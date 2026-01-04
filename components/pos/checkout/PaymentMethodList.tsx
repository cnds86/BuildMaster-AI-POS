
import React from 'react';
import { Banknote, QrCode, CreditCard, FileText, X, Check } from 'lucide-react';
import { Customer } from '../../../types';
import { useGlobal } from '../../../context/GlobalContext';

interface PaymentMethodListProps {
  paymentMethod: 'cash' | 'card' | 'transfer' | 'qr' | 'credit';
  onSelect: (method: 'cash' | 'card' | 'transfer' | 'qr' | 'credit') => void;
  onClose: () => void;
  total: number;
  selectedCustomer: Customer | null;
  className?: string;
}

export const PaymentMethodList: React.FC<PaymentMethodListProps> = ({ 
  paymentMethod, onSelect, onClose, total, selectedCustomer, className 
}) => {
  const { formatPrice } = useGlobal();

  const methods = [
    { id: 'cash', icon: Banknote, label: 'Cash', sub: 'Instant Settlement', disabled: false },
    { id: 'qr', icon: QrCode, label: 'OnePay QR', sub: 'Mobile Banking', disabled: false },
    { id: 'card', icon: CreditCard, label: 'Card Terminal', sub: 'Credit / Debit', disabled: false },
    { id: 'credit', icon: FileText, label: 'Store Credit', sub: selectedCustomer ? 'Account Charge' : 'Customer Required', disabled: !selectedCustomer }
  ];

  return (
    <div className={`flex flex-col h-full ${className}`}>
        <div className="p-6 border-b border-slate-200 bg-white sm:bg-transparent flex justify-between items-center shrink-0">
            <h3 className="font-black text-xl text-slate-900 tracking-tight uppercase italic">Payment Method</h3>
            <button onClick={onClose} className="sm:hidden p-2 bg-slate-100 rounded-full text-slate-500">
               <X className="w-5 h-5" />
            </button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
            {methods.map((m) => (
                <button 
                  key={m.id}
                  onClick={() => !m.disabled && onSelect(m.id as any)} 
                  className={`w-full p-4 rounded-2xl border-2 flex items-center transition-all group relative overflow-hidden ${
                    m.disabled ? 'opacity-40 cursor-not-allowed border-transparent bg-slate-100 grayscale' :
                    paymentMethod === m.id 
                    ? `border-slate-900 bg-slate-900 text-white shadow-xl translate-x-1` 
                    : `border-white bg-white hover:border-slate-200 shadow-sm hover:shadow-md`
                  }`}
                >
                  <div className={`p-3 rounded-xl mr-4 transition-colors ${paymentMethod === m.id ? `bg-white/10 text-white` : 'bg-slate-50 text-slate-500 group-hover:text-slate-900'}`}>
                      <m.icon className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1">
                      <span className="font-bold text-sm uppercase tracking-tight block">{m.label}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${paymentMethod === m.id ? 'text-slate-400' : 'text-slate-400'}`}>{m.sub}</span>
                  </div>
                  {paymentMethod === m.id && <Check className="w-5 h-5 text-construction-orange"/>}
                </button>
            ))}
        </div>
        
        <div className="p-6 border-t border-slate-200 bg-white sm:bg-transparent mt-auto shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payable</p>
            <div className="text-3xl font-black text-slate-900 tracking-tighter">{formatPrice(total)}</div>
        </div>
    </div>
  );
};
