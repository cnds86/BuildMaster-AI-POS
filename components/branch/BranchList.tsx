
import React, { useState } from 'react';
import { Branch } from '../../types';
import { Building, MapPin, User, Edit2, Trash2, Search } from 'lucide-react';
import { EmptyState } from '../ux';

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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-700 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                All Branches
            </h3>
            <span className="text-xs font-bold bg-white text-slate-600 px-2 py-1 rounded-full border border-slate-200 shadow-sm">
                {branches.length}
            </span>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search branches..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none transition-all"
            />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 p-3 space-y-3">
        {filteredBranches.map(branch => (
          <div 
            key={branch.id}
            onClick={() => onSelect(branch.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all group ${
              selectedBranchId === branch.id 
                ? 'border-slate-800 bg-slate-900 text-white shadow-lg transform scale-[1.02]' 
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`font-bold text-lg ${selectedBranchId === branch.id ? 'text-white' : 'text-slate-800'}`}>{branch.name}</h3>
                <div className={`flex items-center text-sm mt-1 ${selectedBranchId === branch.id ? 'text-slate-300' : 'text-slate-500'}`}>
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  {branch.address || 'No address'}
                </div>
              </div>
              {branch.isActive ? (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${selectedBranchId === branch.id ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'}`}>Active</span>
              ) : (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${selectedBranchId === branch.id ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'}`}>Closed</span>
              )}
            </div>
            
            <div className={`mt-4 pt-3 border-t flex justify-between items-center ${selectedBranchId === branch.id ? 'border-slate-700' : 'border-slate-100'}`}>
              <div className={`text-xs flex items-center ${selectedBranchId === branch.id ? 'text-slate-400' : 'text-slate-500'}`}>
                <User className="w-3.5 h-3.5 mr-1.5" /> {branch.manager || 'No Manager'}
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(branch); }}
                  className={`p-1.5 rounded-lg transition-colors ${selectedBranchId === branch.id ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(branch.id); }}
                  className={`p-1.5 rounded-lg transition-colors ${selectedBranchId === branch.id ? 'text-slate-300 hover:text-red-400 hover:bg-slate-700' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredBranches.length === 0 && (
            <EmptyState
              icon={Building}
              compact
              title={branches.length === 0 ? 'No branches yet' : 'No branches match'}
              description={
                branches.length === 0
                  ? 'Create your first branch to start organizing locations.'
                  : 'Try a different search term.'
              }
            />
        )}
      </div>
    </div>
  );
};
