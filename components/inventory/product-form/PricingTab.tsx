
import React from 'react';
import { Product, CustomerLevel } from '../../../types';
import { Tag, Calculator, Info, Percent } from 'lucide-react';

interface PricingTabProps {
  formData: Partial<Product>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currencySymbol: string;
  customerLevels?: CustomerLevel[];
}

export const PricingTab: React.FC<PricingTabProps> = ({ 
  formData, setFormData, handleInputChange, currencySymbol, customerLevels = [] 
}) => {
  
  // Helper to calculate discounted price for display preview
  const calculateDiscountedPrice = (percentage: number) => {
    const price = formData.price || 0;
    return price * (1 - percentage / 100);
  };

  return (
    <div className="space-y-6">
      {/* Standard Pricing Inputs */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
         <h4 className="font-bold text-slate-800 mb-4 flex items-center">
            <Tag className="w-5 h-5 mr-2 text-slate-500" /> Base Pricing
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-sm font-bold text-slate-800 mb-2">Standard Selling Price</label>
               <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">{currencySymbol}</span>
                  <input 
                    type="number" 
                    name="price" 
                    min="0" 
                    step="0.01" 
                    value={formData.price} 
                    onChange={handleInputChange} 
                    className="w-full pl-8 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-lg font-bold" 
                    placeholder="0.00"
                  />
               </div>
               <p className="text-xs text-slate-500 mt-1">This is the price for general customers (0% discount).</p>
            </div>
            <div>
               <label className="block text-sm font-bold text-slate-800 mb-2">Cost Price</label>
               <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">{currencySymbol}</span>
                  <input 
                    type="number" 
                    name="costPrice" 
                    min="0" 
                    step="0.01" 
                    value={formData.costPrice} 
                    onChange={handleInputChange} 
                    className="w-full pl-8 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-lg" 
                    placeholder="0.00"
                  />
               </div>
               <p className="text-xs text-slate-500 mt-1">Used for profit margin calculation.</p>
            </div>
         </div>
      </div>

      {/* Membership Discount Preview (Read Only) */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-fade-in">
         <div className="flex items-start justify-between mb-4">
            <div>
               <h4 className="font-bold text-slate-800 flex items-center">
                  <Percent className="w-5 h-5 mr-2 text-indigo-500" /> 
                  Membership Level Pricing (Preview)
               </h4>
               <p className="text-sm text-slate-500 mt-1">
                  The system automatically calculates these prices at checkout based on the customer's level.
               </p>
            </div>
            <div className="hidden md:block bg-white p-2 rounded-lg border border-slate-200 text-slate-400">
               <Calculator className="w-5 h-5" />
            </div>
         </div>
         
         {customerLevels.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-xl bg-white">
               No membership levels defined. Go to Customer Management to create levels.
            </div>
         ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                     <tr>
                        <th className="px-4 py-3">Membership Level</th>
                        <th className="px-4 py-3 text-center">Discount</th>
                        <th className="px-4 py-3 text-right">Calculated Price</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {customerLevels.map(level => {
                        const discountedPrice = calculateDiscountedPrice(level.discountPercentage);
                        return (
                           <tr key={level.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-slate-800 flex items-center">
                                 <div className="w-3 h-3 rounded-full mr-2 border border-slate-200 shadow-sm" style={{ backgroundColor: level.color || '#94a3b8' }}></div>
                                 {level.name}
                              </td>
                              <td className="px-4 py-3 text-center">
                                 {level.discountPercentage > 0 ? (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">
                                       -{level.discountPercentage}%
                                    </span>
                                 ) : (
                                    <span className="text-slate-400 text-xs">Standard</span>
                                 )}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-900">
                                 {currencySymbol} {discountedPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         )}
         
         <div className="mt-4 flex items-start gap-2 text-xs text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p>
               <strong>Note:</strong> To change discount percentages, go to <strong>Customer Management &gt; Membership Levels</strong>. 
               This table is a preview of how the current Base Price ({currencySymbol}{formData.price || 0}) interacts with those settings.
            </p>
         </div>
      </div>
    </div>
  );
};
