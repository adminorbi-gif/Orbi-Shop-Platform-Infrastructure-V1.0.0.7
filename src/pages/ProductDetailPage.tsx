import React, { useState, useMemo, useEffect } from "react";
import { Product, SellerProfile, Customer } from "../types";
import { formatCurrency } from "../lib/storage";
import {
  X,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Share2,
  Bell,
  MessageCircle,
  Twitter,
  Facebook,
  Store,
  ArrowLeft,
  Star,
  CheckCircle2,
  Heart,
  Tag,
  Info,
  ShieldCheck,
  Award,
  Package,
  Zap,
  ChevronDown,
  ChevronUp,
  Sliders
} from "lucide-react";
import { Lang } from "../lib/i18nClient";
import { db } from "../lib/db";
import { useDialog } from "../components/CustomDialogContext";
import { PriceDisplay } from "../components/PriceDisplay";
import { parseWholesaleTiersFromText, getProductPriceForQty } from "../utils/pricing";
import { AppBarBackgroundSlider } from "../components/AppBarBackgroundSlider";

// Inline Flag assets styled exactly as in the main app layout
const TanzaniaFlag = () => (
  <svg viewBox="0 0 300 200" className="w-5 h-3.5 inline-block shrink-0 shadow-xs rounded-xs border border-white/20" fill="none">
    <polygon points="0,0 300,0 0,200" fill="#1eb53a" />
    <polygon points="0,200 300,200 300,0" fill="#00a3dd" />
    <line x1="-20" y1="220" x2="320" y2="-20" stroke="#fcd116" strokeWidth="54" />
    <line x1="-20" y1="220" x2="320" y2="-20" stroke="#000000" strokeWidth="34" />
  </svg>
);

const UKFlag = () => (
  <svg viewBox="0 0 60 30" className="w-5 h-3.5 inline-block shrink-0 shadow-xs rounded-xs border border-white/20" fill="none">
    <clipPath id="uk-flag-clip-detail">
      <path d="M0,0 L30,15 L0,15 z M0,30 L30,15 L30,30 z M60,30 L30,15 L60,15 z M60,0 L30,15 L30,0 z" />
    </clipPath>
    <rect width="60" height="30" fill="#012169" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#uk-flag-clip-detail)" />
    <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
    <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

interface Props {
  product: Product;
  seller?: SellerProfile;
  relatedProducts?: Product[];
  onClose: () => void;
  onAdd: (p: Product, openCart?: boolean, customQty?: number) => void;
  onViewSeller?: (s: SellerProfile) => void;
  lang: Lang;
  onSelectProduct?: (p: Product) => void;
  activeUser?: Customer | null;
  isLiked?: boolean;
  onLikeToggle?: (productId: string, niche?: string) => void;
  
  // Standalone App Bar configurations
  globalSettings?: any;
  cart?: any[];
  onOpenCart?: () => void;
  onSetLang?: (l: Lang) => void;
  onOpenAuth?: (mode: "login" | "register") => void;
}

function parseKeyAttributes(description: string = "", features: any[] = []): { key: string; value: string }[] {
  const list: { key: string; value: string }[] = [];
  const seenKeys = new Set<string>();

  // 1. Add explicit features first
  if (features && Array.isArray(features)) {
    features.forEach(f => {
      const k = f.name?.trim();
      const v = f.description?.trim();
      if (k && v && !seenKeys.has(k.toLowerCase())) {
        list.push({ key: k, value: v });
        seenKeys.add(k.toLowerCase());
      }
    });
  }

  // 2. Parse from description attributes
  if (description) {
    const lines = description.split("\n").map(l => l.trim()).filter(Boolean);
    
    // Check if we have Key: Value format
    let hasColonFormat = false;
    for (const line of lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0 && colonIdx < 40) {
        const key = line.substring(0, colonIdx).trim();
        const value = line.substring(colonIdx + 1).trim();
        // Allow keys of 2-35 chars with standard labels, not URLs
        if (key.length >= 2 && key.length <= 35 && value.length > 0 && value.length < 200 && !key.includes(".") && !key.includes(",") && !key.toLowerCase().startsWith("http")) {
          hasColonFormat = true;
          break;
        }
      }
    }

    if (hasColonFormat) {
      for (const line of lines) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0 && colonIdx < 40) {
          const key = line.substring(0, colonIdx).trim();
          const value = line.substring(colonIdx + 1).trim();
          if (
            key.length >= 2 && 
            key.length <= 35 && 
            value.length > 0 && 
            value.length < 200 && 
            !key.includes(".") && 
            !key.includes(",") && 
            !key.includes("?") && 
            !key.includes("!") &&
            !seenKeys.has(key.toLowerCase())
          ) {
            list.push({ key, value });
            seenKeys.add(key.toLowerCase());
          }
        }
      }
    } else {
      // Check alternating line format if no colons found
      let i = 0;
      while (i < lines.length - 1) {
        const lineVal1 = lines[i];
        const lineVal2 = lines[i + 1];
        
        const isKeyCandidate = 
          lineVal1.length >= 2 && 
          lineVal1.length <= 35 && 
          !lineVal1.includes(".") && 
          !lineVal1.includes(",") && 
          !lineVal1.includes("?") && 
          !lineVal1.includes("!") &&
          !lineVal1.includes(":") &&
          !lineVal1.toLowerCase().includes("show more");
          
        const isValueCandidate = 
          lineVal2.length > 0 && 
          lineVal2.length <= 250;

        if (isKeyCandidate && isValueCandidate) {
          const lKey = lineVal1.toLowerCase();
          if (!seenKeys.has(lKey)) {
            list.push({ key: lineVal1, value: lineVal2 });
            seenKeys.add(lKey);
          }
          // Move two lines forward
          i += 2;
        } else {
          i++;
        }
      }
    }
  }

  return list;
}

