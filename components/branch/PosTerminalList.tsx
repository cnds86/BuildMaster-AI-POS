
import React from 'react';
import { Branch, PosMachine } from '../../types';
// Added Building2 to the lucide-react import list
import { Monitor, Phone, Plus, Edit2, Trash2, Store, Clock, Wifi, Building2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

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
    <Card className="flex-1 flex flex-col overflow-hidden bg-white border-slate-200">
      {activeBranch ? (
        <>
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <Store className="w-5 h-5 text-slate-400" />
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">{activeBranch.name}</h3>
               </div>
               <div className="flex flex-wrap items-center gap-4 ml-7">
                  <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Phone className="w-3.5 h-3.5 mr-1.5 text-construction-orange" />
                    {activeBranch.phone}
                  </div>
                  <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Monitor className="w-3.5 h-3.5 mr-1.5 text-construction-orange" />
                    {posMachines.length} Terminals
                  </div>
               </div>
             </div>
             
             <Button 
               variant="primary"
               size="sm"
               onClick={onAdd}
               className="rounded-2xl w-full sm:w-auto shadow-xl shadow-slate-200"
             >
               <Plus className="w-4 h-4 mr-2" />
               New Terminal
             </Button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto flex-1">
            <table className="w-full text-left">
               <thead className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                  <tr>
                    <th className="px-8 py-5">Terminal ID</th>
                    <th className="px-6 py-5">Network Status</th>
                    <th className="px-6 py-5">Last Heartbeat</th>
                    <th className="px-6 py-5 text-center">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {posMachines.map(pos => (
                    <tr key={pos.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                           <div className={`p-2.5 rounded-xl border-2 transition-all ${
                              pos.status === 'active' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100'
                           }`}>
                              <Monitor className="w-4 h-4" />
                           </div>
                           <div>
                              <span className="font-black text-slate-900 text-base">{pos.machineNumber}</span>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Device ID: {pos.id.slice(-6)}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <Badge variant={pos.status === 'active' ? 'success' : pos.status === 'maintenance' ? 'warning' : 'slate'} className="font-black">
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                               pos.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}></span>
                            {pos.status}
                         </Badge>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center text-xs font-bold text-slate-500">
                            <Clock className="w-3.5 h-3.5 mr-2 text-slate-300" />
                            {pos.lastActive ? new Date(pos.lastActive).toLocaleTimeString() : 'Never Synced'}
                         </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                           <button 
                              onClick={() => onEdit(pos)}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-200 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => onDelete(pos.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
             {posMachines.map(pos => (
               <div key={pos.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                  {pos.status === 'active' && <div className="absolute right-0 top-0 w-2 h-full bg-emerald-500/20"></div>}
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className={`p-2.5 rounded-xl ${pos.status === 'active' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <Monitor className="w-5 h-5" />
                       </div>
                       <div className="font-black text-lg text-slate-900 leading-none">
                          {pos.machineNumber}
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Terminal</p>
                       </div>
                    </div>
                    <Badge variant={pos.status === 'active' ? 'success' : 'slate'} className="font-black">
                       {pos.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <div className="flex items-center text-xs font-bold text-slate-700">
                           <Wifi className="w-3 h-3 mr-1.5 text-emerald-500" /> Online
                        </div>
                     </div>
                     <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Activity</p>
                        <div className="flex items-center text-xs font-bold text-slate-700">
                           <Clock className="w-3 h-3 mr-1.5 text-slate-300" /> 2m ago
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-slate-100">
                     <button onClick={() => onEdit(pos)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200">Edit</button>
                     <button onClick={() => onDelete(pos.id)} className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-2xl text-xs hover:bg-red-100">Remove</button>
                  </div>
               </div>
             ))}
          </div>

          {posMachines.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-20 text-center">
              <div className="p-8 bg-slate-50 rounded-[2.5rem] mb-6">
                <Monitor className="w-16 h-16 text-slate-200" />
              </div>
              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter">No Terminals Registered</h4>
              <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto mt-2">Initialize your first POS terminal for this branch to start processing sales.</p>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-20 text-center">
          <div className="p-10 bg-slate-50 rounded-[3rem] mb-8 animate-pulse">
            <Building2 className="w-20 h-20 text-slate-200" />
          </div>
          <h4 className="text-3xl font-black text-slate-800 tracking-tight">Select a Branch</h4>
          <p className="text-sm font-medium text-slate-400 max-w-sm mx-auto mt-3 leading-relaxed">
            Choose a location from the left panel to configure its specific Point of Sale terminals and network parameters.
          </p>
        </div>
      )}
    </Card>
  );
};
