import { useClientApp } from "./useClientApp";
import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from "react";
import { supabase, supabaseUrl, supabaseKey } from "../../lib/supabase";
import { db } from "../../lib/db";
import {
  BilingualSearchEngine,
  InvertedIndexSearch,
} from "../../lib/SearchEngine";
import PromotionalBannersSection from "../../components/PromotionalBannersSection";
import { PriceDisplay } from "../../components/PriceDisplay";
import { formatCurrency } from "../../lib/storage";
import {
  Product,
  Promotion,
  Order,
  OrderStatusLog,
  Customer,
  Message,
  CartItem,
  Coupon,
  Niche,
  SellerProfile,
  MarketplaceAd,
  Review,
  PromotionalBanner,
} from "../../types";
import { getProductPriceForQty } from "../../utils/pricing";
import { navigateTo } from "../../utils/navigation";
import {
  ShoppingCart,
  Search,
  User,
  Zap,
  MessageSquare,
  MessageCircle,
  Menu,
  X,
  Trash,
  Phone,
  ArrowUpDown,
  Image as ImageIcon,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Check,
  MapPin,
  Mail,
  Globe,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  Package,
  Clock,
  Paperclip,
  Download,
  Smartphone,
  Shirt,
  Sofa,
  Heart,
  CarFront,
  ShoppingBag,
  TrendingUp,
  History,
  Store,
  Shuffle,
  Sparkles,
  Gift,
  Award,
  Bell,
  Bot,
  Camera,
  RefreshCw,
  Coins,
  Star,
  Tag,
  Ticket,
  Activity,
  Cpu,
  FileText,
  Laptop,
  Baby,
  Palette,
  Coffee,
  Dumbbell,
  Scissors,
  Briefcase,
  Headphones,
  Cake,
  Watch,
  Bike,
  Key,
  BookOpen,
  Leaf,
  Flame,
  Music,
  Gem,
  Tv,
  Compass,
  Footprints,
  Crown,
  GlassWater,
  Wrench,
  Flower2,
  Anchor,
  Apple,
  Banana,
  Beer,
  Bone,
  Box,
  Brain,
  Brush,
  Bus,
  Calculator,
  Candy,
  Cat,
  ChefHat,
  Clapperboard,
  Cloud,
  Cookie,
  Dog,
  Dices,
  Disc,
  Egg,
  Fan,
  Feather,
  Fish,
  Gamepad2,
  Gavel,
  Guitar,
  Hammer,
  IceCream,
  Joystick,
  Lightbulb,
  Luggage,
  Map,
  Mic,
  Microscope,
  Moon,
  Mountain,
  Paintbrush,
  PenTool,
  Pill,
  Pizza,
  Plane,
  Plug,
  Printer,
  Puzzle,
  Radio,
  Receipt,
  Rocket,
  Ruler,
  Scale,
  Server,
  Shell,
  ShowerHead,
  Shovel,
  Sprout,
  Stethoscope,
  Sun,
  Table,
  Tablet,
  Tent,
  Thermometer,
  Trophy,
  Umbrella,
  Utensils,
  Wallet,
  Wine,
  Pause,
  Play,
  Armchair,
  Bath,
  Battery,
  Bed,
  Beef,
  BellRing,
  Bird,
  Book,
  Castle,
  Clover,
  Construction,
  Container,
  CupSoda,
  Glasses,
  GraduationCap,
  HardHat,
  Heater,
  Martini,
  Notebook,
  PackageOpen,
  PawPrint,
  Pen,
  Pencil,
  PiggyBank,
  PlugZap,
  Rabbit,
  Refrigerator,
  Salad,
  Sandwich,
  ShoppingBasket,
  Smile,
  Snowflake,
  Soup,
  Speaker,
  Target,
  Telescope,
  Terminal,
  ToyBrick,
  Train,
  Trees,
  Volleyball,
  Wand,
  Warehouse,
  WashingMachine,
  Waves,
  Webcam,
  Wheat,
} from "lucide-react";
import { Lang, t } from "../../lib/i18nClient";
import {
  AboutUsSection,
  ApplySellerModal,
} from "../../components/client/ClientSubcomponents";
import { useDialog } from "../../components/CustomDialogContext";
const ProductDetailPage = lazy(() => import("../ProductDetailPage"));
import { AppBarBackgroundSlider } from "../../components/AppBarBackgroundSlider";
const TrackOrderModal = lazy(() => import("../../components/TrackOrderModal"));
const ReviewModal = lazy(() => import("../../components/ReviewModal"));
import ScratchCardChallenge from "../../components/ScratchCardChallenge";
import CookieConsent from "../../components/CookieConsent";
const AboutUsPage = lazy(() => import("../AboutUsPage"));
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { motion, AnimatePresence } from "motion/react";

// Loyalty points system helper methods
import {
  PromoImageSlider,
  PromoCarousel,
  CustomerInvoiceView,
  ContactSection,
  CheckoutModal,
  AuthModal,
  ProductSkeleton,
  MediaRenderer,
  PackageIcon,
  CustomerProfile
} from './components';
import { getLoyaltyPoints } from "../../lib/helpers";

const formatItemCount = (num: number) => {
  if (num >= 1000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  }
  return num.toString();
};

const TanzaniaFlag = () => (
  <svg
    viewBox="0 0 300 200"
    className="w-5 h-3.5 inline-block shrink-0 shadow-xs rounded-xs border border-white/20"
    fill="none"
  >
    <polygon points="0,0 300,0 0,200" fill="#1eb53a" />
    <polygon points="0,200 300,200 300,0" fill="#00a3dd" />
    <line
      x1="-20"
      y1="220"
      x2="320"
      y2="-20"
      stroke="#fcd116"
      strokeWidth="54"
    />
    <line
      x1="-20"
      y1="220"
      x2="320"
      y2="-20"
      stroke="#000000"
      strokeWidth="34"
    />
  </svg>
);

