
import React, { useState } from 'react';
import { User } from '../types';
import { Plus, Users, Building2, ShieldCheck } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { UserList } from './user/UserList';
import { UserFormModal } from './user/UserFormModal';
import { DepartmentManager } from './user/DepartmentManager';
import { RoleManager } from './user/RoleManager';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const { branches, currentUser } = useGlobal();
  const [activeTab, setActiveTab] = useState<'users' | 'departments' | 'roles'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  const handleOpenModal = (user?: User) => {
    // Permission check: Managers cannot edit Admins
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
      onDeleteUser(user.id);
    }
  };

  const handleSubmit = (formData: any, isEdit: boolean) => {
    // Prepare Data
    const userData: any = {
      username: formData.username,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      avatarUrl: formData.avatarUrl,
      department: formData.department,
      branchId: formData.branchId
    };

    if (formData.password) {
      userData.password = formData.password;
    }

    if (isEdit && editingUser) {
        // If edit and no password provided, preserve old password logic is handled by global hook logic or backend
        // But for client state update simulation:
        const existing = users.find(u => u.id === editingUser.id);
        if (existing && !userData.password) {
            userData.password = existing.password;
        }
        onUpdateUser({ ...userData, id: editingUser.id });
    } else {
        onAddUser({ ...userData, id: `u-${Date.now()}` });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          <p className="text-slate-500">Manage system users, roles, and access permissions.</p>
        </div>
        
        {/* Only show Add User button when on Users tab */}
        {activeTab === 'users' && (
           <button 
             onClick={() => handleOpenModal()}
             className="flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-sm whitespace-nowrap"
           >
             <Plus className="w-5 h-5 mr-2" />
             Add User
           </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
         <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
             activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Users
        </button>
        <button 
          onClick={() => setActiveTab('departments')}
          className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
             activeTab === 'departments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4 mr-2" />
          Departments
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
             activeTab === 'roles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4 mr-2" />
          Roles & Permissions
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
         {activeTab === 'users' && (
            <UserList 
               users={users} 
               branches={branches} 
               currentUser={currentUser} 
               onEdit={handleOpenModal} 
               onDelete={handleDeleteUser} 
            />
         )}

         {activeTab === 'departments' && <DepartmentManager />}
         
         {activeTab === 'roles' && <RoleManager />}
      </div>

      <UserFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingUser}
        branches={branches}
        currentUser={currentUser}
      />
    </div>
  );
};
