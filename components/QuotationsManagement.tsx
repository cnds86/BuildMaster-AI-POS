
import React, { useState } from 'react';
import { Quotation } from '../types';
import { Search, Plus } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { QuotationList } from './sales/QuotationList';
import { QuotationDetailModal } from './sales/QuotationDetailModal';
import { QuotationFormModal } from './sales/QuotationFormModal';
import { useSalesStore } from '../store/useSalesStore';

export const QuotationsManagement: React.FC = () => {
  const { 
    settings, 
    formatPrice, 
    products, 
    customers, 
    currentUser 
  } = useGlobal();
  
  const { quotations, addQuotation, updateQuotation } = useSalesStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  const filteredQuotations = quotations.filter(q => 
    q.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.customerName && q.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenCreate = () => {
    setEditingQuotation(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (quotation: Quotation) => {
    // Close detail view if open
    setSelectedQuotation(null);
    setEditingQuotation(quotation);
    setIsFormOpen(true);
  };

  const handleSaveQuotation = (data: any) => {
    const customer = customers.find(c => c.id === data.customerId);
    
    if (editingQuotation) {
       // Update existing
       const updatedQuote: Quotation = {
          ...editingQuotation,
          items: data.items,
          subtotal: data.subtotal,
          total: data.total,
          discountAmount: data.discountAmount || 0,
          taxAmount: data.taxAmount || 0,
          validUntil: data.validUntil,
          note: data.note,
          customerId: data.customerId,
          customerName: customer ? customer.name : 'Walk-in',
          customerAddress: customer?.address,
          customerPhone: customer?.phone
       };
       updateQuotation(updatedQuote);
    } else {
       // Create new
       const refNo = `QT-${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
       const newQuote: Quotation = {
          id: `q-${Date.now()}`,
          referenceNo: refNo,
          date: new Date().toISOString(),
          status: 'active',
          userId: currentUser?.id,
          userName: currentUser?.name,
          items: data.items,
          subtotal: data.subtotal,
          total: data.total,
          discountAmount: data.discountAmount || 0,
          taxAmount: data.taxAmount || 0,
          validUntil: data.validUntil,
          note: data.note,
          customerId: data.customerId,
          customerName: customer ? customer.name : 'Walk-in',
          customerAddress: customer?.address,
          customerPhone: customer?.phone
       };
       addQuotation(newQuote);
    }
    
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quotations</h2>
          <p className="text-slate-500">Create and manage price estimates for customers.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Quotation
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
           <label className="block text-xs font-medium text-slate-500 mb-1">Search Quotations</label>
           <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ref No. or Customer Name"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
           </div>
        </div>
      </div>

      <QuotationList 
        quotations={filteredQuotations}
        formatPrice={formatPrice}
        onViewQuotation={setSelectedQuotation}
      />

      <QuotationDetailModal 
        quotation={selectedQuotation}
        isOpen={!!selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        settings={settings}
        onEdit={() => selectedQuotation && handleOpenEdit(selectedQuotation)}
      />

      <QuotationFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        products={products}
        customers={customers}
        settings={settings}
        initialData={editingQuotation}
        onSubmit={handleSaveQuotation}
      />
    </div>
  );
};
