
import React from 'react';
import { DollarSign, Users, Package } from 'lucide-react';
import { EmptyState } from '../ux';
import { isLowStock } from '../../utils/inventory';

interface InventoryValuationProps {
  data: {
    reportItems: any[];
    totalStockValue: number;
    totalRetailValue: number;
  };
  mode: 'inventory' | 'low-stock';
  formatPrice: (val: number) => string;
}

export const InventoryValuation: React.FC<InventoryValuationProps> = ({ data, mode, formatPrice }) => {
  const { reportItems, totalStockValue, totalRetailValue } = data;
  
  // Filter for low stock if mode matches
  const displayItems = mode === 'low-stock' 
    ? reportItems.filter(isLowStock)
    : reportItems;

  return (
     <div className="space-y-6 animate-fade-in">
        {mode === 'inventory' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <p className="text-sm text-slate-500 font-medium">Inventory Valuation (Cost)</p>
                       <h3 className="text-3xl font-bold text-slate-800">{formatPrice(totalStockValue)}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                       <DollarSign className="w-6 h-6" />
                    </div>
                 </div>
                 <p className="text-xs text-slate-400">Total value of assets based on cost price.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <p className="text-sm text-slate-500 font-medium">Potential Retail Value</p>
                       <h3 className="text-3xl font-bold text-green-600">{formatPrice(totalRetailValue)}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-green-600">
                       <Users className="w-6 h-6" />
                    </div>
                 </div>
                 <p className="text-xs text-slate-400">Projected revenue if all stock is sold.</p>
              </div>
           </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-700">
                 {mode === 'low-stock' ? 'Low Stock Alerts' : 'Detailed Inventory Asset Report'}
              </h3>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                    <tr>
                       <th className="px-6 py-3">Product Name</th>
                       <th className="px-6 py-3 text-right">Stock Level</th>
                       <th className="px-6 py-3 text-right">Cost Price</th>
                       <th className="px-6 py-3 text-right">Selling Price</th>
                       <th className="px-6 py-3 text-right">Total Asset Value</th>
                       {mode === 'inventory' && <th className="px-6 py-3 text-right">Margin</th>}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 text-sm">
                    {displayItems.map((item) => (
                       <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                             <div className="font-medium text-slate-800">{item.name}</div>
                             <div className="text-xs text-slate-500">{item.sku}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className={`font-bold ${isLowStock(item) ? 'text-red-600' : 'text-slate-700'}`}>
                                {item.stock} {item.unit}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-slate-600">{formatPrice(item.costPrice || 0)}</td>
                          <td className="px-6 py-4 text-right font-mono text-slate-600">{formatPrice(item.price)}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-800">{formatPrice(item.stockValue)}</td>
                          {mode === 'inventory' && (
                             <td className="px-6 py-4 text-right">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.margin > 30 ? 'bg-green-100 text-green-700' : item.margin > 15 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                   {item.margin.toFixed(1)}%
                                </span>
                             </td>
                          )}
                       </tr>
                    ))}
                    {displayItems.length === 0 && (
                        <tr><td colSpan={6}><EmptyState icon={Package} compact title={mode === 'low-stock' ? 'No low-stock items' : 'No inventory items'} description={mode === 'low-stock' ? 'All products are above their minimum stock threshold.' : 'Add products to see valuation and margin analysis.'} /></td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
     </div>
  );
};
