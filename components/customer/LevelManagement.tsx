
import React from 'react';
import { CustomerLevel } from '../../types';
import { AlertCircle, Plus, Edit2, Trash2 } from 'lucide-react';

interface LevelManagementProps {
  levels: CustomerLevel[];
  onAdd: () => void;
  onEdit: (level: CustomerLevel) => void;
  onDelete: (id: string) => void;
}

export const LevelManagement: React.FC<LevelManagementProps> = ({ levels, onAdd, onEdit, onDelete }) => {
  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
       <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-800 mb-2">About Membership Levels</h3>
             <p className="text-sm text-slate-500 mb-4">
                Create tiers to automatically apply discounts at the POS. Assign customers to tiers to reward loyalty.
             </p>
             <button 
                onClick={onAdd}
                className="w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium flex items-center justify-center"
             >
                <Plus className="w-4 h-4 mr-2" />
                Create New Level
             </button>
          </div>
       </div>

       <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
             <h3 className="font-bold text-slate-700">Active Membership Tiers</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-4 space-y-3">
             {levels.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                   <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                   <p>No membership levels defined.</p>
                </div>
             ) : (
                levels.map(level => (
                   <div key={level.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all bg-white">
                      <div className="flex items-center">
                         <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm mr-4"
                            style={{ backgroundColor: level.color || '#64748b' }}
                         >
                            {level.discountPercentage}%
                         </div>
                         <div>
                            <h4 className="font-bold text-slate-800">{level.name}</h4>
                            <p className="text-xs text-slate-500">Auto-applies {level.discountPercentage}% discount</p>
                         </div>
                      </div>
                      <div className="flex space-x-2">
                         <button onClick={() => onEdit(level)} className="p-2 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50">
                            <Edit2 className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={() => {
                               if(confirm('Delete this level?')) onDelete(level.id);
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                ))
             )}
          </div>
       </div>
    </div>
  );
};
