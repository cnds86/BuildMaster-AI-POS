
import React, { useState } from 'react';
import { Branch, PosMachine } from '../types';
import { Store, Plus, Building2 } from 'lucide-react';
import { BranchList } from './branch/BranchList';
import { PosTerminalList } from './branch/PosTerminalList';
import { BranchFormModal } from './branch/BranchFormModal';
import { PosFormModal } from './branch/PosFormModal';

interface BranchManagementProps {
  branches: Branch[];
  posMachines: PosMachine[];
  onAddBranch: (branch: Branch) => void;
  onUpdateBranch: (branch: Branch) => void;
  onDeleteBranch: (id: string) => void;
  onAddPosMachine: (machine: PosMachine) => void;
  onUpdatePosMachine: (machine: PosMachine) => void;
  onDeletePosMachine: (id: string) => void;
}

export const BranchManagement: React.FC<BranchManagementProps> = ({
  branches,
  posMachines,
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  onAddPosMachine,
  onUpdatePosMachine,
  onDeletePosMachine
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(branches[0]?.id || null);
  
  // Modal States
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<PosMachine | null>(null);

  const activeBranch = branches.find(b => b.id === selectedBranchId);
  const branchPosMachines = posMachines.filter(p => p.branchId === selectedBranchId);

  const handleOpenBranchModal = (branch?: Branch) => {
    setEditingBranch(branch || null);
    setIsBranchModalOpen(true);
  };

  const handleBranchSubmit = (formData: Partial<Branch>) => {
    if (editingBranch) {
      onUpdateBranch({ ...formData, id: editingBranch.id } as Branch);
    } else {
      onAddBranch({ ...formData, id: `b-${Date.now()}` } as Branch);
    }
    setIsBranchModalOpen(false);
  };

  const handleOpenPosModal = (pos?: PosMachine) => {
    setEditingPos(pos || null);
    setIsPosModalOpen(true);
  };

  const handlePosSubmit = (formData: Partial<PosMachine>) => {
    if (!selectedBranchId) return;
    if (editingPos) {
      onUpdatePosMachine({ ...formData, id: editingPos.id, branchId: selectedBranchId } as PosMachine);
    } else {
      onAddPosMachine({ ...formData, id: `pm-${Date.now()}`, branchId: selectedBranchId } as PosMachine);
    }
    setIsPosModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-8 animate-fade-in max-w-[1600px] mx-auto w-full px-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-slate-900 text-white rounded-xl">
                <Store className="w-5 h-5" />
             </div>
             <h2 className="text-4xl font-black text-slate-900 tracking-tight">Branch Management</h2>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] flex items-center ml-11">
            <Building2 className="w-4 h-4 mr-2 text-construction-orange" />
            Manage store locations and POS terminals
          </p>
        </div>

        <button 
          onClick={() => handleOpenBranchModal()}
          className="flex items-center justify-center px-8 py-4 bg-slate-900 text-white rounded-[2rem] hover:bg-slate-800 transition-all font-black text-sm shadow-xl shadow-slate-200 active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Branch
        </button>
      </div>

      {/* Main Content: Responsive Split */}
      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden min-h-0 pb-10">
        
        {/* Left Column: Branch Selection List */}
        <div className="w-full lg:w-1/3 flex flex-col h-full min-h-[300px]">
           <BranchList 
             branches={branches}
             selectedBranchId={selectedBranchId}
             onSelect={setSelectedBranchId}
             onEdit={handleOpenBranchModal}
             onDelete={onDeleteBranch}
           />
        </div>

        {/* Right Column: Branch & POS Details */}
        <div className="w-full lg:w-2/3 flex flex-col h-full min-h-[400px]">
           <PosTerminalList 
             activeBranch={activeBranch}
             posMachines={branchPosMachines}
             onAdd={() => handleOpenPosModal()}
             onEdit={handleOpenPosModal}
             onDelete={onDeletePosMachine}
           />
        </div>
      </div>

      {/* Modals */}
      <BranchFormModal 
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onSubmit={handleBranchSubmit}
        initialData={editingBranch}
      />

      <PosFormModal 
        isOpen={isPosModalOpen}
        onClose={() => setIsPosModalOpen(false)}
        onSubmit={handlePosSubmit}
        initialData={editingPos}
      />
    </div>
  );
};
