
import React from 'react';
import { SystemSettings } from '../../types';
import { Percent, Banknote, Coins } from 'lucide-react';

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

  // Ensure rounding object exists with defaults
  const rounding = formData.rounding || { enabled: true, interval: 500, displayOnReceipt: true };

  const updateRounding = (key: string, value: any) => {
     setFormData(prev => ({
        ...prev,
        rounding: { 
            ...(prev.rounding || { enabled: true, interval: 500, displayOnReceipt: true }), 
            [key]: value 
        }
     }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Financials & Tax Configuration</h3>
      
      {/* Tax Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-8">
         <div className="md:col-span-2">
            <h4 className="font-bold text-slate-700 mb-2 flex items-center">
               <Percent className="w-5 h-5 mr-2 text-blue-600" /> Tax Settings
            </h4>
            <p className="text-sm text-slate-500 mb-4">Configure VAT or Sales Tax calculations.</p>
         </div>
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tax Rate (%)</label>
            <input type="number" min="0" max="100" step="0.01" value={formData.tax.rate} onChange={e => {
              const raw = parseFloat(e.target.value);
              const clamped = isNaN(raw) ? 0 : Math.min(100, Math.max(0, raw));
              setFormData({...formData, tax: { ...formData.tax, rate: clamped }});
           }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
         </div>
         <div className="flex flex-col gap-3 justify-center">
            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
               <input type="checkbox" checked={formData.tax.enabled} onChange={e => setFormData({...formData, tax: { ...formData.tax, enabled: e.target.checked }})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
               <span className="text-sm text-slate-700 font-bold">Enable Tax Calculation</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
               <input type="checkbox" checked={formData.tax.displayOnReceipt} onChange={e => setFormData({...formData, tax: { ...formData.tax, displayOnReceipt: e.target.checked }})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
               <span className="text-sm text-slate-700 font-bold">Show Tax on Receipt</span>
            </label>
         </div>
      </div>

      {/* Rounding Section (Added) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-8">
         <div className="md:col-span-2">
            <h4 className="font-bold text-slate-700 mb-2 flex items-center">
               <Coins className="w-5 h-5 mr-2 text-orange-600" /> Currency Rounding
            </h4>
            <p className="text-sm text-slate-500 mb-4">Manage how decimal amounts are handled at checkout.</p>
         </div>
         
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rounding Interval</label>
            <select 
               value={rounding.interval} 
               onChange={e => updateRounding('interval', parseInt(e.target.value))} 
               className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500"
               disabled={!rounding.enabled}
            >
               <option value={1}>1 (Exact Amount)</option>
               <option value={100}>100</option>
               <option value={500}>500 (Standard)</option>
               <option value={1000}>1,000</option>
            </select>
            <p className="text-xs text-slate-400 mt-2">Example: 2,900 becomes 3,000 (if set to 500)</p>
         </div>

         <div className="flex flex-col gap-3 justify-center">
            {/* Enable Toggle */}
            <label className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-colors ${rounding.enabled ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
               <input 
                  type="checkbox" 
                  checked={rounding.enabled} 
                  onChange={e => updateRounding('enabled', e.target.checked)} 
                  className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" 
               />
               <div>
                  <span className={`block text-sm font-bold ${rounding.enabled ? 'text-orange-900' : 'text-slate-700'}`}>Enable Rounding</span>
                  <span className="block text-xs text-slate-500">Calculates rounding difference automatically</span>
               </div>
            </label>
            
            {/* Show on Receipt Toggle */}
            <label className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-all ${!rounding.enabled ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-orange-300'}`}>
               <input 
                  type="checkbox" 
                  checked={rounding.displayOnReceipt} 
                  onChange={e => updateRounding('displayOnReceipt', e.target.checked)} 
                  disabled={!rounding.enabled} 
                  className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" 
               />
               <div>
                  <span className="block text-sm font-bold text-slate-700">Show on Receipt</span>
                  <span className="block text-xs text-slate-500">Print the "Rounding" line on customer slips</span>
               </div>
            </label>
         </div>
      </div>

      {/* Cash Denominations */}
      <div className="space-y-4">
         <div className="md:col-span-2">
            <h4 className="font-bold text-slate-700 mb-2 flex items-center">
               <Banknote className="w-5 h-5 mr-2 text-green-600" /> Cash Denominations
            </h4>
            <p className="text-sm text-slate-500 mb-4">Define available bills/coins for the shift closing counter.</p>
         </div>
         <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Denominations (Comma Separated)</label>
            <input 
               type="text" 
               defaultValue={formData.cashDenominations?.join(', ') || '100000, 50000, 20000, 10000, 5000, 2000, 1000, 500'} 
               onBlur={handleDenominationsChange}
               className="w-full px-4 py-2 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500" 
               placeholder="e.g. 1000, 500, 100, 20, 1"
            />
         </div>
      </div>
    </div>
  );
};
