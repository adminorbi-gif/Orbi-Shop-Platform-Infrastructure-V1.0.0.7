import React from "react";
import { Search, ShoppingCart, User, Menu, X, Sparkles, Zap, Bot, MessageSquare, History, Tag, Smartphone, Shirt, Sofa, Heart, CarFront, ShoppingBag, TrendingUp, Compass, Footprints, Crown, GlassWater, Wrench, Flower2, Anchor, Apple, Banana, Beer, Bone, Box, Brain, Brush, Bus, Calculator, Candy, Cat, ChefHat, Clapperboard, Cloud, Cookie, Dog, Dices, Disc, Egg, Fan, Feather, Fish, Gamepad2, Gavel, Guitar, Hammer, IceCream, Joystick, Lightbulb, Luggage, Map, Mic, Microscope, Moon, Mountain, Paintbrush, PenTool, Pill, Pizza, Plane, Plug, Printer, Puzzle, Radio, Receipt, Rocket, Ruler, Scale, Server, Shell, ShowerHead, Shovel, Sprout, Stethoscope, Sun, Table, Tablet, Tent, Thermometer, Trophy, Umbrella, Utensils, Wallet, Wine, Pause, Play, Armchair, Bath, Battery, Bed, Beef, BellRing, Bird, Book, Castle, Clover, Construction, Container, CupSoda, Glasses, GraduationCap, HardHat, Heater, Martini, Notebook, PackageOpen, PawPrint, Pen, Pencil, PiggyBank, PlugZap, Rabbit, Refrigerator, Salad, Sandwich, ShoppingBasket, Smile, Snowflake, Soup, Speaker, Target, Telescope, Terminal, ToyBrick, Train, Trees, Volleyball, Wand, Warehouse, WashingMachine, Waves, Webcam, Wheat } from "lucide-react";
import { TanzaniaFlag, LanguageSelector } from "./LanguageSelector";
import { formatCurrency } from "../../lib/storage";

const iconMap: Record<string, any> = {
  Search, ShoppingCart, User, Menu, X, Sparkles, Zap, Bot, MessageSquare, History, Tag, Smartphone, Shirt, Sofa, Heart, CarFront, ShoppingBag, TrendingUp, Compass, Footprints, Crown, GlassWater, Wrench, Flower2, Anchor, Apple, Banana, Beer, Bone, Box, Brain, Brush, Bus, Calculator, Candy, Cat, ChefHat, Clapperboard, Cloud, Cookie, Dog, Dices, Disc, Egg, Fan, Feather, Fish, Gamepad2, Gavel, Guitar, Hammer, IceCream, Joystick, Lightbulb, Luggage, Map, Mic, Microscope, Moon, Mountain, Paintbrush, PenTool, Pill, Pizza, Plane, Plug, Printer, Puzzle, Radio, Receipt, Rocket, Ruler, Scale, Server, Shell, ShowerHead, Shovel, Sprout, Stethoscope, Sun, Table, Tablet, Tent, Thermometer, Trophy, Umbrella, Utensils, Wallet, Wine, Pause, Play, Armchair, Bath, Battery, Bed, Beef, BellRing, Bird, Book, Castle, Clover, Construction, Container, CupSoda, Glasses, GraduationCap, HardHat, Heater, Martini, Notebook, PackageOpen, PawPrint, Pen, Pencil, PiggyBank, PlugZap, Rabbit, Refrigerator, Salad, Sandwich, ShoppingBasket, Smile, Snowflake, Soup, Speaker, Target, Telescope, Terminal, ToyBrick, Train, Trees, Volleyball, Wand, Warehouse, WashingMachine, Waves, Webcam, Wheat
};

interface NavigationProps {
  lang: "sw" | "en";
  setLang: (l: "sw" | "en") => void;
  search: string;
  setSearch: (v: string) => void;
  committedSearch: string;
  setCommittedSearch: (v: string) => void;
  cart: any[];
  setShowCart: (v: boolean) => void;
  activeUser: any;
  setShowProfile: (v: boolean) => void;
  setShowAuth: (v: "login" | "register" | null) => void;
  unreadCount: number;
  unreadNotificationsCount: number;
  setShowNotificationsMenu: (v: boolean) => void;
  setShowAIChatDrawer: (v: boolean) => void;
  selectedNiche: string;
  setSelectedNiche: (v: string) => void;
  niches: { name: string; icon: string }[];
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  t: (k: string) => string;
  nicheScrollRef: React.RefObject<HTMLDivElement>;
  backendPopularSearches: string[];
  searchHistory: string[];
  isExpandingSearch: boolean;
}

