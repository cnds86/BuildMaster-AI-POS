
import React, { useState, useMemo } from 'react';
import { Sale } from '../types';
import { Search, Receipt, Plus, Calendar, Filter } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { SalesList } from './sales/SalesList';
import { SaleDetailModal } from './sales/SaleDetailModal';
import { BackOfficeSaleModal } from './sales/BackOfficeSaleModal';

interface SalesHistoryProps {
  sales: Sale[];
  onVoidSale: (id: string) => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ sales = [], onVoidSale }) => {
  const { currentUser, settleSaleDebt, processReturn, settings, formatPrice, products, customers, processSale } = useGlobal();

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'voided' | 'unpaid'>('all');
  
  // Modal States
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isBackOfficeSaleOpen, setIsBackOfficeSaleOpen] = useState(false);

  const safeSales = sales || [];

  const filteredSales = useMemo(() => {
    return safeSales.filter(sale => {
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
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(sale.date) <= end;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [safeSales, searchTerm, startDate, endDate, statusFilter]);

  const handleVoid = () => {
    if (!selectedSale) return;
    if (confirm(`Are you sure you want to VOID Sale #${selectedSale.id}? This will restore items to stock automatically.`)) {
      onVoidSale(selectedSale.id);
      setSelectedSale(null);
    }
  };

  const handleSettleDebt = async (amount: number, method: string) => {
    if (!selectedSale) return;
    
    await settleSaleDebt(selectedSale.id, amount, method);
    
    // Update the selected sale object locally to reflect changes immediately in the modal
    setSelectedSale(prev => {
        if (!prev) return null;
        const newPaid = (prev.amountReceived || 0) + amount;
        const newRemaining = Math.max(0, (prev.remainingAmount || prev.total) - amount);
        return {
            ...prev, 
            amountReceived: newPaid, 
            remainingAmount: newRemaining,
            paymentStatus: newRemaining <= 0.01 ? 'paid' : 'partial'
        };
    });
  };

  const isAdminOrManager = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sales History</h2>
          <p className="text-slate-500">Manage invoices, credit sales, and void transactions.</p>
        </div>
        {isAdminOrManager && (
          <button 
            onClick={() => setIsBackOfficeSaleOpen(true)}
            className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold shadow-sm whitespace-nowrap"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Back Office Sale
          </button>
        )}
      </div>

      {/* Style A: Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4 print:hidden">
        <div className="flex-1 relative">
           <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
           <input
             type="text"
             placeholder="Search Invoice ID or Customer..."
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none font-medium transition-all"
           />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
           <div className="flex items-center bg-slate-100 rounded-xl px-4 py-2">
              <Calendar className="w-5 h-5 text-slate-400 mr-2" />
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="bg-transparent border-none text-slate-700 focus:ring-0 text-sm p-0 w-32" 
              />
              <span className="mx-2 text-slate-400">-</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="bg-transparent border-none text-slate-700 focus:ring-0 text-sm p-0 w-32" 
              />
           </div>

           <div className="relative min-w-[160px]">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl text-slate-700 focus:ring-2 focus:ring-slate-200 focus:outline-none appearance-none font-medium"
              >
                <option value="all">All Status</option>
                <option value="completed">Paid / Completed</option>
                <option value="unpaid">Unpaid / Credit</option>
                <option value="voided">Voided</option>
              </select>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
         <SalesList 
           sales={filteredSales} 
           formatPrice={formatPrice} 
           onViewSale={setSelectedSale} 
         />
      </div>

      <SaleDetailModal 
        sale={selectedSale}
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        onVoid={handleVoid}
        onSettleDebt={handleSettleDebt}
        onReturn={processReturn.bind(null, selectedSale!)} 
        settings={settings}
        formatPrice={formatPrice}
        isAdminOrManager={isAdminOrManager}
      />

      <BackOfficeSaleModal 
        isOpen={isBackOfficeSaleOpen}
        onClose={() => setIsBackOfficeSaleOpen(false)}
        products={products}
        customers={customers}
        onProcessSale={processSale}
      />
    </div>
  );
};
