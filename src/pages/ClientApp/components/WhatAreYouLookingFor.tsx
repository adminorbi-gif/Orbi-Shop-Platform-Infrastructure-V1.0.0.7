import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Award, Flame, ArrowRight, Layers, Eye } from "lucide-react";
import { Product, SellerProfile } from "../../../types";

interface WhatAreYouLookingForProps {
  products: Product[];
  sellers: SellerProfile[];
  lang: "sw" | "en";
  onSelectFamily: (family: string) => void;
  onSelectProduct?: (productId: string) => void;
}

interface FamilyGroup {
  name: string;
  representativeProduct: Product;
  totalCount: number;
  hasProTrader: boolean;
  isPushed: boolean;
}

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' text-anchor='middle' dominant-baseline='central' fill='%2394a3b8'%3ENo image%3C/text%3E%3C/svg%3E";

export const WhatAreYouLookingFor: React.FC<WhatAreYouLookingForProps> = ({
  products,
  sellers,
  lang,
  onSelectFamily,
  onSelectProduct,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledGroups, setShuffledGroups] = useState<FamilyGroup[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string>("");

  // ---- 1. Group, score, and sort by priority (deterministic) ----
  const sortedGroups = useMemo(() => {
    if (!products || !sellers) return [];

    const sellerMap = new Map<string, SellerProfile>();
    sellers.forEach((s) => sellerMap.set(s.id, s));

    const groups: { [key: string]: Product[] } = {};

    products.forEach((p) => {
      let fam = p.family?.trim();
      if (!fam && p.category) {
        const parts = p.category.split("::");
        if (parts.length >= 3) {
          fam = parts[2]?.trim();
        }
      }
      if (!fam) fam = "Zingine";

      const lowerFam = fam.toLowerCase();
      if (lowerFam === "zote" || lowerFam === "all" || fam === "") {
        return;
      }

      if (!groups[fam]) {
        groups[fam] = [];
      }
      groups[fam].push(p);
    });

    const list: FamilyGroup[] = [];

    Object.entries(groups).forEach(([famName, pList]) => {
      const scoredProducts = pList.map((p) => {
        let score = 0;
        const seller = sellerMap.get(p.sellerId);
        const isPro = Boolean(seller?.isPro && seller?.proUntil && seller.proUntil > Date.now());
        if (isPro) score += 1000;

        const isPushed = Boolean(
          p.tags &&
            p.tags.some((t) => {
              const tl = t.toLowerCase();
              return (
                tl.includes("promoted") ||
                tl.includes("promo") ||
                tl.includes("trend") ||
                tl.includes("recommend") ||
                tl.includes("vip")
              );
            })
        );
        if (isPushed) score += 500;

        score += 10;
        return { product: p, score, isPro, isPushed };
      });

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

    return list.sort((a, b) => {
      const aScore = (a.hasProTrader ? 100 : 0) + (a.isPushed ? 50 : 0);
      const bScore = (b.hasProTrader ? 100 : 0) + (b.isPushed ? 50 : 0);
      return bScore - aScore;
    });
  }, [products, sellers]);

  // ---- 2. Interleave + shuffle within tiers (fair spotlight rotation) ----
  useEffect(() => {
    if (sortedGroups.length === 0) {
      setShuffledGroups([]);
      return;
    }

    const highTier = sortedGroups.filter((g) => g.hasProTrader || g.isPushed);
    const normalTier = sortedGroups.filter((g) => !g.hasProTrader && !g.isPushed);

    const shuffleArray = (arr: FamilyGroup[]) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const shuffledHigh = shuffleArray(highTier);
    const shuffledNormal = shuffleArray(normalTier);

    const interleaved: FamilyGroup[] = [];
    const maxLen = Math.max(shuffledHigh.length, shuffledNormal.length);

    for (let i = 0; i < maxLen; i++) {
      if (i < shuffledHigh.length) interleaved.push(shuffledHigh[i]);
      if (i < shuffledNormal.length) interleaved.push(shuffledNormal[i]);
    }

    setShuffledGroups(interleaved);
  }, [sortedGroups]);

  // ---- 3. Pick a random background image from all products ----
  useEffect(() => {
    if (!products || products.length === 0) return;

    // Filter products that have a valid image
    const validProducts = products.filter(
      (p) => p.images && p.images.length > 0 && typeof p.images[0] === "string" && p.images[0].trim() !== ""
    );

    if (validProducts.length === 0) {
      setBackgroundImage("");
      return;
    }

    // Pick a random product
    const randomProduct = validProducts[Math.floor(Math.random() * validProducts.length)];
    const imgUrl = randomProduct.images?.[0];
    if (imgUrl && typeof imgUrl === "string" && imgUrl.trim() !== "") {
      setBackgroundImage(imgUrl);
    } else {
      setBackgroundImage("");
    }
  }, [products]);

  // ---- 4. Auto‑rotation (uses shuffledGroups) ----
  const totalFamilies = shuffledGroups.length;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (totalFamilies <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalFamilies);
    }, 5500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [totalFamilies]);

  if (shuffledGroups.length === 0) return null;

  const activeSpotlight = shuffledGroups[currentIndex % totalFamilies];

  const getImageSrc = (product: Product): string => {
    const img = product?.images && product.images[0];
    if (img && typeof img === "string" && img.trim() !== "" && img !== "null" && img !== "undefined") {
      return img;
    }
    return PLACEHOLDER_IMAGE;
  };

  const handleProductClick = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectProduct) {
      onSelectProduct(productId);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-100 overflow-hidden my-4 relative">
      {/* Background image with blur and dark overlay */}
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              filter: "blur(3px)",
              transform: "scale(1.1)", // avoids edge blur transparency
            }}
          />
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
        </>
      )}
      {!backgroundImage && (
        <div className="absolute inset-0 bg-white" />
      )}

      {/* Content – sits on top */}
      <div className="relative z-10 bg-transparent text-slate-900 p-4 md:p-6">
        {/* Decorative glows (adjusted opacity for background) */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-indigo-50 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-emerald-50 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2 relative z-10 border-b border-slate-200/50 pb-2">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-indigo-50/90 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 backdrop-blur-sm">
              <Sparkles size={10} className="animate-spin-slow" />
              <span>
                {lang === "sw"
                  ? "Mkusanyiko wetu bora uliopendekezwa kwa ajili yako"
                  : "Our top recommended collection for you"}
              </span>
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-950">
              {lang === "sw" ? "Unatafuta nini leo?" : "What are you looking for?"}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-slate-100/90 text-indigo-700 font-black px-2 py-0.5 rounded-lg text-[10px] border border-slate-200 backdrop-blur-sm">
              {shuffledGroups.length}
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10 items-stretch">
          {/* Spotlight (left) */}
          <div className="lg:col-span-5 bg-slate-50/[0.68] backdrop-blur-sm rounded-xl border border-slate-100 p-2 flex flex-col gap-1 overflow-hidden relative min-h-[240px]">
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

                {/* Representative product card with dual actions */}
                <div
                  onClick={() => onSelectFamily(activeSpotlight.name)}
                  className="bg-white/[0.68] hover:bg-white/[0.8] border border-slate-200 rounded-lg p-3 flex items-center gap-4 transition duration-200 cursor-pointer group mt-auto relative backdrop-blur-sm"
                >
                  <div
                    className="w-16 h-16 bg-slate-200 rounded-md overflow-hidden shrink-0 border border-slate-200 relative cursor-pointer"
                    onClick={(e) =>
                      handleProductClick(activeSpotlight.representativeProduct.id, e)
                    }
                    title={lang === "sw" ? "Tazama bidhaa" : "View product"}
                  >
                    <img
                      src={getImageSrc(activeSpotlight.representativeProduct)}
                      alt={activeSpotlight.representativeProduct.name || activeSpotlight.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ display: "block", background: "#e2e8f0" }}
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    {onSelectProduct && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <Eye size={18} className="text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-wide block">
                        {lang === "sw" ? "Mwakilishi" : "Top Representative"}
                      </span>
                      {onSelectProduct && (
                        <button
                          onClick={(e) =>
                            handleProductClick(activeSpotlight.representativeProduct.id, e)
                          }
                          className="text-[9px] font-bold text-emerald-600 hover:text-emerald-800 transition flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100"
                        >
                          <Eye size={10} />
                          {lang === "sw" ? "Bidhaa" : "Product"}
                        </button>
                      )}
                    </div>
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

            {/* Carousel dots */}
            <div className="flex justify-center gap-1 pt-2 border-t border-slate-100 flex-wrap">
              {shuffledGroups.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentIndex % totalFamilies === idx
                      ? "w-6 bg-indigo-600"
                      : "w-1.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                  aria-label={`Go to family ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right side: Horizontal scroller */}
          <div className="lg:col-span-7 flex flex-col justify-center min-w-0">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase">
                {lang === "sw" ? "Bidhaa bora zinazoendana" : "Familiar top products"}
              </span>
              <div className="flex items-center gap-1 text-[9px] text-indigo-600 font-bold">
                <span>{lang === "sw" ? "Sogeza" : "Scroll"}</span>
                <ArrowRight size={9} className="animate-pulse" />
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory pt-0.5">
              {shuffledGroups.map((group) => (
                <div
                  key={group.name}
                  onClick={() => onSelectFamily(group.name)}
                  className="w-32 bg-white/[0.68] hover:bg-white/[0.8] border border-slate-200 rounded-xl p-2 shrink-0 cursor-pointer snap-start transition duration-300 group flex flex-col justify-between backdrop-blur-sm"
                >
                  <div className="w-full aspect-square bg-slate-200 rounded-md overflow-hidden mb-2 relative border border-slate-100">
                    <img
                      src={getImageSrc(group.representativeProduct)}
                      alt={group.representativeProduct.name || group.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{ display: "block", background: "#e2e8f0" }}
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    <div className="absolute top-1 right-1 z-10 flex flex-col gap-0.5 items-end">
                      {group.hasProTrader && (
                        <span className="bg-amber-400 text-slate-950 p-0.5 rounded-sm" title="Pro Seller">
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

            {/* Bottom quick tip */}
            <div className="mt-1 bg-indigo-50/[0.68] backdrop-blur-sm border border-indigo-100 rounded-lg p-1.5 flex items-center justify-between gap-2">
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
                onClick={() => {
                  if (shuffledGroups.length > 0) {
                    onSelectFamily(shuffledGroups[0].name);
                  }
                }}
                className="text-[9px] font-black text-indigo-700 hover:text-indigo-800 transition shrink-0 flex items-center gap-0.5"
                disabled={shuffledGroups.length === 0}
              >
                {lang === "sw" ? "Zaidi" : "View"} &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};