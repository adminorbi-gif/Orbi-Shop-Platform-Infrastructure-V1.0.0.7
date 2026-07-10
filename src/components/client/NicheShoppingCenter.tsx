import React from "react";
import { ArrowLeft } from "lucide-react";
import { Niche, Category, Product } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { DynamicPropertyFilter, DynamicFilters } from "./DynamicPropertyFilter";

interface NicheShoppingCenterProps {
  nicheObj: Niche;
  allCategories: Category[];
  products: Product[];
  lang: string;
  onBack: () => void;
  onSelectCategory: (cat: string) => void;
  onSelectFamily: (fam: string) => void;
  selectedCategory: string;
  selectedFamily: string | null;
  renderProductCard: (p: Product) => React.ReactNode;
  activeDynamicFilters: DynamicFilters;
  setActiveDynamicFilters: (filters: DynamicFilters) => void;
}

export const NicheShoppingCenter: React.FC<NicheShoppingCenterProps> = ({
  nicheObj,
  allCategories,
  products,
  lang,
  onBack,
  onSelectCategory,
  onSelectFamily,
  selectedCategory,
  selectedFamily,
  renderProductCard,
  activeDynamicFilters = {},
  setActiveDynamicFilters,
}) => {

  const nicheCategories = React.useMemo(() => {
    if (nicheObj?.categories && nicheObj.categories.length > 0) {
      return nicheObj.categories;
    }
    const catNames = Array.from(new Set(
      products
        .filter(p => p.niche === nicheObj.name || (!p.niche && nicheObj.name === "Mengineyo"))
        .map(p => p.category)
        .filter(Boolean)
    ));
    return catNames.map(name => ({ name, families: [] }));
  }, [nicheObj, products]);

  const activeCategoryObj = selectedCategory !== "Zote" 
    ? nicheCategories.find((c) => c.name === selectedCategory) 
    : null;

  let displayProducts = products.filter((p) => p.niche === nicheObj.name || (!p.niche && nicheObj.name === "Mengineyo"));

  if (selectedCategory !== "Zote") {
    displayProducts = displayProducts.filter((p) => p.category === selectedCategory);
  }

  if (selectedFamily) {
    displayProducts = displayProducts.filter((p) => p.family === selectedFamily);
  }

  // Apply Dynamic Filters
  if (Object.keys(activeDynamicFilters).length > 0) {
    displayProducts = displayProducts.filter((p) => {
      if (!p.description) return true;
      const descLower = p.description.toLowerCase();
      
      return Object.entries(activeDynamicFilters).every(([propKey, activeValues]) => {
        if (!activeValues || activeValues.length === 0) return true;
        
        // This is a simple substring match for the exact property text based on propertyExtractor output
        // In a real scenario, this would be more robust.
        return activeValues.some(val => val && descLower.includes(val.toLowerCase()));
      });
    });
  }



  const getThemeByNiche = (nicheName: string) => {
    switch (nicheName) {
      case "Electronics & Tech":
        return "bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-blue-400";
      case "Fashion & Apparel":
        return "bg-gradient-to-br from-fuchsia-900 via-pink-900 to-slate-900 text-pink-400";
      case "Home & Furniture":
        return "bg-gradient-to-br from-amber-900 via-orange-900 to-slate-900 text-orange-400";
      case "Health & Beauty":
        return "bg-gradient-to-br from-rose-900 via-pink-900 to-slate-900 text-rose-400";
      case "Auto & Motors":
        return "bg-gradient-to-br from-slate-800 via-gray-900 to-black text-slate-300";
      case "Supermarket & Food":
        return "bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-emerald-400";
      default:
        return "bg-slate-900 text-emerald-400";
    }
  };
  const themeClasses = getThemeByNiche(nicheObj.name);
  const bgColor = themeClasses.split(' ').filter(c => c.startsWith('bg-')).join(' ');
  const textColor = themeClasses.split(' ').filter(c => c.startsWith('text-')).join(' ');

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      <div className={`relative overflow-hidden rounded-3xl text-white ${bgColor} p-8 sm:p-12 shadow-sm flex flex-col sm:flex-row items-center sm:justify-between gap-6`}>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative z-10 max-w-2xl">
          <button 
            onClick={onBack}
            className="mb-4 text-slate-300 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors"
          >
            <ArrowLeft size={16} />
            {lang === "sw" ? "Rudi Kwenye Maduka Yote" : "Back to All Shops"}
          </button>
          <h1 className={`text-3xl sm:text-5xl font-black mb-3 ${textColor}`}>
            {nicheObj.name}
          </h1>
          <p className="text-slate-300 font-medium text-sm sm:text-base max-w-xl">
            {lang === "sw" 
              ? `Gundua bidhaa bora kutoka kwenye duka la ${nicheObj.name}. Chagua kipengele unachotaka.` 
              : `Explore top quality products from the ${nicheObj.name} center. Choose a category to refine.`}
          </p>
        </div>
      </div>

      <div className="w-full overflow-x-auto scrollbar-none pb-2">
        <div className="flex gap-3">
          <button
            onClick={() => {
              onSelectCategory("Zote");
              onSelectFamily("");
            }}
            className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-bold transition-all shadow-xs ${
              selectedCategory === "Zote"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {lang === "sw" ? "Vyote" : "All"}
          </button>
          {nicheCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => {
                onSelectCategory(cat.name);
                onSelectFamily("");
              }}
              className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-bold transition-all shadow-xs ${
                selectedCategory === cat.name
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeCategoryObj && activeCategoryObj.families && activeCategoryObj.families.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 overflow-hidden"
          >
            {activeCategoryObj.families.map((fam) => (
              <button
                key={fam}
                onClick={() => onSelectFamily(fam)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedFamily === fam 
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {fam}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Listing Area Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
        {/* Filter Sidebar (Only visible when a specific category is selected) */}
        {selectedCategory !== "Zote" && (
          <div className="w-full md:w-64 shrink-0 hidden md:block">
            <DynamicPropertyFilter 
              products={products.filter(p => p.category === selectedCategory && (p.niche === nicheObj.name || (!p.niche && nicheObj.name === "Mengineyo")))}
              activeFilters={activeDynamicFilters}
              onFilterChange={setActiveDynamicFilters}
              lang={lang}
            />
          </div>
        )}

        {/* Main Grid */}
        <div className="flex-1 w-full min-w-0">
          {selectedCategory !== "Zote" && (
            <div className="md:hidden mb-4">
               <DynamicPropertyFilter 
                products={products.filter(p => p.category === selectedCategory && (p.niche === nicheObj.name || (!p.niche && nicheObj.name === "Mengineyo")))}
                activeFilters={activeDynamicFilters}
                onFilterChange={setActiveDynamicFilters}
                lang={lang}
              />
            </div>
          )}

          {displayProducts.length > 0 ? (
          <div className="orbi-product-list-grid py-1">
            <AnimatePresence mode="popLayout">
              {displayProducts.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderProductCard(p)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500 font-medium">
              {lang === "sw" ? "Hakuna bidhaa zilizopatikana." : "No products found."}
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