const UKFlag = () => (
  <svg
    viewBox="0 0 60 30"
    className="w-5 h-3.5 inline-block shrink-0 shadow-xs rounded-xs border border-white/20"
    fill="none"
  >
    <clipPath id="uk-flag-clip-client">
      <path d="M0,0 L30,15 L0,15 z M0,30 L30,15 L30,30 z M60,30 L30,15 L60,15 z M60,0 L30,15 L30,0 z" />
    </clipPath>
    <rect width="60" height="30" fill="#012169" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
    <path
      d="M0,0 L60,30 M60,0 L0,30"
      stroke="#C8102E"
      strokeWidth="4"
      clipPath="url(#uk-flag-clip-client)"
    />
    <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
    <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

function CustomSelect({
  value,
  onChange,
  options,
  iconLabel,
  label,
  align = "left",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string; subtitle?: string }[];
  iconLabel: React.ReactNode;
  label: string;
  align?: "left" | "right" | "center";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.id === value) || options[0];

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 hover:bg-slate-100/80 border-none text-slate-700 text-[11px] font-medium rounded-md px-2 py-1 outline-none transition-all flex items-center justify-between text-left h-7"
        title={label}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] shrink-0">{iconLabel}</span>
          <span className="truncate text-[10px] leading-tight mt-0.5">
            {selectedOption.label}
          </span>
        </div>
        <ChevronDown
          size={10}
          className={`text-slate-400 shrink-0 ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 top-[calc(100%+4px)] ${align === "right" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"} w-max max-w-[95vw] min-w-[150px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1`}
        >
          <div className="px-3 py-1.5 text-[9px] font-black uppercase text-slate-400 tracking-widest bg-slate-50/50 border-b border-slate-100 flex items-center gap-1">
            {label}
          </div>
          <div className="p-1.5 space-y-1">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${value === opt.id ? "bg-[#ff4c00]/5" : "bg-transparent hover:bg-slate-50 text-slate-700"}`}
              >
                <div>
                  <div
                    className={`text-[12px] font-bold ${value === opt.id ? "text-[#ff4c00]" : "text-slate-800"}`}
                  >
                    {opt.label}
                  </div>
                  {opt.subtitle && (
                    <div
                      className={`text-[10px] mt-0.5 ${value === opt.id ? "text-[#ff4c00]/70 font-medium" : "text-slate-500"}`}
                    >
                      {opt.subtitle}
                    </div>
                  )}
                </div>
                {value === opt.id && (
                  <CheckCircle2
                    size={14}
                    className="text-[#ff4c00] shrink-0 ml-2"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



export const formatOrderNumber = (order: any) => {
  return order.id.substring(0, 8).toUpperCase();
};

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};


export default function ClientApp() {
    const {
    showAlert,
    showConfirm,
    toastMsg,
    setToastMsg,
    lang,
    setLang,
    prefs,
    setPrefs,
    products,
    setProducts,
    globalSettings,
    setGlobalSettings,
    promos,
    setPromos,
    promotionalBanners,
    setPromotionalBanners,
    cart,
    setCart,
    sellers,
    setSellers,
    orders,
    setOrders,
    marketplaceAds,
    setMarketplaceAds,
    visitorId,
    setVisitorId,
    countedAds,
    setCountedAds,
    shuffleWeights,
    setShuffleWeights,
    handleShuffleClick,
    salesCounts,
    heroAds,
    carouselAds,
    activeMarketplaceAds,
    handleMarketplaceAdClick,
    activeUser,
    setActiveUser,
    search,
    setSearch,
    committedSearch,
    setCommittedSearch,
    searchHistory,
    setSearchHistory,
    backendPopularSearches,
    setBackendPopularSearches,
    expandedKeywords,
    setExpandedKeywords,
    isExpandingSearch,
    setIsExpandingSearch,
    selectedCategory,
    setSelectedCategory,
    selectedNiche,
    setSelectedNiche,
    hoveredCategory,
    setHoveredCategory,
    hoveredCategoryX,
    setHoveredCategoryX,
    hoveredNiche,
    setHoveredNiche,
    hoveredNicheX,
    setHoveredNicheX,
    megaMenuProducts,
    selectedArrangementTier,
    setSelectedArrangementTier,
    selectedArrangementVibe,
    setSelectedArrangementVibe,
    selectedArrangementWrap,
    setSelectedArrangementWrap,
    nicheScrollRef,
    syncStatesRef,
    likedProductIds,
    setLikedProductIds,
    likedNiches,
    toggleLikeProduct,
    showNicheDrawer,
    setShowNicheDrawer,
    sortOrder,
    setSortOrder,
    showCart,
    setShowCart,
    showAuth,
    setShowAuth,
    showApplySellerModal,
    setShowApplySellerModal,
    showProfile,
    setShowProfile,
    showTrackOrder,
    setShowTrackOrder,
    profileInitialTab,
    setProfileInitialTab,
    showCheckout,
    setShowCheckout,
    showSecureOrderAuthPrompt,
    setShowSecureOrderAuthPrompt,
    showAboutPage,
    setShowAboutPage,
    aboutPageTab,
    setAboutPageTab,
    isLoading,
    setIsLoading,
    viewInvoice,
    setViewInvoice,
    viewPromo,
    setViewPromo,
    selectedProduct,
    setSelectedProduct,
    viewSeller,
    setViewSeller,
    showReviewModal,
    setShowReviewModal,
    selectedProductForReview,
    setSelectedProductForReview,
    allReviews,
    setAllReviews,
    sortedAdsList,
    recentProductIds,
    setRecentProductIds,
    handleProductSelect,
    recentProductsList,
    coupons,
    setCoupons,
    systemNiches,
    setSystemNiches,
    guestMessages,
    setGuestMessages,
    forcePointsUpdate,
    setForcePointsUpdate,
    isParsingReceipt,
    setIsParsingReceipt,
    parsedReceiptData,
    setParsedReceiptData,
    parsingError,
    setParsingError,
    readReplyIds,
    setReadReplyIds,
    handleReceiptUpload,
    handleClaimReceiptPoints,
    handleRedeemVoucher,
    showNotificationsMenu,
    setShowNotificationsMenu,
    readNotificationIds,
    setReadNotificationIds,
    saveReadNotificationIds,
    showAIChatDrawer,
    setShowAIChatDrawer,
    imageUploadCount,
    setImageUploadCount,
    showImageLimitModal,
    setShowImageLimitModal,
    getInitialUserId,
    isTransferredToLive,
    setIsTransferredToLive,
    aiLockTimeRemaining,
    setAiLockTimeRemaining,
    checkAIResetQuotaStatus,
    aiChatHistory,
    setAIChatHistory,
    aiInputMessage,
    setAIInputMessage,
    isAILoading,
    setIsAILoading,
    aiSelectedImage,
    setAiSelectedImage,
    handleAIImageChange,
    sendAIChatMessage,
    notifications,
    unreadNotificationsCount,
    loadData,
    unreadCount,
    logoutClient,
    niches,
    dynamicSellerCategories,
    categories,
    filteredProductsBySeller,
    searchIndex,
    debouncedSearch,
    setDebouncedSearch,
    filteredProducts,
    similarSuggestions,
    suggestions,
    adPlacementIndex,
    showSuggestions,
    setShowSuggestions,
    applySearch,
    clearSearchHistory,
    popularCategories,
    popularSearches,
    iconMap,
    handleCategorySelect,
    trackProductInteraction,
    recommendedProducts,
    topSellingProducts,
    proSellerProducts,
    topDealsProducts,
    newArrivalsProducts,
    addToCart,
    updateQuantity,
    handleOpenInternalChat,
    totalCart,
    renderSearchSuggestions
  } = useClientApp();

  return (
    <>
      {isLoading && <LoadingOverlay />}
      {showAboutPage && (
        <div className="fixed inset-0 z-[999999] bg-white overflow-y-auto">
          <Suspense fallback={<div className="flex items-center justify-center h-full p-8"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div></div>}>
            <AboutUsPage
              lang={lang}
              onClose={() => setShowAboutPage(false)}
              initialPage={aboutPageTab}
            />
          </Suspense>
        </div>
      )}

      {/* Dynamic SEO Product Discovery Map - Hidden from UI but accessible to search engine crawlers */}
      <div className="sr-only opacity-0 pointer-events-none absolute -bottom-full" aria-hidden="true">
        <h3>Product Sitemap Discovery - Bei za Bidhaa Tanzania</h3>
        {products.slice(0, 150).map(p => {
          const swName = p.nameSw || p.name;
          const swUrl = `/?product=${p.id}&name=${encodeURIComponent(p.name)}&price=${p.price}${p.nameSw ? `&nameSw=${encodeURIComponent(p.nameSw)}` : ''}`;
          return (
            <a key={`seo-link-${p.id}`} href={swUrl} title={`Bei ya ${swName}`}>
              Nunua {swName} - Bei ya {p.price} TZS - Orbi Shop Tanzania
            </a>
          );
        })}
      </div>

      <div
        className={`min-h-screen flex flex-col font-sans bg-slate-50 ${viewInvoice ? "print:hidden" : ""}`}
      >
        {/* Header */}
        <header
          style={{
            backgroundColor: globalSettings?.appBarColor || undefined,
          }}
          className="bg-slate-900 shrink-0 shadow-md sticky top-0 z-[120] transition-all relative"
        >
          <AppBarBackgroundSlider settings={globalSettings} />
          <div className="h-[60px] flex items-center justify-between px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center whitespace-nowrap gap-1.5">
                <img
                  src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
                  alt="Orbi"
                  className="h-[52px] sm:h-[60px] md:h-[68px] object-contain brightness-0 invert drop-shadow-md relative z-10 transition-all hover:scale-105 duration-300"
                />
              </div>
            </div>

            <div className="hidden md:block flex-1 max-w-2xl relative px-4">
              <div className="relative group flex items-center">
                <input
                  type="text"
                  placeholder={t(lang, "nav.search")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      applySearch(search);
                    }
                  }}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-slate-800/80 text-slate-100 placeholder-slate-450 rounded-full py-2 px-5 pl-10 pr-12 outline-none border border-slate-700/80 focus:border-amber-500 focus:bg-white focus:text-slate-800 focus:placeholder-slate-400 focus:ring-4 focus:ring-amber-500/10 transition-all backdrop-blur-sm font-medium shadow-inner"
                />
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors"
                  size={18}
                />
                {isExpandingSearch && (
                  <Sparkles
                    className="absolute right-11 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse"
                    size={16}
                    title={
                      lang === "sw"
                        ? "Orbi inaboresha utafutaji..."
                        : "Orbi expanding search..."
                    }
                  />
                )}
                <label
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 group-focus-within:text-slate-400 group-focus-within:hover:text-amber-500 transition-colors cursor-pointer flex items-center justify-center p-1"
                  title={
                    lang === "sw"
                      ? "Tafuta kwa picha (Vision AI)"
                      : "Search by Image (Vision AI)"
                  }
                >
                  <Camera size={18} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAIImageChange}
                    className="hidden"
                  />
                </label>
                {showSuggestions && renderSearchSuggestions()}
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 sm:gap-2 md:gap-3 shrink-0">
              <button
                onClick={() => setLang(lang === "sw" ? "en" : "sw")}
                className="text-xs md:text-sm font-medium hover:bg-white/10 transition border border-white/20 rounded-full px-2.5 py-1.5 flex items-center gap-1.5 text-white shadow-xs shrink-0 cursor-pointer"
                title={
                  lang === "sw"
                    ? "Switch to English"
                    : "Badili kwenda Kiswahili"
                }
              >
                <span className="flex items-center shrink-0">
                  {lang === "sw" ? <TanzaniaFlag /> : <UKFlag />}
                </span>
                <span className="hidden sm:inline uppercase text-[10px] md:text-xs font-bold tracking-wider">
                  {lang === "sw" ? "SW" : "EN"}
                </span>
              </button>

              {activeUser ? (
                <div className="flex items-center gap-2 sm:gap-3 text-sm font-medium sm:border-l border-white/20 sm:pl-4 relative group">
                  {/* Subtle active notification bell badge */}
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNotificationsMenu(!showNotificationsMenu);
                      }}
                      className="relative p-2 text-white hover:bg-white/10 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title={lang === "sw" ? "Taarifa Muhimu" : "Notifications"}
                    >
                      <Bell
                        size={18}
                        className="hover:rotate-12 transition-transform"
                      />
                      {unreadNotificationsCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-black flex items-center justify-center border border-orange-500 animate-pulse leading-none">
                          {unreadNotificationsCount}
                        </span>
                      )}
                    </button>

                    {showNotificationsMenu && (
                      <div className="absolute top-11 -right-16 md:right-0 w-[290px] sm:w-[320px] max-h-[380px] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-150 p-4 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                          <h4 className="font-extrabold text-xs flex items-center gap-1.5 text-slate-800">
                            <Bell size={14} className="text-orange-500" />
                            <span>
                              {lang === "sw"
                                ? "Taarifa Mpya"
                                : "Recent Updates"}
                            </span>
                          </h4>
                          {unreadNotificationsCount > 0 && (
                            <button
                              onClick={() => {
                                const allIds = notifications.map((n) => n.id);
                                saveReadNotificationIds(allIds);
                              }}
                              className="text-[10px] text-orange-500 hover:text-orange-600 font-bold hover:underline"
                            >
                              {lang === "sw" ? "Soma zote" : "Mark read"}
                            </button>
                          )}
                        </div>

                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            {lang === "sw"
                              ? "Huna taarifa yoyote mpya."
                              : "No new notifications."}
                          </div>
                        ) : (
                          <div className="space-y-2 mt-1 max-h-[290px] overflow-y-auto pr-1">
                            {notifications.map((n) => {
                              const isRead = readNotificationIds.includes(n.id);
                              return (
                                <div
                                  key={n.id}
                                  onClick={() => {
                                    if (!isRead) {
                                      saveReadNotificationIds([
                                        ...readNotificationIds,
                                        n.id,
                                      ]);
                                    }
                                    if (n.type === "order") {
                                      setProfileInitialTab("orders");
                                      setShowProfile(true);
                                    } else if (n.type === "message") {
                                      setProfileInitialTab("messages");
                                      setShowProfile(true);
                                    } else if (n.type === "discount") {
                                      setProfileInitialTab("rewards");
                                      setShowProfile(true);
                                    }
                                    setShowNotificationsMenu(false);
                                  }}
                                  className={`p-2 rounded-xl border text-left cursor-pointer transition-all hover:bg-slate-50 relative ${
                                    isRead
                                      ? "bg-white border-slate-100 text-slate-500"
                                      : "bg-orange-50/30 border-orange-100/40 text-slate-800 font-medium"
                                  }`}
                                >
                                  {!isRead && (
                                    <span className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                                  )}
                                  <div className="flex items-start gap-2">
                                    <div className="mt-0.5 shrink-0 text-orange-500">
                                      {n.type === "order" ? (
                                        <Truck size={12} />
                                      ) : n.type === "discount" ? (
                                        <Sparkles size={12} />
                                      ) : (
                                        <MessageSquare size={12} />
                                      )}
                                    </div>
                                    <div className="leading-tight flex-1">
                                      <div className="text-[11px] font-bold text-slate-800 mb-0.5 max-w-[210px] truncate">
                                        {lang === "sw" ? n.titleSw : n.title}
                                      </div>
                                      <div className="text-[10px] text-slate-400 leading-normal line-clamp-2">
                                        {lang === "sw" ? n.descSw : n.desc}
                                      </div>
                                      <div className="text-[8px] text-slate-350 mt-1 font-mono">
                                        {new Date(n.date).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    onClick={() => {
                      setProfileInitialTab("orders");
                      setShowProfile(true);
                    }}
                    className="w-9 h-9 rounded-full bg-white text-orange-600 flex items-center justify-center font-bold text-sm uppercase shadow-sm cursor-pointer hover:scale-105 transition-transform relative"
                  >
                    {activeUser.name.charAt(0)}
                  </div>
                  <div className="hidden md:flex flex-col leading-none text-white">
                    <span
                      onClick={() => {
                        setProfileInitialTab("orders");
                        setShowProfile(true);
                      }}
                      className="truncate max-w-[100px] mb-0.5 cursor-pointer hover:underline flex items-center gap-1.5 font-bold"
                    >
                      <span>{activeUser.name}</span>
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div
                        onClick={() => {
                          setShowProfile(true);
                          setProfileInitialTab("rewards" as any);
                        }}
                        className="flex items-center gap-1 text-[10px] text-amber-200 hover:text-amber-100 font-bold cursor-pointer transition-colors"
                        title={
                          lang === "sw" ? "Alama za Uaminifu" : "Loyalty Points"
                        }
                      >
                        <Sparkles
                          size={10}
                          className="text-amber-300 animate-pulse"
                        />
                        <span>
                          {getLoyaltyPoints(activeUser.id)}{" "}
                          {lang === "sw" ? "alama" : "pts"}
                        </span>
                      </div>
                      <span className="text-white/30 text-[9px]">•</span>
                      <button
                        onClick={logoutClient}
                        className="text-[10px] text-orange-100 hover:text-white transition uppercase tracking-wider font-bold"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                  {/* Account Dropdown Menu */}
                  <div className="absolute top-10 -right-2 bg-white shadow-xl rounded-2xl border border-slate-150 p-2.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col min-w-[190px] z-50 text-slate-800">
                    <div
                      onClick={() => {
                        setProfileInitialTab("orders");
                        setShowProfile(true);
                      }}
                      className="cursor-pointer hover:bg-slate-50 rounded-lg p-2 text-left mb-1.5 border-b border-slate-100 pb-2"
                    >
                      <div className="text-sm font-bold text-slate-800 truncate">
                        {activeUser.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {activeUser.phone || "Mteja"}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setProfileInitialTab("orders");
                        setShowProfile(true);
                      }}
                      className="text-xs text-slate-700 font-bold px-2.5 py-2 hover:bg-slate-50 rounded-lg text-left w-full transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <Package size={14} className="text-orange-500 shrink-0" />
                      <span>
                        {lang === "sw" ? "Manunuzi Yangu" : "My Orders"}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileInitialTab("track");
                        setShowProfile(true);
                      }}
                      className="text-xs text-slate-700 font-bold px-2.5 py-2 hover:bg-slate-50 rounded-lg text-left w-full transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <Truck size={14} className="text-orange-500 shrink-0" />
                      <span>
                        {lang === "sw" ? "Fuatilia Oda" : "Track Order"}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileInitialTab("messages");
                        setShowProfile(true);
                      }}
                      className="text-xs text-slate-700 font-bold px-2.5 py-2 hover:bg-slate-50 rounded-lg text-left w-full transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <MessageSquare
                        size={14}
                        className="text-orange-500 shrink-0"
                      />
                      <span>{lang === "sw" ? "Mawasiliano" : "Messages"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileInitialTab("rewards");
                        setShowProfile(true);
                      }}
                      className="text-xs text-slate-700 font-bold px-2.5 py-2 hover:bg-slate-50 rounded-lg text-left w-full transition-all flex items-center gap-2.5 cursor-pointer"
                    >
                      <Sparkles size={14} className="text-amber-500 shrink-0" />
                      <span>
                        {lang === "sw" ? "Zawadi & Alama" : "Rewards & Points"}
                      </span>
                    </button>

                    <div className="border-t border-slate-100 mt-1.5 pt-1.5">
                      <button
                        onClick={logoutClient}
                        className="text-xs text-red-500 font-bold px-2.5 py-2 hover:bg-red-50 rounded-lg text-left w-full transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <Lock size={14} className="shrink-0" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <button
                    onClick={() => setShowAuth("login")}
                    className="px-1.5 sm:px-2.5 py-1 bg-transparent hover:bg-white/10 text-white font-bold border border-white/30 hover:border-white rounded-full transition-all text-xs tracking-normal cursor-pointer shrink-0 select-none"
                    title={lang === "sw" ? "Ingia" : "Log In"}
                  >
                    {lang === "sw" ? "Ingia" : "Log In"}
                  </button>
                  <button
                    onClick={() => setShowAuth("register")}
                    className="px-1.5 sm:px-2.5 py-1 bg-white hover:bg-orange-50 text-orange-600 font-bold rounded-full transition-all shadow-xs text-xs tracking-normal cursor-pointer border border-transparent shrink-0 select-none"
                    title={lang === "sw" ? "Jisajili" : "Sign Up"}
                  >
                    {lang === "sw" ? "Jisajili" : "Sign Up"}
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowCart(true)}
                className="relative p-2.5 bg-white hover:bg-orange-50 text-orange-600 rounded-full transition shadow-md hover:shadow-lg hover:-translate-y-0.5 ml-1 border border-transparent"
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-slate-900 border-2 border-white text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
                    {cart.reduce((a, c) => a + c.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden px-4 pb-2">
            <div className="relative group flex items-center">
              <input
                type="text"
                placeholder={t(lang, "nav.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applySearch(search);
                  }
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-white/10 text-white placeholder-orange-100 rounded-full py-2 px-5 pl-10 pr-12 outline-none border border-white/20 focus:border-white focus:bg-white focus:text-slate-800 focus:placeholder-slate-400 focus:ring-4 focus:ring-white/30 transition-all text-sm backdrop-blur-sm shadow-inner"
              />
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-200 group-focus-within:text-orange-500 transition-colors"
                size={16}
              />
              {isExpandingSearch && (
                <Sparkles
                  className="absolute right-11 top-1/2 -translate-y-1/2 text-amber-300 animate-pulse"
                  size={14}
                  title={
                    lang === "sw"
                      ? "Orbi inaboresha utafutaji..."
                      : "Orbi expanding search..."
                  }
                />
              )}
              <label
                className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-200 hover:text-white group-focus-within:text-slate-400 group-focus-within:hover:text-orange-500 transition-colors cursor-pointer flex items-center justify-center p-1"
                title={
                  lang === "sw"
                    ? "Tafuta kwa picha (Vision AI)"
                    : "Search by Image (Vision AI)"
                }
              >
                <Camera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAIImageChange}
                  className="hidden"
                />
              </label>
              {showSuggestions && renderSearchSuggestions()}
            </div>
          </div>

          {/* Quick Niche Sub Menu Horizontal Scroll */}
          <div
            className="relative z-0 w-full bg-white text-slate-800"
            onMouseLeave={() => {
              setHoveredNiche(null);
              setHoveredCategory(null);
            }}
          >
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

            <div
              className="flex px-4 sm:px-6 gap-6 overflow-x-auto no-scrollbar items-center border-none"
              ref={nicheScrollRef}
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {niches.map((n: Niche) => {
                const Icon = iconMap[n.icon] || Globe;
                const isSelected = selectedNiche === n.name;
                const count =
                  n.name === "Zote"
                    ? products.length
                    : products.filter(
                        (p) => (p.niche || "Mengineyo") === n.name,
                      ).length;
                return (
                  <button
                    key={n.name}
                    onClick={() => {
                      setSelectedNiche(n.name);
                      setSelectedCategory("Zote");
                      setSearch("");
                    }}
                    onMouseEnter={(e) => {
                      if (window.innerWidth < 720) return;
                      setHoveredNiche(n.name);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const parentRect =
                        e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
                      if (parentRect) {
                        setHoveredNicheX(rect.left - parentRect.left);
                      }
                    }}
                    className={`flex items-center gap-1.5 py-1.5 sm:py-2 font-bold text-[11px] sm:text-xs transition-all shrink-0 cursor-pointer border-b-2 outline-none ${
                      isSelected
                        ? "border-[#ff4c00] text-[#ff4c00]"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <Icon
                      size={13}
                      className={
                        isSelected ? "text-[#ff4c00]" : "text-slate-400"
                      }
                    />
                    <span className="whitespace-nowrap">{n.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 font-black rounded-full leading-none ${isSelected ? "bg-[#ff4c00]/10 text-[#ff4c00]" : "bg-slate-100 text-slate-500"}`}
                    >
                      {formatItemCount(count)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Hover Mega Menu for Niche Products */}
            {hoveredNiche && megaMenuProducts.length > 0 && (
              <div
                className="absolute top-full bg-white shadow-2xl z-[100] p-4 border border-slate-200 rounded-b-2xl mt-0 w-[320px] sm:w-[480px] transition-all duration-150"
                style={{
                  left:
                    hoveredNicheX !== null
                      ? `${Math.max(12, Math.min(hoveredNicheX, window.innerWidth - 500))}px`
                      : "12px",
                }}
              >
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-3">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  {lang === "sw" ? "Bidhaa Bora za" : "Top Pro Products in: "}
                  <span className="text-amber-600 ml-1">{hoveredNiche}</span>
                </h3>
                <div className="flex overflow-x-auto gap-3 no-scrollbar pb-1.5 w-full">
                  {megaMenuProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setSelectedNiche(p.niche || "Mengineyo");
                        setHoveredNiche(null);
                      }}
                      className="flex-none w-[110px] sm:w-[130px] flex flex-col text-left group bg-slate-50 rounded-xl p-2 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                    >
                      <div className="w-full aspect-[4/3] rounded-lg bg-slate-200 overflow-hidden mb-2">
                        {p.images && p.images[0] ? (
                          <img
                            src={p.images[0]}
                            className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ShoppingBag />
                          </div>
                        )}
                      </div>
                      <h4 className="text-[11px] font-bold text-slate-800 line-clamp-1 group-hover:text-amber-600 transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-[9px] text-slate-500 truncate mt-0.5">
                        {p.category}
                      </p>
                      <div className="mt-1 font-black text-slate-900 text-xs">
                        <PriceDisplay amount={p.price} className="text-xs" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {showProfile && activeUser ? (
          <main className="flex-1 w-full flex flex-col bg-slate-50">
            <CustomerProfile
              user={activeUser}
              onClose={() => setShowProfile(false)}
              lang={lang}
              onUserUpdate={setActiveUser}
              onLogout={logoutClient}
              onRefresh={() => loadData(true)}
              orders={orders.filter(
                (o) =>
                  o.customer_id === activeUser.id ||
                  o.customerId === activeUser.id ||
                  (o.customerDetails?.phone === activeUser.phone &&
                    activeUser.phone !== ""),
              )}
              onViewInvoice={setViewInvoice}
              initialTab={profileInitialTab}
              aiChatHistory={aiChatHistory}
              sendAIChatMessage={sendAIChatMessage}
              isAILoading={isAILoading}
              isTransferredToLive={isTransferredToLive}
              aiSelectedImage={aiSelectedImage}
              setAiSelectedImage={setAiSelectedImage}
              aiInputMessage={aiInputMessage}
              setAIInputMessage={setAIInputMessage}
              handleAIImageChange={handleAIImageChange}
              aiLockTimeRemaining={aiLockTimeRemaining}
              forcePointsUpdate={forcePointsUpdate}
              setForcePointsUpdate={setForcePointsUpdate}
              handleReceiptUpload={handleReceiptUpload}
              isParsingReceipt={isParsingReceipt}
              parsedReceiptData={parsedReceiptData}
              handleClaimReceiptPoints={handleClaimReceiptPoints}
              setParsedReceiptData={setParsedReceiptData}
              parsingError={parsingError}
              handleRedeemVoucher={handleRedeemVoucher}
              coupons={coupons}
              onWriteReview={(productId, productName) => {
                setSelectedProductForReview({
                  id: productId,
                  name: productName,
                });
                setShowReviewModal(true);
              }}
            />
          </main>
        ) : viewPromo ? (
          <main className="flex-1 w-full flex flex-col items-center">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex-1 flex flex-col">
              <button
                onClick={() => setViewPromo(null)}
                className="mb-6 px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition flex items-center gap-2 self-start"
              >
                <ChevronLeft size={18} /> Rudi
              </button>
              <div className="flex-1 w-full relative">
                <PromoCarousel
                  promos={[viewPromo]}
                  products={products}
                  onAddToCart={addToCart}
                  onViewPromo={() => {}}
                  isIsolated={true}
                />
              </div>
            </div>
          </main>
        ) : (
          <main className="flex-1 w-full bg-slate-50/50 pb-12 overflow-hidden flex flex-col pt-0 md:pt-4">
            <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
              {!viewSeller ? (
                <>
                  {/* Promos */}
                  {isLoading ? (
                    <div className="bg-slate-200 animate-pulse max-[720px]:w-[calc(100%+16px)] max-[720px]:-mx-2 sm:max-[720px]:w-[calc(100%+32px)] sm:max-[720px]:-mx-4 min-[720px]:w-full min-[720px]:mx-0 max-[720px]:rounded-none min-[720px]:rounded-[14px] max-[720px]:aspect-[27/20] min-[720px]:aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/9] max-h-[360px] mb-8 shadow-sm"></div>
                  ) : carouselAds.length > 0 ? (
                    <div className="mb-10">
                      <PromoCarousel
                        promos={carouselAds}
                        products={products}
                        onAddToCart={addToCart}
                        onViewPromo={setViewPromo}
                      />
                    </div>
                  ) : null}

                  {/* Promotional Countdown Banners */}
                  <PromotionalBannersSection
                    banners={promotionalBanners}
                    products={products}
                    onAddToCart={addToCart}
                    onSelectProduct={setSelectedProduct}
                    lang={lang}
                  />
                </>
              ) : (
                <div className="mb-10 bg-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm border border-slate-200">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 border-4 border-slate-50 shadow-md">
                    {viewSeller.avatar ? (
                      <img
                        src={viewSeller.avatar}
                        alt={viewSeller.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                        <Store size={40} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start group">
                    <button
                      onClick={() => setViewSeller(null)}
                      className="text-sm font-bold text-slate-500 hover:text-orange-600 flex items-center gap-1 mb-2 bg-slate-100 hover:bg-orange-50 px-3 py-1 rounded-full transition-colors"
                    >
                      <ChevronLeft size={16} />{" "}
                      {lang === "sw" ? "Rudi" : "Back"}
                    </button>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
                      {viewSeller.name}
                    </h2>
                    <p className="text-slate-600 max-w-2xl text-sm md:text-base leading-relaxed mb-4">
                      {viewSeller.description}
                    </p>
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100">
                      <ShieldCheck size={18} className="text-blue-500" />
                      {lang === "sw"
                        ? "Muuzaji Aliyethibitishwa"
                        : "Verified Seller"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Store Area */}
            <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 mt-2 md:mt-3">
              <div className="w-full space-y-3 sm:space-y-4">
                {/* Custom Arrangements Visual Lookup Panel */}
                <div className="pt-1 pb-0">
                  {(selectedArrangementTier !== "all" ||
                    selectedArrangementVibe !== "all" ||
                    selectedArrangementWrap !== "all") && (
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => {
                          setSelectedArrangementTier("all");
                          setSelectedArrangementVibe("all");
                          setSelectedArrangementWrap("all");
                        }}
                        className="text-[10px] font-black text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full px-2 py-1 transition cursor-pointer"
                      >
                        {lang === "sw" ? "Futa Vyote (Reset)" : "Clear Options"}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-1 md:gap-2">
                    {/* Select 1: Arrangement Tier */}
                    <CustomSelect
                      value={selectedArrangementTier}
                      onChange={setSelectedArrangementTier}
                      iconLabel="🛍️"
                      label={
                        lang === "sw"
                          ? "Kiwango cha Thamani (Tier)"
                          : "Arrangement Tier"
                      }
                      align="left"
                      options={[
                        {
                          id: "all",
                          label: lang === "sw" ? "Ngazi Zote" : "All Tiers",
                          subtitle: "No price restrictions",
                        },
                        {
                          id: "standard",
                          label:
                            lang === "sw"
                              ? "Kawaida / Budget"
                              : "Standard Essentials",
                          subtitle: "Eco-friendly, essential gifts",
                        },
                        {
                          id: "premium",
                          label:
                            lang === "sw"
                              ? "Kifahari / Premium"
                              : "Premium Artistry",
                          subtitle: "Handcrafted deluxe options",
                        },
                        {
                          id: "luxury",
                          label:
                            lang === "sw" ? "Kifalme / Luxury" : "Royal Luxury",
                          subtitle: "Bespoke high-end masterpieces",
                        },
                      ]}
                    />

                    {/* Select 2: Color Vibes / Aesthetics */}
                    <CustomSelect
                      value={selectedArrangementVibe}
                      onChange={setSelectedArrangementVibe}
                      iconLabel="🎨"
                      label={
                        lang === "sw"
                          ? "Mandhari ya Rangi (Vibe)"
                          : "Arrangement Vibe"
                      }
                      align="center"
                      options={[
                        {
                          id: "all",
                          label:
                            lang === "sw"
                              ? "Mandhari Zote"
                              : "All Vibes & Colors",
                        },
                        {
                          id: "romance",
                          label:
                            lang === "sw"
                              ? "🔴 Upendo (Red / Rose)"
                              : "🔴 Crimson Romance",
                        },
                        {
                          id: "serenity",
                          label:
                            lang === "sw"
                              ? "⚪ Utulivu (Pink / White)"
                              : "⚪ Pastel Serenity",
                        },
                        {
                          id: "amber",
                          label:
                            lang === "sw"
                              ? "🟠 Machweo (Gold / orange)"
                              : "🟠 Sunset Amber",
                        },
                        {
                          id: "emerald",
                          label:
                            lang === "sw"
                              ? "🟢 Mali na Kijani (Green)"
                              : "🟢 Emerald Wealth",
                        },
                        {
                          id: "minimalist",
                          label:
                            lang === "sw"
                              ? "⚫ Rahisi ya Kisasa (Sleek)"
                              : "⚫ Modern Minimalist",
                        },
                      ]}
                    />

                    {/* Select 3: Presentation Box/Wrap Style */}
                    <CustomSelect
                      value={selectedArrangementWrap}
                      onChange={setSelectedArrangementWrap}
                      iconLabel="🎁"
                      label={
                        lang === "sw"
                          ? "Mtindo wa Ufungashaji"
                          : "Presentation Style"
                      }
                      align="right"
                      options={[
                        {
                          id: "all",
                          label:
                            lang === "sw"
                              ? "Aina Zote za Mipango"
                              : "All Presentations",
                        },
                        {
                          id: "box",
                          label:
                            lang === "sw"
                              ? "Kasha Maalum la Zawadi"
                              : "Signature Gift Box",
                        },
                        {
                          id: "wrap",
                          label:
                            lang === "sw"
                              ? "Karatasi Kifahari / Buketi"
                              : "Special Wrap / Bouquets",
                        },
                        {
                          id: "basket",
                          label:
                            lang === "sw"
                              ? "Kikapu cha Mkono / Hamper"
                              : "Handcrafted Basket",
                        },
                        {
                          id: "acrylic",
                          label:
                            lang === "sw"
                              ? "Glasi ya Kioo ya Acrylic"
                              : "Bespoke Acrylic Cube",
                        },
                      ]}
                    />
                  </div>

                  {/* Match counter banner */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>
                        {lang === "sw"
                          ? `${filteredProducts.length} Mpangilio umeoana na vigezo vyako`
                          : `${filteredProducts.length} arrangements match your criteria`}
                      </span>
                    </div>
                    {(selectedArrangementTier !== "all" ||
                      selectedArrangementVibe !== "all" ||
                      selectedArrangementWrap !== "all") && (
                      <div className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 uppercase tracking-wider animate-pulse">
                        {lang === "sw"
                          ? "Mchujo Umewashwa!"
                          : "Vibe-match Active!"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Selling & Recommended (Segmented Behavior Modules) */}
                <div className="flex flex-col space-y-6 sm:space-y-10">
                  {/* BEHAVIOR MODULE 1: TOP DEALS (Lowest Prices with specific pricing formatting & labels) */}
                  {topDealsProducts.length > 0 &&
                    !isLoading &&
                    selectedCategory === "Zote" &&
                    search === "" && (
                      <div className="lg:py-6 py-4 bg-transparent relative overflow-hidden flex flex-col border-b border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg md:text-xl font-extrabold text-slate-950 tracking-tight flex items-center gap-1.5 leading-tight">
                              {lang === "sw" ? "Ofa Moto-Moto" : "Top Deals"}
                            </h3>
                            <p className="text-[10px] md:text-xs text-slate-400 font-medium">
                              {lang === "sw"
                                ? "Okoa kwa bei nafuu kupita kawaida sokoni"
                                : "Score the lowest prices on Orbi Shop"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 hover:text-slate-600 cursor-pointer transition">
                            <span className="text-xs font-bold">
                              {lang === "sw" ? "Zote" : "View All"}
                            </span>
                            <ChevronRight size={18} />
                          </div>
                        </div>

                        <div className="flex gap-2.5 md:gap-3 overflow-x-auto pb-4 pt-1 scrollbar-none flex-nowrap -mx-2 px-2 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
                          {topDealsProducts.map((p) => {
                            const pSeller = sellers.find(
                              (s) => s.id === p.sellerId,
                            );
                            const hasDiscount =
                              p.oldPrice && p.oldPrice > p.price;
                            const percentOff = hasDiscount
                              ? Math.round(
                                  ((p.oldPrice! - p.price) / p.oldPrice!) * 100,
                                )
                              : 0;

                            return (
                              <div
                                key={`deal-${p.id}`}
                                onClick={() => handleProductSelect(p)}
                                className="w-[130px] sm:w-[155px] shrink-0 bg-transparent hover:bg-slate-50 transition cursor-pointer snap-start flex flex-col group justify-between"
                              >
                                <div>
                                  <div className="aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 relative mb-2">
                                    <img
                                      src={p.images[0]}
                                      alt={p.name}
                                      className="w-full h-full object-contain p-1 group-hover:scale-[1.03] transition duration-500"
                                      referrerPolicy="no-referrer"
                                    />
                                    {hasDiscount && (
                                      <div className="absolute top-1.5 left-1.5 bg-rose-600/90 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs font-bold leading-none shadow-xs">
                                        -{percentOff}%
                                      </div>
                                    )}
                                    {pSeller?.isPro && (
                                      <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[7px] px-1 py-0.5 rounded shadow-xs font-bold uppercase tracking-widest leading-none">
                                        PRO
                                      </div>
                                    )}
                                  </div>

                                  <h4 className="text-[11px] sm:text-[12px] font-medium text-slate-800 line-clamp-2 leading-[1.3] group-hover:text-[#ff4c00] transition-colors mb-1">
                                    {p.name}
                                  </h4>
                                </div>

                                <div className="mt-1">
                                  <PriceDisplay
                                    amount={p.price}
                                    colorClass="text-[#ff4c00]"
                                    className="text-[13px] sm:text-[14px] mb-1"
                                  />
                                  <p className="text-[9px] text-[#ff4c00] mt-0.5 font-medium leading-none text-left truncate w-full">
                                    {lang === "sw"
                                      ? "Chini kwa zinazofanana"
                                      : "Lowest among similar"}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* BEHAVIOR MODULE 2: NEW ARRIVALS (Newest items showcase) */}
                  {newArrivalsProducts.length > 0 &&
                    !isLoading &&
                    selectedCategory === "Zote" &&
                    search === "" && (
                      <div className="lg:py-6 py-4 bg-transparent relative overflow-hidden flex flex-col border-b border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg md:text-xl font-extrabold text-slate-950 tracking-tight flex items-center gap-1.5 leading-tight">
                              {lang === "sw" ? "Hivi Karibuni" : "New Arrivals"}
                              <span className="text-[10px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                                {lang === "sw" ? "MPYA" : "NEW"}
                              </span>
                            </h3>
                            <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-1">
                              {lang === "sw"
                                ? "Wahi bidhaa mpya kabisa zilizotufikia mapema"
                                : "Stay ahead with the latest offerings"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 hover:text-slate-600 cursor-pointer transition">
                            <span className="text-xs font-bold">
                              {lang === "sw" ? "Zote" : "View All"}
                            </span>
                            <ChevronRight size={18} />
                          </div>
                        </div>

                        {/* Slide track */}
                        <div className="flex gap-2.5 md:gap-3 overflow-x-auto pb-4 pt-1 scrollbar-none flex-nowrap -mx-2 px-2 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
                          {newArrivalsProducts.map((p) => {
                            const pSeller = sellers.find(
                              (s) => s.id === p.sellerId,
                            );
                            return (
                              <div
                                key={`new-${p.id}`}
                                onClick={() => handleProductSelect(p)}
                                className="w-[130px] sm:w-[155px] shrink-0 bg-transparent hover:bg-slate-50 transition cursor-pointer snap-start flex flex-col group justify-between"
                              >
                                <div>
                                  <div className="aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 relative mb-2">
                                    <img
                                      src={p.images[0]}
                                      alt={p.name}
                                      className="w-full h-full object-contain p-1 group-hover:scale-[1.03] transition duration-500"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold backdrop-blur-xs leading-none shadow-xs">
                                      {lang === "sw" ? "Mpyaa" : "Fresh In"}
                                    </div>
                                    {pSeller?.isPro && (
                                      <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[7px] px-1 py-0.5 rounded shadow-xs font-bold uppercase tracking-widest leading-none">
                                        PRO
                                      </div>
                                    )}
                                  </div>

                                  <h4 className="text-[11px] sm:text-[12px] font-medium text-slate-800 line-clamp-2 leading-[1.3] group-hover:text-[#ff4c00] transition-colors mb-1">
                                    {p.name}
                                  </h4>
                                </div>

                                <div className="mt-1">
                                  <PriceDisplay
                                    amount={p.price}
                                    colorClass="text-[#ff4c00]"
                                    className="text-[13px] sm:text-[14px] mb-1"
                                  />
                                  <p className="text-[9px] text-[#ff4c00] mt-0.5 font-medium leading-none text-left truncate w-full">
                                    {p.category}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* BEHAVIOR MODULE 3: PRO & PREMIUM FEATURED SELLERS (Vendor Prioritization) */}
                  {proSellerProducts.length > 0 &&
                    !isLoading &&
                    selectedCategory === "Zote" &&
                    search === "" && (
                      <div
                        id="pro-sellers-picks-scroller-section"
                        className="lg:py-6 py-4 bg-transparent relative overflow-hidden flex flex-col border-b border-slate-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 leading-tight">
                              {lang === "sw"
                                ? "Wauzaji walio pendekezwa"
                                : "Pro Sellers' Pick"}
                              <span className="text-[9px] font-black uppercase bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                                APPROVED <Store size={8} />
                              </span>
                            </h3>
                            <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-1">
                              {lang === "sw"
                                ? "Bidhaa zilizothibitishwa moja kwa moja kutoka kwa wauzaji wetu bora"
                                : "Premium certified products directly from top-tier wholesale stores"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 hover:text-slate-600 cursor-pointer transition">
                            <span className="text-xs font-bold">
                              {lang === "sw" ? "Gundua" : "Explore"}
                            </span>
                            <ChevronRight size={18} />
                          </div>
                        </div>

                        {/* Slide track */}
                        <div className="flex gap-2.5 md:gap-3 overflow-x-auto pb-4 pt-1 scrollbar-none flex-nowrap -mx-2 px-2 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
                          {proSellerProducts.map((p) => {
                            const pSeller = sellers.find(
                              (s) => s.id === p.sellerId,
                            );
                            return (
                              <div
                                key={`pro-${p.id}`}
                                onClick={() => handleProductSelect(p)}
                                className="w-[130px] sm:w-[155px] shrink-0 bg-transparent hover:bg-slate-50 transition cursor-pointer snap-start flex flex-col group justify-between"
                              >
                                <div>
                                  <div className="aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 relative mb-2">
                                    <img
                                      src={p.images[0]}
                                      alt={p.name}
                                      className="w-full h-full object-contain p-1 group-hover:scale-[1.03] transition duration-500"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                                      {lang === "sw"
                                        ? "DUKA RASMI"
                                        : "PRO STORE"}
                                    </div>
                                  </div>

                                  <h4 className="text-[11px] sm:text-[12px] font-medium text-slate-800 line-clamp-2 leading-[1.3] group-hover:text-[#ff4c00] transition-colors mb-1">
                                    {p.name}
                                  </h4>
                                </div>

                                <div className="mt-1">
                                  <PriceDisplay
                                    amount={p.price}
                                    colorClass="text-[#ff4c00]"
                                    className="text-[13px] sm:text-[14px] mb-1"
                                  />
                                  {pSeller && (
                                    <p className="text-[9px] text-[#ff4c00] mt-0.5 font-medium flex items-center gap-1 w-full truncate">
                                      <Store size={10} className="shrink-0" />{" "}
                                      {pSeller.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>

                {/* All Products Header and Filters unified in same row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-6 bg-transparent">
                  <div className="shrink-0">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                      Our Collection
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {filteredProducts.length}{" "}
                      {lang === "sw"
                        ? "Bidhaa Zilizopatikana"
                        : "Products Found"}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0 lg:justify-end">
                    {/* Categories list as capsule buttons (Horizontal Scroll) */}
                    <div
                      className="relative flex-1 max-w-full lg:max-w-xl"
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      <div className="overflow-x-auto scrollbar-hide py-1">
                        <div className="flex items-center gap-6">
                          {isLoading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="h-9 w-20 bg-slate-100 animate-pulse rounded-full shrink-0"
                                ></div>
                              ))
                            : categories.map((c: any) => (
                                <button
                                  key={c}
                                  onClick={() => handleCategorySelect(c)}
                                  onMouseEnter={(e) => {
                                    if (window.innerWidth < 720) return;
                                    setHoveredCategory(c);
                                    const rect =
                                      e.currentTarget.getBoundingClientRect();
                                    const parentRect =
                                      e.currentTarget.parentElement?.parentElement?.parentElement?.getBoundingClientRect();
                                    if (parentRect) {
                                      setHoveredCategoryX(
                                        rect.left - parentRect.left,
                                      );
                                    }
                                  }}
                                  className={`py-2 text-[13px] font-bold whitespace-nowrap transition-all border-b-[3px] outline-none cursor-pointer ${
                                    selectedCategory === c
                                      ? "border-slate-900 text-slate-900"
                                      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                                  }`}
                                >
                                  {c}
                                </button>
                              ))}

                          {/* Dedicated visual separator & Special Merchant Filters, keeping them distinct from standard product categories */}
                          {!viewSeller &&
                            selectedNiche === "Zote" &&
                            dynamicSellerCategories.length > 0 && (
                              <>
                                <div className="h-5 w-px bg-slate-200 shrink-0 self-center mx-1"></div>
                                {dynamicSellerCategories.map((sc) => {
                                  const isSelected = selectedCategory === sc;
                                  return (
                                    <button
                                      key={sc}
                                      onClick={() => handleCategorySelect(sc)}
                                      className={`py-1 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all outline-none cursor-pointer flex items-center gap-1.5 shrink-0 border duration-200 ${
                                        isSelected
                                          ? sc === "Pro Sellers"
                                            ? "bg-amber-100 text-amber-800 border-amber-300 shadow-sm font-black"
                                            : "bg-indigo-100 text-indigo-800 border-indigo-300 shadow-sm font-black"
                                          : sc === "Pro Sellers"
                                            ? "bg-amber-50/50 text-amber-700 hover:bg-amber-100/50 border-amber-200"
                                            : "bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100/50 border-indigo-200"
                                      }`}
                                    >
                                      {sc === "Pro Sellers" ? (
                                        <>
                                          <Sparkles
                                            size={11}
                                            className={`${isSelected ? "text-amber-600 fill-amber-350 animate-bounce" : "text-amber-500"} shrink-0`}
                                          />
                                          <span>
                                            {lang === "sw"
                                              ? "Wauzaji wa Pro"
                                              : "Pro Sellers"}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <Briefcase
                                            size={11}
                                            className={`${isSelected ? "text-indigo-600" : "text-indigo-500"} shrink-0`}
                                          />
                                          <span>
                                            {lang === "sw"
                                              ? "Kununua Juu/Jumla"
                                              : "Wholesale Store"}
                                          </span>
                                        </>
                                      )}
                                    </button>
                                  );
                                })}
                              </>
                            )}
                        </div>
                      </div>

                      {/* Hover Mega Menu for Category Products */}
                      {hoveredCategory && megaMenuProducts.length > 0 && (
                        <div
                          className="absolute top-full bg-white shadow-lg z-[100] p-4 md:p-6 border border-slate-100 rounded-xl mt-1 w-[290px] sm:w-[480px] transition-all duration-150"
                          style={{
                            left:
                              hoveredCategoryX !== null
                                ? `${Math.max(12, Math.min(hoveredCategoryX, window.innerWidth - 500))}px`
                                : "auto",
                            right: hoveredCategoryX !== null ? "auto" : "0px",
                          }}
                        >
                          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
                            <Star
                              size={16}
                              className="text-[#ff4c00] fill-[#ff4c00]"
                            />
                            {lang === "sw"
                              ? "Bidhaa Bora za"
                              : "Top Pro Products in: "}
                            <span className="text-[#ff4c00] ml-1">
                              {hoveredCategory}
                            </span>
                          </h3>
                          <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar w-full">
                            {megaMenuProducts.slice(0, 4).map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setSelectedCategory(p.category);
                                  setHoveredCategory(null);
                                }}
                                className="flex-none w-[120px] md:w-[130px] flex flex-col text-left group bg-transparent rounded-lg p-1 hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                <div className="w-full aspect-[4/3] rounded-lg bg-slate-100 overflow-hidden mb-2">
                                  {p.images && p.images[0] ? (
                                    <img
                                      src={p.images[0]}
                                      className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-500"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                      <ShoppingBag />
                                    </div>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-amber-600 transition-colors">
                                  {p.name}
                                </h4>
                                <div className="mt-2 font-black text-slate-900 text-xs">
                                  <PriceDisplay
                                    amount={p.price}
                                    className="text-xs"
                                  />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sorting Selection Dropdown with Custom Personalized Indicator */}
                    <div className="flex items-center gap-2 shrink-0 bg-transparent transition-all self-start sm:self-auto min-w-[170px] z-20">
                      {likedProductIds.length > 0 &&
                        sortOrder === "default" && (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-100 text-[10px] font-black text-rose-600 animate-pulse shrink-0 shadow-xs">
                            <Heart
                              size={11}
                              fill="currentColor"
                              className="text-rose-500"
                            />
                            <span>
                              {lang === "sw"
                                ? `${likedProductIds.length} Pendwa Zimepewa Kipaumbele!`
                                : `Favorites Highlighted (${likedProductIds.length})`}
                            </span>
                          </div>
                        )}

                      <CustomSelect
                        value={sortOrder}
                        onChange={(v) => setSortOrder(v as any)}
                        iconLabel={
                          <ArrowUpDown size={13} className="text-slate-500" />
                        }
                        label={
                          lang === "sw"
                            ? "Upangaji wa Bidhaa"
                            : "Sort Preferences"
                        }
                        options={[
                          { id: "default", label: t(lang, "filter.default") },
                          { id: "asc", label: t(lang, "filter.asc") },
                          { id: "desc", label: t(lang, "filter.desc") },
                          { id: "newest", label: t(lang, "filter.newest") },
                          { id: "popular", label: t(lang, "filter.popular") },
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {/* Active Filters Ribbon */}
                {(() => {
                  const hasActiveFilters = !!(
                    (committedSearch && committedSearch.trim().length > 0) ||
                    selectedCategory !== "Zote" ||
                    selectedNiche !== "Zote" ||
                    selectedArrangementTier !== "all" ||
                    selectedArrangementVibe !== "all" ||
                    selectedArrangementWrap !== "all"
                  );
                  if (!hasActiveFilters) return null;
                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 border border-slate-200/65 rounded-2xl p-4 mb-6 shadow-xs animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-500 uppercase tracking-widest shrink-0">
                        <Sparkles
                          size={14}
                          className="text-[#ff4c00] animate-pulse"
                        />
                        <span>
                          {lang === "sw"
                            ? "Vichujio Amilifu:"
                            : "Active Filters:"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center flex-1">
                        {committedSearch && (
                          <span className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-black text-slate-800 flex items-center gap-1.5 shadow-xs">
                            <span>"{committedSearch}"</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSearch("");
                                setCommittedSearch("");
                              }}
                              className="text-slate-400 hover:text-red-500 transition cursor-pointer p-0.5"
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </span>
                        )}
                        {selectedCategory !== "Zote" && (
                          <span className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-black text-slate-800 flex items-center gap-1.5 shadow-xs">
                            <span>{selectedCategory}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedCategory("Zote")}
                              className="text-slate-400 hover:text-red-500 transition cursor-pointer p-0.5"
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </span>
                        )}
                        {selectedNiche !== "Zote" && (
                          <span className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-black text-slate-800 flex items-center gap-1.5 shadow-xs">
                            <span>{selectedNiche}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedNiche("Zote")}
                              className="text-slate-400 hover:text-red-500 transition cursor-pointer p-0.5"
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </span>
                        )}
                        {selectedArrangementTier !== "all" && (
                          <span className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-black text-slate-800 flex items-center gap-1.5 shadow-xs">
                            <span>
                              {selectedArrangementTier === "luxury"
                                ? lang === "sw"
                                  ? "Luxury"
                                  : "Luxury"
                                : selectedArrangementTier === "premium"
                                  ? lang === "sw"
                                    ? "Premium"
                                    : "Premium"
                                  : lang === "sw"
                                    ? "Budget"
                                    : "Standard"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedArrangementTier("all")}
                              className="text-slate-400 hover:text-red-500 transition cursor-pointer p-0.5"
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </span>
                        )}
                        {selectedArrangementVibe !== "all" && (
                          <span className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-black text-slate-800 flex items-center gap-1.5 shadow-xs">
                            <span>{selectedArrangementVibe.toUpperCase()}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedArrangementVibe("all")}
                              className="text-slate-400 hover:text-red-500 transition cursor-pointer p-0.5"
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </span>
                        )}
                        {selectedArrangementWrap !== "all" && (
                          <span className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs font-black text-slate-800 flex items-center gap-1.5 shadow-xs">
                            <span>{selectedArrangementWrap.toUpperCase()}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedArrangementWrap("all")}
                              className="text-slate-400 hover:text-red-500 transition cursor-pointer p-0.5"
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setCommittedSearch("");
                          setSelectedCategory("Zote");
                          setSelectedNiche("Zote");
                          setSelectedArrangementTier("all");
                          setSelectedArrangementVibe("all");
                          setSelectedArrangementWrap("all");
                        }}
                        className="text-xs font-black text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 px-4 py-2 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 self-end sm:self-auto shrink-0 shadow-xs"
                      >
                        <Trash size={14} />
                        <span>
                          {lang === "sw" ? "Futa Vyote" : "Clear All"}
                        </span>
                      </button>
                    </div>
                  );
                })()}

                {/* Main Grid */}
                <div className="">
                  {isLoading ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(175px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-1.5 py-1 sm:gap-2">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <ProductSkeleton key={i} />
                      ))}
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(175px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-1.5 py-1 sm:gap-2">
                      <AnimatePresence mode="popLayout">
                        {filteredProducts.flatMap((p, idx) => {
                          const pSeller = sellers.find(
                            (s) => s.id === p.sellerId,
                          );

                          const cards = [
                            <motion.div
                              key={p.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95, y: 15 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                              <ProductCard
                                p={p}
                                seller={pSeller}
                                onAdd={(openCart) => addToCart(p, openCart)}
                                onSelect={() => handleProductSelect(p)}
                                onInteract={() => trackProductInteraction(p)}
                                onViewSeller={(s) => {
                                  setViewSeller(s);
                                  setSelectedNiche("Zote");
                                  setSelectedCategory("Zote");
                                  setSearch("");
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                lang={lang}
                                reviews={allReviews[p.id] || []}
                                isLiked={likedProductIds.includes(p.id)}
                                onLikeToggle={toggleLikeProduct}
                              />
                            </motion.div>,
                          ];

                          if (
                            idx === adPlacementIndex &&
                            sortedAdsList.length > 0
                          ) {
                            cards.push(
                              <motion.div
                                key="orbi-embedded-carousel-ads"
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="col-span-full py-2 my-1"
                                id="orbi-unified-carousel-scroller-section"
                              >
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none flex-nowrap scroll-smooth pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                                  {sortedAdsList.map((ad) => (
                                    <div
                                      key={ad.id}
                                      id={`orbi-ad-card-${ad.id}`}
                                      onClick={ad.action}
                                      className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:border-emerald-500/80 hover:shadow-md cursor-pointer transition-all duration-300 group flex flex-row w-[290px] sm:w-[340px] shrink-0 snap-start h-28"
                                    >
                                      {/* Left Ad image creative */}
                                      <div className="w-[100px] sm:w-[120px] h-full shrink-0 relative overflow-hidden bg-slate-100">
                                        <img
                                          src={ad.image}
                                          alt={ad.title}
                                          className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute top-2 left-2 bg-slate-900/60 text-white text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                                          {ad.badge}
                                        </div>
                                      </div>

                                      {/* Right details copy text */}
                                      <div className="p-3.5 flex-1 flex flex-col justify-between min-w-0">
                                        <div className="space-y-0.5">
                                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest truncate leading-tight">
                                            {ad.businessName}
                                          </p>
                                          <h4 className="text-[11px] font-black text-slate-900 group-hover:text-emerald-600 leading-snug line-clamp-2 transition-colors whitespace-normal">
                                            {ad.title}
                                          </h4>
                                        </div>

                                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
                                          <span>
                                            {lang === "sw"
                                              ? "Gundua"
                                              : "Discover"}
                                          </span>
                                          <ChevronRight
                                            size={12}
                                            className="transition-transform group-hover:translate-x-0.5"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>,
                            );
                          }

                          return cards;
                        })}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {similarSuggestions.length > 0 ? (
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-sm">
                            <div className="bg-white p-4 rounded-full shadow-sm text-amber-500 shrink-0">
                              <Sparkles
                                size={28}
                                className="animate-pulse text-amber-500"
                              />
                            </div>
                            <div className="text-center sm:text-left">
                              <h4
                                id="orbi-similar-matches-heading"
                                className="text-lg font-black text-slate-900 mb-1"
                              >
                                {lang === "sw"
                                  ? `Hakuna bidhaa iliyopatikana kwa "${debouncedSearch}"`
                                  : `No items found matching "${debouncedSearch}"`}
                              </h4>
                              <p className="text-sm font-medium text-slate-600">
                                {lang === "sw"
                                  ? "Lakini tusingependa uondoke mikono mitupu! Hapa tunapendekeza bidhaa zinazofanana na utafutaji wako:"
                                  : "But we wouldn't want you to leave empty-handed! Here are some similar products we think you'll love:"}
                              </p>
                            </div>
                          </div>

                          {/* Similar Products Grid */}
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(175px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-1.5 py-1 sm:gap-2">
                            <AnimatePresence mode="popLayout">
                              {similarSuggestions.map((p) => {
                                const pSeller = sellers.find(
                                  (s) => s.id === p.sellerId,
                                );
                                return (
                                  <motion.div
                                    key={`similar-${p.id}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                  >
                                    <ProductCard
                                      p={p}
                                      seller={pSeller}
                                      onAdd={(openCart) => addToCart(p, openCart)}
                                      onSelect={() => handleProductSelect(p)}
                                      onInteract={() => trackProductInteraction(p)}
                                      onViewSeller={(s) => {
                                        setViewSeller(s);
                                        setSelectedNiche("Zote");
                                        setSelectedCategory("Zote");
                                        setSearch("");
                                        window.scrollTo({
                                          top: 0,
                                          behavior: "smooth",
                                        });
                                      }}
                                      lang={lang}
                                      reviews={allReviews[p.id] || []}
                                      isLiked={likedProductIds.includes(p.id)}
                                      onLikeToggle={toggleLikeProduct}
                                    />
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-300">
                          <div className="bg-slate-50 p-6 rounded-full mb-6 text-slate-300">
                            <ShoppingCart size={64} />
                          </div>
                          <h4 className="text-xl font-bold text-slate-700 mb-2">
                            Shopping Center
                          </h4>
                          <p className="text-slate-500 font-medium max-w-sm text-center">
                            {t(lang, "prod.none")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div
              id="support-contact"
              className="w-full px-4 sm:px-6 lg:px-8 mt-12 mb-8"
            >
              <ContactSection lang={lang} user={activeUser} />
            </div>
          </main>
        )}

        {/* Footer */}
        <footer className="bg-slate-950 text-slate-400 py-6 md:py-8 text-sm text-center md:text-left relative mt-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center md:items-start text-center md:text-left sm:col-span-2 pr-0 md:pr-12">
              <div className="flex items-center whitespace-nowrap gap-1.5 mb-2 md:mb-4">
                <img
                  src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
                  alt="Orbi"
                  className="h-16 md:h-20 object-contain brightness-0 invert opacity-90"
                />
              </div>
              <p className="mb-2 md:mb-3 uppercase tracking-[0.2em] font-bold text-[10px] text-accent/80">
                {t(lang, "hero.subtitle")}
              </p>
              <p className="text-slate-500 leading-relaxed font-medium max-w-sm md:max-w-md text-xs mb-4">
                {t(lang, "footer.desc")}
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.elements.namedItem(
                    "email",
                  ) as HTMLInputElement;
                  if (input && input.value) {
                    try {
                      await db.subscribeNewsletter(input.value);
                      alert(
                        lang === "sw"
                          ? "Asante kwa kujiunga! Tutaleta taarifa mpya."
                          : "Subscribed successfully! We will keep you updated.",
                      );
                      input.value = "";
                    } catch (err: any) {
                      alert(
                        lang === "sw"
                          ? "Kuna tatizo au umeshajiunga tayari."
                          : "Error or already subscribed.",
                      );
                    }
                  }
                }}
                className="flex w-full max-w-xs items-center relative"
              >
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={
                    lang === "sw" ? "Weka email yako..." : "Enter your email..."
                  }
                  className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-slate-600 focus:bg-slate-800 transition"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 bg-slate-800 hover:bg-slate-700 text-white px-3 rounded-lg text-xs font-bold transition"
                >
                  {lang === "sw" ? "Jiunge" : "Join"}
                </button>
              </form>
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-2 md:mb-3">
                {t(lang, "footer.contact")}
              </h4>
              <ul className="space-y-1.5 md:space-y-2 font-medium flex flex-col items-center sm:items-start text-xs md:text-sm">
                <li>
                  <a
                    href="tel:+255764258114"
                    className="flex items-center gap-2 md:gap-3 hover:text-white hover:translate-x-1 transition-transform"
                  >
                    <div className="p-1 bg-slate-900 rounded-lg text-slate-400">
                      <Phone size={12} />
                    </div>{" "}
                    +255 764 258 114
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:shop@orbifinancial.com"
                    className="flex items-center gap-2 md:gap-3 hover:text-white hover:translate-x-1 transition-transform"
                  >
                    <div className="p-1 bg-slate-900 rounded-lg text-slate-400">
                      <Mail size={12} />
                    </div>{" "}
                    shop@orbifinancial.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://shop.orbifinancial.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 md:gap-3 hover:text-white hover:translate-x-1 transition-transform"
                  >
                    <div className="p-1 bg-slate-900 rounded-lg text-slate-400">
                      <Globe size={12} />
                    </div>{" "}
                    shop.orbifinancial.com
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-2 md:mb-3">
                {t(lang, "footer.location")}
              </h4>
              <div className="font-medium leading-relaxed flex flex-row items-center sm:items-start gap-3 md:gap-2 text-xs md:text-sm text-left mb-6">
                <div className="p-1 bg-slate-900 rounded-lg text-slate-400 shrink-0">
                  <MapPin size={14} />
                </div>
                <span className="text-slate-400 sm:max-w-[200px]">
                  Kariakoo Alikoma na Magira Street
                  <br />
                  Dar es Salaam, Tanzania
                </span>
              </div>

              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-2 md:mb-3">
                Orbi Platform
              </h4>
              <div className="flex flex-col items-center sm:items-start gap-3">
                <a
                  href="/?seller-signup=true"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowApplySellerModal(true);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer inline-flex"
                >
                  <ShieldCheck size={14} /> Apply as Seller
                </a>
              </div>
            </div>
          </div>

          <div className="w-full px-4 sm:px-6 lg:px-8 mt-6">
            <div className="flex flex-wrap justify-center sm:justify-center items-center gap-x-4 gap-y-2 text-[11px] font-medium text-slate-500 max-w-5xl mx-auto">
              <a
                href="/?about=true&about-tab=about"
                onClick={(e) => {
                  e.preventDefault();
                  setAboutPageTab("about");
                  setShowAboutPage(true);
                }}
                className="hover:text-amber-500 transition whitespace-nowrap cursor-pointer"
              >
                {lang === "sw" ? "Kuhusu Sisi" : "About Us"}
              </a>
              <a
                href="/?about=true&about-tab=how"
                onClick={(e) => {
                  e.preventDefault();
                  setAboutPageTab("how");
                  setShowAboutPage(true);
                }}
                className="hover:text-amber-500 transition whitespace-nowrap cursor-pointer"
              >
                {lang === "sw" ? "Jinsi Inavyofanya Kazi" : "How It Works"}
              </a>
              <a
                href="/?about=true&about-tab=security"
                onClick={(e) => {
                  e.preventDefault();
                  setAboutPageTab("security");
                  setShowAboutPage(true);
                }}
                className="hover:text-amber-500 transition whitespace-nowrap cursor-pointer"
              >
                {lang === "sw" ? "Kituo cha Usalama" : "Security Center"}
              </a>
              <a
                href="/?about=true&about-tab=buyer"
                onClick={(e) => {
                  e.preventDefault();
                  setAboutPageTab("buyer");
                  setShowAboutPage(true);
                }}
                className="hover:text-amber-500 transition whitespace-nowrap cursor-pointer"
              >
                {lang === "sw" ? "Ulinzi wa Mnunuzi" : "Buyer Protection"}
              </a>
              <a
                href="/?about=true&about-tab=seller"
                onClick={(e) => {
                  e.preventDefault();
                  setAboutPageTab("seller");
                  setShowAboutPage(true);
                }}
                className="hover:text-amber-500 transition whitespace-nowrap cursor-pointer"
              >
                {lang === "sw" ? "Ulinzi wa Muuzaji" : "Seller Protection"}
              </a>
              <a
                href="/?about=true&about-tab=terms"
                onClick={(e) => {
                  e.preventDefault();
                  setAboutPageTab("terms");
                  setShowAboutPage(true);
                }}
                className="hover:text-amber-500 transition whitespace-nowrap cursor-pointer"
              >
                {lang === "sw" ? "Vigezo na Masharti" : "Terms & Conditions"}
              </a>
              <a
                href="/?about=true&about-tab=escrow"
                onClick={(e) => {
                  e.preventDefault();
                  setAboutPageTab("escrow");
                  setShowAboutPage(true);
                }}
                className="hover:text-amber-500 transition whitespace-nowrap cursor-pointer"
              >
                {lang === "sw" ? "Sera ya Malipo & Escrow" : "Payment & Escrow"}
              </a>
              <a
                href="/?about=true&about-tab=privacy"
                onClick={(e) => {
                  e.preventDefault();
                  setAboutPageTab("privacy");
                  setShowAboutPage(true);
                }}
                className="hover:text-amber-500 transition whitespace-nowrap cursor-pointer"
              >
                {lang === "sw" ? "Sera ya Faragha" : "Privacy Policy"}
              </a>
              <a
                href="/?about=true&about-tab=contact"
                onClick={(e) => {
                  e.preventDefault();
                  setAboutPageTab("contact");
                  setShowAboutPage(true);
                }}
                className="hover:text-amber-500 transition whitespace-nowrap cursor-pointer"
              >
                {lang === "sw" ? "Wasiliana Nasi" : "Contact Us"}
              </a>
            </div>
          </div>

          <div className="w-full px-4 sm:px-6 lg:px-8 mt-6 md:mt-8 pt-4 md:pt-6 border-t border-slate-900 text-center flex flex-col sm:flex-row justify-between items-center gap-2 md:gap-4 text-xs text-slate-600">
            <div>
              &copy; {new Date().getFullYear()} {t(lang, "footer.rights")}
            </div>
            <div className="flex items-center gap-0 text-xs text-slate-500 font-medium">
              <span>Powered by</span>
              <img
                src="https://media-stock.orbifinancial.com/ORBI_LOGO_Blue.png"
                alt="ORBI Financial Technologies"
                title="ORBI Financial Technologies"
                className="h-10 w-auto object-contain ml-[-2px] opacity-70 brightness-0 invert"
              />
            </div>
            <div
              className="flex items-center justify-center opacity-30 hover:opacity-100 transition duration-500"
              title="100% Genuine & Trusted"
            >
              <ShieldCheck size={20} className="text-white" strokeWidth={1.5} />
            </div>
            <div className="flex gap-4">
              <a
                href="/?seller-login=true"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("?seller-login=true");
                }}
                className="hover:text-white font-bold transition flex items-center gap-2 outline-none cursor-pointer"
              >
                <Store size={12} /> Admin
              </a>
            </div>
          </div>
        </footer>

        {false && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex justify-end">
            <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-350 select-none">
              {/* Drawer Header */}
              <div
                className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-orange-600 to-amber-555 text-white sticky top-0 z-10"
                style={{ backgroundColor: "#ea580c" }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl relative">
                    <Bot size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 leading-none mb-1">
                      Orbi AI Assistant
                    </h2>
                    <p className="text-[10px] text-orange-200/90 font-bold uppercase tracking-wider">
                      {lang === "sw"
                        ? "Msaidizi wa Duka"
                        : "Intelligent Shopping Bot"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const userId = activeUser
                        ? activeUser.id
                        : getInitialUserId();
                      setAIChatHistory([]);
                      localStorage.setItem(
                        `orbi_ai_chat_history_${userId}`,
                        "[]",
                      );
                      setIsTransferredToLive(false);
                      localStorage.setItem(
                        `orbi_ai_transferred_${userId}`,
                        "false",
                      );
                      localStorage.removeItem(`orbi_ai_lock_until_${userId}`);
                    }}
                    className="text-[10px] hover:bg-white/10 px-2 py-1 rounded transition border border-white/20 font-bold"
                    title={lang === "sw" ? "Futa Historia" : "Clear History"}
                  >
                    {lang === "sw" ? "Futa" : "Clear"}
                  </button>
                  <button
                    onClick={() => setShowAIChatDrawer(false)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-5 bg-slate-50/70 space-y-4 flex flex-col [background-image:radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:20px_20px]">
                {aiChatHistory.length === 0 ? (
                  <div className="text-center py-10 my-auto">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100 shadow-xs text-orange-500">
                      <Bot size={34} className="animate-bounce" />
                    </div>
                    <h3 className="font-black text-slate-800 text-base mb-1">
                      {lang === "sw"
                        ? "Hujambo! Mimi ni Msaidizi wa Orbi Shop"
                        : "Hello! I am your AI Shopping Assistant"}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6 leading-relaxed">
                      {lang === "sw"
                        ? "Uliza swali lolote kuhusu bidhaa, bei, kuponi zilizopo au msaada wa usafirishaji kwa Kiswahili na Kiingereza."
                        : "Ask me anything about products, prices, active discounts, or courier estimates. I support Swahili and English."}
                    </p>

                    {/* Starter Prompts */}
                    <div className="space-y-2 max-w-xs mx-auto">
                      {[
                        {
                          textSw: "Nisaidie kuona bidhaa zilizopo dukani",
                          textEn: "Help me find currently available products",
                        },
                        {
                          textSw: "Nawezaje kulipia mzigo kwa kutumia M-Pesa?",
                          textEn: "How do I make payment using Mobile Money?",
                        },
                        {
                          textSw: "Nionyeshe njia za usafirishaji na gharama",
                          textEn: "Show me carrier pickup stations and costs",
                        },
                      ].map((item, keyIdx) => {
                        const promptText =
                          lang === "sw" ? item.textSw : item.textEn;
                        return (
                          <button
                            key={keyIdx}
                            onClick={() => sendAIChatMessage(promptText)}
                            className="w-full p-2.5 text-left text-xs bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-900 rounded-xl border border-slate-200/70 hover:border-orange-200 shadow-2xs font-medium transition duration-200 block cursor-pointer"
                          >
                            ⭐ {promptText}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {aiChatHistory.map((chat, idx) => {
                      const isUser = chat.role === "user";
                      return (
                        <div
                          key={idx}
                          className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-xs leading-relaxed ${
                              isUser
                                ? "bg-orange-500 text-white rounded-br-none font-bold"
                                : "bg-white text-slate-800 border border-slate-150 rounded-bl-none"
                            }`}
                          >
                            {chat.image && (
                              <div className="mb-2 max-w-full overflow-hidden rounded-lg border border-slate-200/50">
                                <img
                                  src={chat.image.data}
                                  alt="Uploaded graphic context"
                                  className="object-cover max-h-40 w-full rounded"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <div className="whitespace-pre-line">
                              {chat.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isAILoading && (
                      <div className="flex justify-start">
                        <div className="p-3 bg-white border border-slate-150 rounded-2xl rounded-bl-none text-slate-400 text-xs flex items-center gap-1.5 shadow-2xs">
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-orange-450 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex flex-col gap-2">
                {/* Image selection preview */}
                {aiSelectedImage && (
                  <div className="p-2 bg-orange-50/50 rounded-lg border border-orange-100 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="flex items-center gap-2">
                      <img
                        src={aiSelectedImage.data}
                        alt="Selected Preview"
                        className="w-10 h-10 object-cover rounded-lg border border-orange-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-[10px] leading-tight">
                        <span className="font-extrabold text-slate-700 block truncate max-w-[180px]">
                          {aiSelectedImage.filename}
                        </span>
                        <span className="text-orange-600 font-bold block">
                          {lang === "sw" ? "Tayari kutumwa" : "Ready to upload"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAiSelectedImage(null)}
                      className="p-1 hover:bg-orange-100 text-orange-600 rounded-full transition-colors"
                      title={lang === "sw" ? "Ondoa picha" : "Remove image"}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {isTransferredToLive ? (
                  <div className="space-y-3 p-3.5 bg-gradient-to-r from-red-50 to-amber-50 rounded-2xl border border-amber-200 animate-pulse-slow">
                    <div className="flex gap-2 items-start">
                      <span className="text-base">📢</span>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">
                          {lang === "sw"
                            ? "Uhamishaji wa Live Agent"
                            : "Live Agent Support Activated"}
                        </h4>
                        <p className="text-[10px] text-slate-600 font-bold leading-relaxed mt-0.5">
                          {lang === "sw"
                            ? "Umezidi kikomo cha maswali 10 ya AI. Timu yetu imeshapokea mazungumzo yako na ipo tayari kukusaidia!"
                            : "You have exceeded 10 AI questions. Our staff is prepared and has received your transcripts!"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAIChatDrawer(false);
                        const el = document.getElementById("support-contact");
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth" });
                          showAlert(
                            lang === "sw"
                              ? "Tumekuhamisha! Andika ujumbe wako hapa chini na live agent atakujibu."
                              : "Transferred successfully! Please type your support query below and an agent will assist.",
                            "success",
                          );
                        }
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-650 hover:to-amber-650 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <span>💬</span>
                      <span>
                        {lang === "sw"
                          ? "Zungumza na Staff Agent Sasa"
                          : "Chat with Live Agent Now"}
                      </span>
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendAIChatMessage(aiInputMessage);
                    }}
                    className="flex gap-2 items-center"
                  >
                    <label
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 hover:text-orange-600 rounded-xl transition duration-200 cursor-pointer flex items-center justify-center text-slate-500 shrink-0 border border-slate-200/50"
                      title={lang === "sw" ? "Pakia Picha" : "Upload Image"}
                    >
                      <ImageIcon size={18} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAIImageChange}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      required={!aiSelectedImage}
                      value={aiInputMessage}
                      onChange={(e) => setAIInputMessage(e.target.value)}
                      placeholder={
                        aiSelectedImage
                          ? lang === "sw"
                            ? "Andika maelezo ya picha..."
                            : "Add details to image..."
                          : lang === "sw"
                            ? "Andika ujumbe wako..."
                            : "Type your message..."
                      }
                      className="flex-1 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all font-medium bg-slate-50/50"
                    />
                    <button
                      type="submit"
                      disabled={
                        isAILoading ||
                        (!aiInputMessage.trim() && !aiSelectedImage)
                      }
                      className="px-4 py-2.5 bg-orange-500 hover:bg-orange-650 disabled:opacity-50 text-white rounded-xl text-xs font-black shrink-0 transition-colors cursor-pointer"
                    >
                      {lang === "sw" ? "Tuma" : "Send"}
                    </button>
                  </form>
                )}

                <div className="flex justify-between items-center text-[10px] text-slate-455 font-semibold px-1 mt-1">
                  <span>
                    {lang === "sw"
                      ? "Msaidizi wa Orbi (Orbi Assistant AI)"
                      : "Orbi Assistant (AI & Vision Matcher)"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold border ${imageUploadCount >= 3 ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-600 border-slate-200/60"}`}
                  >
                    {lang === "sw"
                      ? `Utafutaji picha uliobaki: ${Math.max(0, 3 - imageUploadCount)}/3`
                      : `Visual searches left: ${Math.max(0, 3 - imageUploadCount)}/3`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Support Chat (Internal) */}
        <button
          onClick={handleOpenInternalChat}
          className="fixed bottom-6 right-6 w-14 h-14 bg-success text-white rounded-full shadow-[0_8px_30px_rgba(16,185,129,0.4)] hover:scale-110 hover:-translate-y-1 transition-all duration-300 z-55 flex items-center justify-center group"
          title={
            lang === "sw" ? "Msaada wa Moja kwa Moja" : "Live Chat Support"
          }
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare size={26} className="group-hover:animate-pulse" />
            {unreadCount > 0 && (
              <span className="absolute -top-3.5 -right-3.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white shadow-lg animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
        </button>

        {/* Cart Sidebar */}
        {showCart && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex justify-end">
            <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="font-bold text-xl flex items-center gap-3 text-slate-800">
                  <ShoppingCart size={22} className="text-primary" />{" "}
                  {t(lang, "cart.title")} (
                  {cart.reduce((a, c) => a + c.quantity, 0)})
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
                  >
                    <div className="w-20 h-20 bg-slate-50 rounded-xl flex-shrink-0 border border-slate-100 overflow-hidden">
                      {item.product.images[0] && (
                        <MediaRenderer
                          src={item.product.images[0]}
                          className="w-full h-full object-cover rounded-xl"
                          autoPlay
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <h4 className="font-bold text-sm line-clamp-2 text-slate-800">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <PriceDisplay
                          amount={getProductPriceForQty(
                            item.product,
                            item.quantity,
                          )}
                          colorClass="text-accent"
                          className="text-sm font-black"
                        />
                        {getProductPriceForQty(item.product, item.quantity) <
                          item.product.price && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm shrink-0">
                            {lang === "sw" ? "Jumla" : "Wholesale"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-3">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded transition disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded transition disabled:opacity-50"
                            disabled={item.quantity >= item.product.stock}
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            setCart(
                              cart.filter(
                                (c) => c.product.id !== item.product.id,
                              ),
                            )
                          }
                          className="text-red-500/70 hover:text-red-600 text-xs flex items-center gap-1 font-medium transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                        >
                          <Trash size={14} /> {t(lang, "cart.remove")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center pb-20">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <ShoppingCart size={40} className="text-slate-300" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-700 mb-2">
                      {t(lang, "cart.empty_title")}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      {t(lang, "cart.empty_desc")}
                    </p>
                    <button
                      onClick={() => setShowCart(false)}
                      className="mt-8 bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-slate-800 transition"
                    >
                      {t(lang, "cart.continue")}
                    </button>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                  <div className="flex justify-between items-center mb-1 text-sm text-slate-500 font-medium">
                    <span>{t(lang, "cart.items")}</span>
                    <span>{cart.reduce((a, c) => a + c.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-6 text-xl font-black">
                    <span className="text-slate-800">
                      {t(lang, "cart.total")}
                    </span>
                    <span className="text-primary">
                      <PriceDisplay
                        amount={totalCart}
                        colorClass="text-primary"
                        size="2xl"
                      />
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (!activeUser) {
                        setShowCart(false);
                        setShowSecureOrderAuthPrompt(true);
                      } else {
                        setShowCart(false);
                        setShowCheckout(true);
                      }
                    }}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-slate-800 shadow-[0_8px_30px_rgb(30,41,59,0.2)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-lg cursor-pointer"
                  >
                    <Check size={20} /> {t(lang, "cart.checkout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <CheckoutModal
            lang={lang}
            cart={cart}
            total={totalCart}
            user={activeUser}
            onOpenAbout={(tab: string) => {
              setAboutPageTab(tab);
              setShowAboutPage(true);
            }}
            onClose={() => setShowCheckout(false)}
            onSuccess={() => {
              setCart([]);
              db.getProducts().then((ps) =>
                setProducts(ps.filter((p) => p.visible !== false)),
              );
            }}
            availableCoupons={coupons}
            onRefresh={() => loadData(true)}
          />
        )}

        {/* Secure Order Auth Prompt Modal */}
        {showSecureOrderAuthPrompt && (
          <div className="fixed inset-0 bg-slate-950/60 z-[999999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white relative max-w-md w-full rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              {/* Close Button */}
              <button
                onClick={() => setShowSecureOrderAuthPrompt(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Icon Container */}
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-[#ff4c00] mb-5 relative">
                <div className="absolute inset-0 rounded-full bg-orange-500/10 animate-ping duration-1000" />
                <ShieldCheck size={32} />
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">
                {lang === "sw" ? "Unda Agizo Salama" : "Place Secure Order"}
              </h3>

              {/* Description */}
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                {lang === "sw"
                  ? "Tafadhali ingia kwenye akaunti yako au ujisajili ili kufanya agizo salama. Kwa kujiunga na sisi, utaweza kufuatilia na kupata taarifa za order yako."
                  : "Please login or register to place a secure order. By joining us, you will be able to track and get updates on your order."}
              </p>

              {/* Buttons Stack */}
              <div className="w-full flex flex-col gap-3">
                {/* Login Button */}
                <button
                  onClick={() => {
                    setShowSecureOrderAuthPrompt(false);
                    setShowAuth("login");
                  }}
                  className="w-full h-12 bg-[#ff4c00] hover:bg-[#e04300] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
                >
                  <User size={18} />
                  <span>
                    {lang === "sw"
                      ? "Ingia kwenye Akaunti"
                      : "Login to Account"}
                  </span>
                </button>

                {/* Register Button */}
                <button
                  onClick={() => {
                    setShowSecureOrderAuthPrompt(false);
                    setShowAuth("register");
                  }}
                  className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-850 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {lang === "sw"
                      ? "Unda Akaunti Mpya (Jisajili)"
                      : "Register New Account"}
                  </span>
                </button>

                {/* Cancel Link */}
                <button
                  onClick={() => setShowSecureOrderAuthPrompt(false)}
                  className="mt-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {lang === "sw"
                    ? "Ghairi na uendelee"
                    : "Cancel & back to shop"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auth Modals */}
        {showApplySellerModal && (
          <ApplySellerModal
            lang={lang}
            onClose={() => setShowApplySellerModal(false)}
          />
        )}
        {showAuth === "login" && (
          <AuthModal
            mode="login"
            lang={lang}
            onOpenAbout={(tab: string) => {
              setAboutPageTab(tab);
              setShowAboutPage(true);
            }}
            onClose={() => setShowAuth(null)}
            onSwitch={() => setShowAuth("register")}
            onSuccess={(u) => {
              setActiveUser(u);
              setShowAuth(null);
            }}
            onApplySeller={() => {
              setShowAuth(null);
              setShowApplySellerModal(true);
            }}
          />
        )}
        {showAuth === "register" && (
          <AuthModal
            mode="register"
            lang={lang}
            onOpenAbout={(tab: string) => {
              setAboutPageTab(tab);
              setShowAboutPage(true);
            }}
            onClose={() => setShowAuth(null)}
            onSwitch={() => setShowAuth("login")}
            onSuccess={(u) => {
              setActiveUser(u);
              setShowAuth(null);
            }}
            onApplySeller={() => {
              setShowAuth(null);
              setShowApplySellerModal(true);
            }}
          />
        )}

        {selectedProduct && (
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-8"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div></div>}>
            <ProductDetailPage
              product={selectedProduct}
              seller={sellers.find((s) => s.id === selectedProduct.sellerId)}
              relatedProducts={(() => {
              // 1. Must match the same category to avoid unrelated categories in the same broad niche
              const sameCategoryProducts = products.filter((p) => {
                if (p.id === selectedProduct.id) return false;
                
                // Match the exact category
                if (selectedProduct.category && p.category !== selectedProduct.category) {
                  return false;
                }
                
                // Match the niche (or fallback to broad matching if niche isn't specified)
                const sNiche = selectedProduct.niche && selectedProduct.niche !== "Zote";
                if (sNiche && p.niche !== selectedProduct.niche) {
                  return false;
                }
                
                return true;
              });

              // If there are no products of the exact same category, fallback to niche-based products
              const basePool = sameCategoryProducts.length > 0 
                ? sameCategoryProducts 
                : products.filter((p) => {
                    if (p.id === selectedProduct.id) return false;
                    const sNiche = selectedProduct.niche && selectedProduct.niche !== "Zote";
                    return sNiche && p.niche === selectedProduct.niche;
                  });

              // 2. Score by "Family" similarity to sort closer items first
              const scored = basePool.map((p) => {
                let score = 0;
                
                // A) Brand / Prefix matching (e.g., both "Sony ..." or "Samsung ...")
                const firstWord1 = selectedProduct.name.trim().split(/\s+/)[0]?.toLowerCase();
                const firstWord2 = p.name.trim().split(/\s+/)[0]?.toLowerCase();
                if (firstWord1 && firstWord1 === firstWord2) {
                  score += 30;
                }

                // B) Title/name keyword overlap (e.g. matching "4K", "Smart", "OLED", "TV")
                const words1 = selectedProduct.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                const words2 = p.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                const commonWords = words1.filter(w => words2.includes(w));
                score += commonWords.length * 10;

                // C) Tag overlap similarity
                const p1Tags = selectedProduct.tags || [];
                const p2Tags = p.tags || [];
                const commonTags = p1Tags.filter(t => p2Tags.includes(t));
                score += commonTags.length * 5;

                return { product: p, score };
              });

              // Sort by highest similarity score first
              return scored
                .sort((a, b) => b.score - a.score)
                .map(item => item.product);
            })()}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              const params = new URLSearchParams(window.location.search);
              params.set("product", p.id);
              window.history.pushState(
                {},
                "",
                `${window.location.pathname}?${params.toString()}`,
              );
            }}
            onViewSeller={(s) => {
              setViewSeller(s);
              setSelectedNiche("Zote");
              setSelectedCategory("Zote");
              setSearch("");
              // Close product details when navigating to seller list
              setSelectedProduct(null);
              const params = new URLSearchParams(window.location.search);
              params.delete("product");
              const remaining = params.toString();
              const suffix = remaining ? `?${remaining}` : "";
              window.history.pushState(
                {},
                "",
                `${window.location.pathname}${suffix}`,
              );
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onClose={() => {
              setSelectedProduct(null);
              const params = new URLSearchParams(window.location.search);
              params.delete("product");
              const remaining = params.toString();
              const suffix = remaining ? `?${remaining}` : "";
              window.history.pushState(
                {},
                "",
                `${window.location.pathname}${suffix}`,
              );
            }}
            onAdd={addToCart}
            lang={lang}
            activeUser={activeUser}
            isLiked={likedProductIds.includes(selectedProduct.id)}
            onLikeToggle={toggleLikeProduct}
            // Passing standalone App Bar dependencies
            globalSettings={globalSettings}
            cart={cart}
            onOpenCart={() => setShowCart(true)}
            onSetLang={(newLang) => setLang(newLang)}
            onOpenAuth={(mode) => setShowAuth(mode)}
          />
          </Suspense>
        )}
        {showTrackOrder && (
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-8"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div></div>}>
            <TrackOrderModal onClose={() => setShowTrackOrder(false)} />
          </Suspense>
        )}
        {showReviewModal && selectedProductForReview && (
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-8"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div></div>}>
            <ReviewModal
              productId={selectedProductForReview.id}
              productName={selectedProductForReview.name}
              onClose={() => {
              setShowReviewModal(false);
              setSelectedProductForReview(null);
            }}
            lang={lang}
            activeUser={activeUser}
            onSuccess={(savedReview: Review) => {
              setAllReviews((prev) => {
                const updated = { ...prev };
                if (!updated[selectedProductForReview.id]) {
                  updated[selectedProductForReview.id] = [];
                }
                updated[selectedProductForReview.id] = [
                  savedReview,
                  ...updated[selectedProductForReview.id],
                ];
                return updated;
              });
              loadData(true);
            }}
          />
          </Suspense>
        )}
      </div>
      {showImageLimitModal && (
        <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 relative shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowImageLimitModal(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Camera size={30} />
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {lang === "sw"
                ? "Kikomo cha Kupakia Picha"
                : "Image Limit Reached"}
            </h2>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed font-semibold">
              {lang === "sw"
                ? "Pole, umefikia kikomo cha kutafuta picha 3 kwa sasa ili kuzuia matumizi mabaya ya rasilimali. Tafadhali endelea na utafutaji wa maandishi wa kawaida au wasiliana nasi!"
                : "Sorry, you have reached the maximum limit of 3 visual image searches to prevent system abuse. Please continue using smart text-based recommendations!"}
            </p>

            <button
              onClick={() => setShowImageLimitModal(false)}
              className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 text-xs font-black shadow-sm transition-colors cursor-pointer"
            >
              {lang === "sw" ? "Nimeelewa" : "I Understand"}
            </button>
          </div>
        </div>
      )}

      {viewInvoice && (
        <CustomerInvoiceView
          order={viewInvoice}
          onClose={() => setViewInvoice(null)}
          lang={lang}
        />
      )}
      <CookieConsent lang={lang} />

      {toastMsg && (
        <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[99999999] bg-slate-900/95 backdrop-blur-md text-white text-xs sm:text-sm font-semibold py-2.5 px-5 sm:px-6 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.3)] flex items-center gap-2 border border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <div className="w-2 h-2 rounded-full bg-emerald-500 absolute left-[20px] sm:left-[24px]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  );
}

interface ProductCardProps {
  p: Product;
  seller?: SellerProfile;
  onAdd: (openCart?: boolean) => void;
  onSelect: (p: Product) => void;
  onInteract?: () => void;
  onViewSeller?: (s: SellerProfile) => void;
  lang?: Lang;
  reviews?: Review[];
  isLiked?: boolean;
  onLikeToggle?: (productId: string, niche?: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  p,
  seller,
  onAdd,
  onSelect,
  onInteract,
  onViewSeller,
  lang = "sw",
  reviews = [],
  isLiked = false,
  onLikeToggle,
}) => {
  const isOutOfStock = p.stock <= 0;
  const [imgIdx, setImgIdx] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);

  const avgRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return parseFloat((total / reviews.length).toFixed(1));
  }, [reviews]);

  const handleChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInteract) onInteract();
    const link = `${window.location.origin}/?product=${p.id}`;
    let msg = `${t((lang || "sw") as Lang, "prod.wa_inquiry")} ${p.name} (${link})`;
    window.open(
      `https://wa.me/255764258114?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInteract) onInteract();
    setImgIdx((i) => (i + 1) % p.images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInteract) onInteract();
    setImgIdx((i) => (i - 1 + p.images.length) % p.images.length);
  };

  return (
    <>
      <div
        className="flex flex-col group transition-all duration-300 hover:-translate-y-0.5 cursor-pointer h-full"
        onClick={() => onSelect(p)}
      >
        <div
          className="relative aspect-[3/4] sm:aspect-[4/5] bg-[#f8fafc] rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-2.5 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (onInteract) onInteract();
            onSelect(p);
          }}
        >
          {seller?.isPro && seller?.proUntil && seller.proUntil > Date.now() ? (
            <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 z-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
              PRO <Store size={8} className="sm:w-2 sm:h-2" />
            </div>
          ) : null}
          {p.images.length > 0 ? (
            <>
              <MediaRenderer
                src={p.images[imgIdx]}
                alt={p.name}
                className="w-full h-full object-contain group-hover:scale-[1.03] transition duration-500 ease-out p-1"
                autoPlay
              />
              {p.images.length > 1 && (
                <>
                  <button
                    onClick={prevImg}
                    className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xs text-slate-800 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-xs"
                  >
                    <ChevronLeft size={12} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={nextImg}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xs text-slate-800 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-xs"
                  >
                    <ChevronRight size={12} strokeWidth={2.5} />
                  </button>
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {p.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          setImgIdx(i);
                        }}
                        className={`h-1 rounded-full transition-all duration-300 ${i === imgIdx ? "w-2.5 bg-white shadow-xs" : "w-1 bg-white/50 hover:bg-white"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <ImageIcon size={24} strokeWidth={1} />
            </div>
          )}

          {p.oldPrice && p.oldPrice > p.price && (
            <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 bg-rose-500 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs animate-pulse">
              -{Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)}%
            </div>
          )}

          <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 flex flex-col gap-1 items-end z-10">
            <div className="bg-blue-50/95 text-blue-600 border border-blue-100/60 backdrop-blur-xs text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-0.5 w-fit">
              <ShieldCheck
                size={7}
                className="text-blue-500 sm:w-2.5 sm:h-2.5"
              />
              Verified
            </div>

            {p.warranty && (
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border border-amber-600/30 backdrop-blur-xs text-[7px] sm:text-[8px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 w-fit transform hover:scale-105 transition-all">
                <Award size={8} className="sm:w-3 sm:h-3 text-white" />
                <span>{p.warranty}</span>
              </div>
            )}
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="bg-white text-slate-900 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black shadow-md tracking-wider uppercase">
                {t((lang || "sw") as Lang, "prod.out_of_stock")}
              </span>
            </div>
          )}

          {onLikeToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onInteract) onInteract();
                onLikeToggle(p.id, p.niche);
              }}
              className={`absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 z-20 rounded-full p-2 backdrop-blur-xs transition z-30 shadow-xs hover:scale-110 active:scale-95 outline-none ${
                isLiked
                  ? "bg-rose-500 text-white border border-rose-500"
                  : "bg-white/80 border border-slate-200 text-slate-500 hover:text-rose-500 hover:bg-white"
              }`}
              title={lang === "sw" ? "Penda" : "Favorite"}
            >
              <Heart
                size={12}
                fill={isLiked ? "currentColor" : "none"}
                className="sm:w-3.5 sm:h-3.5"
              />
            </button>
          )}
        </div>

        <div className="flex flex-col flex-1 px-1 justify-between pb-1 mt-0.5">
          <div>
            <h3
              className="text-[11px] sm:text-[12px] md:text-[13px] font-medium leading-[1.3] text-slate-800 line-clamp-2 h-auto mb-1 flex-shrink-0 group-hover:text-[#ff4c00] transition-colors"
              title={p.name}
            >
              {p.name}
            </h3>
            {avgRating > 0 && (
              <div className="flex items-center gap-1 mb-1 mt-0.5">
                <span className="flex items-center text-[#ff4c00]">
                  <Star fill="currentColor" size={10} strokeWidth={0} />
                </span>
                <span className="text-[10px] font-black text-slate-800 leading-none">
                  {avgRating}{" "}
                  <span className="text-slate-400 font-medium font-sans">
                    ({reviews.length})
                  </span>
                </span>
              </div>
            )}
            <div className="mt-1 flex flex-col justify-start mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap whitespace-nowrap">
                <PriceDisplay
                  amount={p.price}
                  colorClass="text-[#ff4c00]"
                  className="text-[13px] sm:text-[15px]"
                />
                {p.oldPrice && p.oldPrice > p.price && (
                  <PriceDisplay
                    amount={p.oldPrice}
                    colorClass="text-slate-400/90 line-through font-medium"
                    className="text-[10px]"
                  />
                )}
              </div>
              {p.oldPrice && p.oldPrice > p.price ? (
                <div className="text-[9px] text-slate-500 line-clamp-1 mt-1 font-medium">
                  {lang === "sw"
                    ? "Chini kwa zinazofanana"
                    : "Lowest among similar"}
                </div>
              ) : (
                <div className="text-[9px] text-[#ff4c00] line-clamp-1 mt-1 font-medium">
                  {lang === "sw" ? "Bidhaa mpya, karibu" : "New Arrivals"}
                </div>
              )}
            </div>
          </div>

          <div className="mt-1 flex flex-col gap-1 w-full">
            {!isOutOfStock ? (
              <div className="flex gap-1 w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(false);
                  }}
                  className="flex-1 min-w-0 border border-slate-200 hover:border-[#ff4c00]/60 text-slate-700 hover:text-[#ff4c00] text-[10px] sm:text-[11px] font-bold py-1 sm:py-1.5 px-0.5 sm:px-1 rounded-full transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
                  title={lang === "sw" ? "Weka kwenye kikapu" : "Add to Cart"}
                >
                  <ShoppingCart size={11} className="shrink-0" />
                  <span className="truncate">
                    {lang === "sw" ? "Kapuni" : "Add"}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(true);
                  }}
                  className="flex-1 min-w-0 bg-[#ff4c00] hover:bg-[#e04300] text-white text-[10px] sm:text-[11px] font-black py-1 sm:py-1.5 px-0.5 sm:px-1 rounded-full transition-colors flex items-center justify-center gap-0.5 cursor-pointer shadow-xs"
                  title={lang === "sw" ? "Nunua Sasa" : "Buy Now"}
                >
                  <Zap
                    size={10}
                    className="shrink-0 fill-current animate-pulse"
                  />
                  <span className="truncate">
                    {lang === "sw" ? "Nunua" : "Buy"}
                  </span>
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full border border-slate-200 text-slate-400 text-[10px] sm:text-[11px] font-bold py-1 sm:py-1.5 px-1 rounded-full flex items-center justify-center"
              >
                <span className="truncate">
                  {lang === "sw" ? "Imeisha" : "Sold Out"}
                </span>
              </button>
            )}

            {seller && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewSeller && onViewSeller(seller);
                }}
                className="w-full py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full flex items-center justify-center gap-1 transition-colors border border-slate-200 text-[9px] font-medium cursor-pointer"
                title={seller.name}
              >
                <Store size={10} />
                <span className="truncate max-w-[100px]">{seller.name}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showFullImage && p.images.length > 0 && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-6 right-6 text-white/50 hover:text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"
          >
            <X size={24} />
          </button>

          <div className="max-w-5xl w-full relative flex items-center justify-center">
            {p.images.length > 1 && (
              <button
                onClick={prevImg}
                className="absolute left-0 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all hidden md:block"
              >
                <ChevronLeft size={36} />
              </button>
            )}

            <MediaRenderer
              src={p.images[imgIdx]}
              className="max-h-[75vh] w-auto h-auto max-w-full object-contain rounded-2xl shadow-2xl"
              controls
              autoPlay
            />

            {p.images.length > 1 && (
              <button
                onClick={nextImg}
                className="absolute right-0 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all hidden md:block"
              >
                <ChevronRight size={36} />
              </button>
            )}
          </div>

          {p.images.length > 1 && (
            <div className="flex gap-3 mt-8 overflow-x-auto max-w-full pb-4 px-4 scrollbar-hide">
              {p.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${imgIdx === i ? "border-accent opacity-100 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.3)]" : "border-transparent opacity-40 hover:opacity-100"}`}
                >
                  <MediaRenderer
                    src={img}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};
