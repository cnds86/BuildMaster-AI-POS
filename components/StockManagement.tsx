
import React, { useState } from 'react';
import { 
  Warehouse, Product, StockTransfer, StockCount, StockReservation, StockReceipt, StockAdjustment, 
  DocumentStatus 
} from '../types';
import { Plus } from 'lucide-react';
import { useConfirm } from '@/components/common/Confirm';
import { StockNavigation } from './stock/StockNavigation';
import { StockList } from './stock/StockList';
import { StockDocumentModal } from './stock/StockDocumentModal';

interface StockManagementProps {
  warehouses: Warehouse[];
  products: Product[];
  transfers: StockTransfer[];
  counts: StockCount[];
  reservations: StockReservation[];
  receipts: StockReceipt[];
  adjustments: StockAdjustment[];
  defaultItemsPerPage: number;
  onUpdateTransfer: (t: StockTransfer) => void;
  onDeleteTransfer: (id: string) => void;
  onUpdateCount: (c: StockCount) => void;
  onDeleteCount: (id: string) => void;
  onUpdateReservation: (r: StockReservation) => void;
  onDeleteReservation: (id: string) => void;
  onUpdateReceipt: (r: StockReceipt) => void;
  onDeleteReceipt: (id: string) => void;
  onUpdateAdjustment: (a: StockAdjustment) => void;
  onDeleteAdjustment: (id: string) => void;
  onStatusChange: (type: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment', id: string, status: DocumentStatus) => void;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  warehouses, products, transfers, counts, reservations, receipts, adjustments,
  onUpdateTransfer, onDeleteTransfer,
  onUpdateCount, onDeleteCount,
  onUpdateReservation, onDeleteReservation,
  onUpdateReceipt, onDeleteReceipt,
  onUpdateAdjustment, onDeleteAdjustment,
  onStatusChange
}) => {
  const [activeTab, setActiveTab] = useState<'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment'>('transfer');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({}); 

  // Init form based on tab
  const initForm = () => {
    const common = {
      referenceNo: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      items: []
    };

    switch(activeTab) {
      case 'transfer': return { ...common, sourceWarehouseId: '', targetWarehouseId: '' };
      case 'count': return { ...common, warehouseId: '', counterName: '', reason: '' };
      case 'reservation': return { ...common, warehouseId: '', customerName: '', expiryDate: '' };
      case 'receipt': return { ...common, warehouseId: '', vendorName: '', vendorInvoiceNo: '', totalCost: 0 };
      case 'adjustment': return { ...common, warehouseId: '', reason: '' };
    }
  };

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ ...item });
    } else {
      setEditingId(null);
      setFormData(initForm());
    }
    setIsModalOpen(true);
  };

  const handleSave = (data: any) => {
    const id = editingId || (activeTab === 'transfer' ? `TR-${Date.now()}` : 
                             activeTab === 'count' ? `SC-${Date.now()}` :
                             activeTab === 'reservation' ? `RS-${Date.now()}` :
                             activeTab === 'receipt' ? `RC-${Date.now()}` :
                             `AD-${Date.now()}`);
    
    // Always save as Draft initially or preserve existing status if editing
    const currentStatus = data.status === 'Completed' || data.status === 'Approved' ? data.status : 'Draft';
    const payload = { ...data, id, status: currentStatus };

    // Auto-generate Ref No if missing
    if (!payload.referenceNo) {
        payload.referenceNo = `${activeTab.toUpperCase().slice(0,2)}-${new Date().getFullYear()}${new Date().getMonth()+1}-${Math.floor(Math.random()*1000)}`;
    }

    switch (activeTab) {
      case 'transfer': onUpdateTransfer(payload); break;
      case 'count': onUpdateCount(payload); break;
      case 'reservation': onUpdateReservation(payload); break;
      case 'receipt': onUpdateReceipt(payload); break;
      case 'adjustment': onUpdateAdjustment(payload); break;
    }
    setIsModalOpen(false);
  };

  const confirm = useConfirm();

  const handleComplete = async (item: any) => {
    const ok = await confirm({
      title: 'Confirm Completion',
      message: 'This will update stock levels permanently. Continue?',
      confirmText: 'Complete',
      variant: 'warning',
    });
    if (!ok) return;
    onStatusChange(activeTab, item.id, 'Completed');
    if (isModalOpen) setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Document',
      message: 'This document will be permanently removed. This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    switch(activeTab) {
      case 'transfer': onDeleteTransfer(id); break;
      case 'count': onDeleteCount(id); break;
      case 'reservation': onDeleteReservation(id); break;
      case 'receipt': onDeleteReceipt(id); break;
      case 'adjustment': onDeleteAdjustment(id); break;
    }
  };

  const getList = () => {
    switch(activeTab) {
      case 'transfer': return transfers;
      case 'count': return counts;
      case 'reservation': return reservations;
      case 'receipt': return receipts;
      case 'adjustment': return adjustments;
      default: return [];
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Stock Management</h2>
          <p className="text-slate-500 text-sm md:text-base">Manage stock movements, counts, and adjustments.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center justify-center px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Document
        </button>
      </div>

      <StockNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100">
        <StockList 
          activeTab={activeTab}
          items={getList()}
          warehouses={warehouses}
          onOpenModal={handleOpenModal}
          onComplete={handleComplete}
          onDelete={handleDelete}
        />
      </div>

      <StockDocumentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeTab={activeTab}
        editingId={editingId}
        initialData={formData}
        warehouses={warehouses}
        products={products}
        onSave={handleSave}
        onComplete={handleComplete}
      />
    </div>
  );
};
