
import React from 'react';
import { Branch } from '../../types';
import { Building2, MapPin, User, Edit2, Trash2, ChevronRight, Hash } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

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
    <Card className="flex-1 flex flex-col overflow-hidden bg-white border-slate-200">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center">
          All Branches <span className="ml-2 bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg text-[10px]">{branches.length}</span>
        </h3>
      </div>
      
      <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
        {branches.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center opacity-40">
            <Building2 className="w-16 h-16 mb-4 text-slate-300" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">No Branches Registered</p>
          </div>
        ) : (
          branches.map(branch => (
            <div 
              key={branch.id}
              onClick={() => onSelect(branch.id)}
              className={`group p-4 rounded-3xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                selectedBranchId === branch.id 
                  ? 'border-construction-orange bg-white shadow-xl shadow-orange-900/5 translate-x-1' 
                  : 'border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-white'
              }`}
            >
              {selectedBranchId === branch.id && (
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-construction-orange"></div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 text-lg tracking-tight truncate">{branch.name}</h4>
                  <div className="flex items-center text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                    <MapPin className="w-3 h-3 mr-1.5 text-slate-300" />
                    <span className="truncate">{branch.address}</span>
                  </div>
                </div>
                <Badge variant={branch.isActive ? 'success' : 'danger'} className="shrink-0">
                  {branch.isActive ? 'Active' : 'Closed'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between mt-auto">
                 <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <User className="w-3 h-3 mr-1.5 text-slate-300" />
                    {branch.manager}
                 </div>
                 <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(branch); }}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(branch.id); }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
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
