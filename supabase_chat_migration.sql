-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY,
    participants JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_message TEXT,
    last_message_at BIGINT,
    unread_count JSONB DEFAULT '{}'::jsonb,
    created_at BIGINT NOT NULL
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    sender_name TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    timestamp BIGINT NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at DESC);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (since backend uses anon key, we must allow access)
-- Note: In a production app, you would restrict this to authenticated users
-- who are participants in the conversation. For now, to match the mock behavior:
CREATE POLICY "Allow anon read conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Allow anon insert conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update conversations" ON public.conversations FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete conversations" ON public.conversations FOR DELETE USING (true);

CREATE POLICY "Allow anon read chat_messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow anon insert chat_messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update chat_messages" ON public.chat_messages FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete chat_messages" ON public.chat_messages FOR DELETE USING (true);
