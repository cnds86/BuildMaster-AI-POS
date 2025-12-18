
import React from 'react';
import { Warehouse, Branch } from '../../types';
import { Container, Plus, Edit2, Trash2 } from 'lucide-react';

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
    <div className="lg:w-1/3 flex flex-col gap-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Branch</label>
        <select 
          value={selectedBranchId}
          onChange={(e) => onSelectBranch(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
        >
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 flex items-center">
            <Container className="w-5 h-5 mr-2" /> Warehouses
          </h3>
          <button 
            onClick={onAdd}
            className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-2 space-y-2 flex-1">
          {filteredWarehouses.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No warehouses found.</p>
            </div>
          ) : (
            filteredWarehouses.map(wh => (
              <div 
                key={wh.id}
                onClick={() => onSelectWarehouse(wh.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedWarehouseId === wh.id 
                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' 
                    : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{wh.name}</h4>
                    <span className="text-xs font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 mt-1 inline-block">
                      {wh.code}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(wh); }}
                      className="p-1 text-slate-400 hover:text-primary-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(wh.id); }}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500 flex justify-between">
                   <span>Type: {wh.type}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
