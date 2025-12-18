
import React from 'react';
import { HeldOrder } from '../../types';
import { ClipboardList, PauseCircle, RefreshCw, Trash2, X } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

interface RecallModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldOrders: HeldOrder[];
  onRecall: (id: string) => void;
  onDiscard: (id: string) => void;
}

export const RecallModal: React.FC<RecallModalProps> = ({ isOpen, onClose, heldOrders, onRecall, onDiscard }) => {
  const { formatPrice } = useGlobal();

  if (!isOpen) return null;

  return (
     <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
           <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-slate-800 flex items-center">
                 <ClipboardList className="w-5 h-5 mr-2 text-slate-500" /> 
                 Suspended Orders
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
           </div>
           <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
              {heldOrders.length === 0 ? (
                 <div className="text-center py-12 text-slate-400">
                    <PauseCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>No suspended orders.</p>
                 </div>
              ) : (
                 <div className="space-y-3">
                    {heldOrders.map(order => (
                       <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2">
                             <div>
                                <div className="flex items-center">
                                   <span className="font-bold text-slate-800 text-lg mr-2">{formatPrice(order.total)}</span>
                                   <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">
                                      {new Date(order.timestamp).toLocaleTimeString()}
                                   </span>
                                </div>
                                <div className="text-sm text-slate-500 mt-1">
                                   {order.customer ? order.customer.name : 'Walk-in Customer'} • {order.items.length} items
                                </div>
                                {order.note && <div className="text-xs text-orange-600 mt-2 bg-orange-50 px-2 py-1 rounded inline-block font-medium">{order.note}</div>}
                             </div>
                             <button 
                                onClick={() => { if(confirm('Delete this order?')) onDiscard(order.id); }}
                                className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-slate-50"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                          <button 
                             onClick={() => onRecall(order.id)}
                             className="w-full mt-2 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors flex items-center justify-center"
                          >
                             <RefreshCw className="w-3.5 h-3.5 mr-2" /> Restore to Cart
                          </button>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>
     </div>
  );
};
