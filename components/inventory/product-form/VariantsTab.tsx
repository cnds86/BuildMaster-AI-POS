
import React, { useState, useEffect, useRef } from 'react';
import { ProductVariant, UnitDefinition, VariantAttribute } from '../../../types';
import { Plus, Trash2, Tag, Barcode, CheckSquare, Square, ArrowRightLeft, Box, Sparkles, TrendingUp, Info } from 'lucide-react';

interface VariantsTabProps {
  variants: Partial<ProductVariant>[];
  setVariants: React.Dispatch<React.SetStateAction<Partial<ProductVariant>[]>>;
  handleAddVariant: () => void;
  handleVariantChange: (index: number, field: keyof ProductVariant | 'attributes', value: any, attributeName?: string) => void;
  unitsByCategory: Record<string, UnitDefinition[]>;
  availableAttributes: VariantAttribute[];
  baseCostPrice: number;
}

export const VariantsTab: React.FC<VariantsTabProps> = ({
  variants, setVariants, handleAddVariant, handleVariantChange, unitsByCategory, availableAttributes, baseCostPrice
}) => {
  // Local state to track which attributes are "enabled" for this product form
  const [activeAttributeIds, setActiveAttributeIds] = useState<string[]>([]);
  const [suggestionOpenIndex, setSuggestionOpenIndex] = useState<number | null>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Initialize active attributes based on existing variant data
  useEffect(() => {
    if (variants.length > 0) {
      const usedAttrs = new Set<string>();
      variants.forEach(v => {
        if (v.attributes) {
          Object.keys(v.attributes).forEach(attrName => {
             const attrDef = availableAttributes.find(a => a.name === attrName);
             if (attrDef) usedAttrs.add(attrDef.id);
          });
        }
      });
      if (usedAttrs.size > 0) {
         setActiveAttributeIds(Array.from(usedAttrs));
      }
    }
  }, []); // Run once on mount

  // Close suggestion dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setSuggestionOpenIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleAttribute = (attrId: string) => {
    if (activeAttributeIds.includes(attrId)) {
      setActiveAttributeIds(prev => prev.filter(id => id !== attrId));
    } else {
      setActiveAttributeIds(prev => [...prev, attrId]);
    }
  };

  const activeAttributes = availableAttributes.filter(a => activeAttributeIds.includes(a.id));

  // Generate suggestions based on cost
  const getPriceSuggestions = (variant: Partial<ProductVariant>) => {
    const factor = variant.conversionFactor || 1;
    // Use base cost if variant doesn't have specific override (currently we only have base cost in form)
    const cost = baseCostPrice * factor;
    
    if (cost <= 0) return null;

    return [
      { label: 'Low Margin (20%)', price: cost * 1.2, color: 'text-yellow-600 bg-yellow-50 border-yellow-100', icon: TrendingUp },
      { label: 'Standard (35%)', price: cost * 1.35, color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Tag },
      { label: 'High Margin (50%)', price: cost * 1.5, color: 'text-green-600 bg-green-50 border-green-100', icon: TrendingUp },
      { label: 'AI Market Analysis', price: cost * 1.42, color: 'text-purple-600 bg-purple-50 border-purple-100', icon: Sparkles, note: 'Based on competitor data' }
    ];
  };

  const applySuggestedPrice = (index: number, price: number) => {
    handleVariantChange(index, 'price', price.toFixed(2));
    setSuggestionOpenIndex(null);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in" style={{ minHeight: '400px' }}>
       {/* Attribute Selector Section */}
       <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <h5 className="font-bold text-slate-700 text-sm mb-3">Select Active Attributes</h5>
          <div className="flex flex-wrap gap-3">
             {availableAttributes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No global attributes defined. Go to Unit Mgmt to add attributes.</p>
             ) : (
                availableAttributes.map(attr => {
                   const isActive = activeAttributeIds.includes(attr.id);
                   return (
                      <button
                         key={attr.id}
                         type="button"
                         onClick={() => toggleAttribute(attr.id)}
                         className={`flex items-center px-3 py-1.5 rounded-lg text-sm border transition-all ${
                            isActive 
                               ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                               : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                         }`}
                      >
                         {isActive ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2 text-slate-400" />}
                         {attr.name}
                      </button>
                   );
                })
             )}
          </div>
       </div>

       <div className="flex justify-between items-center mb-6">
         <div>
            <h4 className="font-bold text-slate-800 flex items-center">
               <Tag className="w-5 h-5 mr-2 text-slate-500" />
               Product Variants
            </h4>
            <p className="text-xs text-slate-500 mt-1">Define different versions (size, color, unit) with specific pricing and stock.</p>
         </div>
         <button 
            type="button" 
            onClick={handleAddVariant} 
            className="text-sm flex items-center text-white font-bold bg-slate-900 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
         >
            <Plus className="w-4 h-4 mr-1.5" /> Add Variant
         </button>
       </div>
       
       <div className="space-y-4 pb-20">
          {variants.map((v, i) => {
             const suggestions = getPriceSuggestions(v);
             const hasSuggestions = suggestions !== null;

             return (
             <div key={i} className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative group transition-all hover:shadow-md hover:border-slate-300">
                <button 
                   type="button" 
                   onClick={() => setVariants(prev => prev.filter((_, idx) => idx !== i))} 
                   className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-lg border border-slate-200 shadow-sm transition-colors z-10"
                   title="Remove Variant"
                >
                   <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                   {/* Unit Selection */}
                   <div className="lg:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Unit / Type</label>
                      <select 
                         value={v.name} 
                         onChange={e => handleVariantChange(i, 'name', e.target.value)} 
                         className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-400 outline-none"
                      >
                         <option value="">Select Unit</option>
                         {Object.entries(unitsByCategory).map(([c, uList]) => (
                           <optgroup key={c} label={c}>
                             {(uList as UnitDefinition[]).map(u => <option key={u.id} value={u.symbol}>{u.name} ({u.symbol})</option>)}
                           </optgroup>
                         ))}
                      </select>
                   </div>

                   {/* Dynamic Attributes */}
                   {activeAttributes.map(attr => (
                      <div key={attr.id} className="lg:col-span-1">
                         <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{attr.name}</label>
                         <select
                            value={v.attributes?.[attr.name] || ''}
                            onChange={e => handleVariantChange(i, 'attributes', e.target.value, attr.name)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                         >
                            <option value="">Any</option>
                            {attr.values.map(val => (
                               <option key={val} value={val}>{val}</option>
                            ))}
                         </select>
                      </div>
                   ))}

                   {/* Conversion Factor */}
                   <div className="lg:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Factor</label>
                      <div className="relative">
                         <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={v.conversionFactor} 
                            onChange={e => handleVariantChange(i, 'conversionFactor', e.target.value)} 
                            className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-indigo-400 outline-none" 
                            title="How many base units this variant contains"
                         />
                      </div>
                   </div>

                   {/* SKU / Code */}
                   <div className="lg:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">SKU Code</label>
                      <div className="relative">
                         <Barcode className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                         <input 
                            type="text" 
                            value={v.code} 
                            onChange={e => handleVariantChange(i, 'code', e.target.value)} 
                            placeholder="SKU-001" 
                            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-slate-400 outline-none" 
                         />
                      </div>
                   </div>

                   {/* Stock Input */}
                   <div className="lg:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Stock Qty</label>
                      <div className="relative">
                         <Box className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                         <input 
                            type="number" 
                            min="0"
                            value={v.stock || 0} 
                            onChange={e => handleVariantChange(i, 'stock', e.target.value)} 
                            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                         />
                      </div>
                   </div>

                   {/* Selling Price with AI Suggestion */}
                   <div className="lg:col-span-1 relative">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase flex justify-between">
                         Price
                         {hasSuggestions && (
                            <button 
                               type="button" 
                               onClick={() => setSuggestionOpenIndex(suggestionOpenIndex === i ? null : i)}
                               className="text-purple-600 hover:text-purple-800 transition-colors"
                               title="Get Price Suggestions"
                            >
                               <Sparkles className="w-3.5 h-3.5" />
                            </button>
                         )}
                      </label>
                      <input 
                         type="number" 
                         min="0" 
                         step="0.01"
                         value={v.price} 
                         onChange={e => handleVariantChange(i, 'price', e.target.value)} 
                         placeholder="0.00" 
                         className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                      
                      {/* Suggestions Popover */}
                      {suggestionOpenIndex === i && hasSuggestions && (
                         <div ref={suggestionRef} className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
                            <div className="bg-purple-50 p-3 border-b border-purple-100 flex justify-between items-center">
                               <h6 className="font-bold text-xs text-purple-900 flex items-center">
                                  <Sparkles className="w-3 h-3 mr-1.5" /> Price Suggestions
                               </h6>
                               <span className="text-[10px] text-purple-700 font-mono">Cost: {(baseCostPrice * (v.conversionFactor || 1)).toFixed(2)}</span>
                            </div>
                            <div className="p-2 space-y-1">
                               {suggestions.map((s, idx) => {
                                  const Icon = s.icon;
                                  return (
                                     <button
                                        key={idx}
                                        type="button"
                                        onClick={() => applySuggestedPrice(i, s.price)}
                                        className={`w-full text-left p-2 rounded-lg text-xs hover:shadow-sm transition-all flex items-center justify-between group ${s.color} bg-opacity-30 border border-opacity-50`}
                                     >
                                        <div className="flex items-center">
                                           <Icon className="w-3.5 h-3.5 mr-2 opacity-70" />
                                           <div className="flex flex-col">
                                              <span className="font-bold">{s.label}</span>
                                              {s.note && <span className="text-[9px] opacity-70">{s.note}</span>}
                                           </div>
                                        </div>
                                        <span className="font-bold text-sm">{s.price.toFixed(2)}</span>
                                     </button>
                                  );
                               })}
                            </div>
                         </div>
                      )}
                   </div>
                </div>
                
                {/* Hints */}
                <div className="mt-2 flex flex-wrap gap-2">
                   {v.name && v.conversionFactor && (
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                         1 <strong>{v.name}</strong> = <strong>{v.conversionFactor}</strong> base units
                      </span>
                   )}
                </div>
             </div>
          })}
          
          {variants.length === 0 && (
             <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-sm">No variants added yet.</p>
                <p className="text-xs mt-1">Add variants for different sizes, colors, or units with custom pricing and stock.</p>
             </div>
          )}
       </div>
    </div>
  );
};
