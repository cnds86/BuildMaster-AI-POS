
import React from 'react';
import { Product, CategoryItem, UnitDefinition } from '../../../types';
import { ImageIcon } from 'lucide-react';

interface GeneralTabProps {
  formData: Partial<Product>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  categoryOptions: { id: string; name: string; level: number }[];
  units: UnitDefinition[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  formData, setFormData, handleInputChange, categoryOptions, units, fileInputRef, handleImageUpload
}) => {
  return (
    <div className="space-y-6 animate-fade-in bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 flex justify-center">
             <div className="relative group w-32 h-32 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-primary-500 transition-colors bg-slate-50">
                {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-400"><ImageIcon className="w-8 h-8 mb-1" /><span className="text-xs">Upload</span></div>}
                <input type="file" ref={fileInputRef} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
             </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
            <select name="category" required value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white">
               <option value="">Select</option>
               {categoryOptions.map(cat => <option key={cat.id} value={cat.id}>{'\u00A0'.repeat(cat.level * 3)}{cat.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">SKU</label><input type="text" name="sku" value={formData.sku} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Barcode</label><input type="text" name="barcode" value={formData.barcode} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono" /></div>
          
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-sm font-medium text-slate-700 mb-1">Stock</label><input type="number" name="stock" min="0" value={formData.stock} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
             <div><label className="block text-sm font-medium text-slate-700 mb-1">Min. Order Qty</label><input type="number" name="minOrderQuantity" min="1" value={formData.minOrderQuantity || 1} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="1" /></div>
          </div>
          
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit</label><select name="unit" required value={formData.unit} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"><option value="">Select</option>{units.map(u => <option key={u.id} value={u.symbol}>{u.name} ({u.symbol})</option>)}</select></div>
       </div>
    </div>
  );
};
