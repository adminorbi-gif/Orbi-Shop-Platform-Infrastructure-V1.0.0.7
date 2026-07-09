import { useState, useEffect, useRef } from "react";
// UI: Chat Widget
import { MessageSquare, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InboxList } from "./InboxList";
import { ChatRoom } from "./ChatRoom";
import { useWebSocket } from "../../hooks/useWebSocket";
import { fetchConversations, fetchMessages, sendChatMessage, startConversation, markMessagesAsRead, deleteConversationMessages } from "../../lib/chat";
import { Conversation, ChatMessage } from "../../types";

// Safe inline Web Audio API synthesizer for message notification chimes
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // First note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Second note slightly delayed
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.5);
      } catch {}
    }, 120);
  } catch (err) {
    console.warn("Could not play chime:", err);
  }
};

export function ChatWidget({
  currentUserId,
  currentUserRole,
  currentUserName,
  currentUserAvatar,
  isAdminPreview = false,
  targetConversationId,
  targetParticipantId,
  targetParticipantName,
  targetParticipantAvatar,
  lang = "sw",
  onClose,
  products = [],
  // New Props for unified header & space optimization
  activeConversationProp,
  onActiveConversationChange,
  askStaffAgent,
  setAskStaffAgent,
  hideHeader = false,
  // Props for mobile sidebar control
  isMobileInboxOpenProp,
  setIsMobileInboxOpenProp,
}: {
  currentUserId: string;
  currentUserRole: "customer" | "seller" | "admin";
  currentUserName: string;
  currentUserAvatar?: string;
  isAdminPreview?: boolean;
  targetConversationId?: string;
  targetParticipantId?: string;
  targetParticipantName?: string;
  targetParticipantAvatar?: string;
  lang?: string;
  onClose?: () => void;
  products?: any[];
  // New props types
  activeConversationProp?: Conversation | null;
  onActiveConversationChange?: (conv: Conversation | null) => void;
  askStaffAgent?: boolean;
  setAskStaffAgent?: (val: boolean) => void;
  hideHeader?: boolean;
  isMobileInboxOpenProp?: boolean;
  setIsMobileInboxOpenProp?: (val: boolean) => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [internalActiveConversation, setInternalActiveConversation] = useState<Conversation | null>(null);
  const activeConversation = activeConversationProp !== undefined ? activeConversationProp : internalActiveConversation;

  // Mobile inbox side-drawer state synchronization
  const [internalMobileInboxOpen, setInternalMobileInboxOpen] = useState(false);
  const isMobileInboxOpen = isMobileInboxOpenProp !== undefined ? isMobileInboxOpenProp : internalMobileInboxOpen;
  const setIsMobileInboxOpen = (val: boolean) => {
    if (setIsMobileInboxOpenProp) {
      setIsMobileInboxOpenProp(val);
    } else {
      setInternalMobileInboxOpen(val);
    }
  };

  const handleSetActiveConversation = (conv: Conversation | null) => {
    if (onActiveConversationChange) {
      onActiveConversationChange(conv);
    }
    if (activeConversationProp === undefined) {
      setInternalActiveConversation(conv);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (isAdminPreview) return;
    try {
      const success = await deleteConversationMessages(convId);
      if (success) {
        if (activeConversation?.id === convId) {
          handleSetActiveConversation(null);
        }
        loadConversations();
      } else {
        alert(lang === "sw" ? "Imeshindwa kufuta soga." : "Failed to delete conversation.");
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  };

  const handleBulkDeleteConversations = async (convIds: string[]) => {
    if (isAdminPreview) return;
    try {
      let anyFailed = false;
      for (const convId of convIds) {
        const success = await deleteConversationMessages(convId);
        if (!success) anyFailed = true;
      }
      
      if (activeConversation && convIds.includes(activeConversation.id)) {
        handleSetActiveConversation(null);
      }
      loadConversations();
      
      if (anyFailed) {
        alert(lang === "sw" ? "Imeshindwa kufuta baadhi ya soga." : "Failed to delete some conversations.");
      }
    } catch (err) {
      console.error("Error deleting conversations:", err);
    }
  };
  
  const { 
    socket, 
    isConnected, 
    messages, 
    joinConversation, 
    leaveConversation, 
    sendMessage,
    emitMessagesRead,
    setMessages 
  } = useWebSocket(currentUserId);

  useEffect(() => {
    loadConversations();
  }, [currentUserId, currentUserRole, targetParticipantId]);

  useEffect(() => {
    if (activeConversation) {
      joinConversation(activeConversation.id);
      loadMessages(activeConversation.id);
    }
    return () => {
      if (activeConversation) leaveConversation(activeConversation.id);
    };
  }, [activeConversation, joinConversation, leaveConversation]);

  // Audio notifier upon receiving new message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      // Only play sound if it is from the other participant and was just received
      if (lastMsg && lastMsg.senderId !== currentUserId && !lastMsg.isRead) {
        playNotificationChime();
      }
    }
  }, [messages, currentUserId]);

  const getNormalizedParticipantId = (p: { id: string; name?: string }): string => {
    if (p.id === "support" || p.id === "admin" || p.name?.toLowerCase().includes("support") || p.name?.toLowerCase().includes("mhudumu")) {
      return "support";
    }
    if (p.id === "00000000-0000-0000-0000-000000000001" || p.id === "official" || p.name?.toLowerCase().includes("orbi shop store") || p.name?.toLowerCase().includes("orbi store")) {
      return "00000000-0000-0000-0000-000000000001";
    }
    return p.id;
  };

  const deduplicateConversations = (list: Conversation[]): Conversation[] => {
    const deduplicated: Conversation[] = [];
    
    // For admin, we should deduplicate by exact participant sets or conversation ID.
    // Actually, conversations from API are already distinct. We just need to remove
    // duplicates created by race conditions with the exact same participants.
    const seenParticipants = new Set<string>();
    
    const sorted = [...list].sort((a, b) => {
      const timeA = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    
    for (const conv of sorted) {
      if (currentUserRole === "admin") {
        // Admin wants to see one conversation per user. Deduplicate by the other participant's ID.
        const other = conv.participants.find(p => p.id !== "support" && p.id !== "00000000-0000-0000-0000-000000000001" && p.id !== "admin" && p.id !== "official");
        if (other) {
          if (!seenParticipants.has(other.id)) {
            seenParticipants.add(other.id);
            deduplicated.push(conv);
          }
        } else {
          // Fallback if no other participant (e.g. testing data)
          const partsKey = [...conv.participants].map(p => getNormalizedParticipantId(p)).sort().join('|');
          if (!seenParticipants.has(partsKey)) {
            seenParticipants.add(partsKey);
            deduplicated.push(conv);
          }
        }
      } else {
        // Normal user deduplicates by the *other* participant
        const other = conv.participants.find(p => p.id !== currentUserId);
        if (!other) {
          deduplicated.push(conv);
          continue;
        }
        
        const normId = getNormalizedParticipantId(other);
        if (!seenParticipants.has(normId)) {
          seenParticipants.add(normId);
          deduplicated.push(conv);
        }
      }
    }
    return deduplicated;
  };

  const loadConversations = async () => {
    try {
      const data = await fetchConversations(currentUserId, currentUserRole);
      const deduplicated = deduplicateConversations(data);
      setConversations(deduplicated);
      if (targetConversationId) {
         const target = deduplicated.find((c: Conversation) => c.id === targetConversationId);
         if (target) handleSetActiveConversation(target);
      } else if (targetParticipantId) {
         let target = deduplicated.find((c: Conversation) => {
             const other = c.participants.find(p => p.id !== currentUserId);
             return other && getNormalizedParticipantId(other) === getNormalizedParticipantId({ id: targetParticipantId, name: targetParticipantName });
          });
         if (target) {
            handleSetActiveConversation(target);
         } else {
            // Need to start a new one
            const newConv = await startConversation([
                { id: currentUserId, role: currentUserRole, name: currentUserName, avatar: currentUserAvatar },
                { id: targetParticipantId, role: targetParticipantId === "support" ? "admin" : "seller", name: targetParticipantId === "support" ? "Orbi Shop Support Team" : (targetParticipantName || "Store"), avatar: targetParticipantId === "support" ? "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png" : (targetParticipantAvatar || "") } // We might not have all details of seller here, but the backend will just store the JSON
            ]);
            setConversations(prev => deduplicateConversations([newConv, ...prev]));
            handleSetActiveConversation(newConv);
         }
      } else if (deduplicated.length > 0 && !activeConversation) {
        // Only auto-select if on desktop, or we can handle responsive layout later
        // handleSetActiveConversation(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const data = await fetchMessages(convId);
      setMessages(data);
      
      // Mark messages as read
      const hasUnread = data.some((m: ChatMessage) => !m.isRead && m.senderId !== currentUserId);
      if (hasUnread) {
         markMessagesAsRead(convId, currentUserId);
         emitMessagesRead(convId, currentUserId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeConversation && messages.length > 0) {
      const hasUnread = messages.some((m: ChatMessage) => !m.isRead && m.senderId !== currentUserId);
      if (hasUnread) {
         markMessagesAsRead(activeConversation.id, currentUserId);
         emitMessagesRead(activeConversation.id, currentUserId);
      }
    }
  }, [messages, activeConversation, currentUserId]);

  const handleSendMessage = async (content: string, customSender?: { senderId: string; senderRole: "customer" | "seller" | "admin"; senderName: string }) => {
    if (!activeConversation) return;

    const senderId = customSender ? customSender.senderId : currentUserId;
    const senderRole = customSender ? customSender.senderRole : currentUserRole;
    const senderName = customSender ? customSender.senderName : currentUserName;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: activeConversation.id,
      senderId,
      senderRole,
      senderName,
      content,
      timestamp: Date.now(),
      isRead: false,
      isSending: !customSender,
    };

    // Optimistic update
    setMessages(prev => {
      // Prevent duplicating if already received somehow
      if (prev.some(m => m.id === tempId)) return prev;
      return [...prev, optimisticMessage];
    });

    const payload = {
      conversationId: activeConversation.id,
      senderId,
      senderRole,
      senderName,
      content,
      lang,
      askStaffAgent,
    };

    try {
      const res = await sendChatMessage(activeConversation.id, payload);
      if (!res?.success) {
        // If there was a security block
        setMessages(prev => prev.filter(m => m.id !== tempId));
        const errMsg = res?.error || "Security violation detected. Account locked.";
        const isSecurityBlock = errMsg.includes("Account locked") || errMsg.includes("security violations") || errMsg.includes("suspended") || errMsg.includes("frozen");
        if (isSecurityBlock) {
            localStorage.setItem(`orbi_scam_flags_${currentUserId}`, "4"); // force client-side freeze
            window.dispatchEvent(new Event("storage")); // trigger update
            alert(errMsg);
        }
        return;
      }
      
      const savedMsg = res.data;
      
      // We emit via websocket as well, or we can just emit and let the server save
      sendMessage(savedMsg);
      
      // Replace optimistic message with saved message
      setMessages(prev => {
        let next = prev.map(m => m.id === tempId ? { ...savedMsg, isSending: false } : m);
        if (res.warning) {
          next = [...next, res.warning];
          sendMessage(res.warning);
        }
        return next;
      });

      // Update last message in conversation list
      setConversations(prev => prev.map(c => 
        c.id === activeConversation.id 
          ? { ...c, lastMessage: content, lastMessageAt: Date.now() } 
          : c
      ));
    } catch (err: any) {
      console.error("Failed to deliver message:", err);
      const errMsg = err?.message || "";
      const isSecurityBlock = errMsg.includes("Account locked") || errMsg.includes("security violations") || errMsg.includes("suspended") || errMsg.includes("frozen");
      
      if (isSecurityBlock) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        localStorage.setItem(`orbi_scam_flags_${currentUserId}`, "4"); // force client-side freeze
        window.dispatchEvent(new Event("storage")); // trigger update
        alert(errMsg);
      } else {
        // Mark optimistic message as failed
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, isSending: false, isFailed: true } : m));
      }
    }
  };

  return (
    <div className="flex h-full w-full gap-5 bg-transparent overflow-hidden relative">
      {/* MOBILE INBOX DRAWER (SIDEBAR) */}
      <AnimatePresence>
        {isMobileInboxOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileInboxOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[9998]"
            />
            
            {/* Sliding Drawer Sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="md:hidden fixed inset-y-0 left-0 w-[290px] sm:w-[320px] bg-white shadow-2xl z-[9999] flex flex-col h-full border-r border-slate-150"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-indigo-600" />
                  <span className="text-xs font-black text-slate-800 tracking-wider uppercase font-sans">
                    {lang === "sw" ? "Mawasiliano" : "Inbox Chats"}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileInboxOpen(false)}
                  className="p-1.5 hover:bg-slate-200/70 active:scale-95 text-slate-500 hover:text-slate-800 rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <InboxList
                  conversations={conversations}
                  currentUserId={currentUserId}
                  activeConversationId={activeConversation?.id}
                  onSelect={(conv) => {
                    handleSetActiveConversation(conv);
                    setIsMobileInboxOpen(false); // Auto close sidebar on select
                  }}
                  onDelete={handleDeleteConversation}
                  onBulkDelete={handleBulkDeleteConversations}
                  lang={lang}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: InboxList Card */}
      <div className={`${activeConversation ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-[360px] shrink-0 bg-white md:rounded-2xl md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:border md:border-slate-200/50 overflow-hidden h-full`}>
        <InboxList
          conversations={conversations}
          currentUserId={currentUserId}
          activeConversationId={activeConversation?.id}
          onSelect={handleSetActiveConversation}
          onDelete={handleDeleteConversation}
          onBulkDelete={handleBulkDeleteConversations}
          lang={lang}
        />
      </div>

      {/* RIGHT COLUMN: ChatRoom / Empty Card */}
      <div className={`${!activeConversation ? "hidden md:flex md:items-center md:justify-center" : "flex flex-col"} flex-1 bg-white md:rounded-2xl md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:border md:border-slate-200/50 overflow-hidden h-full relative`}>
        {activeConversation ? (
          <ChatRoom
              conversation={activeConversation}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              messages={messages}
              onSendMessage={handleSendMessage}
              isAdminPreview={isAdminPreview}
              isConnected={isConnected}
              lang={lang}
              products={products}
              hideHeader={hideHeader}
              askStaffAgent={askStaffAgent}
              setAskStaffAgent={setAskStaffAgent}
              onOpenMobileInbox={() => setIsMobileInboxOpen(true)}
              onDeleted={() => {
                handleSetActiveConversation(null);
                loadConversations();
              }}
              currentUserName={currentUserName}
          />
        ) : (
          <div className="text-center text-slate-400 p-8 flex flex-col items-center justify-center h-full bg-slate-50/50">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center shadow-xs mb-4.5 animate-bounce">
              <MessageSquare size={30} />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">
              {lang === "sw" ? "Mawasiliano ya Orbi" : "Orbi Chat Station"}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed font-medium">
              {lang === "sw" 
                ? "Chagua mazungumzo upande wa kushoto ili kuanza kutuma ujumbe." 
                : "Select a conversation from the left to start sending messages."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
