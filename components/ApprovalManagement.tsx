
import React, { useMemo, useState } from 'react';
import {
  StockTransfer,
  StockCount,
  StockReservation,
  StockReceipt,
  StockAdjustment,
  DocumentStatus,
  Warehouse,
  Expense,
  Promotion
} from '../types';
import {
  ArrowRightLeft,
  CheckSquare,
  CalendarClock,
  Truck,
  Clock,
  SlidersHorizontal,
  CheckCircle,
  Receipt,
  Tag
} from 'lucide-react';
import { useToast } from './toast/ToastContext';
import { ApprovalList } from './approval/ApprovalList';
import { StockDocumentModal } from './stock/StockDocumentModal';
import { useGlobal } from '../context/GlobalContext';

const API = import.meta.env.VITE_API_URL || '';

interface ApprovalManagementProps {
  transfers: StockTransfer[];
  counts: StockCount[];
  reservations: StockReservation[];
  receipts: StockReceipt[];
  adjustments: StockAdjustment[];
  warehouses: Warehouse[];
  onStatusChange: (type: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment', id: string, status: DocumentStatus) => void;
}

export const ApprovalManagement: React.FC<ApprovalManagementProps> = ({
  transfers,
  counts,
  reservations,
  receipts,
  adjustments,
  warehouses,
  onStatusChange
}) => {
  const {
    products,
    updateTransfer,
    updateCount,
    updateReservation,
    updateReceipt,
    updateAdjustment,
    expenses,
    promotions,
    updateExpense,
    updatePromotion,
    expenseCategories
  } = useGlobal();
  const { addToast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment' | 'expense' | 'promotion'>('transfer');
  const [statusFilter, setStatusFilter] = useState<'Draft' | 'Approved'>('Draft');

  const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || id;
  const getCategoryName = (id: string) => expenseCategories.find(c => c.id === id)?.name || id;

  // Flatten and normalize data for the list
  const pendingItems = useMemo(() => {
    const list: any[] = [];

    // ── Stock documents ──────────────────────────────────────────
    if (statusFilter === 'Draft') {
      list.push(...transfers.filter(i => i.status === 'Draft').map(item => ({
        ...item,
        type: 'transfer' as const,
        typeLabel: 'Stock Transfer',
        icon: ArrowRightLeft,
        description: `Transfer from ${getWarehouseName(item.sourceWarehouseId)} to ${getWarehouseName(item.targetWarehouseId)}`,
        color: 'text-blue-600 bg-blue-50 border-blue-200'
      })));
      list.push(...counts.filter(i => i.status === 'Draft').map(item => ({
        ...item,
        type: 'count' as const,
        typeLabel: 'Stock Audit',
        icon: CheckSquare,
        description: `Audit at ${getWarehouseName(item.warehouseId)} by ${item.counterName}`,
        color: 'text-purple-600 bg-purple-50 border-purple-200'
      })));
      list.push(...reservations.filter(i => i.status === 'Draft').map(item => ({
        ...item,
        type: 'reservation' as const,
        typeLabel: 'Reservation',
        icon: CalendarClock,
        description: `Reserved for ${item.customerName}`,
        meta: `Exp: ${new Date(item.expiryDate).toLocaleDateString()}`,
        color: 'text-orange-600 bg-orange-50 border-orange-200'
      })));
      list.push(...receipts.filter(i => i.status === 'Draft').map(item => ({
        ...item,
        type: 'receipt' as const,
        typeLabel: 'Goods Receipt',
        icon: Truck,
        description: `Received from ${item.vendorName}`,
        meta: item.vendorInvoiceNo ? `Inv: ${item.vendorInvoiceNo}` : undefined,
        color: 'text-green-600 bg-green-50 border-green-200'
      })));
      list.push(...adjustments.filter(i => i.status === 'Draft').map(item => ({
        ...item,
        type: 'adjustment' as const,
        typeLabel: 'Stock Adjustment',
        icon: SlidersHorizontal,
        description: `Adjustment at ${getWarehouseName(item.warehouseId)}`,
        meta: item.reason,
        color: 'text-pink-600 bg-pink-50 border-pink-200'
      })));

      // ── Expenses ──────────────────────────────────────────────
      list.push(...expenses.filter(e => e.approvalStatus === 'pending').map(item => ({
        ...item,
        type: 'expense' as const,
        typeLabel: 'Expense',
        icon: Receipt,
        description: item.description,
        meta: item.categoryName || getCategoryName(item.categoryId),
        color: 'text-red-600 bg-red-50 border-red-200',
        categoryName: item.categoryName || getCategoryName(item.categoryId),
        paymentMethod: item.paymentMethod,
        referenceNo: item.referenceNo || item.id,
        date: item.date,
      })));

      // ── Promotions ────────────────────────────────────────────
      list.push(...promotions.filter(p => p.approvalStatus === 'pending').map(item => ({
        ...item,
        type: 'promotion' as const,
        typeLabel: 'Promotion',
        icon: Tag,
        description: item.title,
        meta: item.type,
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        promotionType: item.type,
        promotionValue: item.value,
        isActive: item.isActive,
        referenceNo: item.id,
        date: item.startDate || new Date().toISOString(),
      })));

    } else {
      // Approved items — ready to complete (stock docs only)
      list.push(...transfers.filter(i => i.status === 'Approved').map(item => ({
        ...item,
        type: 'transfer' as const,
        typeLabel: 'Stock Transfer',
        icon: ArrowRightLeft,
        description: `Transfer from ${getWarehouseName(item.sourceWarehouseId)} to ${getWarehouseName(item.targetWarehouseId)}`,
        color: 'text-blue-600 bg-blue-50 border-blue-200'
      })));
      list.push(...counts.filter(i => i.status === 'Approved').map(item => ({
        ...item,
        type: 'count' as const,
        typeLabel: 'Stock Audit',
        icon: CheckSquare,
        description: `Audit at ${getWarehouseName(item.warehouseId)} by ${item.counterName}`,
        color: 'text-purple-600 bg-purple-50 border-purple-200'
      })));
      list.push(...reservations.filter(i => i.status === 'Approved').map(item => ({
        ...item,
        type: 'reservation' as const,
        typeLabel: 'Reservation',
        icon: CalendarClock,
        description: `Reserved for ${item.customerName}`,
        meta: `Exp: ${new Date(item.expiryDate).toLocaleDateString()}`,
        color: 'text-orange-600 bg-orange-50 border-orange-200'
      })));
      list.push(...receipts.filter(i => i.status === 'Approved').map(item => ({
        ...item,
        type: 'receipt' as const,
        typeLabel: 'Goods Receipt',
        icon: Truck,
        description: `Received from ${item.vendorName}`,
        meta: item.vendorInvoiceNo ? `Inv: ${item.vendorInvoiceNo}` : undefined,
        color: 'text-green-600 bg-green-50 border-green-200'
      })));
      list.push(...adjustments.filter(i => i.status === 'Approved').map(item => ({
        ...item,
        type: 'adjustment' as const,
        typeLabel: 'Stock Adjustment',
        icon: SlidersHorizontal,
        description: `Adjustment at ${getWarehouseName(item.warehouseId)}`,
        meta: item.reason,
        color: 'text-pink-600 bg-pink-50 border-pink-200'
      })));

      // Approved expenses
      list.push(...expenses.filter(e => e.approvalStatus === 'approved').map(item => ({
        ...item,
        type: 'expense' as const,
        typeLabel: 'Expense',
        icon: Receipt,
        description: item.description,
        meta: item.categoryName || getCategoryName(item.categoryId),
        color: 'text-green-600 bg-green-50 border-green-200',
        categoryName: item.categoryName || getCategoryName(item.categoryId),
        paymentMethod: item.paymentMethod,
        referenceNo: item.referenceNo || item.id,
        date: item.date,
      })));

      // Approved promotions
      list.push(...promotions.filter(p => p.approvalStatus === 'approved').map(item => ({
        ...item,
        type: 'promotion' as const,
        typeLabel: 'Promotion',
        icon: Tag,
        description: item.title,
        meta: item.type,
        color: 'text-green-600 bg-green-50 border-green-200',
        promotionType: item.type,
        promotionValue: item.value,
        isActive: item.isActive,
        referenceNo: item.id,
        date: item.startDate || new Date().toISOString(),
      })));
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transfers, counts, reservations, receipts, adjustments, warehouses, statusFilter, expenses, promotions, expenseCategories]);

  const handleApproveExpense = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/approvals/expense/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || 'Failed to approve', 'error'); return; }
      updateExpense({ ...data.expense, approvalStatus: 'approved' });
      addToast('Expense approved', 'success');
    } catch {
      addToast('Network error approving expense', 'error');
    }
  };

  const handleRejectExpense = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/approvals/expense/${id}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || 'Failed to reject', 'error'); return; }
      updateExpense({ ...data.expense, approvalStatus: 'rejected' });
      addToast('Expense rejected', 'warning');
    } catch {
      addToast('Network error rejecting expense', 'error');
    }
  };

  const handleApprovePromotion = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/approvals/promotion/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || 'Failed to approve', 'error'); return; }
      updatePromotion({ ...data.promotion, approvalStatus: 'approved' });
      addToast('Promotion approved', 'success');
    } catch {
      addToast('Network error approving promotion', 'error');
    }
  };

  const handleRejectPromotion = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/approvals/promotion/${id}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || 'Failed to reject', 'error'); return; }
      updatePromotion({ ...data.promotion, approvalStatus: 'rejected' });
      addToast('Promotion rejected', 'warning');
    } catch {
      addToast('Network error rejecting promotion', 'error');
    }
  };

  const handleApprove = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    // Expense / Promotion — use dedicated API
    if (item.type === 'expense') {
      if (window.confirm(`Approve expense "${item.description}"?`)) {
        handleApproveExpense(item.id);
      }
      return;
    }
    if (item.type === 'promotion') {
      if (window.confirm(`Approve promotion "${item.description}"?`)) {
        handleApprovePromotion(item.id);
      }
      return;
    }
    // Stock documents
    if (statusFilter === 'Draft') {
      if (window.confirm('Are you sure you want to Approve this request?')) {
        onStatusChange(item.type, item.id, 'Approved');
        addToast('Request approved successfully', 'success');
      }
    } else {
      if (window.confirm('Are you sure you want to Complete this document?')) {
        onStatusChange(item.type, item.id, 'Completed');
        addToast('Document completed successfully', 'success');
      }
    }
  };

  const handleReject = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    // Expense / Promotion
    if (item.type === 'expense') {
      if (window.confirm(`Reject expense "${item.description}"?`)) {
        handleRejectExpense(item.id);
      }
      return;
    }
    if (item.type === 'promotion') {
      if (window.confirm(`Reject promotion "${item.description}"?`)) {
        handleRejectPromotion(item.id);
      }
      return;
    }
    // Stock documents
    if (statusFilter === 'Draft') {
      if (window.confirm('Are you sure you want to Reject this request?')) {
        onStatusChange(item.type, item.id, 'Cancelled');
        addToast('Request rejected', 'warning');
      }
    } else {
      if (window.confirm('Are you sure you want to Cancel this document?')) {
        onStatusChange(item.type, item.id, 'Cancelled');
        addToast('Document cancelled', 'warning');
      }
    }
  };

  const handleOpenModal = (item: any) => {
    // Expense / Promotion don't have a stock document modal
    if (item.type === 'expense' || item.type === 'promotion') return;
    setSelectedItem(item);
    setActiveTab(item.type);
    setIsModalOpen(true);
  };

  const handleModalSave = (data: any) => {
    switch (activeTab) {
      case 'transfer': updateTransfer(data); break;
      case 'count': updateCount(data); break;
      case 'reservation': updateReservation(data); break;
      case 'receipt': updateReceipt(data); break;
      case 'adjustment': updateAdjustment(data); break;
    }
    addToast("Changes saved.", "success");
  };

  const handleModalComplete = (data: any) => {
    if (window.confirm('Approve this document?')) {
      handleModalSave(data);
      onStatusChange(activeTab as any, data.id, 'Approved');
      setIsModalOpen(false);
      addToast('Document approved', 'success');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Approval Center</h2>
          <p className="text-slate-500">Review and approve pending document, expense, and promotion requests.</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setStatusFilter('Draft')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                statusFilter === 'Draft'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('Approved')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                statusFilter === 'Approved'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Approved
            </button>
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 w-fit">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-slate-900 text-lg">{pendingItems.length}</span>
            <span className="text-slate-500 text-sm font-medium">Pending</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
        <ApprovalList
          items={pendingItems}
          onApprove={handleApprove}
          onReject={handleReject}
          onView={handleOpenModal}
          statusFilter={statusFilter}
        />
      </div>

      <StockDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeTab={activeTab as 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment'}
        editingId={selectedItem?.id}
        initialData={selectedItem}
        warehouses={warehouses}
        products={products}
        onSave={handleModalSave}
        onComplete={handleModalComplete}
      />
    </div>
  );
};
