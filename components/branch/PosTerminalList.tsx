
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
    <div className="lg:w-1/2 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {activeBranch ? (
        <>
          <div className="p-6 border-b border-slate-100">
             <div className="flex justify-between items-start mb-4">
               <div>
                 <h3 className="text-xl font-bold text-slate-800">{activeBranch.name}</h3>
                 <p className="text-slate-500 flex items-center mt-1">
                   <Phone className="w-4 h-4 mr-2" /> {activeBranch.phone}
                 </p>
               </div>
               <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                 <Building className="w-6 h-6" />
               </div>
             </div>
             
             <div className="flex items-center justify-between mt-6">
                <h4 className="font-bold text-slate-700 flex items-center">
                  <Monitor className="w-5 h-5 mr-2" />
                  POS Terminals ({posMachines.length})
                </h4>
                <button 
                  onClick={onAdd}
                  className="text-sm bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-slate-900 transition-colors flex items-center"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Terminal
                </button>
             </div>
          </div>

          <div className="overflow-y-auto flex-1 p-4">
            {posMachines.length === 0 ? (
              <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No POS machines configured for this branch.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posMachines.map(pos => (
                  <div key={pos.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center">
                      <div className={`p-2 rounded mr-3 ${pos.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                         <Monitor className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{pos.machineNumber}</div>
                        <div className="text-xs text-slate-500 flex items-center mt-0.5">
                          Status: <span className={`ml-1 font-medium capitalize ${
                            pos.status === 'active' ? 'text-green-600' : 
                            pos.status === 'maintenance' ? 'text-orange-600' : 'text-slate-500'
                          }`}>{pos.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                       <button 
                        onClick={() => onEdit(pos)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(pos.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
          <Building className="w-16 h-16 mb-4 text-slate-200" />
          <p className="text-lg font-medium">Select a branch to manage details</p>
          <p className="text-sm">Click on a branch from the list on the left.</p>
        </div>
      )}
    </div>
  );
};
