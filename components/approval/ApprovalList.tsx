
import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface ApprovalItem {
  id: string;
  type: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment';
  typeLabel: string;
  icon: any;
  description: string;
  meta?: string;
  color: string;
  referenceNo: string;
  date: string;
  items: any[];
}

interface ApprovalListProps {
  items: ApprovalItem[];
  onApprove: (e: React.MouseEvent, item: ApprovalItem) => void;
  onReject: (e: React.MouseEvent, item: ApprovalItem) => void;
}

export const ApprovalList: React.FC<ApprovalListProps> = ({ items, onApprove, onReject }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-8">
        <div className="bg-slate-50 p-6 rounded-full mb-4">
          <CheckCircle className="w-12 h-12 text-green-200" />
        </div>
        <h3 className="text-lg font-bold text-slate-700">All caught up!</h3>
        <p className="text-sm">No pending approvals found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1 bg-slate-50/50 p-4">
      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-5 relative overflow-hidden group hover:shadow-md transition-shadow">
              {/* Left Border Status Indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.color.split(' ')[0].replace('text-', 'bg-')}`}></div>
              
              <div className="flex-1 flex items-start gap-4">
                <div className={`p-3.5 rounded-xl border shrink-0 ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1.5">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-white ${item.color.replace('text-', 'border-').replace('bg-', '')}`}>
                      {item.typeLabel}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center bg-slate-50 px-2 py-0.5 rounded">
                       {item.referenceNo}
                       <span className="mx-1">•</span>
                       {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 text-lg mb-1 leading-tight">
                    {item.description}
                  </h3>
                  {item.meta && <p className="text-sm text-slate-500 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block">{item.meta}</p>}
                  
                  {/* Compact Items Preview */}
                  <div className="flex flex-wrap gap-2 mt-1">
                     {item.items.slice(0, 3).map((prod: any, idx: number) => {
                       const displayQty = item.type === 'count' ? prod.countedQuantity : prod.quantity;
                       const prefix = (item.type === 'adjustment' && prod.quantity > 0) ? '+' : '';
                       
                       return (
                         <div key={idx} className="flex items-center px-2.5 py-1.5 bg-slate-100 text-slate-700 text-xs rounded-lg border border-slate-200 font-medium">
                           <span className="truncate max-w-[120px]">{prod.productName}</span>
                           <span className={`ml-2 font-bold ${item.type === 'adjustment' && prod.quantity < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                             {prefix}{displayQty}
                           </span>
                         </div>
                       );
                     })}
                     {item.items.length > 3 && (
                       <span className="flex items-center px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-lg border border-slate-200 font-bold">
                         +{item.items.length - 3} more
                       </span>
                     )}
                  </div>
                </div>
              </div>

              {/* Actions - Full width on Mobile, Side on Desktop */}
              <div className="flex flex-row lg:flex-col xl:flex-row items-center justify-end gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 lg:pl-4 lg:border-l">
                <button 
                  onClick={(e) => onReject(e, item)}
                  className="flex-1 lg:flex-none flex items-center justify-center px-4 py-3 border-2 border-red-100 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors font-bold text-sm w-full lg:w-auto"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </button>
                <button 
                  onClick={(e) => onApprove(e, item)}
                  className="flex-1 lg:flex-none flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold text-sm shadow-md w-full lg:w-auto active:scale-95"
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
  );
};
