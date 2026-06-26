import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Search, 
  Package, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Check, 
  Truck, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  Coins, 
  ArrowRight,
  Navigation,
  Phone
} from 'lucide-react';
import { db } from '../lib/db';
import { Order, OrderStatusLog } from '../types';
import { formatCurrency } from '../lib/storage';

interface Props {
  onClose: () => void;
  lang?: string;
}

export default function TrackOrderModal({ onClose, lang = "sw" }: Props) {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeOrderStatus = (status: string | undefined): string => {
    if (!status) return 'pending';
    const s = status.toUpperCase();
    if (s === "CREATED" || s === "AWAITING_PAYMENT" || s === "PENDING") return "pending";
    if (s === "PAYMENT_HELD" || s === "PROCESSING" || s === "CONFIRMED") return "confirmed";
    if (s === "SHIPPED") return "shipped";
    if (s === "DELIVERED") return "delivered";
    if (s === "CUSTOMER_CONFIRMED" || s === "BUYER_CONFIRMED" || s === "RELEASED" || s === "ARCHIVED") return "customer_confirmed";
    if (s === "CANCELLED" || s === "REFUNDED") return "cancelled";
    return status.toLowerCase();
  };

  const performTracking = async (idToTrack: string) => {
    if (!idToTrack.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const orders = await db.getOrders();
      const cleanId = idToTrack.trim().toUpperCase();
      const cleanNumeric = cleanId.replace(/^ORD-/, '').split('-')[0]; // extracts '12345' from 'ORD-12345-system' or '12345'
      
      const foundOrder = orders.find(o => {
        const orderIdUpper = o.id.toUpperCase();
        const legacyIdUpper = ((o as any).legacy_id || "").toUpperCase();
        
        return orderIdUpper === cleanId || 
               legacyIdUpper === cleanId || 
               legacyIdUpper.startsWith(cleanId) ||
               legacyIdUpper.includes(cleanNumeric) ||
               orderIdUpper.includes(cleanNumeric);
      });
      
      if (foundOrder) {
        setOrder({
          ...foundOrder,
          status: normalizeOrderStatus(foundOrder.status) as any
        });
      } else {
        setError("Oda haijapatikana. Hakikisha Namba ya Oda (e.g. ORD-XXXXX) ni sahihi.");
      }
    } catch (e) {
      setError("Imeshindikana kutafuta oda. Jaribu tena.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get('order') || params.get('order_id');
    if (orderParam) {
      setOrderId(orderParam);
      performTracking(orderParam);
    }
  }, []);

  useEffect(() => {
    if (!order?.id) return;
    
    const intervalId = setInterval(async () => {
      try {
        const dbOrders = await db.getOrders();
        const fresh = dbOrders.find(o => o.id === order.id);
        if (fresh) {
          const normStatus = normalizeOrderStatus(fresh.status);
          if (
            normStatus !== order.status || 
            fresh.paymentReference !== order.paymentReference || 
            JSON.stringify(fresh.riderName) !== JSON.stringify(order.riderName) ||
            fresh.riderPhone !== order.riderPhone ||
            fresh.riderVehicle !== order.riderVehicle
          ) {
            setOrder({
              ...fresh,
              status: normStatus as any
            });
          }
        }
      } catch (e) {
        console.warn("TrackOrderModal background polling failed:", e);
      }
    }, 5000); // Poll every 5 seconds for updates
    
    return () => clearInterval(intervalId);
  }, [order?.id, order?.status, order?.paymentReference, order?.riderName, order?.riderPhone, order?.riderVehicle]);
  
  // Highlight states when status changes
  const [highlightStatus, setHighlightStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  // Option 2: Payment proof state
  const [localTxId, setLocalTxId] = useState('');
  const [paymentSubmittedLocally, setPaymentSubmittedLocally] = useState(false);
  const [showSMSArea, setShowSMSArea] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [isOcrParsing, setIsOcrParsing] = useState(false);
  const [storedProof, setStoredProof] = useState<any>(null);

  const [logs, setLogs] = useState<OrderStatusLog[]>([]);

  useEffect(() => {
    async function loadLogs() {
      if (!order?.id) {
        setLogs([]);
        return;
      }
      try {
        const fetched = await db.getOrderLogs(order.id);
        setLogs(fetched || []);
      } catch (err) {
        console.warn("Failed to load tracking order logs:", err);
      }
    }
    loadLogs();
  }, [order?.id, order?.status]);

  const getStageTimestamp = (statusName: string): number | null => {
    if (statusName === 'pending') return order?.date || null;
    const matchedLog = logs.find(l => l.newStatus === statusName);
    if (matchedLog) return matchedLog.createdAt;
    
    const orderOfStatuses = ['pending', 'confirmed', 'customer_confirmed', 'shipped', 'delivered'];
    const currentIdx = orderOfStatuses.indexOf(order?.status || 'pending');
    const targetIdx = orderOfStatuses.indexOf(statusName);
    
    if (currentIdx >= targetIdx && targetIdx > 0 && order?.date) {
      return order.date + (targetIdx * 30 * 60 * 1000);
    }
    return null;
  };

  const formatStageTime = (statusName: string) => {
    const ts = getStageTimestamp(statusName);
    if (!ts) return null;
    return new Date(ts).toLocaleString(lang === "sw" ? "sw-TZ" : "en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  useEffect(() => {
    if (order) {
      if (prevStatusRef.current && prevStatusRef.current !== order.status) {
        setHighlightStatus(true);
        setStatusMessage(`Hali imebadilika: ${prevStatusRef.current.toUpperCase()} ➜ ${order.status.toUpperCase()}!`);
        const timer = setTimeout(() => {
          setHighlightStatus(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
      prevStatusRef.current = order.status;
      
      // Load any existing proof
      const displayId = (order as any).legacy_id || order.id;
      const proofs = JSON.parse(localStorage.getItem("orbi_payment_proofs") || "{}");
      if (order.paymentReference) {
        setStoredProof({
          transactionId: order.paymentReference,
          timestamp: Date.now(),
          amount: order.total,
          method: order.payment_method_name || order.payment_method || "Mobile",
          status: "pending_verification"
        });
        setPaymentSubmittedLocally(true);
      } else if (proofs[displayId]) {
        setStoredProof(proofs[displayId]);
        setPaymentSubmittedLocally(true);
      } else {
        setStoredProof(null);
        setPaymentSubmittedLocally(false);
      }
    } else {
      prevStatusRef.current = null;
    }
  }, [order?.status, order?.id, paymentSubmittedLocally]);

  const handleTrack = async () => {
    if (!orderId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const orders = await db.getOrders();
      const cleanId = orderId.trim().toUpperCase();
      const cleanNumeric = cleanId.replace(/^ORD-/, '').split('-')[0];
      
      const foundOrder = orders.find(o => {
        const orderIdUpper = o.id.toUpperCase();
        const legacyIdUpper = ((o as any).legacy_id || "").toUpperCase();
        
        return orderIdUpper === cleanId || 
               legacyIdUpper === cleanId || 
               legacyIdUpper.startsWith(cleanId) ||
               legacyIdUpper.includes(cleanNumeric) ||
               orderIdUpper.includes(cleanNumeric);
      });
      
      if (foundOrder) {
        setOrder({
          ...foundOrder,
          status: normalizeOrderStatus(foundOrder.status) as any
        });
      } else {
        setError("Oda haijapatikana. Hakikisha Namba ya Oda (e.g. ORD-XXXXX) ni sahihi.");
      }
    } catch (e) {
      setError("Imeshindikana kutafuta oda. Jaribu tena.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualProofSubmit = async () => {
    if (!localTxId.trim() || !order) return;
    const displayId = (order as any).legacy_id || order.id;
    const proofs = JSON.parse(localStorage.getItem("orbi_payment_proofs") || "{}");
    const data = {
      transactionId: localTxId.trim().toUpperCase(),
      timestamp: Date.now(),
      amount: order.total,
      method: order.payment_method_name || order.payment_method || "Mobile",
      status: "pending_verification"
    };
    proofs[displayId] = data;
    localStorage.setItem("orbi_payment_proofs", JSON.stringify(proofs));
    setStoredProof(data);
    setPaymentSubmittedLocally(true);
    try {
      await db.saveOrder({ id: order.id, paymentReference: localTxId.trim().toUpperCase() });
      setOrder({ ...order, paymentReference: localTxId.trim().toUpperCase() });
    } catch (e) {
      console.error("Failed to save payment reference to DB:", e);
    }
  };

  const handleSmsOcrParse = () => {
    if (!smsText.trim()) return;
    setIsOcrParsing(true);
    setTimeout(() => {
      const match = smsText.match(/\b([A-Z0-9]{10,12})\b/i);
      if (match) {
        setLocalTxId(match[1].toUpperCase());
      } else {
        const fallback = smsText.match(/\b([A-Z0-9]{8,15})\b/i);
        if (fallback) {
          setLocalTxId(fallback[1].toUpperCase());
        }
      }
      setIsOcrParsing(false);
      setShowSMSArea(false);
    }, 850);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full h-full sm:rounded-3xl sm:shadow-2xl sm:max-w-lg sm:max-h-[92vh] flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-5 border-b border-slate-100 sm:rounded-t-3xl">
          <div>
            <h2 className="font-extrabold text-lg text-slate-800 tracking-tight flex items-center gap-2">
              <span className="p-1 px-2.5 bg-orange-500 text-white rounded-xl text-sm font-black">ORBI</span>
              <span>Fuatilia Oda (Express Tracker)</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Uhakiki wa Malipo & Ramani ya Dereva katika Alama ya Orange</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-50 transition cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!order ? (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 text-amber-900 text-xs font-semibold leading-relaxed">
                <div className="text-lg">📦</div>
                <div>
                  <p className="font-bold text-amber-950">Weka Namba ya Oda Iliyotolewa</p>
                  <p className="text-slate-600 font-normal mt-0.5">Ingiza namba ya muamala kuanza na <strong>ORD-...</strong> au UUID kuangalia hali halisi mnyororo mzima wa kufikishiwa mzigo wako.</p>
                </div>
              </div>

              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Mfano: ORD-12345-system au ID yako" 
                  value={orderId} 
                  onChange={e => setOrderId(e.target.value)}
                  className="w-full p-4 pl-5 border border-slate-200 rounded-2xl outline-none focus:border-orange-500 font-mono text-sm tracking-wide font-black uppercase text-slate-800"
                />
              </div>
              <button 
                onClick={handleTrack}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-2xl font-black transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/15 text-sm uppercase tracking-wider"
              >
                {loading ? 'Inatafuta...' : <><Search size={18}/> Fuatilia Sasa</>}
              </button>
              {error && <p className="text-red-500 text-xs font-semibold text-center mt-2">{error}</p>}
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
               
               {/* Change Alert banner */}
               {statusMessage && (
                 <div className="p-3 bg-amber-50 border border-amber-200/50 rounded-xl text-[11px] font-black text-amber-800 flex items-center gap-2 animate-bounce">
                   <Sparkles size={14} className="text-orange-500 animate-spin" />
                   <span>{statusMessage}</span>
                 </div>
               )}

               {/* Top Badge Card */}
               <div 
                 className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-all duration-700 ease-in-out ${
                   highlightStatus 
                     ? "bg-amber-50/90 border-amber-500 shadow-md scale-[1.01]" 
                     : order.status === "shipped"
                       ? "bg-amber-50 border-orange-200 text-orange-950"
                       : order.status === "confirmed"
                         ? "bg-emerald-50 border-emerald-100 text-emerald-950"
                         : "bg-slate-50 border-slate-100 text-slate-900"
                 }`}
               >
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block font-mono">
                      Oda ID: <span className="text-slate-700 font-black">{order.id.slice(0, 8).toUpperCase()}</span>
                    </span>
                    <p className={`font-black text-lg transition-all mt-1 uppercase duration-300 ${
                      order.status === "shipped" 
                        ? "text-orange-600" 
                        : order.status === "customer_confirmed"
                          ? "text-indigo-600"
                          : order.status === "confirmed" 
                            ? "text-emerald-700" 
                            : "text-amber-600"
                    }`}>
                      {order.status === "pending" && (paymentSubmittedLocally ? "Malipo Chini ya Uhakiki ⏳" : "Malipo Yanasubiriwa 💳")}
                      {order.status === "confirmed" && "Imeidhinishwa Na Duka 📦"}
                      {order.status === "customer_confirmed" && "Mteja Amethibitisha 📞"}
                      {order.status === "shipped" && "Mzigo Uko Njiani (Transit) 🚚"}
                      {order.status === "delivered" && "Imepokelewa (Delivered) 🎉"}
                      {order.status === "cancelled" && "Imeghairiwa (Cancelled) ✕"}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                    <Package className={`transition-transform duration-300 ${highlightStatus ? "scale-125 rotate-12 text-amber-500" : order.status === "confirmed" ? "text-emerald-600" : "text-orange-500"}`} size={20} />
                  </div>
               </div>

               {/* Option 1: Dynamic Stepper Timeline Vertical Nodes */}
               <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl space-y-4">
                 <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-2">Mchakato wa Kusafirisha (Timeline)</h4>
                 
                 <div className="relative pl-6 space-y-6">
                   {/* Continuous line */}
                   <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200"></div>

                   {/* Step 1: Placed */}
                   <div className="relative flex gap-3 text-xs">
                     <div className="absolute -left-[21px] w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[9px] shadow border-2 border-white">
                       ✓
                     </div>
                     <div>
                       <div className="flex justify-between items-start gap-2 w-full">
                          <p className="font-extrabold text-slate-800">Oda Yako Imesajiliwa</p>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono shrink-0">
                            {formatStageTime('pending')}
                          </span>
                        </div>
                       <p className="text-[10px] text-slate-500">Mteja ametoa agizo tayari na limewekwa kwenye foleni.</p>
                     </div>
                   </div>

                   {/* Step 2: Approved / Verification */}
                   <div className="relative flex gap-3 text-xs">
                     {["confirmed", "customer_confirmed", "shipped", "delivered"].includes(order.status) ? (
                       <div className="absolute -left-[21px] w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[9px] shadow border-2 border-white">
                         ✓
                       </div>
                     ) : order.status === "cancelled" ? (
                       <div className="absolute -left-[21px] w-4.5 h-4.5 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-[9px] shadow border-2 border-white">
                         ✕
                       </div>
                     ) : (
                       <div className="absolute -left-[21px] w-4.5 h-4.5 rounded-full bg-amber-500 animate-pulse text-white flex items-center justify-center font-bold text-[9px] shadow border-2 border-white">
                         •
                       </div>
                     )}
                     <div>
                                               <p className="font-extrabold text-slate-800 flex items-center justify-between gap-1.5 w-full">
                         <span>Imeidhinishwa na Duka</span>
                          {["confirmed", "customer_confirmed", "shipped", "delivered"].includes(order.status) && (
                            <span className="font-mono text-[9px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded shrink-0">
                              {formatStageTime('confirmed')}
                            </span>
                          )}
                         {paymentSubmittedLocally && (
                           <span className="bg-orange-500/10 text-orange-600 font-mono font-black border border-orange-500/20 rounded px-1 text-[8px]">
                             ID: {storedProof?.transactionId || localTxId}
                           </span>
                         )}
                       </p>
                       <p className="text-[10px] text-slate-500">
                         {["confirmed", "customer_confirmed", "shipped", "delivered"].includes(order.status)
                           ? "Oda imethibitishwa na duka na ufungashaji umeanza." 
                           : paymentSubmittedLocally 
                             ? "Mteja amewasilisha namba ya muamala. Foleni ya ukaguzi ya Orbi inafanyia kazi sasa." 
                             : "Mteja hajawasilisha namba ya muamala bado."}
                       </p>
                     </div>
                   </div>

                   {/* Step 3: Customer Confirmed */}
                   <div className="relative flex gap-3 text-xs">
                     {["customer_confirmed", "shipped", "delivered"].includes(order.status) ? (
                       <div className="absolute -left-[21px] w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[9px] shadow border-2 border-white">
                         ✓
                       </div>
                     ) : order.status === "confirmed" ? (
                       <div className="absolute -left-[21px] w-4.5 h-4.5 rounded-full bg-amber-500 animate-pulse text-white flex items-center justify-center font-bold text-[9px] shadow border-2 border-white">
                         📞
                       </div>
                     ) : (
                       <div className="absolute -left-[21px] w-4.5 h-4.5 rounded-full bg-slate-200 border-2 border-white text-slate-400 flex items-center justify-center text-[9px]"></div>
                     )}
                     <div>
                       <div className="flex justify-between items-start gap-2 w-full">
                          <p className="font-extrabold text-slate-800">Uthibitisho wa Mteja (Customer Confirmed)</p>
                          {["customer_confirmed", "shipped", "delivered"].includes(order.status) && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono shrink-0">
                              {formatStageTime('customer_confirmed')}
                            </span>
                          )}
                        </div>
                       <p className="text-[10px] text-slate-500">
                         {["customer_confirmed", "shipped", "delivered"].includes(order.status)
                           ? "Mteja amethibitisha na kukubaliana na muuzaji, tayari kuanza usafiri." 
                           : order.status === 'confirmed' 
                             ? "Muuzaji anapiga simu/WhatsApp ili uweze kuthibitisha oda yako haraka." 
                             : "Inasubiri kuidhinishwa kwanza na duka kabla ya wasilisho kufanyika."}
                       </p>
                     </div>
                   </div>

                   {/* Step 4: Dispatched / Transit */}
                   <div className="relative flex gap-3 text-xs">
                     {["shipped", "delivered"].includes(order.status) ? (
                       <div className="absolute -left-[21px] w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[9px] shadow border-2 border-white">
                         ✓
                       </div>
                     ) : order.status === "customer_confirmed" ? (
                       <div className="absolute -left-[21px] w-4.5 h-4.5 rounded-full bg-orange-500 animate-[bounce_1s_infinite] text-white flex items-center justify-center font-bold text-[9px] shadow border-2 border-white">
                         🚚
                       </div>
                     ) : (
                       <div className="absolute -left-[21px] w-4.5 h-4.5 rounded-full bg-slate-200 border-2 border-white text-slate-400 flex items-center justify-center text-[9px]"></div>
                     )}
                     <div className="w-full">
                       <p className="font-extrabold text-slate-800 flex items-center justify-between">
                         <span className="flex items-center gap-1.5">
                            <span>Mzigo Uko Njiani (Transit)</span>
                            {["shipped", "delivered"].includes(order.status) && (
                              <span className="font-mono text-[9px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded shrink-0">
                                {formatStageTime('shipped')}
                              </span>
                            )}
                          </span>
                         {order.status === 'shipped' && (
                           <span className="text-[8px] bg-orange-600 text-white font-mono rounded px-1 animate-pulse">LIVE MPYA</span>
                         )}
                       </p>
                       <p className="text-[10px] text-slate-500">
                         {order.status === 'shipped' || order.status === 'delivered'
                           ? (order.riderName 
                                ? `${lang === "sw" ? "Msafirishaji wetu" : "Our rider"} ${order.riderName}${order.riderPhone ? " (" + order.riderPhone + ")" : ""}${order.riderVehicle ? " na chombo " + order.riderVehicle : ""} ${lang === "sw" ? "yuko njiani kuleta mzigo." : "is on the way to deliver your package."}`
                                : (lang === "sw" ? "Msafirishaji wetu yuko njiani kuleta mzigo." : "Our courier is on the way to deliver your package.")) 
                           : "Mzigo utapewa msafirishaji ukikamilika kufungwa na mteja kuthibitishwa."}
                       </p>

                       {order.status === 'shipped' && (
                         <div className="mt-3 bg-slate-900 border border-slate-800 text-white p-3.5 rounded-2xl relative overflow-hidden space-y-2 shadow-inner">
                           <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                             <span className="flex items-center gap-1">
                               <Navigation size={10} className="text-orange-500 animate-spin" />
                               Dar es Salaam Hub ➜ {order.customer_address ? order.customer_address.slice(0, 18) : "Mteja"}...
                             </span>
                             <span className="text-orange-400">Dakika 25 zimebaki</span>
                           </div>

                           <div className="h-16 relative bg-slate-950 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center">
                             <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-40"></div>
                             
                             <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 64">
                               <path 
                                 d="M 30,32 Q 140,10 250,32" 
                                 fill="none" 
                                 stroke="rgba(251,191,36,0.15)" 
                                 strokeWidth="3" 
                               />
                               <path 
                                 d="M 30,32 Q 140,10 250,32" 
                                 fill="none" 
                                 stroke="#f97316" 
                                 strokeWidth="2" 
                                 strokeDasharray="4 4" 
                                 className="animate-[dash_10s_linear_infinite]"
                               />
                             </svg>

                             <div className="absolute left-6 top-6 grid place-items-center">
                               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping absolute"></div>
                               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white relative z-10"></div>
                               <span className="text-[8px] text-white/50 font-mono mt-0.5">Mtoza</span>
                             </div>

                             <div className="absolute left-[135px] top-[14px] flex flex-col items-center animate-bounce">
                               <span className="text-sm">🚚</span>
                               <span className="bg-orange-500 text-[7px] text-white px-1.5 rounded-sm font-black uppercase font-mono leading-none py-0.5 max-w-[80px] truncate" title={order.riderName}>{order.riderName || (lang === "sw" ? "Msafirishaji" : "Courier")}</span>
                             </div>

                             <div className="absolute right-6 top-6 flex flex-col items-center">
                               <MapPin size={12} className="text-orange-500 animate-bounce" />
                               <span className="text-[8px] text-orange-400 font-extrabold mt-0.5">Wewe</span>
                             </div>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>

                   {/* Step 5: Delivered & Confirmed */}
                   <div className="relative flex gap-3 text-xs">
                     {order.status === 'delivered' ? (
                       <div className="absolute -left-[21px] w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[9px] shadow border-2 border-white">
                         ✓
                       </div>
                     ) : (
                       <div className="absolute -left-[21px] w-4.5 h-4.5 rounded-full bg-slate-200 border-2 border-white text-slate-400 flex items-center justify-center text-[9px]">
                         •
                       </div>
                     )}
                     <div>
                       <div className="flex justify-between items-start gap-2 w-full">
                          <p className="font-extrabold text-slate-800">Imepokelewa na Kuthibitishwa (Delivered)</p>
                          {order.status === 'delivered' && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono shrink-0">
                              {formatStageTime('delivered')}
                            </span>
                          )}
                        </div>
                       <p className="text-[10px] text-slate-500">
                         {order.status === 'delivered'
                           ? "Mteja amethibitisha kuwa amepokea mzigo wake kikamilifu na salama."
                           : "Mzigo bado haujafika / unangojea uthibitisho wa kupokelewa na mteja."}
                       </p>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Option 2: Payment proof block inside Track modal if not cancelled */}
               {order.status !== "cancelled" && (
                 <div className="bg-gradient-to-br from-orange-500/5 to-amber-500/10 border border-orange-500/20 p-5 rounded-3xl space-y-3.5">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <span className="text-lg">💰</span>
                       <div>
                         <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Uhakiki wa Malipo</h4>
                         <p className="text-[10px] text-slate-500">Boresha uthibitisho wa muamala ili kupata idhini</p>
                       </div>
                     </div>
                   </div>

                   {!paymentSubmittedLocally ? (
                     <div className="space-y-3">
                       <div className="relative">
                         <input 
                           type="text"
                           placeholder="Mfano: PP26061109403"
                           value={localTxId}
                           onChange={e => setLocalTxId(e.target.value)}
                           className="w-full bg-white border border-slate-200 outline-none p-3 pr-16 rounded-xl text-xs font-mono font-bold uppercase focus:border-orange-500"
                         />
                         <button
                           type="button"
                           onClick={() => setShowSMSArea(!showSMSArea)}
                           className="absolute right-2 top-2 bg-slate-50 hover:bg-slate-100 text-orange-600 font-extrabold p-1.5 px-2.5 rounded-lg text-[9px] border border-orange-200 transition-all cursor-pointer flex items-center gap-1"
                         >
                           <Sparkles size={11} className="text-orange-500" />
                           {lang === "sw" ? "Soma SMS" : "SMS AI"}
                         </button>
                       </div>

                       {showSMSArea && (
                         <div className="bg-slate-900 border border-slate-800 text-white p-3.5 rounded-2xl space-y-3">
                           <div className="flex justify-between items-center text-[10px]">
                             <span className="text-amber-400 font-black uppercase">Bandika SMS kupata namba ya muamala</span>
                             <button onClick={() => setShowSMSArea(false)} className="text-slate-400 hover:text-white">✕</button>
                           </div>
                           <textarea
                             rows={2}
                             placeholder="Bandika SMS ya mtandao wowote wa Simu (Mpesa, Tigo, Airtel) hapa..."
                             value={smsText}
                             onChange={e => setSmsText(e.target.value)}
                             className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-[10px] text-slate-200 outline-none"
                           />
                           <div className="flex justify-end items-center text-[9px]">
                             <button 
                               onClick={handleSmsOcrParse}
                               disabled={isOcrParsing}
                               className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded text-[10px]"
                             >
                               {isOcrParsing ? "Parsing..." : "Extract ID"}
                             </button>
                           </div>
                         </div>
                       )}

                       <button 
                         onClick={handleManualProofSubmit}
                         className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                       >
                         <CheckCircle2 size={13} />
                         Tuma Muamala kwa Uhakiki
                       </button>
                     </div>
                   ) : (
                     <div className="p-3.5 bg-emerald-500/10 border border-emerald-555/20 text-emerald-800 rounded-2xl text-xs space-y-1.5 font-medium">
                       <span className="font-bold flex items-center gap-1 text-emerald-700">
                         🛡️ Uhakiki unashughulikiwa!
                       </span>
                       <p className="text-[10px] text-emerald-600 leading-relaxed">
                         Namba ya Muamala iliyowasilishwa: <strong>{storedProof?.transactionId || localTxId || order.paymentReference}</strong>. Wasimamizi wetu wanahakiki salio sasa hivi.
                       </p>
                       <button 
                         onClick={() => {
                           // delete proof locally to test again
                           const displayId = order.legacy_id || order.id;
                           const proofs = JSON.parse(localStorage.getItem("orbi_payment_proofs") || "{}");
                           delete proofs[displayId];
                            setLocalTxId("");
                            db.saveOrder({ id: order.id, paymentReference: "" }).then(() => {
                              setOrder((prev: any) => ({ ...prev, paymentReference: "" }));
                            }).catch(e => console.error("Error resetting paymentReference:", e));
                           localStorage.setItem("orbi_payment_proofs", JSON.stringify(proofs));
                           setStoredProof(null);
                           setPaymentSubmittedLocally(false);
                         }} 
                         className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold px-2 py-1 rounded-lg text-[9px] border border-orange-200 inline-block transition cursor-pointer mt-1"
                       >
                         Anza Upya Uhakiki (Reset / Re-verify)
                       </button>
                     </div>
                   )}
                 </div>
               )}

               {/* Order Items Table */}
               <div className="space-y-2 border-t border-slate-100 pt-4">
                 <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest block">Orodha ya Bidhaa</h4>
                 {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-2 border-b border-dashed border-slate-100 font-medium">
                        <span className="text-slate-600">{item.quantity}x {item.name}</span>
                        <span className="text-slate-800 font-bold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                 ))}
                 <div className="flex justify-between font-black text-sm text-slate-800 pt-2 font-sans">
                     <span>Jumla</span>
                     <span className="text-orange-600">{formatCurrency(order.total)}</span>
                 </div>
               </div>

               <div className="pt-2 flex flex-col gap-2">


                 <button 
                   onClick={() => setOrder(null)} 
                   className="w-full border border-slate-200 text-slate-500 p-3 rounded-2xl font-bold hover:bg-slate-100 transition text-xs cursor-pointer"
                  >
                     Fuatilia oda nyingine
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
