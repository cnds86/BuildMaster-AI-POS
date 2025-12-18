
import React from 'react';
import { Banknote, QrCode, CreditCard, FileText, X } from 'lucide-react';
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

  return (
    <div className={`w-full sm:w-1/3 bg-slate-50 border-r border-slate-200 flex-col ${className}`}>
        <div className="p-5 border-b border-slate-200 bg-white sm:bg-transparent flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">Payment Method</h3>
            <button onClick={onClose} className="sm:hidden p-2 bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {[
                { id: 'cash', icon: Banknote, label: 'Cash', color: 'blue' },
                { id: 'qr', icon: QrCode, label: 'OnePay / QR', color: 'blue' },
                { id: 'card', icon: CreditCard, label: 'Card / Transfer', color: 'blue' },
                { id: 'credit', icon: FileText, label: 'Credit / ติดหนี้', color: 'orange', sub: 'Members Only', disabled: !selectedCustomer }
            ].map((m) => (
                <button 
                key={m.id}
                onClick={() => !m.disabled && onSelect(m.id as any)} 
                className={`w-full p-4 rounded-xl border-2 flex items-center transition-all ${
                    m.disabled ? 'opacity-50 cursor-not-allowed border-slate-200 bg-white' :
                    paymentMethod === m.id 
                    ? `border-${m.color}-500 bg-white shadow-md` 
                    : `border-slate-200 bg-white hover:border-${m.color}-300`
                }`}
                >
                <div className={`p-3 rounded-full mr-4 ${paymentMethod === m.id ? `bg-${m.color}-100 text-${m.color}-600` : 'bg-slate-100 text-slate-500'}`}>
                    <m.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                    <span className="font-bold text-lg text-slate-700 block">{m.label}</span>
                    {m.sub && <span className="text-xs text-slate-400 font-medium">{m.sub}</span>}
                </div>
                </button>
            ))}
        </div>
        <div className="p-5 border-t border-slate-200 bg-white sm:bg-transparent">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Total Due</span>
                <span className="text-2xl font-bold text-slate-900">{formatPrice(total)}</span>
            </div>
        </div>
    </div>
  );
};
