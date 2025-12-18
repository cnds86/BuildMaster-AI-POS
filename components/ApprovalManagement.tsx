
import React, { useMemo } from 'react';
import { 
  StockTransfer, 
  StockCount, 
  StockReservation, 
  StockReceipt, 
  StockAdjustment,
  DocumentStatus,
  Warehouse
} from '../types';
import { 
  ArrowRightLeft, 
  CheckSquare, 
  CalendarClock, 
  Truck, 
  Clock,
  SlidersHorizontal
} from 'lucide-react';
import { ApprovalList } from './approval/ApprovalList';

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
  
  const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || id;

  // Flatten and normalize data for the list
  const pendingItems = useMemo(() => {
    const list: any[] = [];

    // 1. Transfers
    transfers.filter(i => i.status === 'Draft').forEach(item => {
      list.push({
        ...item,
        type: 'transfer',
        typeLabel: 'Stock Transfer',
        icon: ArrowRightLeft,
        description: `Transfer from ${getWarehouseName(item.sourceWarehouseId)} to ${getWarehouseName(item.targetWarehouseId)}`,
        color: 'text-blue-600 bg-blue-50 border-blue-200'
      });
    });

    // 2. Stock Counts
    counts.filter(i => i.status === 'Draft').forEach(item => {
      list.push({
        ...item,
        type: 'count',
        typeLabel: 'Stock Audit',
        icon: CheckSquare,
        description: `Audit at ${getWarehouseName(item.warehouseId)} by ${item.counterName}`,
        color: 'text-purple-600 bg-purple-50 border-purple-200'
      });
    });

    // 3. Reservations
    reservations.filter(i => i.status === 'Draft').forEach(item => {
      list.push({
        ...item,
        type: 'reservation',
        typeLabel: 'Reservation',
        icon: CalendarClock,
        description: `Reserved for ${item.customerName}`,
        meta: `Exp: ${new Date(item.expiryDate).toLocaleDateString()}`,
        color: 'text-orange-600 bg-orange-50 border-orange-200'
      });
    });

    // 4. Receipts
    receipts.filter(i => i.status === 'Draft').forEach(item => {
      list.push({
        ...item,
        type: 'receipt',
        typeLabel: 'Goods Receipt',
        icon: Truck,
        description: `Received from ${item.vendorName}`,
        meta: item.vendorInvoiceNo ? `Inv: ${item.vendorInvoiceNo}` : undefined,
        color: 'text-green-600 bg-green-50 border-green-200'
      });
    });

    // 5. Adjustments
    adjustments.filter(i => i.status === 'Draft').forEach(item => {
      list.push({
        ...item,
        type: 'adjustment',
        typeLabel: 'Stock Adjustment',
        icon: SlidersHorizontal,
        description: `Adjustment at ${getWarehouseName(item.warehouseId)}`,
        meta: item.reason,
        color: 'text-pink-600 bg-pink-50 border-pink-200'
      });
    });

    // Sort by date (newest first)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transfers, counts, reservations, receipts, adjustments, warehouses]);

  const handleApprove = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    // Only Approve. Execution happens in Stock Management via 'Complete'.
    if (window.confirm('Are you sure you want to Approve this request?')) {
      onStatusChange(item.type, item.id, 'Approved');
    }
  };

  const handleReject = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to Reject this request?')) {
      onStatusChange(item.type, item.id, 'Cancelled');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Approval Center</h2>
          <p className="text-slate-500">Review and approve pending document requests.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 w-fit">
          <Clock className="w-5 h-5 text-orange-500" />
          <span className="font-bold text-slate-900 text-lg">{pendingItems.length}</span>
          <span className="text-slate-500 text-sm font-medium">Pending</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
        <ApprovalList 
          items={pendingItems}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
    </div>
  );
};
