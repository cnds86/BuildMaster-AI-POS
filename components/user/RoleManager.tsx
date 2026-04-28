
import React, { useState } from 'react';
import { SystemRole } from '../../types';
import { useGlobal } from '../../context/GlobalContext';
import { Plus, Edit2, Trash2, ShieldCheck, Search, X, Check, Lock } from 'lucide-react';

const PERMISSION_GROUPS = [
  {
    module: 'Dashboard & Reports',
    permissions: [
      { id: 'dashboard.view', label: 'View Dashboard' },
      { id: 'reports.view', label: 'View Reports' },
    ]
  },
  {
    module: 'Point of Sale',
    permissions: [
      { id: 'pos.operate', label: 'Operate POS' },
      { id: 'sales.view', label: 'View Sales History' },
      { id: 'sales.void', label: 'Void Transactions' },
    ]
  },
  {
    module: 'Inventory & Stock',
    permissions: [
      { id: 'inventory.view', label: 'View Inventory' },
      { id: 'inventory.manage', label: 'Manage Products (Add/Edit)' },
      { id: 'stock.view', label: 'View Stock Docs' },
      { id: 'stock.manage', label: 'Create Stock Docs' },
      { id: 'approvals.manage', label: 'Approve Stock Movements' },
    ]
  },
  {
    module: 'People & Admin',
    permissions: [
      { id: 'customers.view', label: 'View Customers' },
      { id: 'customers.manage', label: 'Manage Customers' },
      { id: 'users.view', label: 'View Users' },
      { id: 'users.manage', label: 'Manage Users' },
      { id: 'settings.manage', label: 'System Settings' },
    ]
  }
];

export const RoleManager: React.FC = () => {
  const { systemRoles, addSystemRole, updateSystemRole, deleteSystemRole } = useGlobal();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<SystemRole | null>(null);
  
  const [formData, setFormData] = useState<Partial<SystemRole>>({
     name: '', description: '', permissions: []
  });

  const filteredRoles = systemRoles.filter(r => 
     r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (role?: SystemRole) => {
     if (role) {
        setEditingRole(role);
        setFormData({ ...role });
     } else {
        setEditingRole(null);
        setFormData({ name: '', description: '', permissions: [] });
     }
     setIsModalOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
     setFormData(prev => {
        const current = prev.permissions || [];
        if (current.includes(permId)) {
           return { ...prev, permissions: current.filter(p => p !== permId) };
        } else {
           return { ...prev, permissions: [...current, permId] };
        }
     });
  };

  const handleToggleAll = () => {
     const allPerms = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.id));
     if (formData.permissions?.length === allPerms.length) {
        setFormData(prev => ({ ...prev, permissions: [] }));
     } else {
        setFormData(prev => ({ ...prev, permissions: allPerms }));
     }
  };

  const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!formData.name) return;

     if (editingRole) {
        updateSystemRole({ ...formData, id: editingRole.id } as SystemRole);
     } else {
        addSystemRole({ ...formData, id: `role-${Date.now()}` } as SystemRole);
     }
     setIsModalOpen(false);
  };

  return (
    <div className="flex gap-6 h-full">
       {/* List View */}
       <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
             <div className="flex justify-between items-center">
               <h3 className="font-bold text-slate-700">System Roles</h3>
               <button 
                  onClick={() => handleOpenModal()}
                  className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
               >
                  <Plus className="w-4 h-4" />
               </button>
             </div>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                   type="text" 
                   placeholder="Search roles..." 
                   className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
             {filteredRoles.map(role => (
                <div 
                   key={role.id} 
                   className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                   onClick={() => handleOpenModal(role)}
                >
                   <div className="flex justify-between items-start">
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800">{role.name}</span>
                            {role.isSystem && <span title="System Role (Protected)"><Lock className="w-3 h-3 text-slate-400" /></span>}
                         </div>
                         <p className="text-xs text-slate-500 line-clamp-1">{role.description || 'No description'}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={(e) => { e.stopPropagation(); handleOpenModal(role); }} className="p-1.5 text-slate-400 hover:text-blue-600 rounded"><Edit2 className="w-3.5 h-3.5"/></button>
                         {!role.isSystem && (
                            <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete role?')) deleteSystemRole(role.id); }} className="p-1.5 text-slate-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                         )}
                      </div>
                   </div>
                   <div className="mt-2 flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map(p => (
                         <span key={p} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{p.split('.')[0]}</span>
                      ))}
                      {role.permissions.length > 3 && <span className="text-[10px] text-slate-400 px-1">+{role.permissions.length - 3}</span>}
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Detail/Edit View (Desktop Side Panel style or Modal) - Using Modal consistent with others */}
       {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><ShieldCheck className="w-6 h-6"/></div>
                      <div>
                         <h3 className="font-bold text-slate-800 text-lg">{editingRole ? 'Edit Role' : 'Create Role'}</h3>
                         <p className="text-xs text-slate-500">{editingRole?.isSystem ? 'System Role (Core permissions locked)' : 'Define custom access levels'}</p>
                      </div>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                   <form id="roleForm" onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role Name *</label>
                            <input 
                               required
                               type="text" 
                               value={formData.name}
                               onChange={e => setFormData({ ...formData, name: e.target.value })}
                               className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                               disabled={editingRole?.isSystem} // Prevent renaming system roles to avoid breakages
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <input 
                               type="text" 
                               value={formData.description}
                               onChange={e => setFormData({ ...formData, description: e.target.value })}
                               className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                         </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                         <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-800">Permissions</h4>
                            <button 
                               type="button" 
                               onClick={handleToggleAll} 
                               className="text-xs font-bold text-purple-600 hover:underline"
                            >
                               {formData.permissions?.length === PERMISSION_GROUPS.flatMap(g => g.permissions).length ? 'Deselect All' : 'Select All'}
                            </button>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {PERMISSION_GROUPS.map((group) => (
                               <div key={group.module} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                  <h5 className="font-bold text-slate-700 text-sm mb-3 border-b border-slate-200 pb-2">{group.module}</h5>
                                  <div className="space-y-2">
                                     {group.permissions.map(perm => {
                                        const isChecked = formData.permissions?.includes(perm.id) || (formData.permissions?.includes('all'));
                                        return (
                                           <label key={perm.id} className="flex items-center cursor-pointer group">
                                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors mr-3 ${isChecked ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-300 group-hover:border-purple-400'}`}>
                                                 {isChecked && <Check className="w-3 h-3 text-white" />}
                                              </div>
                                              <input 
                                                 type="checkbox" 
                                                 className="hidden" 
                                                 checked={isChecked}
                                                 onChange={() => handleTogglePermission(perm.id)}
                                                 disabled={formData.permissions?.includes('all')}
                                              />
                                              <span className={`text-sm ${isChecked ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>{perm.label}</span>
                                           </label>
                                        )
                                     })}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </form>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end space-x-3 bg-white shrink-0">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                   <button type="submit" form="roleForm" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-sm">Save Role</button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};
