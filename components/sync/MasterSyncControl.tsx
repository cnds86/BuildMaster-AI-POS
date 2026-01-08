
import React, { useState } from 'react';
import { Branch } from '../../types';
import { Server, ArrowUpCircle, ArrowDownCircle, CheckSquare, Square, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface MasterSyncControlProps {
  branches: Branch[];
  onSync: (type: 'Push' | 'Pull', targetBranchIds: string[]) => void;
  isSyncing: boolean;
}

export const MasterSyncControl: React.FC<MasterSyncControlProps> = ({ branches, onSync, isSyncing }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const activeBranches = branches.filter(b => b.isActive);

  const handleToggleAll = () => {
    if (selectedIds.length === activeBranches.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeBranches.map(b => b.id));
    }
  };

  const handleToggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(bid => bid !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleAction = (type: 'Push' | 'Pull') => {
    if (selectedIds.length === 0) return;
    onSync(type, selectedIds);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <Server className="w-5 h-5 mr-2 text-indigo-600" />
            Master Server Control
          </h3>
          <p className="text-sm text-slate-500">Select branches to synchronize data.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleAction('Pull')}
            disabled={isSyncing || selectedIds.length === 0}
            className="flex items-center px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors font-bold text-sm shadow-sm"
          >
            <ArrowDownCircle className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-bounce' : ''}`} />
            Pull from Branch
          </button>
          <button
            onClick={() => handleAction('Push')}
            disabled={isSyncing || selectedIds.length === 0}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-bold text-sm shadow-md"
          >
            <ArrowUpCircle className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-bounce' : ''}`} />
            Push to Branch
          </button>
        </div>
      </div>

      {/* Branch Selection List */}
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
          <div 
            onClick={handleToggleAll}
            className="flex items-center cursor-pointer text-sm font-bold text-slate-700"
          >
            {selectedIds.length === activeBranches.length && activeBranches.length > 0 ? (
              <CheckSquare className="w-5 h-5 text-indigo-600 mr-2" />
            ) : (
              <Square className="w-5 h-5 text-slate-400 mr-2" />
            )}
            Select All Active Branches ({activeBranches.length})
          </div>
          <span className="text-xs text-slate-500">
            {selectedIds.length} Selected
          </span>
        </div>
        
        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {activeBranches.length === 0 ? (
             <div className="p-6 text-center text-slate-400 text-sm">No active branches found.</div>
          ) : (
             activeBranches.map(branch => {
                const isSelected = selectedIds.includes(branch.id);
                return (
                  <div 
                    key={branch.id} 
                    onClick={() => handleToggleOne(branch.id)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600 mr-3" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 mr-3" />
                      )}
                      <div>
                        <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{branch.name}</p>
                        <p className="text-xs text-slate-500">{branch.phone || 'No IP Configured'}</p>
                      </div>
                    </div>
                    
                    {/* Simulated Status Indicator */}
                    <div className="flex items-center">
                       {isSyncing && isSelected ? (
                          <span className="flex items-center text-xs text-indigo-600 font-medium">
                             <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Syncing...
                          </span>
                       ) : (
                          <span className="flex items-center text-xs text-green-600 font-medium">
                             <CheckCircle className="w-3 h-3 mr-1" /> Ready
                          </span>
                       )}
                    </div>
                  </div>
                );
             })
          )}
        </div>
      </div>
    </div>
  );
};
