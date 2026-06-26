import React, { useState, useEffect, useMemo } from "react";
import { Clock, ShoppingCart, Eye, Sparkles } from "lucide-react";
import { PromotionalBanner, Product } from "../types";

interface PromotionalBannersSectionProps {
  banners: PromotionalBanner[];
  products: Product[];
  onAddToCart: (p: Product) => void;
  onSelectProduct: (p: Product) => void;
  lang: any;
}

export default function PromotionalBannersSection({
  banners,
  products,
  onAddToCart,
  onSelectProduct,
  lang,
}: PromotionalBannersSectionProps) {
  // Current time state to drive countdown intervals
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter banners that are currently active based on schedule
  const activeBanners = useMemo(() => {
    return banners.filter((banner) => {
      if (!banner.visible) return false;
      const startTime = banner.startDate ? new Date(banner.startDate).getTime() : 0;
      const endTime = banner.endDate ? new Date(banner.endDate).getTime() : Infinity;
      return now >= startTime && now < endTime;
    });
  }, [banners, now]);

  if (activeBanners.length === 0) return null;

  return (
    <div className="mb-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm md:text-lg font-black uppercase text-slate-800 tracking-wider">
              {lang === "sw" ? "Ofa Maalum za Muda Mfupi" : "Flash Deals & Special Offers"}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
              {lang === "sw" 
                ? "Mawasilisho na punguzo maalum kabla ya muda kwisha!" 
                : "Limited-time discounts scheduled just for you!"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeBanners.map((banner) => {
          const matchedProduct = products.find((prod) => prod.id === banner.link);

          return (
            <BannerCard
              key={banner.id}
              banner={banner}
              now={now}
              lang={lang}
              product={matchedProduct}
              onAddToCart={onAddToCart}
              onSelectProduct={onSelectProduct}
            />
          );
        })}
      </div>
    </div>
  );
}

interface BannerCardProps {
  key?: any;
  banner: PromotionalBanner;
  now: number;
  lang: any;
  product?: Product;
  onAddToCart: (p: Product) => void;
  onSelectProduct: (p: Product) => void;
}

function BannerCard({
  banner,
  now,
  lang,
  product,
  onAddToCart,
  onSelectProduct,
}: BannerCardProps) {
  const targetTime = useMemo(() => {
    return banner.endDate ? new Date(banner.endDate).getTime() : 0;
  }, [banner.endDate]);

  // Calculate dynamic countdown values
  const countdown = useMemo(() => {
    const diff = targetTime - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, expired: false };
  }, [targetTime, now]);

  const handleCta = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product) {
      onSelectProduct(product);
    } else if (banner.link && banner.link.startsWith("http")) {
      window.open(banner.link, "_blank");
    }
  };

  const cardBackground = banner.bgColor || "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";

  return (
    <div
      style={{ background: cardBackground }}
      className="rounded-3xl shadow-xl overflow-hidden relative border border-slate-800 flex flex-col justify-between group p-6 min-h-[220px]"
    >
      {/* Decorative Blur Accent */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition duration-500" />

      <div className="flex flex-col sm:flex-row gap-6 relative z-10 h-full">
        {/* Banner image/creative */}
        {banner.image && (
          <div className="w-full sm:w-28 h-28 sm:h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/50">
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                {lang === "sw" ? "Mwisho wa Ofa" : "Ending Soon"}
              </span>
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </div>

            <h3
              style={{ color: banner.textColor || "#ffffff" }}
              className="text-base sm:text-lg font-black tracking-tight leading-snug line-clamp-1 group-hover:text-amber-400 transition-colors"
            >
              {lang === "sw" ? banner.titleSw || banner.title : banner.title}
            </h3>

            <p className="text-slate-300 text-xs font-medium leading-relaxed mt-1 line-clamp-2">
              {lang === "sw" ? banner.descriptionSw || banner.description : banner.description}
            </p>
          </div>

          {/* Countdown Layout Blocks */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="flex flex-col items-center">
              <span className="font-mono text-base sm:text-xl font-black text-amber-400 bg-slate-900/60 px-2.5 py-1 rounded-xl border border-slate-700/30 min-w-[2.4rem] text-center shadow-inner leading-none">
                {String(countdown.days).padStart(2, "0")}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">
                {lang === "sw" ? "Siku" : "Days"}
              </span>
            </div>
            <span className="text-amber-500 font-extrabold pb-4 shadow-sm animate-none">:</span>
            <div className="flex flex-col items-center">
              <span className="font-mono text-base sm:text-xl font-black text-amber-400 bg-slate-900/60 px-2.5 py-1 rounded-xl border border-slate-700/30 min-w-[2.4rem] text-center shadow-inner leading-none">
                {String(countdown.hours).padStart(2, "0")}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">
                {lang === "sw" ? "Saa" : "Hrs"}
              </span>
            </div>
            <span className="text-amber-500 font-extrabold pb-4 shadow-sm animate-none">:</span>
            <div className="flex flex-col items-center">
              <span className="font-mono text-base sm:text-xl font-black text-amber-400 bg-slate-900/60 px-2.5 py-1 rounded-xl border border-slate-700/30 min-w-[2.4rem] text-center shadow-inner leading-none">
                {String(countdown.minutes).padStart(2, "0")}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">
                {lang === "sw" ? "Daq" : "Mins"}
              </span>
            </div>
            <span className="text-amber-500 font-extrabold pb-4 shadow-sm animate-none">:</span>
            <div className="flex flex-col items-center">
              <span className="font-mono text-base sm:text-xl font-black text-amber-400 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-700/30 min-w-[2.4rem] text-center shadow-inner leading-none">
                {String(countdown.seconds).padStart(2, "0")}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">
                {lang === "sw" ? "Sec" : "Secs"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom Actions Row */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-800/60 mt-4 pt-4 relative z-10 font-sans">
        {product && (
          <div className="text-slate-300">
            <span className="text-[9px] uppercase font-black text-slate-400 block tracking-widest">
              {lang === "sw" ? "Bei ya Bidhaa" : "Product Price"}
            </span>
            <span className="text-sm font-black text-emerald-400">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "TZS", maximumFractionDigits: 0 }).format(product.price)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {product && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="bg-white/10 hover:bg-white/20 text-white rounded-xl p-2.5 transition border border-white/10 flex items-center justify-center cursor-pointer shadow-sm"
              title={lang === "sw" ? "Ongeza Kikapuni" : "Add to Cart"}
            >
              <ShoppingCart size={16} />
            </button>
          )}

          <button
            onClick={handleCta}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer leading-none"
          >
            <Eye size={14} />
            {banner.buttonText 
              ? (lang === "sw" ? banner.buttonTextSw || banner.buttonText : banner.buttonText)
              : (lang === "sw" ? "Angalia Ofa" : "View Deal")}
          </button>
        </div>
      </div>
    </div>
  );
}
