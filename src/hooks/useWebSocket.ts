import { useCallback, useState } from "react";
import type { ChatMessage } from "../types";

export type ConnectionQuality = "poor" | "good" | "offline";

/**
 * HTTP-first compatibility layer for the V1.0.1.x chat UI.
 *
 * The backend endpoints persist/read chat data today. A true socket transport
 * can replace this hook later without changing the chat components.
 */
export function useWebSocket(_userId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const joinConversation = useCallback((_conversationId: string) => {
    // Real-time room joins are intentionally deferred to Phase 2b.
  }, []);

  const leaveConversation = useCallback((_conversationId: string) => {
    // Real-time room leaves are intentionally deferred to Phase 2b.
  }, []);

  const sendMessage = useCallback((message: Partial<ChatMessage>) => {
    if (!message?.id) return;
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) return prev;
      return [...prev, message as ChatMessage];
    });
  }, []);

  const emitMessagesRead = useCallback((_conversationId: string, _readByUserId: string) => {
    // Read receipts are persisted through the HTTP mark-read endpoint.
  }, []);

  const reconnect = useCallback(() => {
    // HTTP-first mode has no persistent socket to reconnect.
  }, []);

  return {
    socket: null,
    isConnected: true,
    connectionQuality: "good" as ConnectionQuality,
    messages,
    joinConversation,
    leaveConversation,
    sendMessage,
    emitMessagesRead,
    reconnect,
    setMessages,
  };
}
