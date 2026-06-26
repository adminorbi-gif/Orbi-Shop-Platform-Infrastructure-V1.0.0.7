import React, { useState, useEffect } from "react";
import { Store, User, ShoppingBag, LogIn, ExternalLink } from "lucide-react";
import { navigateTo, getNavigationState } from "../utils/navigation";

export function FloatingShortcutNav() {
  const [navState, setNavState] = useState(getNavigationState());
  const [isOpen, setIsOpen] = useState(true);
  const [isInternal, setIsInternal] = useState(() => {
    return window.location.search.includes("internal-nav=true") || window.location.hash.includes("#internal-nav");
  });

  useEffect(() => {
    const checkState = () => {
      setNavState(getNavigationState());
      setIsInternal(window.location.search.includes("internal-nav=true") || window.location.hash.includes("#internal-nav"));
    };
    window.addEventListener("popstate", checkState);
    const interval = setInterval(checkState, 400);
    return () => {
      window.removeEventListener("popstate", checkState);
      clearInterval(interval);
    };
  }, []);

  if (!isInternal) {
    return null;
  }

  return (
    <div id="orbi-floating-nav" className="fixed bottom-6 right-6 z-[99999] font-sans">
      <div className="flex flex-col items-end gap-2.5">
        {/* Main Capsule Drawer */}
        {isOpen && (
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-2 border border-slate-750 flex flex-col md:flex-row items-stretch md:items-center gap-1.5 animate-in fade-in slide-in-from-bottom-5 duration-300 md:h-[52px]">
            {/* Header / Info Section inside panel */}
            <div className="px-3 py-1 md:py-0 border-b md:border-b-0 md:border-r border-slate-800 flex items-center gap-2 pr-4 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-400">
                Orbi Quick Links:
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap md:flex-nowrap gap-1">
              {/* Buyer Home */}
              <button
                onClick={() => navigateTo("")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide uppercase transition cursor-pointer select-none ${
                  navState.isClient
                    ? "bg-amber-500 text-slate-950 font-black shadow-lg"
                    : "hover:bg-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                <ShoppingBag size={14} />
                <span>Buyer Shop</span>
              </button>

              {/* Seller / Admin Login */}
              <button
                onClick={() => navigateTo("?seller-login=true")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide uppercase transition cursor-pointer select-none ${
                  navState.isSellerLogin && !navState.isSellerSignup
                    ? "bg-amber-500 text-slate-950 font-black shadow-lg"
                    : "hover:bg-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                <LogIn size={14} />
                <span>Seller Login</span>
              </button>

              {/* Seller Signup */}
              <button
                onClick={() => navigateTo("?seller-signup=true")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide uppercase transition cursor-pointer select-none ${
                  navState.isSellerSignup
                    ? "bg-amber-500 text-slate-950 font-black shadow-lg"
                    : "hover:bg-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                <Store size={14} />
                <span>Join as Seller</span>
              </button>
            </div>
          </div>
        )}

        {/* Collapsible toggle circle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-slate-950 text-white hover:bg-slate-900 border border-slate-800 hover:border-slate-700 h-9 px-3.5 rounded-full shadow-lg transition flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest cursor-pointer select-none active:scale-95"
          title="Toggle Navigation Links Menu"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          {isOpen ? "Hide shortcuts" : "Quick Navigation Links"}
        </button>
      </div>
    </div>
  );
}
