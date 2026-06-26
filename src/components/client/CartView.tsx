import React from "react";
import { X, ShoppingBag, Trash, Minus, Plus, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PriceDisplay } from "../PriceDisplay";
import { formatCurrency } from "../../lib/storage";

interface CartViewProps {
  showCart: boolean;
  setShowCart: (v: boolean) => void;
  cart: any[];
  setCart: (v: any[]) => void;
  lang: string;
  setShowCheckout: (v: boolean) => void;
  getProductPriceForQty: (p: any, q: number) => number;
}

export function CartView({
  showCart,
  setShowCart,
  cart,
  setCart,
  lang,
  setShowCheckout,
  getProductPriceForQty
}: CartViewProps) {
  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.product.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => {
    const actualPrice = getProductPriceForQty(item.product, item.quantity);
    return sum + (actualPrice * item.quantity);
  }, 0);

  return (
    <AnimatePresence>
      {showCart && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCart(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white shadow-2xl z-[110] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{lang === "sw" ? "Kapu Lako" : "Your Cart"}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{cart.length} {lang === "sw" ? "Bidhaa" : "Items"} Total</p>
                </div>
              </div>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <ShoppingBag size={40} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800">{lang === "sw" ? "Kapu ni Tupu" : "Cart is Empty"}</h4>
                    <p className="text-sm text-slate-400 max-w-[200px] mx-auto mt-1">{lang === "sw" ? "Bado hujaongeza bidhaa yoyote kwenye kapu lako." : "You haven't added any items to your cart yet."}</p>
                  </div>
                  <button 
                    onClick={() => setShowCart(false)}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition active:scale-95"
                  >
                    {lang === "sw" ? "Anza Kununua" : "Start Shopping"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const actualPrice = getProductPriceForQty(item.product, item.quantity);
                    return (
                      <div key={item.product.id} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                        <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                          {item.product.images?.[0] ? (
                            <img src={item.product.images[0]} className="w-full h-full object-cover" alt={item.product.name} referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ShoppingBag size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-sm font-bold text-slate-800 truncate leading-tight group-hover:text-[#ff4c00] transition-colors">
                                {item.product.name}
                              </h4>
                              <button onClick={() => removeItem(item.product.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 -mt-1 -mr-1">
                                <Trash size={14} />
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{item.product.category || "General"}</p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-100">
                              <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-white rounded transition-all"><Minus size={12} /></button>
                              <span className="w-8 text-center text-xs font-black text-slate-800">{item.quantity}</span>
                              <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-white rounded transition-all"><Plus size={12} /></button>
                            </div>
                            <div className="text-right">
                              <PriceDisplay amount={actualPrice * item.quantity} size="sm" colorClass="text-slate-900 font-black" />
                              {item.quantity > 1 && (
                                <p className="text-[9px] text-slate-400 font-bold mt-0.5">@ {formatCurrency(actualPrice)} ea</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-sm font-bold">{lang === "sw" ? "Jumla ya Bidhaa" : "Subtotal"}</span>
                    <PriceDisplay amount={subtotal} size="sm" colorClass="text-slate-600 font-bold" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-black text-slate-900 uppercase tracking-tight">{lang === "sw" ? "Jumla Kuu" : "Estimated Total"}</span>
                    <PriceDisplay amount={subtotal} size="lg" colorClass="text-[#ff4c00] font-black" />
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setShowCart(false);
                      setShowCheckout(true);
                    }}
                    className="w-full bg-[#ff4c00] hover:bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg shadow-orange-100 transition-all active:scale-95 group"
                  >
                    <span>{lang === "sw" ? "Endelea na Malipo" : "Proceed to Checkout"}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <div className="flex items-center justify-center gap-4 py-2 border-t border-slate-200/50 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      <span>Orbi PaySafe Active</span>
                    </div>
                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      <Zap size={12} className="text-amber-500" />
                      <span>Instant Escrow</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
