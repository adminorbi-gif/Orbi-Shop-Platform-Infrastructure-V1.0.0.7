-- Backfill legacy support messages into the new conversations/chat_messages model.
-- Safe to run multiple times: message ids are deterministic and ON CONFLICT protected.

CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp DESC);

CREATE OR REPLACE FUNCTION public.backfill_legacy_messages_to_chat()
RETURNS void AS $$
DECLARE
  msg RECORD;
  customer_key TEXT;
  conversation_key TEXT;
  message_time BIGINT;
  reply_time BIGINT;
  admin_unread INTEGER;
  customer_unread INTEGER;
BEGIN
  FOR msg IN
    SELECT *
    FROM public.messages
    ORDER BY created_at ASC
  LOOP
    customer_key := COALESCE(
      msg.customer_id::text,
      'legacy-customer-' || md5(COALESCE(msg.phone, '') || ':' || COALESCE(msg.name, ''))
    );
    conversation_key := 'legacy-support-' || customer_key;
    message_time := FLOOR(EXTRACT(EPOCH FROM COALESCE(msg.created_at, NOW())) * 1000)::BIGINT;
    reply_time := message_time + 1;
    admin_unread := CASE WHEN COALESCE(msg.is_read, false) = false THEN 1 ELSE 0 END;
    customer_unread := CASE WHEN NULLIF(BTRIM(COALESCE(msg.admin_reply, '')), '') IS NOT NULL THEN 1 ELSE 0 END;

    INSERT INTO public.conversations (
      id,
      participants,
      last_message,
      last_message_at,
      unread_count,
      created_at
    )
    VALUES (
      conversation_key,
      jsonb_build_array(
        jsonb_build_object(
          'id', customer_key,
          'role', 'customer',
          'name', COALESCE(NULLIF(BTRIM(msg.name), ''), 'Customer')
        ),
        jsonb_build_object(
          'id', 'admin',
          'role', 'admin',
          'name', 'Orbi Admin'
        )
      ),
      COALESCE(NULLIF(BTRIM(msg.admin_reply), ''), msg.message),
      CASE
        WHEN NULLIF(BTRIM(COALESCE(msg.admin_reply, '')), '') IS NOT NULL THEN reply_time
        ELSE message_time
      END,
      jsonb_build_object('admin', admin_unread, customer_key, customer_unread),
      message_time
    )
    ON CONFLICT (id) DO UPDATE SET
      participants = EXCLUDED.participants,
      last_message = EXCLUDED.last_message,
      last_message_at = GREATEST(COALESCE(public.conversations.last_message_at, 0), EXCLUDED.last_message_at),
      unread_count = public.conversations.unread_count || EXCLUDED.unread_count;

    INSERT INTO public.chat_messages (
      id,
      conversation_id,
      sender_id,
      sender_role,
      sender_name,
      content,
      is_read,
      timestamp
    )
    VALUES (
      'legacy-message-' || msg.id::text,
      conversation_key,
      customer_key,
      'customer',
      COALESCE(NULLIF(BTRIM(msg.name), ''), 'Customer'),
      msg.message,
      COALESCE(msg.is_read, false),
      message_time
    )
    ON CONFLICT (id) DO NOTHING;

    IF NULLIF(BTRIM(COALESCE(msg.admin_reply, '')), '') IS NOT NULL THEN
      INSERT INTO public.chat_messages (
        id,
        conversation_id,
        sender_id,
        sender_role,
        sender_name,
        content,
        is_read,
        timestamp
      )
      VALUES (
        'legacy-reply-' || msg.id::text,
        conversation_key,
        'admin',
        'admin',
        'Orbi Admin',
        msg.admin_reply,
        false,
        reply_time
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END LOOP;

  WITH legacy_counts AS (
    SELECT
      conversation_id,
      REPLACE(conversation_id, 'legacy-support-', '') AS participant_id,
      COUNT(*) FILTER (WHERE sender_role <> 'admin' AND COALESCE(is_read, false) = false) AS admin_unread,
      COUNT(*) FILTER (WHERE sender_role = 'admin' AND COALESCE(is_read, false) = false) AS participant_unread
    FROM public.chat_messages
    WHERE conversation_id LIKE 'legacy-support-%'
    GROUP BY conversation_id
  )
  UPDATE public.conversations c
  SET unread_count = jsonb_build_object(
    'admin', legacy_counts.admin_unread,
    legacy_counts.participant_id, legacy_counts.participant_unread
  )
  FROM legacy_counts
  WHERE c.id = legacy_counts.conversation_id;
END;
$$ LANGUAGE plpgsql;

SELECT public.backfill_legacy_messages_to_chat();
