
import React from 'react';
import { Branch } from '../../types';
import { Building, MapPin, User, Edit2, Trash2 } from 'lucide-react';

interface BranchListProps {
  branches: Branch[];
  selectedBranchId: string | null;
  onSelect: (id: string) => void;
  onEdit: (branch: Branch) => void;
  onDelete: (id: string) => void;
}

export const BranchList: React.FC<BranchListProps> = ({ 
  branches, selectedBranchId, onSelect, onEdit, onDelete 
}) => {
  return (
    <div className="lg:w-1/2 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700 flex items-center">
        <Building className="w-5 h-5 mr-2" />
        All Branches
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {branches.map(branch => (
          <div 
            key={branch.id}
            onClick={() => onSelect(branch.id)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedBranchId === branch.id 
                ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' 
                : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800">{branch.name}</h3>
                <div className="flex items-center text-sm text-slate-500 mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  {branch.address}
                </div>
              </div>
              {branch.isActive ? (
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">Active</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">Closed</span>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-100/50 flex justify-between items-center">
              <div className="text-xs text-slate-500 flex items-center">
                <User className="w-3 h-3 mr-1" /> {branch.manager}
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(branch); }}
                  className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-white rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(branch.id); }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
