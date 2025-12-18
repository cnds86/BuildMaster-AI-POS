
import React from 'react';
import { SystemSettings } from '../../types';
import { Percent, Banknote } from 'lucide-react';

interface FinancialSettingsProps {
  formData: SystemSettings;
  setFormData: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export const FinancialSettings: React.FC<FinancialSettingsProps> = ({ formData, setFormData }) => {
  const handleDenominationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     // Split by comma, filter non-numbers, sort descending
     const raw = e.target.value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n)).sort((a,b) => b-a);
     setFormData(prev => ({ ...prev, cashDenominations: raw }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Financials & Tax Configuration</h3>
      
      {/* Tax Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-6 mb-6">
         <div className="md:col-span-2">
            <h4 className="font-bold text-slate-700 mb-4 flex items-center">
               <Percent className="w-5 h-5 mr-2 text-slate-500" /> Tax Settings
            </h4>
         </div>
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tax Rate (%)</label>
            <input type="number" value={formData.tax.rate} onChange={e => setFormData({...formData, tax: { ...formData.tax, rate: parseFloat(e.target.value) || 0 }})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
         </div>
         <div className="flex items-center mt-6">
            <input type="checkbox" checked={formData.tax.enabled} onChange={e => setFormData({...formData, tax: { ...formData.tax, enabled: e.target.checked }})} className="w-4 h-4 text-primary-600 rounded" />
            <span className="ml-2 text-sm text-slate-700">Enable Tax Calculation</span>
         </div>
      </div>

      {/* Cash Denominations */}
      <div className="space-y-4">
         <div className="md:col-span-2">
            <h4 className="font-bold text-slate-700 mb-2 flex items-center">
               <Banknote className="w-5 h-5 mr-2 text-slate-500" /> Cash Denominations
            </h4>
            <p className="text-sm text-slate-500 mb-4">Define bills and coins for the cash drawer counter.</p>
         </div>
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Denominations (Comma Separated)</label>
            <input 
               type="text" 
               defaultValue={formData.cashDenominations?.join(', ') || '100000, 50000, 20000, 10000, 5000, 2000, 1000, 500'} 
               onBlur={handleDenominationsChange}
               className="w-full px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm" 
               placeholder="e.g. 1000, 500, 100, 20, 1"
            />
            <p className="text-xs text-slate-400 mt-1">Used for counting cash when closing a shift.</p>
         </div>
      </div>
    </div>
  );
};
