
import React, { useState } from 'react';
import { UserRoleDefinition, Permission } from '../../types';
import { ShieldCheck, Plus, Edit2, Trash2, Info, Lock } from 'lucide-react';
import { RoleFormModal } from './RoleFormModal';

interface RoleTabProps {
  roles: UserRoleDefinition[];
  permissions: Permission[];
  onAdd: (role: UserRoleDefinition) => void;
  onUpdate: (role: UserRoleDefinition) => void;
  onDelete: (id: string) => void;
}

export const RoleTab: React.FC<RoleTabProps> = ({ roles, permissions, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRoleDefinition | undefined>(undefined);

  const handleOpenModal = (role?: UserRoleDefinition) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleSave = (data: Partial<UserRoleDefinition>) => {
    if (editingRole) {
      onUpdate({ ...editingRole, ...data } as UserRoleDefinition);
    } else {
      onAdd({ ...data, id: `role-${Date.now()}` } as UserRoleDefinition);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in">
       <div className="flex justify-end">
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-8 py-4 bg-slate-900 text-white rounded-[2rem] hover:bg-slate-800 transition-all font-black text-sm shadow-xl active:scale-95"
          >
             <Plus className="w-5 h-5 mr-2" /> Add New Role
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto pr-2 custom-scrollbar pb-10">
          {roles.map(role => (
             <div key={role.id} className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 hover:border-construction-orange transition-all group flex flex-col h-full relative overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1">
                <div className="flex justify-between items-start mb-8">
                   <div className={`p-4 rounded-[1.5rem] shadow-xl ${role.isSystem ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-orange-50 text-orange-600 shadow-orange-100'}`}>
                      <ShieldCheck className="w-8 h-8" />
                   </div>
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button onClick={() => handleOpenModal(role)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
                         <Edit2 className="w-5 h-5" />
                      </button>
                      {!role.isSystem && (
                        <button onClick={() => confirm('Permanently delete this access role?') && onDelete(role.id)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                           <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                   </div>
                </div>

                <div className="mb-8">
                   <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{role.name}</h4>
                      {role.isSystem && <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-1 rounded-lg uppercase tracking-widest">Core</span>}
                   </div>
                   <p className="text-sm font-medium text-slate-400 leading-relaxed">{role.description || 'Defines functional access boundaries for personnel.'}</p>
                </div>

                <div className="space-y-4 mt-auto border-t border-slate-50 pt-6">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center">
                      <Lock className="w-3.5 h-3.5 mr-2 text-construction-orange" /> {role.permissions.length} Enabled Modules
                   </p>
                   <div className="flex flex-wrap gap-2">
                      {role.permissions.slice(0, 5).map(pId => {
                        const p = permissions.find(x => x.id === pId);
                        return (
                          <span key={pId} className="text-[10px] font-black bg-slate-50 text-slate-600 border border-slate-100 px-3 py-1.5 rounded-xl uppercase tracking-wide">
                             {p?.label || pId}
                          </span>
                        );
                      })}
                      {role.permissions.length > 5 && (
                         <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-slate-900">
                            +{role.permissions.length - 5} MORE
                         </span>
                      )}
                   </div>
                </div>
             </div>
          ))}
       </div>

       <RoleFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
          initialData={editingRole}
          allPermissions={permissions}
       />
    </div>
  );
};
