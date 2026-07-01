import React from "react";
import { Package, ArrowUpDown, Zap, Star, Tag, History, ShoppingCart, Eye, ExternalLink } from "lucide-react";
import { PriceDisplay } from "../PriceDisplay";

interface ProductGridProps {
  products: any[];
  lang: string;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  sortOrder: "default" | "asc" | "desc" | "newest" | "popular";
  setSortOrder: (v: any) => void;
  handleProductSelect: (p: any) => void;
  t: (k: string) => string;
}

export function ProductGrid({
  products,
  lang,
  selectedCategory,
  setSelectedCategory,
  sortOrder,
  setSortOrder,
  handleProductSelect,
  t
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
          <Package size={40} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800">{lang === "sw" ? "Hakuna bidhaa zilizopatikana" : "No products found"}</h3>
          <p className="text-sm text-slate-400 font-medium mt-1">{lang === "sw" ? "Jaribu kutafuta kitu kingine ama badili kundi." : "Try searching for something else or change the category."}</p>
        </div>
        <button 
          onClick={() => {
            setSelectedCategory("Zote");
          }}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-lg shadow-slate-100"
        >
          {lang === "sw" ? "Onyesha Zote" : "Show All Products"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="products-grid">
      {/* Grid Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Zap size={18} className="text-[#ff4c00]" />
            {selectedCategory === "Zote" ? (lang === "sw" ? "Bidhaa Zote" : "All Products") : selectedCategory}
          </h3>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-200">
            {products.length} {lang === "sw" ? "Bidhaa" : "Items"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 mr-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <ArrowUpDown size={12} />
            Sort By
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer shadow-sm"
          >
            <option value="default">{lang === "sw" ? "Chaguo-msingi" : "Default"}</option>
            <option value="newest">{lang === "sw" ? "Mpya Zaidi" : "Newest First"}</option>
            <option value="popular">{lang === "sw" ? "Maarufu" : "Most Popular"}</option>
            <option value="asc">{lang === "sw" ? "Bei: Chini kwenda Juu" : "Price: Low to High"}</option>
            <option value="desc">{lang === "sw" ? "Bei: Juu kwenda Chini" : "Price: High to Low"}</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="orbi-product-list-grid">
        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => handleProductSelect(p)}
            className="orbi-market-product-card group flex cursor-pointer flex-col overflow-hidden rounded-[1.4rem] border border-slate-200/80 text-left transition-all duration-300 hover:-translate-y-1 hover:border-orange-300/70 active:scale-[0.99]"
          >
            {/* Image Container */}
            <div className="orbi-product-image-stage relative aspect-[1/1.08] overflow-hidden">
              {p.images?.[0] ? (
                <img 
                  src={p.images[0]} 
                  className="h-full w-full object-contain p-4 transition-transform duration-700 group-hover:scale-[1.055]"
                  alt={p.name}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200">
                  <Package size={48} />
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute left-2 top-2 z-20 flex max-w-[72%] flex-wrap gap-1.5">
                {p.stock <= 5 && p.stock > 0 && (
                  <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
                    {lang === "sw" ? "Chache" : "Low stock"}
                  </span>
                )}
                {p.isNew && (
                  <span className="rounded-full bg-slate-950/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
                    {lang === "sw" ? "Mpya" : "New arrival"}
                  </span>
                )}
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-gradient-to-t from-slate-950/28 to-transparent p-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <div className="rounded-full bg-white/95 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-xl backdrop-blur-md">
                  {lang === "sw" ? "Tazama" : "Quick view"}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between gap-3 p-3.5 sm:p-4">
              <div className="space-y-2.5">
                <p className="truncate text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{p.category || "General"}</p>
                <h4 className="orbi-product-title line-clamp-2 text-[13px] font-black leading-[1.35] text-slate-950 transition-colors group-hover:text-[#ff4c00] sm:text-[15px]">
                  {lang === "sw" ? (p.nameSw || p.name) : p.name}
                </h4>
                
                {/* Rating (Placeholder for now) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-full bg-amber-50 px-2 py-1 ring-1 ring-amber-100">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={10} className={s <= 4 ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {p.stock > 0 ? (lang === "sw" ? `${p.stock} zipo` : `${p.stock} left`) : (lang === "sw" ? "Imeisha" : "Sold out")}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <PriceDisplay amount={p.price} size="lg" colorClass="text-[#ff4c00] font-black" className="orbi-product-price" />
                  {p.oldPrice && p.oldPrice > p.price && (
                    <span className="text-[11px] text-slate-400 line-through font-bold">{formatCurrency(p.oldPrice)}</span>
                  )}
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-slate-100 pt-2.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${p.stock > 0 ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                    <span className="truncate text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                      {p.stock > 0 ? (lang === "sw" ? "Tayari kununua" : "Ready to buy") : (lang === "sw" ? "Haipatikani" : "Unavailable")}
                    </span>
                  </div>
                  <button className="rounded-full bg-slate-950 p-2 text-white transition-colors hover:bg-[#ff4c00]">
                    <ShoppingCart size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCurrency(num: number) {
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
  }).format(num);
}
