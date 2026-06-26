import React, { useState, useRef } from "react";
import { User, Package, MessageSquare, History, Gift, LogOut, X, Send, Paperclip, CheckCircle2, Star, Clock, Zap, Award, Sparkles, Camera } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PriceDisplay } from "../PriceDisplay";
import { formatCurrency } from "../../lib/storage";

interface ProfileViewProps {
  showProfile: boolean;
  setShowProfile: (v: boolean) => void;
  user: any;
  lang: string;
  logoutClient: () => void;
  orders: any[];
  guestMessages: any[];
  pPoints: number;
  initialTab?: "orders" | "track" | "messages" | "rewards" | "locator";
  t: (k: string) => string;
  formatOrderNumber: (o: any) => string;
  setViewInvoice: (v: any) => void;
  sendProfileMessage: (e: any) => void;
  profileMsgText: string;
  setProfileMsgText: (v: string) => void;
  isSendingMsg: boolean;
  attachedMediaUrl: string;
  setAttachedMediaUrl: (v: string) => void;
  isUploadingMedia: boolean;
  handleFileChange: (e: any) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  profileTextareaRef: React.RefObject<HTMLTextAreaElement>;
  readReplyIds: string[];
  setReadReplyIds: (v: string[]) => void;
}

export function ProfileView({
  showProfile,
  setShowProfile,
  user,
  lang,
  logoutClient,
  orders,
  guestMessages,
  pPoints,
  initialTab = "orders",
  t,
  formatOrderNumber,
  setViewInvoice,
  sendProfileMessage,
  profileMsgText,
  setProfileMsgText,
  isSendingMsg,
  attachedMediaUrl,
  setAttachedMediaUrl,
  isUploadingMedia,
  handleFileChange,
  fileInputRef,
  profileTextareaRef,
  readReplyIds,
  setReadReplyIds
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!user) return null;

  const userOrders = orders.filter(o => o.customerId === user.id || o.customer_id === user.id || o.customerDetails?.phone === user.phone);

  return (
    <AnimatePresence>
      {showProfile && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProfile(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white shadow-2xl z-[130] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
                <User size={120} />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md">
                    <User size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">{user.name}</h3>
                    <p className="text-xs text-white/60 font-bold uppercase tracking-widest mt-0.5">{user.phone}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="bg-[#ff4c00] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                         <Zap size={8} className="fill-white" />
                         {pPoints} Points
                       </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowProfile(false)} className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-6 mt-8 relative z-10 overflow-x-auto no-scrollbar">
                {[
                  { id: "orders", label: lang === "sw" ? "Oda" : "Orders", icon: Package },
                  { id: "messages", label: lang === "sw" ? "Ujumbe" : "Inbox", icon: MessageSquare, badge: guestMessages.length },
                  { id: "rewards", label: lang === "sw" ? "Zawadi" : "Rewards", icon: Gift },
                ].map((tab: any) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 pb-2 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
                      activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                    {tab.badge > 0 && (
                      <span className="bg-[#ff4c00] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center ml-1">
                        {tab.badge}
                      </span>
                    )}
                    {activeTab === tab.id && (
                      <motion.div layoutId="profileTabLine" className="absolute bottom-0 left-0 right-0 h-1 bg-[#ff4c00] rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {activeTab === "orders" && (
                <div className="space-y-4">
                  {userOrders.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-slate-200 border border-slate-100">
                        <Package size={32} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{lang === "sw" ? "Hujafanya oda bado" : "No orders yet"}</h4>
                        <p className="text-xs text-slate-400 mt-1">{lang === "sw" ? "Bidhaa utakazonunua zitaonekana hapa." : "Your shopping history will appear here."}</p>
                      </div>
                    </div>
                  ) : (
                    userOrders.map((order) => (
                      <div key={order.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID: #{formatOrderNumber(order)}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{new Date(order.date).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                            order.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            order.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-slate-50 text-slate-400 border border-slate-100'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          {order.items.map((item: any, i: number) => (
                            <div key={i} className="flex gap-3 items-center">
                              <div className="w-8 h-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 text-[10px] font-black overflow-hidden">
                                 {item.name?.charAt(0)}
                              </div>
                              <p className="text-xs font-bold text-slate-700 flex-1 truncate">{item.name}</p>
                              <p className="text-xs font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Total Amount</span>
                            <PriceDisplay amount={order.total} size="sm" colorClass="text-slate-900 font-black" />
                          </div>
                          <button 
                            onClick={() => setViewInvoice(order)}
                            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                          >
                            View Invoice
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "messages" && (
                <div className="h-full flex flex-col space-y-4">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
                    {guestMessages.length === 0 ? (
                      <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-slate-200 border border-slate-100">
                          <MessageSquare size={32} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{lang === "sw" ? "Sanduku la ujumbe tupu" : "Inbox is empty"}</h4>
                          <p className="text-xs text-slate-400 mt-1">{lang === "sw" ? "Mawasiliano yako na Orbi yataonekana hapa." : "Your messages with Orbi will appear here."}</p>
                        </div>
                      </div>
                    ) : (
                      guestMessages.map((msg) => (
                        <div key={msg.id} className="space-y-2">
                           <div className="flex justify-end">
                             <div className="bg-[#ff4c00] text-white p-3 rounded-2xl rounded-tr-none max-w-[80%] shadow-sm">
                               <p className="text-xs leading-relaxed">{msg.message}</p>
                               <p className="text-[8px] font-bold mt-1 text-white/60 uppercase">{new Date(msg.date).toLocaleTimeString()}</p>
                             </div>
                           </div>
                           {msg.adminReply && (
                             <div className="flex justify-start">
                               <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none max-w-[80%] shadow-sm">
                                 <p className="text-xs text-slate-800 leading-relaxed font-medium">{msg.adminReply}</p>
                                 <p className="text-[8px] font-bold mt-1 text-slate-400 uppercase">Orbi Support • {new Date(msg.date + 1000000).toLocaleTimeString()}</p>
                               </div>
                             </div>
                           )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={sendProfileMessage} className="mt-auto pt-4 border-t border-slate-100 bg-white p-4 rounded-3xl shadow-lg">
                    <div className="flex items-end gap-2">
                      <textarea
                        ref={profileTextareaRef}
                        value={profileMsgText}
                        onChange={(e) => setProfileMsgText(e.target.value)}
                        placeholder={lang === "sw" ? "Andika ujumbe..." : "Type a message..."}
                        rows={1}
                        className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-xs font-bold outline-none resize-none focus:bg-white focus:ring-2 focus:ring-[#ff4c00]/10 transition-all"
                      />
                      <button 
                        type="submit"
                        disabled={isSendingMsg || !profileMsgText.trim()}
                        className="w-10 h-10 bg-[#ff4c00] text-white rounded-xl flex items-center justify-center hover:bg-slate-900 transition-all disabled:opacity-50 shadow-md shadow-orange-100"
                      >
                        <Send size={18} className="translate-x-0.5" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "rewards" && (
                <div className="space-y-6">
                  {/* Reuse some logic from RewardsView or keep it simple here */}
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Loyalty Wallet</p>
                        <h4 className="text-3xl font-black mt-1">{pPoints} <span className="text-sm font-bold text-white/60 ml-1">Points</span></h4>
                      </div>
                      <Award size={32} className="text-white/40" />
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-black py-3 rounded-xl transition-all uppercase tracking-widest">
                        Redeem Rewards
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center space-y-2 shadow-sm">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mx-auto">
                        <CheckCircle2 size={20} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Orders Done</p>
                      <p className="text-lg font-black text-slate-800">{userOrders.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center space-y-2 shadow-sm">
                      <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mx-auto">
                        <Star size={20} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Active Reviews</p>
                      <p className="text-lg font-black text-slate-800">0</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-slate-100">
              <button 
                onClick={logoutClient}
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group"
              >
                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                Sign Out from Orbi
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
