
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
  CheckCircle, 
  XCircle, 
  Clock,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';

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
        description: `${item.items.length} items from ${getWarehouseName(item.sourceWarehouseId)} to ${getWarehouseName(item.targetWarehouseId)}`,
        color: 'text-blue-600 bg-blue-50 border-blue-100'
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
        color: 'text-purple-600 bg-purple-50 border-purple-100'
      });
    });

    // 3. Reservations
    reservations.filter(i => i.status === 'Draft').forEach(item => {
      list.push({
        ...item,
        type: 'reservation',
        typeLabel: 'Reservation',
        icon: CalendarClock,
        description: `For ${item.customerName} (Exp: ${new Date(item.expiryDate).toLocaleDateString()})`,
        color: 'text-orange-600 bg-orange-50 border-orange-100'
      });
    });

    // 4. Receipts
    receipts.filter(i => i.status === 'Draft').forEach(item => {
      list.push({
        ...item,
        type: 'receipt',
        typeLabel: 'Goods Receipt',
        icon: Truck,
        description: `From ${item.vendorName} (Ref: ${item.vendorInvoiceNo})`,
        color: 'text-green-600 bg-green-50 border-green-100'
      });
    });

    // 5. Adjustments
    adjustments.filter(i => i.status === 'Draft').forEach(item => {
      list.push({
        ...item,
        type: 'adjustment',
        typeLabel: 'Stock Adjustment',
        icon: SlidersHorizontal,
        description: `${item.reason} at ${getWarehouseName(item.warehouseId)}`,
        color: 'text-pink-600 bg-pink-50 border-pink-100'
      });
    });

    // Sort by date (newest first)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transfers, counts, reservations, receipts, adjustments, warehouses]);

  const handleApprove = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    // Determine the correct target status based on document type
    // Count & Receipt -> 'Completed' ensures stock is updated immediately in App.tsx logic
    // Transfer & Adjustment -> 'Approved' triggers the stock movement logic in App.tsx
    // Reservation -> 'Approved' just updates status
    const targetStatus: DocumentStatus = (item.type === 'count' || item.type === 'receipt') 
      ? 'Completed' 
      : 'Approved';

    // Directly call status change to prevent blocking UI/confirm dialog issues
    onStatusChange(item.type, item.id, targetStatus);
  };

  const handleReject = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (confirm(`Reject and Cancel ${item.typeLabel} ${item.referenceNo}?`)) {
      onStatusChange(item.type, item.id, 'Cancelled');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Approval Center</h2>
          <p className="text-slate-500">Review and approve pending document requests.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
          <Clock className="w-5 h-5 text-orange-500" />
          <span className="font-bold text-slate-700">{pendingItems.length}</span>
          <span className="text-slate-500">Pending Requests</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        {pendingItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-8">
            <div className="bg-slate-50 p-6 rounded-full mb-4">
              <ShieldAlert className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-600">All caught up!</h3>
            <p>No pending approvals found.</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <div className="grid grid-cols-1 divide-y divide-slate-100">
              {pendingItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl border ${item.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-white ${item.color.replace('text-', 'border-').replace('bg-', '')}`}>
                            {item.typeLabel}
                          </span>
                          <span className="text-sm text-slate-400 font-mono">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">
                          {item.referenceNo || 'No Reference'}
                        </h3>
                        <p className="text-slate-600 mt-1">
                          {item.description}
                        </p>
                        
                        {/* Items Preview */}
                        <div className="mt-3 flex flex-wrap gap-2">
                           {item.items.slice(0, 3).map((prod: any, idx: number) => {
                             // Correctly determine quantity to display based on document type
                             const displayQty = item.type === 'count' ? prod.countedQuantity : prod.quantity;
                             
                             // For adjustments, show + or -
                             const prefix = (item.type === 'adjustment' && prod.quantity > 0) ? '+' : '';
                             
                             return (
                               <span key={idx} className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                                 {prod.productName} 
                                 <span className={`ml-1 font-semibold ${item.type === 'adjustment' && prod.quantity < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                   x{prefix}{displayQty}
                                 </span>
                               </span>
                             );
                           })}
                           {item.items.length > 3 && (
                             <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded border border-slate-200">
                               +{item.items.length - 3} more
                             </span>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pl-14 md:pl-0">
                      <button 
                        onClick={(e) => handleReject(e, item)}
                        className="flex items-center px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors font-medium text-sm"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </button>
                      <button 
                        onClick={(e) => handleApprove(e, item)}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm hover:shadow-md text-sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
