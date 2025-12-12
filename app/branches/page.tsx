
'use client';
import { BranchManagement } from '../../components/BranchManagement';
import { useGlobal } from '../../context/GlobalContext';

export default function BranchesPage() {
  const { 
    branches, posMachines,
    addBranch, updateBranch, deleteBranch,
    addPos, updatePos, deletePos
  } = useGlobal();

  return (
    <BranchManagement
      branches={branches}
      posMachines={posMachines}
      onAddBranch={addBranch}
      onUpdateBranch={updateBranch}
      onDeleteBranch={deleteBranch}
      onAddPosMachine={addPos}
      onUpdatePosMachine={updatePos}
      onDeletePosMachine={deletePos}
    />
  );
}
