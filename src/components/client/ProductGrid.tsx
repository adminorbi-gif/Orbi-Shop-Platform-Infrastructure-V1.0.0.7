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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => handleProductSelect(p)}
            className="group cursor-pointer bg-white rounded-2xl sm:rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition-all active:scale-95 flex flex-col text-left"
          >
            {/* Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden bg-slate-50">
              {p.images?.[0] ? (
                <img 
                  src={p.images[0]} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={p.name}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200">
                  <Package size={48} />
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {p.stock <= 5 && p.stock > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-md">
                    Low Stock
                  </span>
                )}
                {p.isNew && (
                  <span className="bg-[#ff4c00] text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-md">
                    New Arrival
                  </span>
                )}
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black/60 to-transparent flex justify-center gap-2">
                <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-xl">
                  Quick View
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{p.category || "General"}</p>
                <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-[#ff4c00] transition-colors mb-2">
                  {lang === "sw" ? (p.nameSw || p.name) : p.name}
                </h4>
                
                {/* Rating (Placeholder for now) */}
                <div className="flex items-center gap-1 mb-3">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={10} className={s <= 4 ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-100"} />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-300 font-bold ml-1">(12)</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline gap-1.5">
                  <PriceDisplay amount={p.price} size="lg" colorClass="text-slate-900 font-black" />
                  {p.oldPrice && (
                    <span className="text-[10px] text-slate-300 line-through font-bold">{formatCurrency(p.oldPrice)}</span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">In Stock</span>
                  </div>
                  <button className="text-slate-300 hover:text-[#ff4c00] transition-colors">
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
