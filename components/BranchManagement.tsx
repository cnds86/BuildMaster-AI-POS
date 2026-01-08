
import React, { useState, useEffect } from 'react';
import { Branch, PosMachine } from '../types';
import { Plus } from 'lucide-react';
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
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(branches.length > 0 ? branches[0].id : null);
  
  // Modal States
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<PosMachine | null>(null);

  const activeBranch = branches.find(b => b.id === selectedBranchId);
  const branchPosMachines = posMachines.filter(p => p.branchId === selectedBranchId);

  // Auto-select first branch if none selected or if current selection is deleted
  useEffect(() => {
    if (branches.length > 0) {
      if (!selectedBranchId || !branches.find(b => b.id === selectedBranchId)) {
        setSelectedBranchId(branches[0].id);
      }
    } else {
      setSelectedBranchId(null);
    }
  }, [branches, selectedBranchId]);

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
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Branch Management</h2>
          <p className="text-slate-500">Manage store locations and POS terminals.</p>
        </div>
        <button 
          onClick={() => handleOpenBranchModal()}
          className="flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Branch
        </button>
      </div>

      {/* Main Content: Stacks on mobile, Row on Large screens */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        <div className="w-full lg:w-1/2 flex flex-col h-full">
           <BranchList 
             branches={branches}
             selectedBranchId={selectedBranchId}
             onSelect={setSelectedBranchId}
             onEdit={handleOpenBranchModal}
             onDelete={onDeleteBranch}
           />
        </div>

        <div className="w-full lg:w-1/2 flex flex-col h-full">
           <PosTerminalList 
             activeBranch={activeBranch}
             posMachines={branchPosMachines}
             onAdd={() => handleOpenPosModal()}
             onEdit={handleOpenPosModal}
             onDelete={onDeletePosMachine}
           />
        </div>
      </div>

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
