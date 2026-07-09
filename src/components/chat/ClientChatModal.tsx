import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { X, MessageSquare, ShieldAlert, Bot, User, Menu } from "lucide-react";
import { ChatWidget } from "./ChatWidget";

interface ClientChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  targetParticipantId?: string;
  targetParticipantName?: string;
  targetParticipantAvatar?: string;
  lang?: string;
  products?: any[];
}

export function ClientChatModal({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  targetParticipantId,
  targetParticipantName,
  targetParticipantAvatar,
  lang = "sw",
  products = [],
}: ClientChatModalProps) {
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Controlled chat states for recipient card in main header
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [askStaffAgent, setAskStaffAgent] = useState(false);
  const [isMobileInboxOpen, setIsMobileInboxOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Helper to extract normalize other participant
  const getOtherParticipant = (conv: any) => {
    if (!conv || !conv.participants) return null;
    const rawParticipant = conv.participants.find((p: any) => p.id !== currentUserId) || conv.participants[0];
    if (rawParticipant) {
      if (rawParticipant.id === "support" || rawParticipant.name?.toLowerCase().includes("support")) {
        return {
          ...rawParticipant,
          name: "Orbi Shop Support Team",
          avatar: "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
        };
      }
      if (rawParticipant.id === "00000000-0000-0000-0000-000000000001" || rawParticipant.name?.toLowerCase().includes("orbi shop store") || rawParticipant.name?.toLowerCase().includes("orbi store")) {
        return {
          ...rawParticipant,
          name: "Orbi Shop Store",
          avatar: "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
        };
      }
    }
    return rawParticipant;
  };

  const otherParticipant = activeConversation ? getOtherParticipant(activeConversation) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={constraintsRef}
          id="orbi-chat-modal-root"
          className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            drag={!isMobile}
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            dragConstraints={constraintsRef}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-0 sm:inset-auto sm:w-[96vw] sm:max-w-6xl sm:h-[94vh] bg-slate-100 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 pointer-events-auto border border-slate-200/60"
          >
            {/* Header / Bar (draggable via handle) */}
            <div
              onPointerDown={(e) => {
                dragControls.start(e);
              }}
              className="bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0 cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1 mr-3 sm:mr-4">
                {/* Mobile Menu/Inbox Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileInboxOpen(!isMobileInboxOpen)}
                  onPointerDown={(e) => {
                    // Prevent drag starting when clicking the menu button
                    e.stopPropagation();
                  }}
                  className="sm:hidden p-1.5 hover:bg-white/10 rounded-xl transition-all active:scale-95 text-slate-400 hover:text-white shrink-0 mr-1"
                  title={lang === "sw" ? "Fungua Inbox" : "Open Inbox"}
                >
                  <Menu size={20} />
                </button>

                {/* Drag Indicator handle icon */}
                <div className="hidden sm:flex flex-col gap-1 pr-3 border-r border-slate-800/80 mr-1.5 text-slate-500 hover:text-slate-300 transition-colors shrink-0">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-current" />
                    <span className="w-1 h-1 rounded-full bg-current" />
                  </div>
                  <div className="flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-current" />
                    <span className="w-1 h-1 rounded-full bg-current" />
                  </div>
                  <div className="flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-current" />
                    <span className="w-1 h-1 rounded-full bg-current" />
                  </div>
                </div>

                {otherParticipant ? (
                  /* RECIPIENT PROFILE CARD - Integrated inside top bar */
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 overflow-hidden shrink-0 border border-slate-700 shadow-xs relative">
                      {otherParticipant?.avatar ? (
                        <img 
                          referrerPolicy="no-referrer" 
                          src={otherParticipant.avatar} 
                          alt="avatar" 
                          className={`w-full h-full object-cover ${
                            otherParticipant.avatar.includes("OrbiShop_Logo_Blue") 
                              ? "brightness-0 invert p-1" 
                              : ""
                          }`}
                        />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <h3 className="font-extrabold text-white leading-tight text-xs sm:text-sm flex items-center gap-1 truncate">
                          <span className="truncate">{otherParticipant?.name || "Unknown User"}</span>
                        </h3>
                        {otherParticipant?.name?.toLowerCase().includes("support") && (
                          <span className="bg-slate-850 text-slate-300 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-sm leading-none shrink-0 uppercase border border-slate-700/60">
                            STAFF
                          </span>
                        )}
                        {(otherParticipant?.name?.toLowerCase().includes("orbi shop store") || otherParticipant?.id === "00000000-0000-0000-0000-000000000001") && (
                          <span className="bg-indigo-600/90 text-white text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-sm leading-none shrink-0 uppercase">
                            {lang === "sw" ? "DUKA RASMI" : "OFFICIAL STORE"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 min-w-0">
                        <span className="text-[9.5px] text-slate-400 capitalize font-bold leading-none truncate shrink-0">{otherParticipant?.role || "User"}</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full shrink-0" />
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span className="text-[9.5px] text-slate-400 font-bold truncate">
                            {lang === "sw" ? "Inatumika" : "Active Now"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* DEFAULT CHAT HEADER */
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-inner shrink-0">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h2 className="font-extrabold text-xs sm:text-sm tracking-tight leading-tight flex items-center gap-2">
                        {lang === "sw" ? "Mawasiliano na Msaada" : "Support & Messaging"}
                        <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </h2>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        {lang === "sw"
                          ? "Zungumza na Wauzaji au Huduma kwa Wateja hewani"
                          : "Chat with active Sellers or Customer Support instantly"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  onPointerDown={(e) => {
                    // Prevent drag starting when clicking the close button
                    e.stopPropagation();
                  }}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all duration-150 active:scale-90 touch-manipulation text-slate-400 hover:text-white"
                  aria-label="Close Chat"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat Body Wrapper */}
            <div className="flex-1 overflow-hidden p-4 sm:p-5 bg-slate-100/50 flex flex-col items-center justify-center">
              {!currentUserId || currentUserId.startsWith("guest") ? (
                <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-center shadow-xl flex flex-col items-center justify-center gap-5 my-auto animate-in fade-in zoom-in duration-200">
                  <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border border-red-100 shadow-inner">
                    <ShieldAlert size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                      {lang === "sw" ? "Akaunti Inahitajika" : "Account Required"}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                      {lang === "sw"
                        ? "Mawasiliano na wauzaji au msaada yanaruhusiwa tu kwa wateja waliojisajili na wenye akaunti hai. Wageni hawajisajili hawaruhusiwi kutuma ujumbe."
                        : "Messaging sellers or support is strictly reserved for registered customers with a valid and active account. Guest messaging is no longer allowed."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new CustomEvent("open-login"));
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-all duration-150 shadow-md shadow-indigo-600/10 active:scale-98 text-sm cursor-pointer"
                  >
                    {lang === "sw" ? "Ingia kwenye Akaunti" : "Log In / Register"}
                  </button>
                </div>
              ) : (
                <ChatWidget
                  currentUserId={currentUserId}
                  currentUserRole="customer"
                  currentUserName={currentUserName}
                  currentUserAvatar={currentUserAvatar}
                  targetParticipantId={targetParticipantId}
                  targetParticipantName={targetParticipantName}
                  targetParticipantAvatar={targetParticipantAvatar}
                  lang={lang}
                  onClose={onClose}
                  products={products}
                  // Custom parameters passed for unified layout
                  activeConversationProp={activeConversation}
                  onActiveConversationChange={setActiveConversation}
                  askStaffAgent={askStaffAgent}
                  setAskStaffAgent={setAskStaffAgent}
                  hideHeader={true} // Hide internal header in ChatRoom since it's now integrated on top!
                  isMobileInboxOpenProp={isMobileInboxOpen}
                  setIsMobileInboxOpenProp={setIsMobileInboxOpen}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
