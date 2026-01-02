
import React from 'react';
import { ProductVariant } from '../../../types';
import { Plus, Trash2, Tag, Copy } from 'lucide-react';

interface VariantsTabProps {
  variants: Partial<ProductVariant>[];
  setVariants: React.Dispatch<React.SetStateAction<Partial<ProductVariant>[]>>;
  handleAddVariant: () => void;
  currencySymbol: string;
}

export const VariantsTab: React.FC<VariantsTabProps> = ({
  variants, setVariants, handleAddVariant, currencySymbol
}) => {
  
  const handleVariantChange = (index: number, field: keyof ProductVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    setVariants(updated);
  };

  const duplicateVariant = (index: number) => {
    const v = variants[index];
    const newVariant = { ...v, id: `v-${Date.now()}`, name: `${v.name} (Copy)` };
    setVariants([...variants, newVariant]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
         <div>
            <h4 className="font-bold text-slate-800 flex items-center">
               <Tag className="w-5 h-5 mr-2 text-blue-500" />
               Product Variants
            </h4>
            <p className="text-sm text-slate-500">Define sizes, colors, or types (e.g. Red, XL)</p>
         </div>
         <button 
            type="button" 
            onClick={handleAddVariant} 
            className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-sm transition-colors"
         >
            <Plus className="w-4 h-4 mr-2" /> Add Variant
         </button>
       </div>

       <div className="space-y-3">
          {variants.length === 0 ? (
             <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400">
                <Tag className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No variants added yet.</p>
                <button type="button" onClick={handleAddVariant} className="text-blue-600 hover:underline text-sm font-medium mt-1">Create First Variant</button>
             </div>
          ) : (
             variants.map((v, i) => (
                <div key={v.id || i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md hover:border-blue-200">
                   <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-3">
                         <label className="block text-xs font-bold text-slate-500 mb-1">Variant Name</label>
                         <input 
                            type="text" 
                            value={v.name} 
                            onChange={(e) => handleVariantChange(i, 'name', e.target.value)} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" 
                            placeholder="e.g. Red, XL"
                         />
                      </div>
                      <div className="md:col-span-3">
                         <label className="block text-xs font-bold text-slate-500 mb-1">SKU / Code</label>
                         <input 
                            type="text" 
                            value={v.code} 
                            onChange={(e) => handleVariantChange(i, 'code', e.target.value)} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" 
                            placeholder="Unique Code"
                         />
                      </div>
                      <div className="md:col-span-2">
                         <label className="block text-xs font-bold text-slate-500 mb-1">Price ({currencySymbol})</label>
                         <input 
                            type="number" 
                            min="0"
                            value={v.price} 
                            onChange={(e) => handleVariantChange(i, 'price', parseFloat(e.target.value))} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold" 
                         />
                      </div>
                      <div className="md:col-span-2">
                         <label className="block text-xs font-bold text-slate-500 mb-1">Stock</label>
                         <input 
                            type="number" 
                            min="0"
                            value={v.stock} 
                            onChange={(e) => handleVariantChange(i, 'stock', parseFloat(e.target.value))} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" 
                         />
                      </div>
                      
                      <div className="md:col-span-2 flex justify-end gap-2 pb-1">
                         <button 
                            type="button" 
                            onClick={() => duplicateVariant(i)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Duplicate"
                         >
                            <Copy className="w-4 h-4" />
                         </button>
                         <button 
                            type="button" 
                            onClick={() => removeVariant(i)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>
             ))
          )}
       </div>
    </div>
  );
};
