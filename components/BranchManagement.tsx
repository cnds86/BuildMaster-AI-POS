import React, { useState } from 'react';
import { Branch, PosMachine } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Phone, 
  User, 
  Monitor, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  Building,
  Power
} from 'lucide-react';

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
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  
  // Branch Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({
    name: '', address: '', phone: '', manager: '', isActive: true
  });

  // POS Modal State
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<PosMachine | null>(null);
  const [posForm, setPosForm] = useState<Partial<PosMachine>>({
    machineNumber: '', status: 'active'
  });

  // Helpers
  const activeBranch = branches.find(b => b.id === selectedBranchId);
  const branchPosMachines = posMachines.filter(p => p.branchId === selectedBranchId);

  const handleOpenBranchModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchForm(branch);
    } else {
      setEditingBranch(null);
      setBranchForm({ name: '', address: '', phone: '', manager: '', isActive: true });
    }
    setIsBranchModalOpen(true);
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      onUpdateBranch({ ...branchForm, id: editingBranch.id } as Branch);
    } else {
      onAddBranch({ ...branchForm, id: `b-${Date.now()}` } as Branch);
    }
    setIsBranchModalOpen(false);
  };

  const handleOpenPosModal = (pos?: PosMachine) => {
    if (pos) {
      setEditingPos(pos);
      setPosForm(pos);
    } else {
      setEditingPos(null);
      setPosForm({ machineNumber: '', status: 'active' });
    }
    setIsPosModalOpen(true);
  };

  const handlePosSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) return;

    if (editingPos) {
      onUpdatePosMachine({ ...posForm, id: editingPos.id, branchId: selectedBranchId } as PosMachine);
    } else {
      onAddPosMachine({ 
        ...posForm, 
        id: `pm-${Date.now()}`, 
        branchId: selectedBranchId 
      } as PosMachine);
    }
    setIsPosModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Branch Management</h2>
          <p className="text-slate-500">Manage store locations and POS terminals.</p>
        </div>
        <button 
          onClick={() => handleOpenBranchModal()}
          className="flex items-center justify-center px-4 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left: Branch List */}
        <div className="lg:w-1/2 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700 flex items-center">
            <Building className="w-5 h-5 mr-2" />
            All Branches
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {branches.map(branch => (
              <div 
                key={branch.id}
                onClick={() => setSelectedBranchId(branch.id)}
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
                      onClick={(e) => { e.stopPropagation(); handleOpenBranchModal(branch); }}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-white rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteBranch(branch.id); }}
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

        {/* Right: Branch Details & POS Machines */}
        <div className="lg:w-1/2 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {activeBranch ? (
            <>
              <div className="p-6 border-b border-slate-100">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <h3 className="text-xl font-bold text-slate-800">{activeBranch.name}</h3>
                     <p className="text-slate-500 flex items-center mt-1">
                       <Phone className="w-4 h-4 mr-2" /> {activeBranch.phone}
                     </p>
                   </div>
                   <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                     <Building className="w-6 h-6" />
                   </div>
                 </div>
                 
                 <div className="flex items-center justify-between mt-6">
                    <h4 className="font-bold text-slate-700 flex items-center">
                      <Monitor className="w-5 h-5 mr-2" />
                      POS Terminals ({branchPosMachines.length})
                    </h4>
                    <button 
                      onClick={() => handleOpenPosModal()}
                      className="text-sm bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-slate-900 transition-colors flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Terminal
                    </button>
                 </div>
              </div>

              <div className="overflow-y-auto flex-1 p-4">
                {branchPosMachines.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No POS machines configured for this branch.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {branchPosMachines.map(pos => (
                      <div key={pos.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center">
                          <div className={`p-2 rounded mr-3 ${pos.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                             <Monitor className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{pos.machineNumber}</div>
                            <div className="text-xs text-slate-500 flex items-center mt-0.5">
                              Status: <span className={`ml-1 font-medium capitalize ${
                                pos.status === 'active' ? 'text-green-600' : 
                                pos.status === 'maintenance' ? 'text-orange-600' : 'text-slate-500'
                              }`}>{pos.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                           <button 
                            onClick={() => handleOpenPosModal(pos)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onDeletePosMachine(pos.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <Building className="w-16 h-16 mb-4 text-slate-200" />
              <p className="text-lg font-medium">Select a branch to manage details</p>
              <p className="text-sm">Click on a branch from the list on the left.</p>
            </div>
          )}
        </div>
      </div>

      {/* Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-slate-800">
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </h3>
              <button onClick={() => setIsBranchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleBranchSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Branch Name</label>
                <input 
                  required
                  type="text" 
                  value={branchForm.name} 
                  onChange={e => setBranchForm({...branchForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
                  placeholder="e.g. Downtown Store"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input 
                  type="text" 
                  value={branchForm.address} 
                  onChange={e => setBranchForm({...branchForm, address: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input 
                    type="text" 
                    value={branchForm.phone} 
                    onChange={e => setBranchForm({...branchForm, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Manager</label>
                  <input 
                    type="text" 
                    value={branchForm.manager} 
                    onChange={e => setBranchForm({...branchForm, manager: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="branchActive"
                  checked={branchForm.isActive}
                  onChange={e => setBranchForm({...branchForm, isActive: e.target.checked})}
                  className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                />
                <label htmlFor="branchActive" className="text-sm font-medium text-slate-700">Branch is Active</label>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" className="px-6 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS Modal */}
      {isPosModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-800">
                {editingPos ? 'Edit POS Terminal' : 'Add POS Terminal'}
              </h3>
              <button onClick={() => setIsPosModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handlePosSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">POS Machine Number / ID</label>
                <input 
                  required
                  type="text" 
                  value={posForm.machineNumber} 
                  onChange={e => setPosForm({...posForm, machineNumber: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono" 
                  placeholder="e.g. POS-05"
                />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                 <select 
                   value={posForm.status}
                   onChange={e => setPosForm({...posForm, status: e.target.value as any})}
                   className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                 >
                   <option value="active">Active</option>
                   <option value="maintenance">Maintenance</option>
                   <option value="inactive">Inactive</option>
                 </select>
              </div>
               <div className="flex justify-end pt-4">
                <button type="submit" className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium">Save Terminal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};