
import React, { useState, useMemo } from 'react';
import { 
  Warehouse, Product, StockTransfer, StockCount, StockReservation, StockReceipt, StockAdjustment, 
  DocumentStatus 
} from '../types';
import { Plus, ArrowRightLeft, CheckSquare, CalendarClock, Truck, SlidersHorizontal } from 'lucide-react';
import { StockNavigation } from './stock/StockNavigation';
import { StockList } from './stock/StockList';
import { StockDocumentModal } from './stock/StockDocumentModal';
import { ApprovalList } from './approval/ApprovalList';
import { useGlobal } from '../context/GlobalContext';

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
  const { currentUser } = useGlobal();
  const [activeTab, setActiveTab] = useState<'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment' | 'approvals'>('transfer');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({}); 

  const canApprove = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

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
      default: return common;
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
    if (!payload.referenceNo && activeTab !== 'approvals') {
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

  const handleComplete = (item: any) => {
    if (window.confirm('Confirm completion? This will update stock levels permanently.')) {
      onStatusChange(activeTab as any, item.id, 'Completed');
      if (isModalOpen) setIsModalOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this document?')) return;
    switch(activeTab) {
      case 'transfer': onDeleteTransfer(id); break;
      case 'count': onDeleteCount(id); break;
      case 'reservation': onDeleteReservation(id); break;
      case 'receipt': onDeleteReceipt(id); break;
      case 'adjustment': onDeleteAdjustment(id); break;
    }
  };

  // Approval Data Logic
  const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || id;

  const approvalItems = useMemo(() => {
    const list: any[] = [];
    
    // Transfers
    transfers.filter(i => i.status === 'Draft').forEach(item => {
      list.push({
        ...item,
        type: 'transfer',
        typeLabel: 'Transfer',
        icon: ArrowRightLeft,
        description: `Transfer from ${getWarehouseName(item.sourceWarehouseId)} to ${getWarehouseName(item.targetWarehouseId)}`,
        color: 'text-blue-600 bg-blue-50 border-blue-200'
      });
    });

    // Stock Counts
    counts.filter(i => i.status === 'Draft').forEach(item => {
      list.push({
        ...item,
        type: 'count',
        typeLabel: 'Audit',
        icon: CheckSquare,
        description: `Audit at ${getWarehouseName(item.warehouseId)} by ${item.counterName}`,
        color: 'text-purple-600 bg-purple-50 border-purple-200'
      });
    });

    // Reservations
    reservations.filter(i => i.status === 'Draft').forEach(item => {
      list.push({
        ...item,
        type: 'reservation',
        typeLabel: 'Reserve',
        icon: CalendarClock,
        description: `Reserved for ${item.customerName}`,
        meta: `Exp: ${new Date(item.expiryDate).toLocaleDateString()}`,
        color: 'text-orange-600 bg-orange-50 border-orange-200'
      });
    });

    // Receipts
    receipts.filter(i => i.status === 'Draft').forEach(item => {
      list.push({
        ...item,
        type: 'receipt',
        typeLabel: 'Receipt',
        icon: Truck,
        description: `Received from ${item.vendorName}`,
        meta: item.vendorInvoiceNo,
        color: 'text-green-600 bg-green-50 border-green-200'
      });
    });

    // Adjustments
    adjustments.filter(i => i.status === 'Draft').forEach(item => {
      list.push({
        ...item,
        type: 'adjustment',
        typeLabel: 'Adjust',
        icon: SlidersHorizontal,
        description: `Adjustment at ${getWarehouseName(item.warehouseId)}`,
        meta: item.reason,
        color: 'text-pink-600 bg-pink-50 border-pink-200'
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transfers, counts, reservations, receipts, adjustments, warehouses]);

  const handleApprove = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (window.confirm('Approve this request?')) {
      onStatusChange(item.type, item.id, 'Approved');
    }
  };

  const handleReject = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (window.confirm('Reject this request?')) {
      onStatusChange(item.type, item.id, 'Cancelled');
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
        
        {activeTab !== 'approvals' && (
          <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center justify-center px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold shadow-md active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Document
          </button>
        )}
      </div>

      <StockNavigation activeTab={activeTab} setActiveTab={setActiveTab} showApprovals={canApprove} />

      <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100">
        {activeTab === 'approvals' ? (
           <ApprovalList 
              items={approvalItems}
              onApprove={handleApprove}
              onReject={handleReject}
           />
        ) : (
           <StockList 
              activeTab={activeTab}
              items={getList()}
              warehouses={warehouses}
              onOpenModal={handleOpenModal}
              onComplete={handleComplete}
              onDelete={handleDelete}
           />
        )}
      </div>

      {activeTab !== 'approvals' && (
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
      )}
    </div>
  );
};
