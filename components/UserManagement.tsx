
import React, { useState } from 'react';
import { User } from '../types';
import { Plus } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { UserList } from './user/UserList';
import { UserFormModal } from './user/UserFormModal';

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
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          <p className="text-slate-500">Manage system users, roles, and access permissions.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add User
        </button>
      </div>

      <UserList 
        users={users} 
        branches={branches} 
        currentUser={currentUser} 
        onEdit={handleOpenModal} 
        onDelete={handleDeleteUser} 
      />

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
