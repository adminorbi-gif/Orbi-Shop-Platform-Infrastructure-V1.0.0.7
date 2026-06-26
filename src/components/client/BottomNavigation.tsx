import React from "react";
import { Home, Search, ShoppingBag, User, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartCount: number;
  unreadCount: number;
  lang: string;
}

export function BottomNavigation({
  activeTab,
  onTabChange,
  cartCount,
  unreadCount,
  lang
}: BottomNavigationProps) {
  const tabs = [
    { id: "home", icon: Home, label: lang === "sw" ? "Mwanzo" : "Home" },
    { id: "search", icon: Search, label: lang === "sw" ? "Tafuta" : "Search" },
    { id: "ai", icon: Sparkles, label: "Orbi AI", special: true },
    { id: "cart", icon: ShoppingBag, label: lang === "sw" ? "Kikapu" : "Cart", badge: cartCount },
    { id: "profile", icon: User, label: lang === "sw" ? "Akaunti" : "Profile", badge: unreadCount }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] sm:hidden">
      <div className="bg-white/80 backdrop-blur-xl border-t border-slate-100 px-2 pb-safe-area-inset-bottom pt-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all active:scale-90 ${
                isActive ? "text-[#ff4c00]" : "text-slate-400"
              } ${tab.special ? "bg-orange-50 -mt-8 shadow-lg shadow-orange-100 border-2 border-white" : ""}`}
            >
              <div className="relative">
                <Icon size={tab.special ? 24 : 20} className={isActive ? "fill-orange-50" : ""} />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#ff4c00] text-white text-[8px] font-black min-w-[14px] h-[14px] flex items-center justify-center rounded-full border-2 border-white px-0.5">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? "opacity-100" : "opacity-60"}`}>
                {tab.label}
              </span>
              
              {isActive && !tab.special && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#ff4c00] rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
