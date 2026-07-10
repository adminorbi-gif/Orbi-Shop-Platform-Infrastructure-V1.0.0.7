import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Niche, Product } from '../../types';
import { ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface NicheHubProps {
  niches: Niche[];
  products: Product[];
  lang: string;
  onSelectNiche: (nicheName: string) => void;
}

export function NicheHub({ niches, products, lang, onSelectNiche }: NicheHubProps) {
  // Filter out Zote/All from niches if it exists
  const displayNiches = niches.filter(n => n.name !== "Zote" && n.name !== "All");

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 mb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 mb-2">
          {lang === "sw" ? "Ungependa kuchunguza nini?" : "What would you like to explore?"}
        </h2>
        <p className="text-slate-500 font-medium text-sm">
          {lang === "sw" 
            ? "Chagua duka lako maalum kwa uzoefu bora wa ununuzi." 
            : "Choose your dedicated shopping center for the best experience."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayNiches.map((niche, index) => {
          // Dynamic Icon Rendering
          const IconComponent = (LucideIcons as any)[niche.icon] || LucideIcons.ShoppingBag;
          
          // Get top products for this niche
          const nicheProducts = products.filter(p => p.niche === niche.name).slice(0, 4);

          return (
            <motion.div
              key={niche.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectNiche(niche.name)}
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4 z-10 relative">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors line-clamp-1">
                    {niche.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {niche.categories.length} {lang === "sw" ? "Kategoria" : "Categories"}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <ChevronRight size={18} />
                </div>
              </div>

              {/* Product Previews */}
              <div className="flex-1 z-10 relative mt-auto">
                {nicheProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {nicheProducts.map(p => (
                      <div key={p.id} className="aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100 relative group/img">
                        <img 
                          src={p.images[0] || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80'} 
                          alt={p.name}
                          className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                        />
                      </div>
                    ))}
                    {/* Fill empty spots if less than 4 products */}
                    {Array.from({ length: Math.max(0, 4 - nicheProducts.length) }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square bg-slate-50/50 rounded-xl border border-slate-100/50 flex items-center justify-center">
                        <LucideIcons.Image size={16} className="text-slate-200" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 bg-slate-50 rounded-xl mt-4 flex flex-col items-center justify-center text-slate-400 border border-slate-100 border-dashed">
                    <LucideIcons.PackageOpen size={24} className="mb-2 opacity-50" />
                    <span className="text-xs font-medium">{lang === "sw" ? "Hakuna bidhaa bado" : "No products yet"}</span>
                  </div>
                )}
              </div>
              
              {/* Subtle background decoration */}
              <div className="absolute -bottom-10 -right-10 text-slate-50 opacity-50 group-hover:text-emerald-50/50 group-hover:scale-150 transition-all duration-700 pointer-events-none">
                <IconComponent size={140} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
