
import React from 'react';
import { ProductVariant, UnitDefinition } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';

interface VariantsTabProps {
  variants: Partial<ProductVariant>[];
  setVariants: React.Dispatch<React.SetStateAction<Partial<ProductVariant>[]>>;
  handleAddVariant: () => void;
  handleVariantChange: (index: number, field: keyof ProductVariant, value: any) => void;
  unitsByCategory: Record<string, UnitDefinition[]>;
}

export const VariantsTab: React.FC<VariantsTabProps> = ({
  variants, setVariants, handleAddVariant, handleVariantChange, unitsByCategory
}) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
       <div className="flex justify-between items-center mb-4">
         <h4 className="font-bold text-slate-800">Product Variants</h4>
         <button type="button" onClick={handleAddVariant} className="text-sm flex items-center text-primary-600 font-medium hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg"><Plus className="w-4 h-4 mr-1" /> Add Variant</button>
       </div>
       <div className="space-y-4">
          {variants.map((v, i) => (
             <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                <button type="button" onClick={() => setVariants(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                <div className="grid grid-cols-3 gap-4">
                   <select value={v.name} onChange={e => handleVariantChange(i, 'name', e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm bg-white">
                      <option value="">Unit</option>
                      {Object.entries(unitsByCategory).map(([c, uList]) => (
                        <optgroup key={c} label={c}>
                          {(uList as UnitDefinition[]).map(u => <option key={u.id} value={u.symbol}>{u.name} ({u.symbol})</option>)}
                        </optgroup>
                      ))}
                   </select>
                   <input type="text" value={v.code} onChange={e => handleVariantChange(i, 'code', e.target.value)} placeholder="SKU" className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm" />
                   <input type="number" value={v.price} onChange={e => handleVariantChange(i, 'price', e.target.value)} placeholder="Price" className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm font-bold" />
                </div>
             </div>
          ))}
          {variants.length === 0 && <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-lg">No variants added.</div>}
       </div>
    </div>
  );
};