export default function ProductDetailPage({
  product,
  seller,
  relatedProducts = [],
  onClose,
  onAdd,
  onViewSeller,
  lang,
  onSelectProduct,
  activeUser,
  isLiked = false,
  onLikeToggle,
  
  globalSettings,
  cart = [],
  onOpenCart,
  onSetLang,
  onOpenAuth
}: Props) {
  const displaySeller = useMemo(() => {
    if (seller) return seller;
    return {
      id: "official",
      name: "Orbi Shop Head Office",
      avatar: "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png",
      description: lang === "sw" 
        ? "Duka Rasmi la Orbi Shop lenye dhamana ya kiwango cha juu cha bidhaa." 
        : "Official Orbi Shop Head Office products with premium brand guarantee.",
      isPro: true,
      proUntil: Date.now() + 365 * 24 * 60 * 60 * 1000,
      phone: "0755555555",
      businessLogo: "https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png",
      visible: true,
    } as SellerProfile;
  }, [seller, lang]);

  const [imgIdx, setImgIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyPhone, setNotifyPhone] = useState("");
  const [notifying, setNotifying] = useState(false);
  const [reviews, setReviews] = useState<any[]>(product.reviews || []);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showAlert } = useDialog();
  const isOutOfStock = product.stock <= 0;

  const [qty, setQty] = useState(1);
  const tiers = useMemo(() => {
    return (product.wholesaleTiers && product.wholesaleTiers.length > 0)
      ? product.wholesaleTiers
      : parseWholesaleTiersFromText(product.description || "");
  }, [product]);

  const currentUnitPrice = useMemo(() => {
    return getProductPriceForQty(product, qty);
  }, [product, qty]);

  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const keyAttributes = useMemo(() => {
    return parseKeyAttributes(product.description, product.features);
  }, [product.description, product.features]);

  // SEO: Update Meta Tags and Page Title Dynamically
  useEffect(() => {
    if (product) {
      const productName = product.name;
      const baseName = lang === "sw" ? (product.nameSw || productName) : productName;
      const priceDisplay = formatCurrency(product.price);
      const title = `Bei ya ${baseName} ni ${priceDisplay} | Orbi Shop Tanzania`;
      const description = `Nunua ${baseName} kwa bei bora ya ${priceDisplay} nchini Tanzania. Bidhaa bora, malipo salama kupitia Orbi Pay, na usafirishaji wa haraka popote Tanzania. Trusted marketplace.`;
      
      document.title = title;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', description);
      
      // Update OG tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', title);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', description);
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && product.images.length > 0) ogImage.setAttribute('content', product.images[0]);
      
      // Update Twitter tags
      const twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute('content', title);
      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute('content', description);
      const twImage = document.querySelector('meta[name="twitter:image"]');
      if (twImage && product.images.length > 0) twImage.setAttribute('content', product.images[0]);
    }
  }, [product, lang]);

  // SEO: Breadcrumb Structured Data for Google/AI Crawlers
  const structuredData = useMemo(() => {
    const base = window.location.origin;
    const breadcrumbList = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Orbi Shop",
          "item": base
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": product.niche || "Marketplace",
          "item": `${base}/?niche=${encodeURIComponent(product.niche || "")}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": product.category,
          "item": `${base}/?category=${encodeURIComponent(product.category)}`
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": product.name,
          "item": `${base}/?product=${product.id}`
        }
      ]
    };

    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "image": product.images,
      "description": product.description,
      "sku": product.id,
      "brand": {
        "@type": "Brand",
        "name": displaySeller.name
      },
      "offers": {
        "@type": "Offer",
        "url": `${base}/?product=${product.id}`,
        "priceCurrency": "TZS",
        "price": product.price,
        "itemCondition": "https://schema.org/NewCondition",
        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": displaySeller.name
        }
      },
      "aggregateRating": reviews.length > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1),
        "reviewCount": reviews.length
      } : undefined
    };

    return [breadcrumbList, productSchema];
  }, [product, displaySeller, reviews, lang]);

  // Retrieve reviews dynamically on mount/product change
  useEffect(() => {
    let active = true;
    const loadProductReviews = async () => {
      try {
        const latestReviews = await db.getReviews(product.id);
        if (active) {
          setReviews(latestReviews);
        }
      } catch (err) {
        console.warn("Failed to load reviews inside ProductDetailPage:", err);
      }
    };
    loadProductReviews();
    return () => {
      active = false;
    };
  }, [product.id]);

  // Make sure imgIdx stays within bounds if product changes
  if (product.images.length > 0 && imgIdx >= product.images.length && imgIdx !== 0) {
    setImgIdx(0);
  }

  const handleSubmitReview = async () => {
    if (!newComment.trim()) {
      showAlert(lang === "sw" ? "Tafadhali jaza maoni yako" : "Please write down your review comments", "error");
      return;
    }
    setSubmitting(true);
    try {
      const uName = activeUser ? activeUser.name : "Mteja";
      const savedReview = await db.saveReview({
        productId: product.id,
        customerName: uName,
        rating: newRating,
        comment: newComment,
      });
      setReviews([savedReview, ...reviews]);
      setNewComment("");
      setNewRating(5);
      showAlert(lang === "sw" ? "Asante kwa maoni yako!" : "Thank you for your feedback!", "success");
    } catch (err: any) {
      console.error(err);
      showAlert(lang === "sw" ? "Hitilafu imetokea wakati wa kutuma maoni: " + err.message : "Error submitting review: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?product=${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Tazama ${product.name} kwenye Orbi Shop!`,
          url: url,
        });
      } catch (e) {
        console.error("Share failed", e);
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNotify = async () => {
    if (!notifyEmail || !notifyPhone) {
      showAlert("Tafadhali jaza barua pepe na namba ya simu", "error");
      return;
    }
    setNotifying(true);
    try {
      await db.addStockNotification({
        productId: product.id,
        email: notifyEmail,
        phone: notifyPhone,
      });
      showAlert("Umejisajili kupata taarifa bidhaa itakapopatikana!", "success");
      setShowNotify(false);
      setNotifyEmail("");
      setNotifyPhone("");
    } catch {
      showAlert("Imeshindikana kujiandikisha, jaribu tena baadae", "error");
    } finally {
      setNotifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-[#f8fafc] flex flex-col overflow-hidden animate-in fade-in duration-200">
      
      {/* Complete Standalone Professional App Bar */}
      <header 
        style={{ 
          backgroundColor: globalSettings?.appBarColor || undefined 
        }}
        className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-lg sticky top-0 z-50 shrink-0 select-none relative"
      >
        <AppBarBackgroundSlider settings={globalSettings} />
        <div className="flex items-center gap-3 min-w-0 relative z-10">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-white transition-all duration-200 cursor-pointer flex items-center justify-center border border-white/5 bg-slate-800/40"
            aria-label={lang === "sw" ? "Rudi" : "Back"}
          >
            <ArrowLeft size={18} />
          </button>
          
          {/* Logo & Brand */}
          <div 
            onClick={onClose}
            className="flex items-center gap-2 cursor-pointer group active:scale-95 transition-all"
          >
            <img
              src="https://media-stock.orbifinancial.com/OrbiShop_Logo_Blue.png"
              alt="Orbi"
              className="h-10 sm:h-12 object-contain brightness-0 invert drop-shadow-md transition-all group-hover:scale-105"
            />
            <span className="hidden xs:inline-block font-sans font-black text-sm uppercase tracking-widest text-slate-100">
              {lang === "sw" ? "Maelezo" : "Details"}
            </span>
          </div>
        </div>

        {/* Right Header Navigation Group */}
        <div className="flex items-center gap-2.5 relative z-10">
          {/* Shop button */}
          <button
            onClick={onClose}
            className="hidden sm:flex items-center gap-1.5 text-xs font-black text-amber-400 hover:text-amber-300 bg-white/5 hover:bg-white/10 border border-amber-500/20 rounded-full px-4 py-2 transition-all uppercase tracking-wider cursor-pointer"
          >
            <Store size={14} />
            <span>{lang === "sw" ? "Dukani" : "Browse Shop"}</span>
          </button>

          {/* Language Selector */}
          {onSetLang && (
            <button
              onClick={() => onSetLang(lang === "sw" ? "en" : "sw")}
              className="text-xs font-semibold hover:bg-white/10 transition border border-white/20 rounded-full px-2.5 py-1.5 flex items-center gap-1.5 text-white shadow-xs shrink-0 cursor-pointer select-none"
              title={lang === "sw" ? "Switch to English" : "Badili kwenda Kiswahili"}
            >
              <span className="flex items-center shrink-0">
                {lang === "sw" ? <TanzaniaFlag /> : <UKFlag />}
              </span>
              <span className="hidden md:inline uppercase text-[10px] md:text-xs font-bold tracking-wider">
                {lang === "sw" ? "SW" : "EN"}
              </span>
            </button>
          )}

          {/* Dynamic Cart Badge (Opens Shop Cart Directly) */}
          {onOpenCart && (
            <button
              onClick={() => {
                onOpenCart();
                onClose(); // Switch nicely
              }}
              className="relative p-2.5 bg-white hover:bg-orange-50 text-orange-600 rounded-full transition shadow-md hover:-translate-y-0.5 border border-transparent cursor-pointer flex items-center justify-center shrink-0"
              title={lang === "sw" ? "Kikapu Chako" : "Check Your Cart"}
            >
              <ShoppingCart size={18} />
              {cart && cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-slate-900 border-2 border-white text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in leading-none">
                  {cart.reduce((a, c) => a + c.quantity, 0)}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full bg-slate-50/50 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto w-full p-4 md:p-8 flex flex-col md:flex-row gap-8 lg:gap-12">
          
          {/* Left Column: Images */}
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            <div className="relative aspect-square sm:aspect-[4/3] bg-white rounded-3xl overflow-hidden shadow-xs shrink-0 border border-slate-200/60 p-4 flex items-center justify-center">
              <img
                src={product.images[imgIdx]}
                alt={product.name}
                className="max-h-full max-w-full object-contain transition duration-300"
              />
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImgIdx((i) => (i - 1 + product.images.length) % product.images.length);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full text-slate-700 hover:text-orange-600 shadow-md transition-all hover:scale-105 cursor-pointer"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImgIdx((i) => (i + 1) % product.images.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full text-slate-700 hover:text-orange-600 shadow-md transition-all hover:scale-105 cursor-pointer"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-5 md:grid-cols-4 gap-2 py-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImgIdx(idx)}
                    className={`w-full aspect-square bg-white rounded-xl overflow-hidden border-2 transition-all p-1 cursor-pointer ${
                      idx === imgIdx ? "border-orange-500 ring-2 ring-orange-100" : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumb ${idx}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Wholesale Price per Piece Tier Table */}
            {tiers && tiers.length > 0 && (
              <div id="wholesale-table-card" className="mt-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                  <div className="bg-orange-50 text-[#ff4c00] p-1.5 rounded-lg border border-orange-100">
                    <Package size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                      {lang === "sw" ? "Mchanganuo wa Bei za Jumla (Wholesale)" : "Wholesale Price tiers"}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {lang === "sw" 
                        ? "Bofya mstari kuchagua kiasi kuanzia cha bei hiyo" 
                        : "Click any row to auto-select that quantity range"}
                    </p>
                  </div>
                </div>
                <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white select-none shadow-3xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold">
                        <th className="p-2.5 px-3 text-left">
                          {lang === "sw" ? "Vipande (Pieces)" : "Quantity Range"}
                        </th>
                        <th className="p-2.5 px-3 text-right">
                          {lang === "sw" ? "Bei Kupitia Jumla / pc" : "Price per Piece"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tiers.map((tier, idx) => {
                        const isActive = qty >= tier.minQty && (!tier.maxQty || qty <= tier.maxQty);
                        const rangeStr = tier.maxQty 
                          ? `${tier.minQty} - ${tier.maxQty} pcs` 
                          : `≥ ${tier.minQty.toLocaleString()} pcs`;
                        return (
                          <tr 
                            key={idx} 
                            onClick={() => {
                              setQty(tier.minQty);
                              showAlert(
                                lang === "sw" 
                                  ? `Kiwango cha jumla kimepunguzwa. Kiasi kimepangiliwa kuwa ${tier.minQty}!` 
                                  : `Wholesale tier selected. Quantity set to ${tier.minQty}!`, 
                                "success"
                              );
                            }}
                            className={`cursor-pointer transition duration-150 ${
                              isActive 
                                ? "bg-orange-50/80 font-extrabold text-[#ff4c00]" 
                                : "hover:bg-slate-50 text-slate-700 font-semibold"
                            }`}
                          >
                            <td className="p-2.5 px-3 flex items-center gap-2">
                              {isActive && (
                                <span className="bg-orange-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0">
                                  {lang === "sw" ? "Iliyochaguliwa" : "active"}
                                </span>
                              )}
                              <span>{rangeStr}</span>
                            </td>
                            <td className="p-2.5 px-3 text-right font-mono">
                              <PriceDisplay 
                                amount={tier.price} 
                                size="xs" 
                                colorClass={isActive ? "text-[#ff4c00]" : "text-slate-800"} 
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="w-full md:w-1/2 flex flex-col pt-2 pb-10">
            
            <div className="flex flex-col mb-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                  {product.category}
                </span>
                {(product.niche && product.niche !== "Zote") && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {product.niche}
                  </span>
                )}
                {product.tags && product.tags.map(t => (
                  <span key={t} className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-1 rounded-md">
                    #{t}
                  </span>
                ))}
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-2 tracking-tight">
                {product.name}
              </h2>
              
              {/* Product Stock Status & Warranty */}
              <div className="flex flex-wrap items-center gap-2 mt-1 mb-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  product.stock > 5 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                    : product.stock > 0 
                    ? "bg-amber-50 border-amber-200 text-amber-700 animate-pulse" 
                    : "bg-rose-50 border-rose-100 text-rose-700"
                }`}>
                  <Package size={13} className="shrink-0" />
                  <span>
                    {product.stock > 5 ? (
                      lang === "sw" ? `Vipande ${product.stock} vipo stoo` : `In stock: ${product.stock} pieces available`
                    ) : product.stock > 0 ? (
                      lang === "sw" ? `Haraka: Vipande ${product.stock} pekee vimebaki!` : `Limited Stock: Only ${product.stock} left!`
                    ) : (
                      lang === "sw" ? "Mizigo Imeisha (Sold Out)" : "Out of Stock"
                    )}
                  </span>
                </div>

                 {product.warranty && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border border-amber-500/30 text-amber-700 shadow-xs hover:shadow-md transition-all hover:scale-105 duration-200 cursor-help" title={lang === "sw" ? "Muda wa Dhamana (Warranty)" : "Warranty Duration"}>
                    <Award size={13.5} className="text-amber-500 shrink-0" />
                    <span className="uppercase tracking-widest text-[10px] font-bold">
                      {lang === "sw" ? `DHAMANA: ${product.warranty}` : `WARRANTY: ${product.warranty}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Sold By Seller Header Badge (Always Visible, clicking opens unified store) */}
              <div 
                onClick={() => {
                  if (onViewSeller) {
                    onViewSeller(displaySeller);
                  }
                }}
                className="inline-flex items-center gap-2 mt-1 mb-2.5 px-3 py-1.5 rounded-xl border border-slate-200/60 bg-slate-50 hover:bg-white hover:border-orange-300 hover:shadow-xs transition-all cursor-pointer w-fit group/badge"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-slate-200/60 flex items-center justify-center bg-white">
                  {displaySeller.avatar ? (
                    <img src={displaySeller.avatar} alt={displaySeller.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store size={10} className="text-slate-400" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-500 group-hover/badge:text-orange-600 transition-colors">
                  {lang === "sw" ? "Muuzaji:" : "Seller:"}{" "}
                  <strong className="text-slate-800 font-extrabold">{displaySeller.name}</strong>
                </span>
                {displaySeller.isPro && (
                  <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[8px] font-black px-1 rounded shadow-2xs">
                    PRO
                  </span>
                )}
                {displaySeller.id === "official" && (
                  <span className="bg-blue-500 text-white text-[8px] font-black px-1 rounded shadow-2xs">
                    OFFICIAL
                  </span>
                )}
              </div>

              {/* Rating Summary */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-600">
                  <div className="flex items-center text-amber-400">
                    <Star size={16} className="fill-current" />
                    <span className="ml-1 text-slate-800 font-bold">
                      {(reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)}
                    </span>
                  </div>
                  <span>•</span>
                  <a href="#reviews" className="hover:text-primary underline decoration-slate-300 underline-offset-4">
                    {reviews.length} {lang === "sw" ? "Maoni" : "Reviews"}
                  </a>
                </div>
              )}
            </div>

            {/* Pricing Card with Font Auto-Adjust PriceDisplay */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200/60 mb-6 flex flex-col gap-4">
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                  {lang === "sw" ? "BEI YA BIDHAA (KIPANDE)" : "PRICE PER PIECE"}
                </span>
                <div className="flex items-end gap-3 flex-wrap">
                  {/* Incorporating auto-adjusting PriceDisplay */}
                  <PriceDisplay amount={currentUnitPrice} size="3xl" colorClass="text-[#ff4c00]" />
                  
                  {product.oldPrice && product.oldPrice > currentUnitPrice && (
                    <div className="pb-1">
                      <PriceDisplay amount={product.oldPrice} size="sm" colorClass="text-slate-400 line-through font-medium" />
                    </div>
                  )}
                </div>
                {currentUnitPrice >= 1000 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/50 rounded-lg px-2.5 py-1 w-fit mt-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    {lang === "sw"
                      ? `Pata alama ${Math.floor((currentUnitPrice * qty) / 1000)} za uaminifu`
                      : `Earn ${Math.floor((currentUnitPrice * qty) / 1000)} loyalty points`}
                  </div>
                )}
                {product.warranty && (
                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-800 bg-amber-50/70 border border-amber-200/75 rounded-lg px-3 py-1.5 w-fit mt-2 shadow-xxs">
                    <Award size={14.5} className="text-amber-600 shrink-0" />
                    <span className="font-sans text-[11px] font-bold">
                      {lang === "sw"
                        ? `Dhamana Iliyothibitishwa: ${product.warranty}`
                        : `Certified Warranty: ${product.warranty}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity Selector & Realtime Pricing Tracker */}
              {!isOutOfStock && (
                <div className="border-t border-slate-100 pt-4 mt-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {lang === "sw" ? "Chagua Kiasi (Quantity)" : "Select Quantity"}
                    </span>
                    {currentUnitPrice < product.price && (
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {lang === "sw" ? "Bei ya Jumla Inatumika!" : "Wholesale Discount Applied!"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1 shrink-0 shadow-3xs">
                      <button
                        type="button"
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-9 h-9 flex items-center justify-center text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition font-black active:scale-90 cursor-pointer text-base"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={qty}
                        min={1}
                        max={product.stock}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0 && val <= product.stock) {
                            setQty(val);
                          }
                        }}
                        className="w-12 text-center font-extrabold text-sm bg-transparent outline-none text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                        className="w-9 h-9 flex items-center justify-center text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition font-black active:scale-90 cursor-pointer text-base"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex-1 text-right flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        {lang === "sw" ? "Kiasi Kikuu cha Malipo" : "Total Subtotal"}
                      </span>
                      <div className="text-base font-black text-slate-800">
                        <PriceDisplay amount={currentUnitPrice * qty} size="lg" colorClass="text-[#1a2f52]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                {isOutOfStock ? (
                  <button
                    onClick={() => setShowNotify(true)}
                    className="flex-1 h-12 md:h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black transition-all hover:shadow-md hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-xs text-sm cursor-pointer"
                  >
                    <Bell size={18} />
                    <span>{lang === "sw" ? "Nijulishe ikipatikana" : "Notify Me"}</span>
                  </button>
                ) : (
                  <div className="flex flex-1 flex-col xs:flex-row gap-3">
                    <button
                      onClick={() => {
                        onAdd(product, false, qty);
                      }}
                      className="flex-1 h-12 md:h-14 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-xs text-sm sm:text-base cursor-pointer"
                    >
                      <ShoppingCart size={18} />
                      <span>{lang === "sw" ? "Weka Kikapuni" : "Add to Cart"}</span>
                    </button>

                    <button
                      onClick={() => {
                        onAdd(product, true, qty);
                        onClose();
                      }}
                      className="flex-1 h-12 md:h-14 bg-[#ff4c00] hover:bg-[#e04300] text-white rounded-xl font-black transition-all hover:shadow-lg hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-xs text-sm sm:text-base cursor-pointer"
                    >
                      <Zap size={18} />
                      <span>{lang === "sw" ? "Nunua Sasa" : "Buy Now"}</span>
                    </button>
                  </div>
                )}

                {onLikeToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLikeToggle(product.id, product.niche);
                    }}
                    className={`h-12 md:h-14 px-5 rounded-xl font-black transition-all border shrink-0 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 shadow-xs text-sm cursor-pointer ${
                      isLiked
                        ? "bg-rose-50 border-rose-300 text-rose-500 hover:bg-rose-100"
                        : "bg-white border-slate-200 text-slate-500 hover:text-rose-500 hover:bg-slate-50"
                    }`}
                    title={lang === "sw" ? "Sajili Pendwa yako" : "Add to Preferences"}
                  >
                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                    <span className="hidden sm:inline">
                      {isLiked
                        ? (lang === "sw" ? "Imependwa" : "Favored")
                        : (lang === "sw" ? "Penda" : "Favorite")}
                    </span>
                  </button>
                )}
              </div>

              {/* Guarantees */}
              <div className="flex items-center gap-4 border-t border-slate-100 pt-4 mt-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  <span>{lang === "sw" ? "Malipo Salama" : "Safe Payment"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  <span>{lang === "sw" ? "Imethibitishwa" : "Verified Quality"}</span>
                </div>
              </div>
            </div>

            {/* Sharing Block */}
            <div className="flex flex-col sm:flex-row gap-2 mb-8">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  lang === "sw" 
                    ? `Tazama ${product.nameSw || product.name} kwa ${formatCurrency(product.price)} kwenye Orbi Shop!\n\n${window.location.origin}/?product=${product.id}`
                    : `Check out ${product.name} for ${formatCurrency(product.price)} on Orbi Shop!\n\n${window.location.origin}/?product=${product.id}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-11 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-[1.02] active:scale-95 text-sm cursor-pointer"
              >
                <MessageCircle size={16} />
                <span>{lang === "sw" ? "Shiriki Kupitia WhatsApp" : "Share on WhatsApp"}</span>
              </a>
              
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className={`flex-1 sm:flex-initial h-11 px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow-xs text-sm border cursor-pointer ${
                    copied 
                      ? "bg-green-50 border-green-200 text-green-700" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                  title={lang === "sw" ? "Nakili Kiungo" : "Copy Link"}
                >
                  {copied ? (
                    <span className="text-sm px-2 whitespace-nowrap">{lang === "sw" ? "Imenakiliwa!" : "Copied!"}</span>
                  ) : (
                    <>
                      <Share2 size={15} />
                      <span className="inline sm:hidden md:inline ml-1">{lang === "sw" ? "Nakili" : "Copy"}</span>
                    </>
                  )}
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(product.name)}&url=${encodeURIComponent(`${window.location.origin}/?product=${product.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 w-11 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs hover:scale-105 transition flex items-center justify-center shrink-0"
                >
                  <Twitter size={15} />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/?product=${product.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 w-11 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs hover:scale-105 transition flex items-center justify-center shrink-0"
                >
                  <Facebook size={15} />
                </a>
              </div>
            </div>

            {/* Out of stock notify form */}
            {showNotify && (
              <div className="bg-white p-5 rounded-2xl shadow-xs border border-orange-100 space-y-3 mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                <h4 className="font-bold text-slate-900">
                  {lang === "sw" ? "Bidhaa imeisha" : "Product out of stock"}
                </h4>
                <p className="text-sm text-slate-600">
                  {lang === "sw" ? "Jaza maelezo yako kupata taarifa itakapopatikana." : "Leave your details to be notified when available."}
                </p>
                <input
                  type="email"
                  placeholder="Barua pepe (Email)"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                />
                <input
                  type="tel"
                  placeholder="Namba ya simu (Phone)"
                  value={notifyPhone}
                  onChange={(e) => setNotifyPhone(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                />
                <button
                  onClick={handleNotify}
                  disabled={notifying}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition shadow-xs cursor-pointer"
                >
                  {notifying ? "Inatuma..." : "Nijulishe"}
                </button>
              </div>
            )}

            {/* Seller profile */}
            {displaySeller && (
              <div
                onClick={() => {
                  if (onViewSeller) {
                    onViewSeller(displaySeller);
                  }
                }}
                className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group mb-8 shadow-xs animate-in fade-in"
              >
                <div className="w-14 h-14 rounded-full border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 shrink-0 shadow-inner p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                    {displaySeller.avatar ? (
                      <img
                        src={displaySeller.avatar}
                        alt={displaySeller.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store size={24} className="text-slate-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    {lang === "sw" ? "MUUZAJI" : "SELLER"}
                  </span>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-extrabold text-slate-800 group-hover:text-primary transition-colors tracking-tight">
                      {displaySeller.name}
                    </p>
                    {displaySeller.isPro && displaySeller.proUntil && displaySeller.proUntil > Date.now() && (
                      <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs">
                        PRO
                      </span>
                    )}
                    {displaySeller.id === "official" && (
                      <span className="bg-blue-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs">
                        OFFICIAL
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-medium font-sans">
                    {displaySeller.description}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-orange-50 flex items-center justify-center transition-colors">
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-orange-500" />
                </div>
              </div>
            )}

            {/* Description & Technical Specifications Grid Tab */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-xs">
              <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Info size={16} className="text-orange-500" />
                  {lang === "sw" ? "Ufafanuzi na Taarifa za Bidhaa" : "Specifications & Description"}
                </h3>
              </div>
              <div className="p-5 space-y-6">
                
                {/* Unified Professional Two-Column Key Attributes Specifications Table */}
                {keyAttributes.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                      <Sliders size={12} className="text-slate-400" />
                      {lang === "sw" ? "Sifa na Vigezo vya Bidhaa" : "Key Product Attributes"}
                    </h4>
                    
                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs divide-y divide-slate-100">
                      {(showAllSpecs ? keyAttributes : keyAttributes.slice(0, 8)).map((attr, idx) => (
                        <div key={idx} className="grid grid-cols-12 text-xs hover:bg-slate-50/50 transition duration-75">
                          <div className="col-span-5 bg-slate-50/60 p-3 font-semibold text-slate-500 capitalize border-r border-slate-100/80 flex items-center select-none">
                            {attr.key}
                          </div>
                          <div className="col-span-7 p-3 font-bold text-slate-800 break-words flex items-center">
                            {attr.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {keyAttributes.length > 8 && (
                      <div className="flex justify-center pt-1.5">
                        <button
                          type="button"
                          onClick={() => setShowAllSpecs(!showAllSpecs)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-4 py-2 rounded-xl transition cursor-pointer select-none active:scale-95 border border-slate-200"
                        >
                          <span>{showAllSpecs ? (lang === "sw" ? "Onyesha Chache" : "Show Less") : (lang === "sw" ? "Onyesha Zote" : "Show More")}</span>
                          {showAllSpecs ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2 mt-4 border-t border-slate-100 pt-4">
                    {lang === "sw" ? "Maelezo ya Kina" : "Detailed Description"}
                  </h4>
                  <p className="whitespace-pre-wrap text-slate-600 leading-relaxed text-sm">
                    {product.description || (lang === "sw" ? "Hakuna maelezo ya ziada yalioandikwa kuhusu bidhaa hii." : "No additional description provided for this product.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div id="reviews" className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8 shadow-xs">
              <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-3 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">
                  {lang === "sw" ? "Maeni ya Wateja" : "Customer Reviews"} ({reviews.length})
                </h3>
              </div>
              
              <div className="p-5">
                <div className="space-y-4 mb-6">
                  {reviews.length === 0 ? (
                    <p className="text-slate-500 text-sm italic py-4 text-center">
                      {lang === "sw" ? "Hakuna maoni bado. Kuwa wa kwanza kuacha maoni!" : "No reviews yet. Be the first to leave a review!"}
                    </p>
                  ) : (
                    reviews.map((r) => (
                      <div key={r.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-slate-800">{r.userName}</div>
                          <div className="flex text-amber-400 text-xs">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < r.rating ? "fill-current" : "text-slate-300"} />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600">{r.comment}</p>
                        <div className="text-[10px] text-slate-400 mt-2">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-sm text-slate-800">
                    {lang === "sw" ? "Acha Maoni Yako" : "Leave a Review"}
                  </h4>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewRating(star)}
                        className={`text-2xl transition-colors hover:scale-110 active:scale-95 cursor-pointer ${star <= newRating ? "text-amber-400" : "text-slate-300"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={lang === "sw" ? "Andika maoni yako haha..." : "Write your review here..."}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none h-24"
                  />
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition shadow-xs text-sm cursor-pointer"
                  >
                    {submitting ? (lang === "sw" ? "Inatuma..." : "Sending...") : (lang === "sw" ? "Tuma Maoni" : "Submit Review")}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Related Similar Products Section (Full Width, Bottom) */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="w-full bg-slate-50 border-t border-slate-250/80 py-12 px-4 md:px-8 mt-4">
            <div className="max-w-7xl mx-auto">
              {/* Specialized Niche Banner */}
              <div className="relative w-full rounded-3xl bg-slate-900 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 border border-slate-800 overflow-hidden mb-8 shadow-xl flex flex-col md:flex-row items-center">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
                <div className="relative z-10 p-8 md:p-12 md:w-2/3 flex flex-col items-start gap-4 text-left">
                  <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                    <Star size={12} className="fill-current" />
                    {(product.niche && product.niche !== "Zote") ? product.niche : product.category}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
                    {lang === "sw" ? "Gundua Bidhaa Zaidi" : "Explore More Products"}
                  </h2>
                  <p className="text-sm text-slate-300 font-medium max-w-xl leading-relaxed">
                    {lang === "sw" 
                      ? "Pata bidhaa bora na za kipekee zilizoteuliwa maalum kwa ajili yako kutoka kwenye kundi hili. Endelea kuvinjari kuangalia ofa kabambe za leo!" 
                      : "Find premium and uniquely curated collections dedicated exclusively for you in this niche. Keep exploring for unmatched value deals!"}
                  </p>
                </div>
                <div className="relative z-10 p-8 md:w-1/3 flex justify-end hidden md:flex">
                  <div className="w-32 h-32 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center shadow-inner relative">
                    <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping"></div>
                    <ShoppingCart size={40} className="text-amber-400 drop-shadow-md" />
                  </div>
                </div>
              </div>

              {/* Similar Products List Header */}
              <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                  {lang === "sw" ? "Bidhaa Zinazofanana Nayo" : "Similar Products"}
                </h2>
                <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-xs">
                  {relatedProducts.length} {lang === "sw" ? "Zimepatikana" : "Found"}
                </span>
              </div>
              
              {/* Responsive columns grid - strictly starting with 2 on mobile devices! */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                {relatedProducts.slice(0, 10).map((rp) => (
                  <div
                    key={rp.id}
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(rp);
                        // Scroll to top of detail page
                        const scrollable = document.querySelector('.flex-1.overflow-y-auto');
                        if (scrollable) scrollable.scrollTop = 0;
                        window.scrollTo(0, 0);
                      }
                    }}
                    className="bg-white rounded-2xl shadow-xs border border-slate-150 select-none hover:shadow-md transition duration-300 cursor-pointer overflow-hidden flex flex-col group h-full"
                  >
                    <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden shrink-0">
                      <img
                        src={rp.images[0]}
                        alt={rp.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-1.5 text-left">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#ff4c00] transition-colors">
                          {rp.name}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2 flex-wrap">
                        {/* Perfect pricing typography integration */}
                        <PriceDisplay amount={rp.price} colorClass="text-[#ff4c00]" className="text-xs sm:text-sm font-black" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar for Mobile Screens (hides on desktop) */}
      {!isOutOfStock && (
        <div className="fixed bottom-0 inset-x-0 z-[9999999] bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 md:hidden animate-in slide-in-from-bottom duration-300 select-none">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px] xs:max-w-[150px]">
              {product.name}
            </span>
            <div className="flex items-center gap-1">
              <PriceDisplay amount={product.price} size="lg" colorClass="text-[#ff4c00]" />
            </div>
          </div>
          
          <div className="flex flex-1 items-center gap-2 justify-end">
            <button
              onClick={() => onAdd(product, false)}
              className="flex-1 max-w-[140px] h-11 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-xs xs:text-sm cursor-pointer"
            >
              <ShoppingCart size={15} />
              <span>{lang === "sw" ? "Kikapu" : "Cart"}</span>
            </button>
            
            <button
              onClick={() => {
                onAdd(product, true);
                onClose();
              }}
              className="flex-1 max-w-[160px] h-11 bg-[#ff4c00] hover:bg-[#ff4c00]/90 text-white rounded-xl font-black transition-all flex items-center justify-center gap-1.5 text-xs xs:text-sm shadow-md cursor-pointer"
            >
              <Zap size={14} className="fill-current" />
              <span>{lang === "sw" ? "Nunua" : "Buy Now"}</span>
            </button>
          </div>
        </div>
      )}
      
      {/* SEO: Inject Structured Data for Crawlers */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </div>
  );
}
