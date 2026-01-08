
import React, { useState, useEffect } from 'react';
import { Product, Branch } from '../../../types';
import { Store, Info, Calculator, ArrowRight } from 'lucide-react';

interface BranchPricingTabProps {
  formData: Partial<Product>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  branches: Branch[];
  currencySymbol: string;
}

export const BranchPricingTab: React.FC<BranchPricingTabProps> = ({ 
  formData, setFormData, branches, currencySymbol 
}) => {
  // Store the raw input string (e.g., "+10%", "50000") to allow editing formulas
  const [inputs, setInputs] = useState<Record<string, string>>({});

  // Initialize inputs from existing data
  useEffect(() => {
    const initialInputs: Record<string, string> = {};
    branches.forEach(branch => {
       const existing = formData.branchPrices?.find(bp => bp.branchId === branch.id);
       if (existing) {
          // If data exists, show the absolute price initially
          // (We can't reverse engineer if it was % or fixed previously without extra DB fields)
          initialInputs[branch.id] = existing.price.toString();
       } else {
          initialInputs[branch.id] = '';
       }
    });
    // Only set if inputs are empty to avoid overwriting user typing
    if (Object.keys(inputs).length === 0) {
        setInputs(initialInputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches]); 

  // Helper: Calculate final price based on logic
  const calculateFinalPrice = (basePrice: number, input: string): number | null => {
    if (!input) return null;
    const cleanInput = input.trim();
    
    try {
        // Case 1: Percentage Markup/Markdown (e.g., "+10%", "-5%")
        if (cleanInput.includes('%')) {
            const percentVal = parseFloat(cleanInput.replace('%', ''));
            if (isNaN(percentVal)) return null;
            
            // If strictly just "10%", treat as +10% markup? Or absolute? 
            // Usually in this context, % implies relation to base.
            // Let's handle explicit + or - for clarity, but default to markup if no sign?
            // Simple logic: Base + (Base * Percent / 100)
            // Note: If input is "-10%", parseFloat returns -10, so logic holds.
            return basePrice + (basePrice * percentVal / 100);
        }

        // Case 2: Fixed Addition/Subtraction (e.g., "+5000", "-2000")
        // We look for explicit '+' at start to treat as adder
        if (cleanInput.startsWith('+')) {
            const addVal = parseFloat(cleanInput.replace('+', ''));
            if (isNaN(addVal)) return null;
            return basePrice + addVal;
        }
        
        // Case 3: Absolute Price (e.g., "55000")
        const absVal = parseFloat(cleanInput);
        return isNaN(absVal) ? null : absVal;

    } catch (e) {
        return null;
    }
  };

  const handleInputChange = (branchId: string, value: string) => {
    // 1. Update UI state immediately
    setInputs(prev => ({ ...prev, [branchId]: value }));

    // 2. Calculate and Update Parent Data
    const basePrice = formData.price || 0;
    const calculated = calculateFinalPrice(basePrice, value);
    
    const currentBranchPrices = formData.branchPrices || [];
    const otherBranches = currentBranchPrices.filter(bp => bp.branchId !== branchId);

    if (calculated !== null && value !== '') {
       setFormData(prev => ({
          ...prev,
          branchPrices: [...otherBranches, { branchId, price: calculated }]
       }));
    } else {
       // Invalid or Empty -> Revert to Default
       setFormData(prev => ({
          ...prev,
          branchPrices: otherBranches
       }));
    }
  };

  const activeBranches = branches.filter(b => b.isActive);
  const basePrice = formData.price || 0;

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
      <div className="flex items-start justify-between mb-2">
         <div>
            <h4 className="font-bold text-slate-800 flex items-center">
               <Store className="w-5 h-5 mr-2 text-slate-500" /> 
               Branch Specific Pricing
            </h4>
            <p className="text-sm text-slate-500 mt-1">
               Set different selling prices. You can use <strong>Fixed Price</strong> (e.g. 55000), <strong>Markup</strong> (e.g. +5000), or <strong>Percentage</strong> (e.g. +10%).
            </p>
         </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
         <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
               <tr>
                  <th className="px-4 py-3 whitespace-nowrap w-[25%]">Branch Name</th>
                  <th className="px-4 py-3 whitespace-nowrap w-[20%]">Base Price</th>
                  <th className="px-4 py-3 whitespace-nowrap w-[30%]">Adjustment / Formula</th>
                  <th className="px-4 py-3 whitespace-nowrap w-[25%] text-right">Final Selling Price</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {activeBranches.length === 0 ? (
                  <tr>
                     <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                        No active branches found. Go to Branch Management to create branches.
                     </td>
                  </tr>
               ) : (
                  activeBranches.map(branch => {
                     const inputValue = inputs[branch.id] || '';
                     const finalPrice = formData.branchPrices?.find(bp => bp.branchId === branch.id)?.price;
                     const isModified = finalPrice !== undefined;
                     
                     // Determine style based on input type
                     const isFormula = inputValue.includes('%') || inputValue.startsWith('+') || inputValue.startsWith('-');

                     return (
                        <tr key={branch.id} className={`hover:bg-slate-50 transition-colors ${isModified ? 'bg-blue-50/20' : ''}`}>
                           <td className="px-4 py-3 font-medium text-slate-800">
                              {branch.name}
                              <div className="text-xs text-slate-400 font-normal truncate">{branch.address || 'No Address'}</div>
                           </td>
                           <td className="px-4 py-3 text-slate-500">
                              {currencySymbol} {basePrice.toLocaleString()}
                           </td>
                           <td className="px-4 py-3">
                              <div className="relative">
                                 {/* Helper Icon inside input */}
                                 {isFormula && (
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                                       <Calculator className="w-3.5 h-3.5" />
                                    </div>
                                 )}
                                 <input 
                                    type="text" 
                                    placeholder="e.g. +10% or 55000"
                                    value={inputValue} 
                                    onChange={(e) => handleInputChange(branch.id, e.target.value)}
                                    className={`w-full py-1.5 border rounded-lg text-sm outline-none transition-all font-medium ${
                                       isFormula ? 'pl-9 pr-3 border-blue-300 text-blue-700 bg-blue-50 focus:ring-2 focus:ring-blue-200' : 
                                       isModified ? 'px-3 border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-200' :
                                       'px-3 border-slate-200 text-slate-500 focus:ring-2 focus:ring-slate-200'
                                    }`}
                                 />
                              </div>
                           </td>
                           <td className="px-4 py-3 text-right">
                              {isModified ? (
                                 <div className="flex items-center justify-end gap-2">
                                    {isFormula && (
                                       <span className="text-[10px] text-slate-400 line-through mr-1 hidden sm:inline">
                                          {currencySymbol}{basePrice.toLocaleString()}
                                       </span>
                                    )}
                                    <span className="font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm whitespace-nowrap">
                                       {currencySymbol} {finalPrice?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </span>
                                 </div>
                              ) : (
                                 <span className="text-slate-400 text-xs italic bg-slate-100 px-2 py-1 rounded">
                                    Same as Base
                                 </span>
                              )}
                           </td>
                        </tr>
                     );
                  })
               )}
            </tbody>
         </table>
      </div>

      <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
         <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
         <div>
            <strong>How to use:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
               <li>Type a number (e.g., <code>60000</code>) to set a fixed price.</li>
               <li>Type <code>+10%</code> or <code>-5%</code> to calculate based on standard price.</li>
               <li>Type <code>+5000</code> to add a fixed amount to the standard price.</li>
            </ul>
         </div>
      </div>
    </div>
  );
};
