
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Product } from '../../types';

interface LowStockAlertProps {
  products: Product[];
  t: (key: string) => string;
}

export const LowStockAlert: React.FC<LowStockAlertProps> = ({ products, t }) => {
  if (products.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 bg-red-100 border-b border-red-200 flex items-center justify-between">
        <h3 className="text-red-800 font-bold flex items-center text-sm uppercase tracking-wide">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {t('dashboard.critical')} ({products.length})
        </h3>
      </div>
      <div className="p-4 overflow-x-auto scrollbar-hide">
         <div className="flex space-x-4 pb-2">
           {products.map(p => (
             <div key={p.id} className="min-w-[200px] bg-white p-3 rounded-lg border border-red-100 shadow-sm flex flex-col group hover:border-red-300 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                   <span className="font-semibold text-slate-700 truncate w-32 text-sm" title={p.name}>{p.name}</span>
                   <span className="text-[10px] font-mono bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">
                      {p.sku}
                   </span>
                </div>
                <div className="flex justify-between items-end mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase">Current</span>
                    <span className="text-xl font-bold text-red-600">{p.stock}</span>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] text-slate-400 mb-0.5">Min: {p.minStock || 20}</span>
                     <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase font-bold">
                       {p.unit}
                     </span>
                  </div>
                </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};
