
import React from 'react';
import { Product } from '../../../types';

interface PricingTabProps {
  formData: Partial<Product>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currencySymbol: string;
}

export const PricingTab: React.FC<PricingTabProps> = ({ formData, handleInputChange, currencySymbol }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <label className="block text-sm font-bold text-slate-800 mb-2">Selling Price</label>
             <div className="relative"><span className="absolute left-3 top-2.5 text-slate-400 font-bold">{currencySymbol}</span><input type="number" name="price" min="0" step="0.01" value={formData.price} onChange={handleInputChange} className="w-full pl-8 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-lg font-bold" /></div>
          </div>
          <div>
             <label className="block text-sm font-bold text-slate-800 mb-2">Cost Price</label>
             <div className="relative"><span className="absolute left-3 top-2.5 text-slate-400 font-bold">{currencySymbol}</span><input type="number" name="costPrice" min="0" step="0.01" value={formData.costPrice} onChange={handleInputChange} className="w-full pl-8 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-lg" /></div>
          </div>
       </div>
    </div>
  );
};
