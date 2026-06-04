
import React from 'react';
import { Warehouse } from '../../types';
import { Edit2, Trash2, PlayCircle, FileText, Package, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { EmptyState } from '../ux';

interface StockListProps {
  activeTab: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment';
  items: any[];
  warehouses: Warehouse[];
  onOpenModal: (item: any) => void;
  onComplete: (item: any) => void;
  onDelete: (id: string) => void;
}

export const StockList: React.FC<StockListProps> = ({
  activeTab,
  items,
  warehouses,
  onOpenModal,
  onComplete,
  onDelete
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDetails = (item: any) => {
    switch (activeTab) {
      case 'transfer': return (
        <div className="flex items-center text-xs md:text-sm text-slate-600">
           <span className="font-medium text-slate-900 mr-1">{warehouses.find(w => w.id === item.sourceWarehouseId)?.name || 'Unknown'}</span>
           <ArrowRight className="w-3 h-3 mx-1 text-slate-400" />
           <span className="font-medium text-slate-900 ml-1">{warehouses.find(w => w.id === item.targetWarehouseId)?.name || 'Unknown'}</span>
        </div>
      );
      case 'receipt': return `Vendor: ${item.vendorName} (Ref: ${item.vendorInvoiceNo})`;
      case 'adjustment': return `Reason: ${item.reason} @ ${warehouses.find(w => w.id === item.warehouseId)?.name}`;
      case 'count': return `Counter: ${item.counterName} @ ${warehouses.find(w => w.id === item.warehouseId)?.name}`;
      case 'reservation': return `Customer: ${item.customerName} (Exp: ${new Date(item.expiryDate).toLocaleDateString()})`;
      default: return '';
    }
  };

  if (items.length === 0) {
    const tabLabel: Record<typeof activeTab, string> = {
      transfer: 'transfers',
      count: 'stock counts',
      reservation: 'reservations',
      receipt: 'goods receipts',
      adjustment: 'adjustments',
    };
    return (
      <EmptyState
        icon={Package}
        title={`No ${tabLabel[activeTab]} yet`}
        description="Documents you create in this section will appear here. Use the New button to get started."
      />
    );
  }

  return (
    <>
      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Ref No / Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Details</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center whitespace-nowrap">Items</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-bold text-slate-800">{item.referenceNo}</div>
                  <div className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 min-w-[200px]">
                  {getDetails(item)}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 border border-slate-200">
                    {item.items?.length || 0} items
                  </span>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex justify-end space-x-2 items-center">
                    {item.status === 'Approved' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onComplete(item); }}
                        className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-bold shadow-sm"
                      >
                        <PlayCircle className="w-3 h-3 mr-1" /> Complete
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onOpenModal(item); }} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      {item.status === 'Draft' ? <Edit2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </button>
                    {(item.status === 'Draft' || item.status === 'Approved') && (
                      <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
         {items.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onOpenModal(item)}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative active:scale-[0.99] transition-transform"
            >
               <div className="flex justify-between items-start mb-3">
                  <div>
                     <div className="flex items-center">
                        <span className="font-bold text-slate-900 text-lg mr-2">{item.referenceNo}</span>
                     </div>
                     <div className="flex items-center text-xs text-slate-500 mt-1 font-medium">
                        <Calendar className="w-3 h-3 mr-1.5" />
                        {new Date(item.date).toLocaleDateString()}
                     </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
               </div>

               <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {getDetails(item)}
               </div>

               <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <div className="text-xs font-bold text-slate-500 flex items-center bg-slate-100 px-2 py-1 rounded-lg">
                     <Package className="w-3.5 h-3.5 mr-1.5" />
                     {item.items?.length || 0} Items
                  </div>
                  
                  <div className="flex space-x-2">
                     {item.status === 'Approved' && (
                        <button 
                           onClick={(e) => { e.stopPropagation(); onComplete(item); }}
                           className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold shadow-sm"
                        >
                           Complete
                        </button>
                     )}
                     {(item.status === 'Draft' || item.status === 'Approved') && (
                        <button 
                           onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                           className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-lg"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                     )}
                  </div>
               </div>
            </div>
         ))}
      </div>
    </>
  );
};
