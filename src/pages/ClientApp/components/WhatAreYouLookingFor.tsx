import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, Award, Flame, ArrowRight, Layers } from "lucide-react";
import { Product, SellerProfile } from "../../../types";

interface WhatAreYouLookingForProps {
  products: Product[];
  sellers: SellerProfile[];
  lang: "sw" | "en";
  onSelectFamily: (family: string) => void;
}

interface FamilyGroup {
  name: string;
  representativeProduct: Product;
  totalCount: number;
  hasProTrader: boolean;
  isPushed: boolean;
}

export const WhatAreYouLookingFor: React.FC<WhatAreYouLookingForProps> = ({
  products,
  sellers,
  lang,
  onSelectFamily,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Group products by family and score them to choose the best representative pro trader / promoted product
  const familyGroups = useMemo(() => {
    const groups: { [key: string]: Product[] } = {};

    products.forEach((p) => {
      let fam = p.family?.trim();
      if (!fam && p.category && p.category.includes("::")) {
        fam = p.category.split("::")[2]?.trim();
      }
      if (!fam) fam = "Zingine"; // fallback if no family is specified

      // Skip generic names or empty values
      if (fam.toLowerCase() === "zote" || fam.toLowerCase() === "all" || fam === "") {
        return;
      }

      if (!groups[fam]) {
        groups[fam] = [];
      }
      groups[fam].push(p);
    });

    const list: FamilyGroup[] = [];

    Object.entries(groups).forEach(([famName, pList]) => {
      // Score products to find the absolute best representative product (prioritizing pro traders + pushed products)
      const scoredProducts = pList.map((p) => {
        let score = 0;
        const seller = sellers.find((s) => s.id === p.sellerId);
        
        // 1. Pro Trader priority (+1000)
        const isPro = Boolean(seller?.isPro && seller?.proUntil && seller.proUntil > Date.now());
        if (isPro) score += 1000;

        // 2. Pushed/Promoted product priority (+500)
        const isPushed = Boolean(
          p.tags &&
            p.tags.some((t) => {
              const tl = t.toLowerCase();
              return tl.includes("promoted") || tl.includes("promo") || tl.includes("trend") || tl.includes("recommend") || tl.includes("vip");
            })
        );
        if (isPushed) score += 500;

        // 3. Fallback
        score += 10;

        return { product: p, score, isPro, isPushed };
      });

      // Sort descending by score
      scoredProducts.sort((a, b) => b.score - a.score);

      const topRepresentative = scoredProducts[0];
      if (topRepresentative) {
        list.push({
          name: famName,
          representativeProduct: topRepresentative.product,
          totalCount: pList.length,
          hasProTrader: scoredProducts.some((x) => x.isPro),
          isPushed: scoredProducts.some((x) => x.isPushed),
        });
      }
    });

    // Sort family groups so that families with Pro Traders and pushed products are prioritized at the top/front
    return list.sort((a, b) => {
      const aScore = (a.hasProTrader ? 100 : 0) + (a.isPushed ? 50 : 0);
      const bScore = (b.hasProTrader ? 100 : 0) + (b.isPushed ? 50 : 0);
      return bScore - aScore;
    });
  }, [products, sellers]);

  // Handle auto-rotation for the Spotlight showcase card
  useEffect(() => {
    if (familyGroups.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(familyGroups.length, 6));
    }, 5500);
    return () => clearInterval(interval);
  }, [familyGroups]);

  if (familyGroups.length === 0) return null;

  // Active Spotlight item
  const activeSpotlight = familyGroups[currentIndex % familyGroups.length];
  
  // Debugging
  console.log('[DEBUG] activeSpotlight representativeProduct image:', activeSpotlight.representativeProduct.image);
  console.log('[DEBUG] familyGroups images:', familyGroups.map(g => g.representativeProduct.image));

  return (
    <div className="w-full bg-white text-slate-900 rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 relative overflow-hidden my-4">
      {/* Decorative subtle background glows */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-indigo-50 rounded-full blur-[80px] opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-emerald-50 rounded-full blur-[80px] opacity-50 pointer-events-none"></div>

      {/* Header info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2 relative z-10 border-b border-slate-100 pb-2">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
            <Sparkles size={10} className="animate-spin-slow" />
            <span>{lang === "sw" ? "Mkusanyiko wetu bora uliopendekezwa kwa ajili yako" : "Our top recommended collection for you"}</span>
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-950">
            {lang === "sw" ? "Unatafuta nini leo?" : "What are you looking for?"}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-slate-100 text-indigo-700 font-black px-2 py-0.5 rounded-lg text-[10px] border border-slate-200">
            {familyGroups.length}
          </span>
        </div>
      </div>

      {/* Core split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10 items-stretch">
        
        {/* Left Side: Spotlight Blending Banner Ad */}
        <div className="lg:col-span-5 bg-slate-50 rounded-xl border border-slate-100 p-2 flex flex-col gap-1 overflow-hidden relative min-h-[240px]">
          <div className="absolute top-1 right-2 z-20 flex gap-1">
            {activeSpotlight.hasProTrader && (
              <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] px-2 py-0.5 rounded-md font-black uppercase flex items-center gap-0.5">
                <Award size={10} /> Pro Trader
              </span>
            )}
            {activeSpotlight.isPushed && (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-md font-black uppercase flex items-center gap-0.5">
                <Flame size={10} className="animate-pulse" /> Pushed
              </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSpotlight.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col gap-2 pt-1"
            >
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase block mb-1">
                  {lang === "sw" ? "FAMILIA INAYOONGOZA" : "SPOTLIGHT ECOSYSTEM"}
                </span>
                <h3 className="text-xl font-black text-slate-950 mb-2 leading-tight">
                  {activeSpotlight.name}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3">
                  {lang === "sw"
                    ? `Kusanya bidhaa zote halisi na vifaa chini ya chapa inayopendwa ya ${activeSpotlight.name}.`
                    : `Browse all items, models, and parts matching the official ${activeSpotlight.name} ecosystem.`}
                </p>
              </div>

              {/* Dynamic inline ad presentation */}
              <div 
                onClick={() => onSelectFamily(activeSpotlight.name)}
                className="bg-white hover:bg-slate-100 border border-slate-200 rounded-lg p-3 flex items-center gap-4 transition duration-200 cursor-pointer group shadow-sm mt-auto"
              >
                <div className="w-16 h-16 bg-slate-200 rounded-md overflow-hidden shrink-0 border border-slate-200 relative">
                  <img
                    src={activeSpotlight.representativeProduct.image}
                    alt={activeSpotlight.representativeProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onLoad={() => console.log(`[DEBUG] Image loaded: ${activeSpotlight.representativeProduct.image}`)}
                    onError={() => console.log(`[DEBUG] Image failed: ${activeSpotlight.representativeProduct.image}`)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-wide block">
                    {lang === "sw" ? "Mwakilishi" : "Top Representative Item"}
                  </span>
                  <p className="text-xs font-black text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                    {activeSpotlight.representativeProduct.name}
                  </p>
                  <span className="text-[10px] font-extrabold text-emerald-600 block mt-0.5">
                    {lang === "sw" ? "Gundua zote" : "Explore ecosystem"} &rarr;
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel dots indicators */}
          <div className="flex justify-center gap-1 pt-2 border-t border-slate-100">
            {familyGroups.slice(0, 6).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex % Math.min(familyGroups.length, 6) === idx
                    ? "w-6 bg-indigo-600"
                    : "w-1.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Horizontal Scrolling list */}
        <div className="lg:col-span-7 flex flex-col justify-center min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase">
              {lang === "sw" ? "Bidhaa bora zinazofanana" : "Similar top products"}
            </span>
            <div className="flex items-center gap-1 text-[9px] text-indigo-600 font-bold">
              <span>{lang === "sw" ? "Sogeza" : "Scroll"}</span>
              <ArrowRight size={9} className="animate-pulse" />
            </div>
          </div>

          {/* Infinite-like side scroller */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory pt-0.5">
            {familyGroups.map((group) => (
              <div
                key={group.name}
                onClick={() => onSelectFamily(group.name)}
                className="w-32 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-2 shrink-0 cursor-pointer snap-start transition duration-300 group flex flex-col justify-between shadow-xs"
              >
                {/* Visual Image container */}
                <div className="w-full aspect-square bg-slate-200 rounded-md overflow-hidden mb-2 relative border border-slate-100">
                  <img
                    src={group.representativeProduct.image}
                    alt={group.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onLoad={() => console.log(`[DEBUG] Scroller image loaded: ${group.representativeProduct.image}`)}
                    onError={() => console.log(`[DEBUG] Scroller image failed: ${group.representativeProduct.image}`)}
                  />
                  
                  {/* Subtle badges inside images */}
                  <div className="absolute top-1 right-1 z-10 flex flex-col gap-0.5 items-end">
                    {group.hasProTrader && (
                      <span className="bg-amber-400 text-slate-950 p-0.5 rounded-sm shadow-xs" title="Pro Seller">
                        <Award size={8} />
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-1">
                    <span className="text-[7px] font-black bg-indigo-600 text-white px-1 rounded-sm">
                      {group.totalCount} {lang === "sw" ? "Bidhaa" : "Items"}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-900 group-hover:text-indigo-600 line-clamp-1 transition-colors leading-snug">
                    {group.name}
                  </h4>
                  <p className="text-[8px] text-slate-500 font-medium mt-0.5 flex items-center gap-0.5">
                    <Layers size={7} />
                    <span>{lang === "sw" ? "Gundua" : "View"}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom quick tip card */}
          <div className="mt-1 bg-indigo-50 border border-indigo-100 rounded-lg p-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Award size={10} />
              </div>
              <p className="text-[9px] text-slate-600 font-medium leading-tight">
                {lang === "sw"
                  ? "Sakinisha uhakika wa manunuzi yako."
                  : "Shop securely. Major brands authenticated."}
              </p>
            </div>
            <button
              onClick={() => onSelectFamily(familyGroups[0]?.name || "Oven")}
              className="text-[9px] font-black text-indigo-700 hover:text-indigo-800 transition shrink-0 flex items-center gap-0.5"
            >
              {lang === "sw" ? "Zaidi" : "View"} &rarr;
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
