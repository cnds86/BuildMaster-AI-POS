
import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDiscount: (discount: { type: 'percent' | 'fixed', value: number } | null) => void;
  currencySymbol?: string;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({ isOpen, onClose, onApplyDiscount, currencySymbol }) => {
  const [tempDiscount, setTempDiscount] = useState<{ type: 'percent' | 'fixed', value: number }>({ type: 'percent', value: 0 });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-fade-in">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-slate-800 flex items-center"><Tag className="w-5 h-5 mr-2 text-slate-500" /> Apply Discount</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5">
           <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setTempDiscount(prev => ({ ...prev, type: 'percent' }))} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${tempDiscount.type === 'percent' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Percent (%)</button>
              <button onClick={() => setTempDiscount(prev => ({ ...prev, type: 'fixed' }))} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${tempDiscount.type === 'fixed' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Fixed Amount ({currencySymbol})</button>
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{tempDiscount.type === 'fixed' ? 'Amount' : 'Percentage'}</label>
              <div className="relative">
                 <input type="number" min="0" step={tempDiscount.type === 'fixed' ? "0.01" : "1"} value={tempDiscount.value || ''} onChange={(e) => setTempDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))} className="w-full pl-4 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-2xl font-bold text-center" placeholder="0" autoFocus />
              </div>
           </div>
           <div className="flex space-x-3 pt-2">
              <button onClick={() => { onApplyDiscount(null); onClose(); }} className="flex-1 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors">Clear</button>
              <button onClick={() => { onApplyDiscount(tempDiscount); onClose(); }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">Apply Discount</button>
           </div>
        </div>
      </div>
    </div>
  );
};
