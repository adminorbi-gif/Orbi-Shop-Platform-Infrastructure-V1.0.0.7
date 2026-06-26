import React from "react";
import { X, Send, Bot, Sparkles, Camera, Image as ImageIcon, Zap, History, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIChatDrawerProps {
  showAIChatDrawer: boolean;
  setShowAIChatDrawer: (v: boolean) => void;
  lang: string;
  aiChatHistory: any[];
  isAILoading: boolean;
  isTransferredToLive: boolean;
  aiLockTimeRemaining: string;
  aiInputMessage: string;
  setAIInputMessage: (v: string) => void;
  sendAIChatMessage: (msg: string) => void;
  handleAIImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  aiSelectedImage: any;
  setAiSelectedImage: (v: any) => void;
  imageUploadCount: number;
}

export function AIChatDrawer({
  showAIChatDrawer,
  setShowAIChatDrawer,
  lang,
  aiChatHistory,
  isAILoading,
  isTransferredToLive,
  aiLockTimeRemaining,
  aiInputMessage,
  setAIInputMessage,
  sendAIChatMessage,
  handleAIImageChange,
  aiSelectedImage,
  setAiSelectedImage,
  imageUploadCount
}: AIChatDrawerProps) {
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [aiChatHistory, isAILoading]);

  return (
    <AnimatePresence>
      {showAIChatDrawer && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white shadow-2xl z-[100] flex flex-col border-l border-slate-200"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <Bot className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  Orbi AI Assistant
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {lang === "sw" ? "Msaada wa AI" : "AI Powered Support"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAIChatDrawer(false)}
              className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 scroll-smooth">
            {aiChatHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center animate-bounce duration-1000">
                  <Sparkles className="text-amber-500" size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-black text-slate-800">
                    {lang === "sw" ? "Habari! Mimi ni Orbi AI" : "Hi! I'm Orbi AI"}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[280px]">
                    {lang === "sw"
                      ? "Nisaidie kupata bidhaa, kulinganisha bei, au kuelezea picha zako. Naweza kuona picha unayotuma!"
                      : "I can help you find products, compare prices, or explain images. Send me a photo to start searching visually!"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {[
                    lang === "sw" ? "Niletee viatu vya raba" : "Find me sneakers",
                    lang === "sw" ? "Simu mpya za Samsung" : "Latest Samsung phones",
                    lang === "sw" ? "Nguo za kike za harusi" : "Wedding dresses",
                    lang === "sw" ? "Gesi ya kupikia" : "Cooking gas",
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => sendAIChatMessage(suggestion)}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:border-amber-400 hover:text-amber-600 transition-all text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {aiChatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${msg.role === "user" ? "bg-amber-500 text-white" : "bg-white border border-slate-100 text-slate-800"}`}>
                  {msg.image && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                      <img src={msg.image.data} alt="Visual query" className="w-full max-h-48 object-cover" />
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}

            {isAILoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {lang === "sw" ? "AI Inafikiria..." : "AI is thinking..."}
                  </span>
                </div>
              </div>
            )}

            {isTransferredToLive && (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-orange-700">
                  <Clock size={16} />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {lang === "sw" ? "Kikomo cha Maswali Kimefikiwa" : "AI Quota Limit Reached"}
                  </span>
                </div>
                <p className="text-xs text-orange-600 leading-relaxed font-medium">
                  {lang === "sw"
                    ? "Umekamilisha maswali yako ya AI kwa sasa. Umeunganishwa na mhudumu wetu wa binadamu atakayekujibu hivi punde. AI itarudi baada ya:"
                    : "You've reached your AI query limit. You've been transferred to a live agent. AI assistance will resume in:"}
                </p>
                <div className="text-2xl font-black text-orange-700 font-mono tracking-widest">
                  {aiLockTimeRemaining || "--:--"}
                </div>
                <div className="pt-2 border-t border-orange-200/50">
                  <p className="text-[10px] text-orange-500 font-bold italic">
                    {lang === "sw" 
                      ? "*Mhudumu wetu bado anaweza kuona ujumbe wako hapa na kukujibu moja kwa moja."
                      : "*Our support agent can still see your messages here and reply directly."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="p-4 bg-white border-t border-slate-100 space-y-3">
            {aiSelectedImage && (
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100 animate-in slide-in-from-bottom-2">
                <img src={aiSelectedImage.data} className="w-12 h-12 object-cover rounded-lg" alt="Preview" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">{aiSelectedImage.filename}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Image Attached</p>
                </div>
                <button
                  onClick={() => setAiSelectedImage(null)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 rounded-2xl p-1.5 flex items-center gap-2 border border-transparent focus-within:border-amber-400 focus-within:bg-white transition-all shadow-inner">
                <input
                  type="file"
                  id="ai-image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAIImageChange}
                />
                <button
                  onClick={() => document.getElementById("ai-image-upload")?.click()}
                  disabled={isTransferredToLive}
                  className="p-2 bg-white text-amber-500 rounded-xl hover:bg-amber-50 transition-colors shadow-sm disabled:opacity-50"
                  title="Upload image for AI analysis"
                >
                  <Camera size={18} />
                </button>
                <input
                  type="text"
                  value={aiInputMessage}
                  onChange={(e) => setAIInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendAIChatMessage(aiInputMessage);
                    }
                  }}
                  disabled={isTransferredToLive}
                  placeholder={
                    isTransferredToLive
                      ? (lang === "sw" ? "AI imefungwa..." : "AI locked...")
                      : (lang === "sw" ? "Uliza Orbi AI..." : "Ask Orbi AI...")
                  }
                  className="flex-1 bg-transparent border-none outline-none text-sm p-1.5 placeholder-slate-400 font-medium"
                />
                <button
                  onClick={() => sendAIChatMessage(aiInputMessage)}
                  disabled={isAILoading || isTransferredToLive || (!aiInputMessage.trim() && !aiSelectedImage)}
                  className="p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors shadow-md shadow-amber-100 disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <Zap size={10} className="text-amber-500" />
                <span>Powered by Gemini 1.5 Flash</span>
              </div>
              <div className="text-[10px] text-slate-300 font-bold">
                {imageUploadCount}/3 {lang === "sw" ? "Picha Leo" : "Images Today"}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
