
import React, { useState } from 'react';
import { Warehouse, Branch } from '../../types';
import { Container, Plus, Edit2, Trash2, Search, MapPin } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWarehouses = warehouses.filter(w => 
    w.branchId === selectedBranchId &&
    (w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-700 flex items-center">
            <Container className="w-5 h-5 mr-2" /> Warehouses
          </h3>
          <span className="text-xs font-bold bg-white text-slate-600 px-2 py-1 rounded-full border border-slate-200 shadow-sm">
             {filteredWarehouses.length}
          </span>
        </div>
        
        {/* Branch Selector */}
        <div className="relative">
           <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
           <select 
             value={selectedBranchId}
             onChange={(e) => onSelectBranch(e.target.value)}
             className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none bg-white font-medium text-slate-700"
           >
             {branches.map(b => (
               <option key={b.id} value={b.id}>{b.name}</option>
             ))}
           </select>
        </div>

        {/* Search */}
        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input 
              type="text"
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none transition-all"
           />
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-3 space-y-3">
        {filteredWarehouses.length === 0 ? (
          <div className="text-center py-10 text-slate-400 flex flex-col items-center">
            <Container className="w-12 h-12 mb-3 opacity-20" />
            <p>No warehouses found.</p>
          </div>
        ) : (
          filteredWarehouses.map(wh => (
            <div 
              key={wh.id}
              onClick={() => onSelectWarehouse(wh.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all group relative ${
                selectedWarehouseId === wh.id 
                  ? 'border-slate-800 bg-slate-900 text-white shadow-lg transform scale-[1.02]' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className={`font-bold text-base ${selectedWarehouseId === wh.id ? 'text-white' : 'text-slate-800'}`}>{wh.name}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                     <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${selectedWarehouseId === wh.id ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {wh.code}
                     </span>
                     <span className={`text-[10px] uppercase font-bold tracking-wide ${selectedWarehouseId === wh.id ? 'text-slate-400' : 'text-slate-500'}`}>
                        {wh.type}
                     </span>
                  </div>
                </div>
              </div>
              
              <div className={`mt-3 pt-3 border-t flex justify-between items-center ${selectedWarehouseId === wh.id ? 'border-slate-700' : 'border-slate-100'}`}>
                 <div className={`text-xs ${selectedWarehouseId === wh.id ? 'text-slate-400' : 'text-slate-500'}`}>
                    {wh.description || 'No description'}
                 </div>
                 <div className="flex space-x-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(wh); }}
                      className={`p-1.5 rounded transition-colors ${selectedWarehouseId === wh.id ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(wh.id); }}
                      className={`p-1.5 rounded transition-colors ${selectedWarehouseId === wh.id ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
