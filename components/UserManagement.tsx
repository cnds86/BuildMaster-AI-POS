
import React, { useState } from 'react';
import { User, UserRoleDefinition, Department } from '../types';
import { Plus, Users, ShieldCheck, Briefcase, Lock } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { UserList } from './user/UserList';
import { UserFormModal } from './user/UserFormModal';
import { RoleTab } from './user/RoleTab';
import { DepartmentTab } from './user/DepartmentTab';

export const UserManagement: React.FC = () => {
  const { 
    users, addUser, updateUser, deleteUser,
    roles, addRole, updateRole, deleteRole,
    departments, addDepartment, updateDepartment, deleteDepartment,
    branches, currentUser, permissions
  } = useGlobal();

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'departments'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  const handleOpenModal = (user?: User) => {
    if (user && user.role === 'Admin' && currentUser?.role !== 'Admin') {
      alert("Only Administrators can edit other Administrator accounts.");
      return;
    }
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    if (user.role === 'Admin' && currentUser?.role !== 'Admin') {
      alert("Only Administrators can delete Administrator accounts.");
      return;
    }
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteUser(user.id);
    }
  };

  const handleSubmitUser = (formData: any, isEdit: boolean) => {
    const userData: any = {
      username: formData.username,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      avatarUrl: formData.avatarUrl,
      departmentId: formData.departmentId,
      branchId: formData.branchId
    };

    if (formData.password) {
      userData.password = formData.password;
    }

    if (isEdit && editingUser) {
        const existing = users.find(u => u.id === editingUser.id);
        if (existing && !userData.password) {
            userData.password = existing.password;
        }
        updateUser({ ...userData, id: editingUser.id });
    } else {
        addUser({ ...userData, id: `u-${Date.now()}` });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 h-full flex flex-col pb-20 md:pb-0 animate-fade-in max-w-[1600px] mx-auto w-full px-1">
      {/* Page Header - Style A */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-slate-900 text-white rounded-xl">
                <Lock className="w-5 h-5" />
             </div>
             <h2 className="text-4xl font-black text-slate-900 tracking-tight">Access Control</h2>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] flex items-center ml-11">
            <Users className="w-4 h-4 mr-2 text-construction-orange" />
            Personnel, Roles & Infrastructure
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit shadow-inner">
           {[
             { id: 'users', label: 'Users', icon: Users },
             { id: 'roles', label: 'Roles', icon: ShieldCheck },
             { id: 'departments', label: 'Departments', icon: Briefcase },
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                 activeTab === tab.id 
                   ? 'bg-white text-slate-900 shadow-md scale-105' 
                   : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               <tab.icon className="w-4 h-4 mr-2" />
               <span className="hidden sm:inline">{tab.label}</span>
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {activeTab === 'users' && (
          <div className="flex flex-col gap-6 flex-1 animate-fade-in">
             <div className="flex justify-end">
                <button 
                  onClick={() => handleOpenModal()}
                  className="flex items-center px-8 py-4 bg-slate-900 text-white rounded-[2rem] hover:bg-slate-800 transition-all font-black text-sm shadow-xl active:scale-95"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add New User
                </button>
             </div>
             <UserList 
                users={users} 
                branches={branches} 
                // Fix: Added departments prop to UserList
                departments={departments}
                currentUser={currentUser} 
                onEdit={handleOpenModal} 
                onDelete={handleDeleteUser} 
             />
          </div>
        )}

        {activeTab === 'roles' && (
          <RoleTab 
            roles={roles}
            permissions={permissions}
            onAdd={addRole}
            onUpdate={updateRole}
            onDelete={deleteRole} 
          />
        )}

        {activeTab === 'departments' && (
          <DepartmentTab 
            departments={departments}
            onAdd={addDepartment}
            onUpdate={updateDepartment}
            onDelete={deleteDepartment} 
          />
        )}
      </div>

      <UserFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitUser}
        initialData={editingUser}
        branches={branches}
        departments={departments}
        roles={roles}
        currentUser={currentUser}
      />
    </div>
  );
};
