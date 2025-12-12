
import React, { useState, useMemo } from 'react';
import { Sale, CartItem } from '../types';
import { 
  Search, 
  Calendar, 
  Filter, 
  Eye, 
  RotateCcw, 
  Ban, 
  Printer, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  History,
  DollarSign,
  Wallet
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

interface SalesHistoryProps {
  sales: Sale[];
  onVoidSale: (id: string) => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ sales, onVoidSale }) => {
  const { currentUser, settleSaleDebt } = useGlobal();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'voided' | 'unpaid'>('all');
  
  // Modal State
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isSettleOpen, setIsSettleOpen] = useState(false);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = 
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesStatus = true;
      if (statusFilter === 'completed') matchesStatus = sale.status === 'completed' && sale.paymentStatus === 'paid';
      else if (statusFilter === 'unpaid') matchesStatus = sale.paymentStatus === 'unpaid' || sale.paymentStatus === 'partial';
      else if (statusFilter === 'voided') matchesStatus = sale.status === 'voided';
      
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && new Date(sale.date) >= new Date(startDate);
      }
      if (endDate) {
        // End of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(sale.date) <= end;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [sales, searchTerm, startDate, endDate, statusFilter]);

  const handleVoid = () => {
    if (!selectedSale) return;
    if (confirm(`Are you sure you want to VOID Sale #${selectedSale.id}? This will restore items to stock automatically.`)) {
      onVoidSale(selectedSale.id);
      setSelectedSale(null);
    }
  };

  const handleSettleDebt = async () => {
    if (!selectedSale) return;
    // For simplicity, settle full amount. In a real app, you could have a partial settle modal.
    const debt = selectedSale.remainingAmount || selectedSale.total;
    if (confirm(`Confirm full payment of $${debt.toFixed(2)} for this invoice?`)) {
       await settleSaleDebt(selectedSale.id, debt, 'cash');
       setIsSettleOpen(false);
       // Refresh or close modal logic handled by context update
       setSelectedSale(prev => prev ? ({...prev, paymentStatus: 'paid', remainingAmount: 0, amountReceived: (prev.amountReceived || 0) + debt}) : null); 
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isAdminOrManager = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sales History & Audit</h2>
          <p className="text-slate-500">Manage invoices, credit sales, and void transactions.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
           <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
           <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Invoice ID or Customer Name"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
           </div>
        </div>
        
        <div>
           <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
           <input
             type="date"
             value={startDate}
             onChange={e => setStartDate(e.target.value)}
             className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
           />
        </div>
        
        <div>
           <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
           <input
             type="date"
             value={endDate}
             onChange={e => setEndDate(e.target.value)}
             className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
           />
        </div>

        <div>
           <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
           <select
             value={statusFilter}
             onChange={e => setStatusFilter(e.target.value as any)}
             className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white min-w-[120px]"
           >
             <option value="all">All Status</option>
             <option value="completed">Paid / Completed</option>
             <option value="unpaid">Unpaid / Credit</option>
             <option value="voided">Voided</option>
           </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
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
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No sales found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{new Date(sale.date).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{sale.id}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{new Date(sale.date).toLocaleTimeString()}</div>
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
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      ${sale.total.toFixed(2)}
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
                        onClick={() => setSelectedSale(sale)}
                        className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                 <h3 className="text-xl font-bold text-slate-800">Invoice Details</h3>
                 <p className="text-sm text-slate-500 font-mono">#{selectedSale.id}</p>
              </div>
              <div className="flex items-center space-x-2">
                 {selectedSale.status === 'voided' && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wide flex items-center">
                       <RotateCcw className="w-3 h-3 mr-1" /> Stock Restored
                    </span>
                 )}
                 <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-600">
                   <XCircle className="w-6 h-6" />
                 </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
               <div className="flex justify-between mb-4 text-sm">
                  <div className="text-slate-500">
                     <p>Date: <span className="font-medium text-slate-700">{new Date(selectedSale.date).toLocaleString()}</span></p>
                     <p>Customer: <span className="font-medium text-slate-700">{selectedSale.customerName || 'Walk-in'}</span></p>
                  </div>
                  <div className="text-right text-slate-500">
                     <p>Method: <span className="font-medium text-slate-700 capitalize">{selectedSale.paymentMethod}</span></p>
                     <p>Status: <span className={`font-bold capitalize ${selectedSale.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>{selectedSale.paymentStatus || 'Paid'}</span></p>
                  </div>
               </div>

               <div className="border rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-sm">
                     <thead className="bg-slate-50 text-slate-500">
                        <tr>
                           <th className="px-4 py-2 text-left">Item</th>
                           <th className="px-4 py-2 text-right">Qty</th>
                           <th className="px-4 py-2 text-right">Price</th>
                           <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {selectedSale.items.map((item, idx) => (
                           <tr key={idx}>
                              <td className="px-4 py-2">
                                 <div className="font-medium text-slate-800">{item.name}</div>
                                 {item.selectedVariantId && <div className="text-xs text-slate-400">Variant</div>}
                              </td>
                              <td className="px-4 py-2 text-right">{item.quantity}</td>
                              <td className="px-4 py-2 text-right">${item.sellPrice.toFixed(2)}</td>
                              <td className="px-4 py-2 text-right font-bold">${(item.sellPrice * item.quantity).toFixed(2)}</td>
                           </tr>
                        ))}
                     </tbody>
                     <tfoot className="bg-slate-50 font-bold text-slate-800">
                        <tr>
                           <td colSpan={3} className="px-4 py-3 text-right">Subtotal</td>
                           <td className="px-4 py-3 text-right">${(selectedSale.subtotal || selectedSale.total).toFixed(2)}</td>
                        </tr>
                        {selectedSale.discountAmount && selectedSale.discountAmount > 0 && (
                           <tr className="text-green-600">
                              <td colSpan={3} className="px-4 py-1 text-right">Discount</td>
                              <td className="px-4 py-1 text-right">-${selectedSale.discountAmount.toFixed(2)}</td>
                           </tr>
                        )}
                        <tr className="border-t border-slate-200">
                           <td colSpan={3} className="px-4 py-3 text-right text-lg">Grand Total</td>
                           <td className="px-4 py-3 text-right text-lg">${selectedSale.total.toFixed(2)}</td>
                        </tr>
                        {/* Breakdown for Partial/Credit */}
                        {selectedSale.paymentMethod === 'credit' && (
                           <>
                              <tr className="text-slate-600 font-normal">
                                 <td colSpan={3} className="px-4 py-1 text-right">Paid Amount</td>
                                 <td className="px-4 py-1 text-right text-green-600">-${(selectedSale.amountReceived || 0).toFixed(2)}</td>
                              </tr>
                              <tr className="bg-orange-50 text-orange-800 border-t border-orange-200">
                                 <td colSpan={3} className="px-4 py-2 text-right text-sm">Remaining Debt</td>
                                 <td className="px-4 py-2 text-right font-bold">${(selectedSale.remainingAmount || 0).toFixed(2)}</td>
                              </tr>
                           </>
                        )}
                     </tfoot>
                  </table>
               </div>

               {/* Debt Settlement Actions */}
               {(selectedSale.paymentStatus === 'unpaid' || selectedSale.paymentStatus === 'partial') && selectedSale.status !== 'voided' && (
                  <div className="mb-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
                     <h4 className="font-bold text-orange-800 text-sm mb-2 flex items-center">
                        <Wallet className="w-4 h-4 mr-2" /> 
                        Outstanding Payment
                     </h4>
                     <p className="text-xs text-orange-700 mb-3">
                        This invoice has an outstanding balance of <span className="font-bold">${(selectedSale.remainingAmount || 0).toFixed(2)}</span>.
                     </p>
                     <button
                        onClick={handleSettleDebt}
                        className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 shadow-sm flex items-center justify-center"
                     >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Settle Debt (Receive Full Payment)
                     </button>
                  </div>
               )}

               {selectedSale.status !== 'voided' && isAdminOrManager && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start">
                     <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                     <div>
                        <h4 className="font-bold text-red-800 text-sm">Void Transaction</h4>
                        <p className="text-xs text-red-600 mt-1">
                           Voiding this sale will automatically return all items to inventory. The invoice will be marked as Cancelled.
                        </p>
                        <button 
                           onClick={handleVoid}
                           className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-red-700 shadow-sm"
                        >
                           Void & Restore Stock
                        </button>
                     </div>
                  </div>
               )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 rounded-b-xl">
               <button 
                  onClick={handlePrint}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 flex items-center shadow-sm"
               >
                  <Printer className="w-4 h-4 mr-2" />
                  Reprint Bill
               </button>
               <button 
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900"
               >
                  Close
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
