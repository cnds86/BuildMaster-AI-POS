
import React from 'react';
import { Branch, PosMachine } from '../../types';
import { Monitor, Phone, Building, Plus, Edit2, Trash2 } from 'lucide-react';

interface PosTerminalListProps {
  activeBranch: Branch | undefined;
  posMachines: PosMachine[];
  onAdd: () => void;
  onEdit: (pos: PosMachine) => void;
  onDelete: (id: string) => void;
}

export const PosTerminalList: React.FC<PosTerminalListProps> = ({ 
  activeBranch, posMachines, onAdd, onEdit, onDelete 
}) => {
  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
      {activeBranch ? (
        <>
          <div className="p-6 border-b border-slate-100 bg-slate-50">
             <div className="flex justify-between items-start">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-slate-800">{activeBranch.name}</h3>
                    {!activeBranch.isActive && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded">Closed</span>}
                 </div>
                 <p className="text-slate-500 flex items-center text-sm">
                   <Phone className="w-4 h-4 mr-2" /> {activeBranch.phone || 'No Phone'}
                 </p>
               </div>
               <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 text-slate-500">
                 <Building className="w-6 h-6" />
               </div>
             </div>
             
             <div className="flex items-center justify-between mt-6">
                <h4 className="font-bold text-slate-700 flex items-center text-sm uppercase tracking-wide">
                  <Monitor className="w-4 h-4 mr-2 text-slate-400" />
                  POS Terminals ({posMachines.length})
                </h4>
                <button 
                  onClick={onAdd}
                  className="text-xs font-bold bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Terminal
                </button>
             </div>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-3 bg-white">
            {posMachines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 pb-10">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Monitor className="w-8 h-8 opacity-30" />
                </div>
                <p className="font-medium">No POS terminals set up.</p>
                <button onClick={onAdd} className="mt-4 text-blue-600 hover:underline text-sm">Add the first terminal</button>
              </div>
            ) : (
                posMachines.map(pos => (
                  <div key={pos.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${pos.status === 'active' ? 'bg-green-100 text-green-600' : pos.status === 'maintenance' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                         <Monitor className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-base">{pos.machineNumber}</div>
                        <div className="flex items-center mt-0.5">
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${pos.status === 'active' ? 'bg-green-500' : pos.status === 'maintenance' ? 'bg-orange-500' : 'bg-slate-400'}`}></span>
                          <span className="text-xs text-slate-500 capitalize">{pos.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={() => onEdit(pos)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(pos.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 bg-slate-50/50">
          <Building className="w-16 h-16 mb-4 text-slate-200" />
          <p className="text-lg font-medium text-slate-500">Select a branch</p>
          <p className="text-sm">Click a branch on the left to manage its terminals.</p>
        </div>
      )}
    </div>
  );
};
