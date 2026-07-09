import React, { useState } from "react";
import { Conversation } from "../../types";
import { User, MessageSquare, Search, Trash2, CheckSquare, Square, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function InboxList({
  conversations,
  currentUserId,
  activeConversationId,
  onSelect,
  onDelete,
  onBulkDelete,
  lang = "sw",
}: {
  conversations: Conversation[];
  currentUserId: string;
  activeConversationId?: string;
  onSelect: (conv: Conversation) => void;
  onDelete?: (convId: string) => void;
  onBulkDelete?: (convIds: string[]) => void;
  lang?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    
    // Check participants
    const hasParticipant = conv.participants.some(p => p.name?.toLowerCase().includes(q));
    
    // Check last message
    const hasMessage = conv.lastMessage?.toLowerCase().includes(q);
    
    return hasParticipant || hasMessage;
  });

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0 || !onBulkDelete) return;
    if (confirm(lang === "sw" ? "Una uhakika unataka kufuta soga hizi?" : "Are you sure you want to delete these conversations?")) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="p-4 border-b border-slate-100 bg-slate-50/40 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-base sm:text-lg text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            {lang === "sw" ? "Mawasiliano" : "Messages"}
          </h2>
          <div className="flex items-center gap-2">
            {onBulkDelete && conversations.length > 0 && (
              <button
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedIds(new Set());
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  isSelectionMode 
                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                }`}
              >
                {isSelectionMode ? (lang === "sw" ? "Ghairi" : "Cancel") : (lang === "sw" ? "Chagua" : "Select")}
              </button>
            )}
            {!isSelectionMode && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                {filteredConversations.length}
              </span>
            )}
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={lang === "sw" ? "Tafuta soga..." : "Search chats..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isSelectionMode}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-16">
        {filteredConversations.length === 0 ? (
          <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-3 border border-slate-100">
              <MessageSquare size={20} />
            </div>
            <p className="text-xs font-semibold text-slate-500">
              {lang === "sw" ? "Hakuna ujumbe bado." : "No messages yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/60">
            {filteredConversations.map((conv, idx) => {
              const otherParticipants = conv.participants.filter(p => p.id !== currentUserId && (currentUserId === "admin" ? (p.id !== "support" && p.id !== "00000000-0000-0000-0000-000000000001" && p.id !== "official" && p.id !== "admin") : true)).map(p => {
                if (p.id === "support") {
                  return {
                    ...p,
                    name: "Orbi Shop Support Team",
                    avatar: "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
                  };
                }
                if (p.id === "00000000-0000-0000-0000-000000000001" || p.name?.toLowerCase().includes("orbi shop store") || p.name?.toLowerCase().includes("orbi store")) {
                  return {
                    ...p,
                    name: "Orbi Shop Store",
                    avatar: "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
                  };
                }
                return p;
              });
              
              const displayNames = otherParticipants.length > 0 
                ? otherParticipants.map(p => p.name).join(", ") 
                : conv.participants.map(p => {
                    if (p.id === "support") return "Orbi Shop Support Team";
                    if (p.id === "00000000-0000-0000-0000-000000000001") return "Orbi Shop Store";
                    return p.name;
                  }).join(", ");
              
              const unread = conv.unreadCount?.[currentUserId] || 0;
              const isActive = conv.id === activeConversationId;
              const isSelected = selectedIds.has(conv.id);

              return (
                <motion.div role="button" tabIndex={0}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.2 }}
                  key={conv.id}
                  onClick={(e) => {
                    if (isSelectionMode) {
                      toggleSelection(e, conv.id);
                    } else {
                      onSelect(conv);
                    }
                  }}
                  className={`w-full text-left p-4 flex items-center gap-3.5 transition-all cursor-pointer relative group ${
                    isActive && !isSelectionMode
                      ? "bg-slate-50/80 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.2 before:bg-indigo-600 before:rounded-r-md pl-4.5" 
                      : "hover:bg-slate-50/50 pl-4"
                  } ${isSelected ? "bg-indigo-50/50" : ""}`}
                >
                  {isSelectionMode && (
                    <div className="shrink-0 mr-1 text-indigo-500">
                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-300" />}
                    </div>
                  )}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-slate-500 overflow-hidden border border-slate-100 shadow-xs bg-slate-50">
                       {otherParticipants[0]?.avatar ? (
                          <img src={otherParticipants[0].avatar} alt="avatar" className="w-full h-full object-cover" />
                       ) : (
                          <User size={22} />
                       )}
                    </div>
                    {unread > 0 && !isSelectionMode ? (
                      <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white px-1 shadow-sm animate-pulse">
                        {unread > 99 ? '99+' : unread}
                      </div>
                    ) : !isSelectionMode ? (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    ) : null}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className={`font-bold truncate text-[13.5px] tracking-tight ${(unread > 0 && !isSelectionMode) ? "text-slate-900 font-extrabold" : "text-slate-700"}`}>
                        {displayNames}
                      </h4>
                      {conv.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2 font-semibold">
                            {new Date(conv.lastMessageAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs truncate ${(unread > 0 && !isSelectionMode) ? "font-bold text-slate-900" : "text-slate-500 font-medium"}`}>
                        {conv.lastMessage || (lang === "sw" ? "Mlipana ujumbe..." : "Started a conversation...")}
                      </p>
                    </div>
                  </div>

                  {onDelete && !isSelectionMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv.id);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title={lang === "sw" ? "Futa soga" : "Delete chat"}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isSelectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10 flex items-center justify-between"
          >
            <span className="text-sm font-bold text-slate-700">
              {selectedIds.size} {lang === "sw" ? "zimechaguliwa" : "selected"}
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              <Trash2 size={16} />
              {lang === "sw" ? "Futa Zote" : "Delete Selected"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
