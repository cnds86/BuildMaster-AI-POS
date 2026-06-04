
import React from 'react';
import { EmptyState } from '../ux';
import { BarChart2 } from 'lucide-react';

interface TopProductsTableProps {
  products: any[];
  title: string;
  labels: { name: string; qty: string; revenue: string };
  formatPrice: (val: number) => string;
}

export const TopProductsTable: React.FC<TopProductsTableProps> = ({ products, title, labels, formatPrice }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
       <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button className="text-sm text-sky-600 font-medium hover:underline">View Sales Report</button>
       </div>
       <div className="overflow-x-auto">
         <table className="w-full text-left">
           <thead className="bg-slate-50 border-b border-slate-100">
             <tr>
               <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider pl-6">{labels.name}</th>
               <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{labels.qty}</th>
               <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-6">{labels.revenue}</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {products.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <EmptyState
                      icon={BarChart2}
                      compact
                      title="No sales data for this period"
                      description="Try a wider date range to see your top-selling products and revenue."
                    />
                  </td>
                </tr>
             ) : (
                products.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 pl-6">
                       <div className="flex items-center">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold mr-3 group-hover:bg-sky-100 group-hover:text-sky-600 transition-colors">
                             {idx + 1}
                          </span>
                          <span className="font-medium text-slate-700">{p.name}</span>
                       </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 font-mono text-sm">
                       {Math.round(p.qty)} <span className="text-[10px] text-slate-400 ml-1">{p.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800 pr-6">
                       {formatPrice(p.revenue)}
                    </td>
                  </tr>
                ))
             )}
           </tbody>
         </table>
       </div>
    </div>
  );
};
