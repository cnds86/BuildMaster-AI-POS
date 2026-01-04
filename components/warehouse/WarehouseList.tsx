
import React from 'react';
import { Warehouse, Branch } from '../../types';
import { Building2, Plus, Edit2, Trash2, MapPin, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface WarehouseListProps {
  branches: Branch[];
  warehouses: Warehouse[];
  selectedBranchId: string;
  selectedWarehouseId: string | null;
  onSelectBranch: (id: string) => void;
  onSelectWarehouse: (id: string) => void;
  onAdd: () => void;
  onEdit: (wh: Warehouse) => void;
  onDelete: (id: string) => void;
}

export const WarehouseList: React.FC<WarehouseListProps> = ({
  branches, warehouses, selectedBranchId, selectedWarehouseId,
  onSelectBranch, onSelectWarehouse, onAdd, onEdit, onDelete
}) => {
  const filteredWarehouses = warehouses.filter(w => w.branchId === selectedBranchId);

  return (
    <Card className="flex-1 flex flex-col overflow-hidden bg-white border-slate-200">
      <div className="p-6 bg-slate-50/50 border-b border-slate-100">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Current Branch View</label>
        <div className="relative group">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-construction-orange transition-colors" />
            <select 
              value={selectedBranchId}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-construction-orange transition-all outline-none font-bold text-slate-800 appearance-none"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
        </div>
      </div>

      <div className="p-6 border-b border-slate-50 flex justify-between items-center">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center">
          Warehouses <span className="ml-2 bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg text-[10px]">{filteredWarehouses.length}</span>
        </h3>
        <button 
          onClick={onAdd}
          className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
        {filteredWarehouses.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center opacity-40">
            <Building2 className="w-12 h-12 mb-2 text-slate-300" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No Warehouses Found</p>
          </div>
        ) : (
          filteredWarehouses.map(wh => (
            <div 
              key={wh.id}
              onClick={() => onSelectWarehouse(wh.id)}
              className={`group p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                selectedWarehouseId === wh.id 
                  ? 'border-construction-orange bg-white shadow-xl shadow-orange-900/5' 
                  : 'border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-white'
              }`}
            >
              {selectedWarehouseId === wh.id && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-construction-orange"></div>
              )}
              
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 text-base truncate">{wh.name}</h4>
                  <p className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-tighter mt-0.5">
                    {wh.code}
                  </p>
                </div>
                <Badge variant={selectedWarehouseId === wh.id ? 'primary' : 'slate'} className="shrink-0">
                  {wh.type}
                </Badge>
              </div>

              <div className="flex items-center justify-between mt-auto">
                 <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <MapPin className="w-3 h-3 mr-1 text-slate-300" />
                    Storage Hub
                 </div>
                 <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(wh); }}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(wh.id); }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
