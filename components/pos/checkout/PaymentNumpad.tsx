
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useGlobal } from '../../../context/GlobalContext';

interface PaymentNumpadProps {
  receivedAmountStr: string;
  setReceivedAmountStr: React.Dispatch<React.SetStateAction<string>>;
  total: number;
  change: number;
  handleQuickCash: (amount: number) => void;
}

export const PaymentNumpad: React.FC<PaymentNumpadProps> = ({ 
  receivedAmountStr, setReceivedAmountStr, total, change, handleQuickCash 
}) => {
  const { formatPrice } = useGlobal();
  const receivedAmount = parseFloat(receivedAmountStr) || 0;

  const handleNumPadClick = (val: string) => {
    if (val === 'C') setReceivedAmountStr('');
    else if (val === 'BS') setReceivedAmountStr(prev => prev.slice(0, -1));
    else if (val === '.') {
      if (!receivedAmountStr.includes('.')) setReceivedAmountStr(prev => (prev === '' ? '0' : prev) + '.');
    } else {
      setReceivedAmountStr(prev => (prev === '0' ? val : prev + val));
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-4 text-right shadow-inner relative">
            <span className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-wide">Amount Received</span>
            <div className={`text-6xl font-bold tracking-tight ${receivedAmountStr ? 'text-slate-900' : 'text-slate-300'}`}>
                {receivedAmountStr ? formatPrice(parseFloat(receivedAmountStr)) : formatPrice(0)}
            </div>
        </div>
        <div className="flex justify-between items-end mb-6 px-2">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Change Due</p>
                <p className={`text-4xl font-bold ${change > 0 ? 'text-green-600' : 'text-slate-300'}`}>{formatPrice(change)}</p>
            </div>
            {(total - receivedAmount) > 0 && (
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Remaining</p>
                    <p className="text-2xl font-bold text-red-500">{formatPrice(total - receivedAmount)}</p>
                </div>
            )}
        </div>
        <div className="flex-1 flex gap-3 flex-1 min-h-0">
            <div className="grid grid-cols-3 gap-3 flex-[3] content-start">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '00', 0, 'BS'].map((btn) => (
                    <button
                    key={btn}
                    onClick={() => handleNumPadClick(btn.toString())}
                    className="bg-white border border-slate-200 rounded-xl text-2xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-sm flex items-center justify-center"
                    >
                    {btn === 'BS' ? <ArrowLeft className="w-8 h-8" /> : btn}
                    </button>
                ))}
            </div>
            <div className="flex flex-col gap-3 flex-1">
                <button onClick={() => handleQuickCash(Math.ceil(total))} className="flex-1 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-100 hover:bg-blue-100 transition-all text-sm shadow-sm">Exact</button>
                {[10000, 20000, 50000, 100000].map(val => (
                    <button key={val} onClick={() => handleQuickCash(val)} className="flex-1 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-xs shadow-sm">
                    {val/1000}k
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};
