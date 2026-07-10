import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp, Check, Filter } from 'lucide-react';
import { Product } from '../types';
import { extractFamilyProperties, DynamicPropertyMap } from '../../utils/propertyExtractor';

export interface DynamicFilters {
  [propertyKey: string]: string[];
}

interface DynamicPropertyFilterProps {
  products: Product[];
  activeFilters: DynamicFilters;
  onFilterChange: (filters: DynamicFilters) => void;
  lang: 'en' | 'sw';
}

export const DynamicPropertyFilter: React.FC<DynamicPropertyFilterProps> = ({
  products,
  activeFilters = {},
  onFilterChange,
  lang,
}) => {
  const propertyMap = useMemo(() => extractFamilyProperties(products), [products]);
  const propertyKeys = Object.keys(propertyMap);

  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(new Set(propertyKeys.slice(0, 3)));

  if (propertyKeys.length === 0) return null;

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleToggleOption = (key: string, value: string) => {
    const currentList = activeFilters[key] || [];
    let newList;
    if (currentList.includes(value)) {
      newList = currentList.filter(v => v !== value);
    } else {
      newList = [...currentList, value];
    }

    const newFilters = { ...activeFilters };
    if (newList.length > 0) {
      newFilters[key] = newList;
    } else {
      delete newFilters[key];
    }
    
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 md:p-5 shadow-sm sticky top-24">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <Filter size={18} className="text-indigo-600" />
          <span>{lang === 'sw' ? 'Chuja Bidhaa' : 'Filter Products'}</span>
        </div>
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
          >
            {lang === 'sw' ? 'Safisha' : 'Clear All'}
          </button>
        )}
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
        {propertyKeys.map((key) => {
          const values = Array.from(propertyMap[key]).sort();
          const isExpanded = expandedKeys.has(key);
          const activeCount = (activeFilters[key] || []).length;
          
          return (
            <div key={key} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <button 
                onClick={() => toggleExpand(key)}
                className="w-full flex items-center justify-between py-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 text-sm">{key}</span>
                  {activeCount > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {activeCount}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400" />
                )}
              </button>
              
              {isExpanded && (
                <div className="mt-2 space-y-2">
                  {values.map(val => {
                    const isSelected = (activeFilters[key] || []).includes(val);
                    return (
                      <label 
                        key={val} 
                        className="flex items-start gap-2 cursor-pointer group"
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected 
                            ? 'bg-indigo-600 border-indigo-600' 
                            : 'bg-white border-slate-300 group-hover:border-indigo-400'
                        }`}>
                          {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className={`text-xs leading-snug pt-0.5 ${
                          isSelected ? 'text-indigo-700 font-medium' : 'text-slate-600 group-hover:text-slate-900'
                        }`}>
                          {val}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
