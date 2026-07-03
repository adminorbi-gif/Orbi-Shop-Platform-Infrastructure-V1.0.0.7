import React from "react";
import {
  Clock,
  MapPin,
  MessageSquare,
  Package,
  Settings,
  Sparkles,
} from "lucide-react";

export type CustomerProfileTab =
  | "orders"
  | "track"
  | "messages"
  | "rewards"
  | "locator"
  | "settings";

type ProfileTabDefinition = {
  id: CustomerProfileTab;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  labelSw: string;
  labelEn: string;
  mobileSw: string;
  mobileEn: string;
  iconClass?: string;
};

export const profileTabs: ProfileTabDefinition[] = [
  {
    id: "orders",
    icon: Package,
    labelSw: "Manunuzi Yangu",
    labelEn: "My Orders",
    mobileSw: "Oda",
    mobileEn: "Orders",
  },
  {
    id: "track",
    icon: Clock,
    labelSw: "Fuatilia Oda",
    labelEn: "Track Order",
    mobileSw: "Fuatilia",
    mobileEn: "Track",
  },
  {
    id: "messages",
    icon: MessageSquare,
    labelSw: "Mawasiliano",
    labelEn: "Messages",
    mobileSw: "Chat",
    mobileEn: "Chat",
  },
  {
    id: "rewards",
    icon: Sparkles,
    labelSw: "Zawadi & Alama",
    labelEn: "Loyalty Rewards",
    mobileSw: "Zawadi",
    mobileEn: "Rewards",
    iconClass: "text-amber-500",
  },
  {
    id: "locator",
    icon: MapPin,
    labelSw: "Zamani & Usafiri",
    labelEn: "Carrier Map",
    mobileSw: "Ramani",
    mobileEn: "Map",
    iconClass: "text-orange-500",
  },
  {
    id: "settings",
    icon: Settings,
    labelSw: "Mipangilio",
    labelEn: "Settings",
    mobileSw: "Settings",
    mobileEn: "Settings",
  },
];

export function CustomerProfileShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full mx-auto px-3 sm:px-6 py-4 md:py-8 flex flex-col h-full min-h-0 overflow-hidden animate-fade-in transition-all duration-300 max-w-5xl ${className}`}
    >
      {children}
    </div>
  );
}

export function ProfileTabs({
  tab,
  setTab,
  lang,
  unreadCount = 0,
}: {
  tab: CustomerProfileTab;
  setTab: (tab: CustomerProfileTab) => void;
  lang: string;
  unreadCount?: number;
}) {
  return (
    <>
      <div className="hidden sm:flex border-b border-slate-100 bg-slate-50/70 overflow-x-auto scrollbar-none sticky top-0 z-20 backdrop-blur-md">
        {profileTabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-4 sm:px-6 py-3.5 sm:py-4 font-bold flex items-center justify-center gap-2 border-b-2 transition text-xs sm:text-sm shrink-0 relative flex-1 sm:flex-initial ${
                active
                  ? "border-primary text-primary bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50"
              }`}
            >
              <Icon size={16} className={`shrink-0 ${item.iconClass || ""}`} />
              <span>{lang === "sw" ? item.labelSw : item.labelEn}</span>
              {item.id === "messages" && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none animate-pulse shrink-0">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex sm:hidden border-b border-slate-100 bg-slate-50/90 py-1.5 sticky top-0 z-20 backdrop-blur-md w-full items-center gap-1.5 px-1.5 select-none overflow-x-auto no-scrollbar snap-x">
        {profileTabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[4.8rem] min-h-14 px-2 py-2 rounded-xl transition-all duration-150 snap-start relative ${
                active
                  ? "text-primary bg-primary/5 font-black scale-[1.03]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="relative leading-none">
                <Icon
                  size={17}
                  className={`shrink-0 mb-0.5 ${
                    active ? item.iconClass || "text-primary" : "text-slate-400"
                  }`}
                />
                {item.id === "messages" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold px-1 py-0.2 rounded-full leading-none animate-pulse shrink-0">
                    {unreadCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] tracking-tight font-semibold text-center truncate w-full px-0.5 block leading-none">
                {lang === "sw" ? item.mobileSw : item.mobileEn}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