export function Navigation({
  lang,
  setLang,
  search,
  setSearch,
  committedSearch,
  setCommittedSearch,
  cart,
  setShowCart,
  activeUser,
  setShowProfile,
  setShowAuth,
  unreadCount,
  unreadNotificationsCount,
  setShowNotificationsMenu,
  setShowAIChatDrawer,
  selectedNiche,
  setSelectedNiche,
  niches,
  categories,
  selectedCategory,
  setSelectedCategory,
  t,
  nicheScrollRef,
  backendPopularSearches,
  searchHistory,
  isExpandingSearch
}: NavigationProps) {
  const [showSearchHistory, setShowSearchHistory] = React.useState(false);

  return (
    <div className="sticky top-0 z-[60] bg-white border-b border-slate-100 shadow-sm">
      {/* Top utility bar */}
      <div className="bg-slate-900 py-1 px-4 hidden sm:flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <TanzaniaFlag />
            <span>Mwanza - Dar - Arusha • Fast Delivery</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
            <Zap size={10} className="text-amber-400" />
            <span>Orbi PaySafe Escrow Active</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-32">
            <LanguageSelector lang={lang} setLang={setLang} t={t} />
          </div>
          <span className="text-slate-600">|</span>
          <button className="hover:text-white transition-colors">Sell on Orbi</button>
          <button className="hover:text-white transition-colors">Track Order</button>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center gap-4 sm:gap-8">
        <button 
          onClick={() => {
            window.location.href = '/';
          }}
          className="flex items-center gap-2 group shrink-0"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#ff4c00] rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 group-hover:scale-105 transition-transform active:scale-95">
            <ShoppingBag className="text-white" size={24} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">ORBI SHOP</h1>
            <p className="text-[10px] font-black text-[#ff4c00] tracking-widest uppercase mt-0.5">Tanzania</p>
          </div>
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative group">
          <div className="relative flex items-center bg-slate-100 rounded-2xl border-2 border-transparent focus-within:border-[#ff4c00] focus-within:bg-white transition-all shadow-inner">
            <Search className="ml-4 text-slate-400 group-focus-within:text-[#ff4c00] transition-colors" size={20} />
            <input
              type="text"
              value={search}
              onFocus={() => setShowSearchHistory(true)}
              onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                   setCommittedSearch(search);
                   setShowSearchHistory(false);
                }
              }}
              placeholder={lang === "sw" ? "Tafuta bidhaa, muuzaji ama kundi..." : "Search for products, sellers, or categories..."}
              className="flex-1 bg-transparent border-none outline-none p-3 sm:p-4 text-sm font-semibold text-slate-800 placeholder-slate-400"
            />
            {isExpandingSearch && (
              <div className="mr-3 animate-spin rounded-full h-4 w-4 border-2 border-[#ff4c00] border-t-transparent"></div>
            )}
            <button 
              onClick={() => setCommittedSearch(search)}
              className="hidden sm:flex mr-2 bg-[#ff4c00] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-850 active:scale-95 transition-all shadow-md shadow-orange-100"
            >
              Tafuta
            </button>
          </div>

          {/* Search History & Popular Dropdown */}
          {showSearchHistory && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden py-3 animate-in fade-in slide-in-from-top-2 z-[70]">
              {(searchHistory.length > 0 || backendPopularSearches.length > 0) ? (
                <>
                  {searchHistory.length > 0 && (
                    <div className="mb-4 px-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <History size={10} />
                        Your Recent Searches
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {searchHistory.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSearch(h);
                              setCommittedSearch(h);
                            }}
                            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-lg border border-slate-100 transition-colors"
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {backendPopularSearches.length > 0 && (
                    <div className="px-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <TrendingUp size={10} />
                        Trending on Orbi Shop
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {backendPopularSearches.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSearch(p);
                              setCommittedSearch(p);
                            }}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-700 rounded-lg border border-amber-100 transition-colors"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs text-slate-400 font-bold italic">Start typing to explore thousands of products...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1 sm:gap-3">
          <button 
             onClick={() => setShowAIChatDrawer(true)}
             className="relative p-2.5 text-slate-400 hover:text-[#ff4c00] hover:bg-orange-50 rounded-xl transition-all group"
          >
            <Bot size={24} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
          </button>

          <button 
             onClick={() => setShowNotificationsMenu(true)}
             className="relative p-2.5 text-slate-400 hover:text-[#ff4c00] hover:bg-orange-50 rounded-xl transition-all"
          >
            <Zap size={24} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-[#ff4c00] text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white px-1">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setShowCart(true)}
            className="relative p-2.5 text-slate-400 hover:text-[#ff4c00] hover:bg-orange-50 rounded-xl transition-all active:scale-95"
          >
            <ShoppingCart size={24} />
            {cart.length > 0 && (
              <span className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-[#ff4c00] text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white px-1">
                {cart.length}
              </span>
            )}
          </button>

          <div className="h-8 w-px bg-slate-100 mx-1 hidden sm:block"></div>

          <button 
            onClick={() => activeUser ? setShowProfile(true) : setShowAuth("login")}
            className="flex items-center gap-3 p-1.5 pr-4 hover:bg-slate-100 rounded-xl transition-all group active:scale-95 shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-[#ff4c00]/10 group-hover:text-[#ff4c00] transition-colors relative">
              <User size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff4c00] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Your Account</p>
              <p className="text-xs font-black text-slate-800 mt-1 truncate max-w-[100px]">
                {activeUser ? (activeUser.name || activeUser.phone) : (lang === "sw" ? "Ingia Sasa" : "Sign In")}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="border-t border-slate-50 bg-slate-50/50">
        <div className="max-w-7xl mx-auto flex items-center">
          <div className="w-full relative">
            <div 
              ref={nicheScrollRef}
              className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 px-4"
            >
              {niches.map((n) => {
                const IconComp = iconMap[n.icon] || Globe;
                const isSelected = selectedNiche === n.name;
                return (
                  <button
                    key={n.name}
                    onClick={() => {
                      setSelectedNiche(n.name);
                      setSelectedCategory("Zote");
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap shrink-0 border-2 ${
                      isSelected 
                        ? "bg-[#ff4c00] text-white border-[#ff4c00] shadow-md shadow-orange-100" 
                        : "bg-white text-slate-500 border-transparent hover:bg-white hover:border-slate-200"
                    }`}
                  >
                    <IconComp size={16} />
                    {n.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Sub-categories */}
      {selectedNiche !== "Zote" && (
        <div className="bg-white border-t border-slate-50 overflow-x-auto no-scrollbar py-2 px-4 shadow-inner">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const Globe = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
