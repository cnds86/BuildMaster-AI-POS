
import React, { useState, useMemo, useEffect } from 'react';
import { Sale } from '../../types';
import { FileText, Ban, AlertTriangle, History, CheckCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface SalesListProps {
  sales: Sale[];
  formatPrice: (amount: number) => string;
  onViewSale: (sale: Sale) => void;
}

const ITEMS_PER_PAGE = 20;

export const SalesList: React.FC<SalesListProps> = ({ sales, formatPrice, onViewSale }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when the sales data (filters) change
  useEffect(() => {
    setCurrentPage(1);
  }, [sales]);

  const totalPages = Math.ceil(sales.length / ITEMS_PER_PAGE);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sales.slice(start, start + ITEMS_PER_PAGE);
  }, [sales, currentPage]);

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center w-full h-full">
          <FileText className="w-12 h-12 mb-2 opacity-20" />
          No sales found matching your filters.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date / ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Customer</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Items</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Total</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedSales.map((sale) => (
              <tr key={sale.id} className={`hover:bg-slate-50 transition-colors ${sale.type === 'return' ? 'bg-red-50/50' : ''}`}>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{new Date(sale.date).toLocaleDateString()}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{sale.id}</div>
                  {sale.type === 'return' && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">Refund</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-700">{sale.customerName || 'Walk-in Customer'}</div>
                  <div className="text-xs text-slate-500 capitalize">{sale.paymentMethod}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                    {sale.items.length} items
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-bold ${sale.type === 'return' ? 'text-red-600' : 'text-slate-800'}`}>
                  {formatPrice(Math.abs(sale.total))}
                </td>
                <td className="px-6 py-4 text-center">
                  {sale.status === 'voided' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      <Ban className="w-3 h-3 mr-1" /> Voided
                    </span>
                  ) : sale.paymentStatus === 'unpaid' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      <AlertTriangle className="w-3 h-3 mr-1" /> UNPAID
                    </span>
                  ) : sale.paymentStatus === 'partial' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                      <History className="w-3 h-3 mr-1" /> Partial
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" /> Paid
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onViewSale(sale)}
                    className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-100 bg-white flex justify-between items-center z-10 shrink-0">
           <button 
             onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
             disabled={currentPage === 1}
             className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center text-sm font-medium"
           >
             <ChevronLeft className="w-4 h-4 mr-1" /> Previous
           </button>
           
           <span className="text-sm font-medium text-slate-600">
              Page {currentPage} of {totalPages}
              <span className="text-slate-400 ml-2 text-xs">({sales.length} records)</span>
           </span>

           <button 
             onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
             disabled={currentPage === totalPages}
             className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center text-sm font-medium"
           >
             Next <ChevronRight className="w-4 h-4 ml-1" />
           </button>
        </div>
      )}
    </div>
  );
};
