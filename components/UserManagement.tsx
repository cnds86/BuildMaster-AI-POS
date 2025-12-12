import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  ShieldCheck, 
  UserCircle, 
  Mail, 
  Lock, 
  CheckCircle, 
  Store, 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  Building2, 
  Briefcase, 
  Upload, 
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const { branches, currentUser } = useGlobal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'Cashier',
    avatarUrl: '',
    department: '',
    branchId: ''
  });

  const handleOpenModal = (user?: User) => {
    // Permission check: Managers cannot edit Admins
    if (user && user.role === 'Admin' && currentUser?.role !== 'Admin') {
      alert("Only Administrators can edit other Administrator accounts.");
      return;
    }

    if (user) {
      setEditingId(user.id);
      setFormData({ 
        username: user.username,
        name: user.name,
        email: user.email || '',
        role: user.role,
        avatarUrl: user.avatarUrl || '',
        password: '', // Don't pre-fill password for editing security
        department: user.department || '',
        branchId: user.branchId || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        role: 'Cashier',
        avatarUrl: '',
        department: '',
        branchId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, avatarUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    if (!formData.username || !formData.name || !formData.role) return;
    if (!editingId && !formData.password) {
        alert("Password is required for new users.");
        return;
    }

    // Security check: If not Admin, ensure they haven't somehow selected Admin role
    if (currentUser?.role !== 'Admin' && formData.role === 'Admin') {
       alert("You do not have permission to create Administrator accounts.");
       return;
    }

    const userData: any = {
      username: formData.username,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      avatarUrl: formData.avatarUrl,
      department: formData.department,
      branchId: formData.branchId
    };

    // Only update password if provided
    if (formData.password) {
      userData.password = formData.password;
    }

    if (editingId) {
      // For updates, preserve old password if new one isn't provided
      const existingUser = users.find(u => u.id === editingId);
      if (existingUser && !userData.password) {
          userData.password = existingUser.password;
      }
      onUpdateUser({ ...userData, id: editingId });
    } else {
      onAddUser({ ...userData, id: `u-${Date.now()}` });
    }
    setIsModalOpen(false);
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

  // Permission Visualizer
  const getRolePermissions = (role: UserRole) => {
    const p = (label: string, access: boolean) => ({ label, access });

    switch (role) {
      case 'Admin':
        return [
          p('Dashboard', true),
          p('Point of Sale (POS)', true),
          p('My Shift', true),
          p('Sales History', true),
          p('Inventory', true),
          p('Stock Management', true),
          p('Customers & Levels', true),
          p('Approvals', true),
          p('Promotions', true),
          p('Data Sync', true),
          p('Categories', true),
          p('Units', true),
          p('Branches', true),
          p('Warehouse (WMS)', true),
          p('User Management', true),
          p('Settings', true),
        ];
      case 'Manager':
        return [
          p('Dashboard', true),
          p('Point of Sale (POS)', true),
          p('My Shift', true),
          p('Sales History', true),
          p('Inventory', true),
          p('Stock Management', true),
          p('Customers & Levels', true),
          p('Approvals', true),
          p('Promotions', true),
          p('Data Sync', true),
          p('Categories', true),
          p('Units', true),
          p('Branches', true),
          p('Warehouse (WMS)', true),
          p('User Management', true),
          p('Settings', false),
        ];
      case 'Staff':
        return [
          p('Dashboard', false),
          p('Point of Sale (POS)', true),
          p('My Shift', true),
          p('Sales History', false),
          p('Inventory', true),
          p('Stock Management', true),
          p('Customers & Levels', true),
          p('Approvals', false),
          p('Promotions', true),
          p('Data Sync', false),
          p('Categories', true),
          p('Units', true),
          p('Branches', false),
          p('Warehouse (WMS)', true),
          p('User Management', false),
          p('Settings', false),
        ];
      case 'Cashier':
        return [
          p('Dashboard', false),
          p('Point of Sale (POS)', true),
          p('My Shift', true),
          p('Sales History', true),
          p('Inventory', false),
          p('Stock Management', false),
          p('Customers & Levels', true),
          p('Approvals', false),
          p('Promotions', false),
          p('Data Sync', false),
          p('Categories', false),
          p('Units', false),
          p('Branches', false),
          p('Warehouse (WMS)', false),
          p('User Management', false),
          p('Settings', false),
        ];
      default:
        return [];
    }
  };

  const permissions = getRolePermissions(formData.role as UserRole || 'Cashier');

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
          <p className="text-slate-500">Manage system users, roles, and access permissions.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-500 text-sm">User</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-sm">Role</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-sm">Branch & Dept</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-sm text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                         {user.avatarUrl ? (
                           <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                         ) : (
                           <UserCircle className="w-6 h-6 text-slate-400" />
                         )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      user.role === 'Manager' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      user.role === 'Staff' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      {user.role === 'Admin' && <ShieldCheck className="w-3 h-3 mr-1"/>}
                      {user.role === 'Manager' && <LayoutDashboard className="w-3 h-3 mr-1"/>}
                      {user.role === 'Staff' && <ClipboardList className="w-3 h-3 mr-1"/>}
                      {user.role === 'Cashier' && <Store className="w-3 h-3 mr-1"/>}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex flex-col space-y-1">
                      {user.branchId ? (
                        <div className="flex items-center text-xs text-slate-700 font-medium">
                          <Building2 className="w-3 h-3 mr-1.5 text-slate-400"/>
                          {branches.find(b => b.id === user.branchId)?.name || 'Unknown Branch'}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No branch assigned</span>
                      )}
                      {user.department && (
                        <div className="flex items-center text-xs text-slate-500">
                          <Briefcase className="w-3 h-3 mr-1.5 text-slate-400"/>
                          {user.department}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                     <span className="text-sm text-slate-600">Active</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                       <button onClick={() => handleOpenModal(user)} className={`p-1.5 rounded transition-colors ${user.role === 'Admin' && currentUser?.role !== 'Admin' ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-primary-600 hover:bg-slate-100'}`}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user)} 
                        className={`p-1.5 rounded transition-colors ${user.role === 'Admin' && currentUser?.role !== 'Admin' ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Form Fields */}
                  <div className="space-y-5">
                    {/* Avatar Upload */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Profile Avatar</label>
                      <div className="flex items-center space-x-4">
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="relative w-16 h-16 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-primary-400 transition-colors overflow-hidden group"
                        >
                          {formData.avatarUrl ? (
                            <>
                              <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <Edit2 className="w-4 h-4 text-white" />
                              </div>
                            </>
                          ) : (
                            <UserCircle className="w-8 h-8 text-slate-400" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                           <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Upload
                              </button>
                              {formData.avatarUrl && (
                                <button
                                  type="button"
                                  onClick={handleRemoveImage}
                                  className="px-3 py-1.5 bg-white border border-red-200 rounded-md text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              )}
                           </div>
                           <p className="text-[10px] text-slate-400 mt-1">Max 5MB. Formats: JPG, PNG</p>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                      <input
                        required
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-slate-50"
                        placeholder="username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Password {editingId && <span className="text-xs font-normal text-slate-400">(Leave blank to keep current)</span>}
                      </label>
                      <div className="relative">
                         <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                         <input
                          required={!editingId}
                          type="password"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-slate-400 font-normal">(Optional)</span></label>
                      <div className="relative">
                         <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                         <input
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                      <div className="relative">
                         <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                         <input
                          type="text"
                          value={formData.department}
                          onChange={e => setFormData({...formData, department: e.target.value})}
                          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="e.g. Sales, Warehouse"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                      <div className="relative">
                         <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                         <select
                          value={formData.branchId || ''}
                          onChange={e => setFormData({...formData, branchId: e.target.value})}
                          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                          <option value="">Select Branch</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Role & Permissions */}
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                    <label className="block text-sm font-bold text-slate-700 mb-4">Role & Permissions</label>
                    
                    <div className="space-y-3 mb-6">
                      {/* Admin - Only visible if current user is Admin */}
                      {currentUser?.role === 'Admin' && (
                        <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'Admin' ? 'bg-white border-primary-500 shadow-sm ring-1 ring-primary-500' : 'border-slate-200 hover:bg-white'}`}>
                          <input 
                            type="radio" 
                            name="role" 
                            value="Admin" 
                            checked={formData.role === 'Admin'}
                            onChange={e => setFormData({...formData, role: 'Admin'})}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                          />
                          <div className="ml-3">
                             <span className="block text-sm font-medium text-slate-800">Administrator</span>
                             <span className="block text-xs text-slate-500">Full system configuration</span>
                          </div>
                        </label>
                      )}

                      {/* Manager */}
                      <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'Manager' ? 'bg-white border-primary-500 shadow-sm ring-1 ring-primary-500' : 'border-slate-200 hover:bg-white'}`}>
                        <input 
                          type="radio" 
                          name="role" 
                          value="Manager" 
                          checked={formData.role === 'Manager'}
                          onChange={e => setFormData({...formData, role: 'Manager'})}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                        />
                        <div className="ml-3">
                           <span className="block text-sm font-medium text-slate-800">Manager</span>
                           <span className="block text-xs text-slate-500">Dashboard, Approvals & Stock</span>
                        </div>
                      </label>

                      {/* Staff */}
                      <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'Staff' ? 'bg-white border-primary-500 shadow-sm ring-1 ring-primary-500' : 'border-slate-200 hover:bg-white'}`}>
                        <input 
                          type="radio" 
                          name="role" 
                          value="Staff" 
                          checked={formData.role === 'Staff'}
                          onChange={e => setFormData({...formData, role: 'Staff'})}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                        />
                        <div className="ml-3">
                           <span className="block text-sm font-medium text-slate-800">Staff</span>
                           <span className="block text-xs text-slate-500">Inventory, Warehouse & Stock</span>
                        </div>
                      </label>

                      {/* Cashier */}
                      <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'Cashier' ? 'bg-white border-primary-500 shadow-sm ring-1 ring-primary-500' : 'border-slate-200 hover:bg-white'}`}>
                        <input 
                          type="radio" 
                          name="role" 
                          value="Cashier" 
                          checked={formData.role === 'Cashier'}
                          onChange={e => setFormData({...formData, role: 'Cashier'})}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                        />
                        <div className="ml-3">
                           <span className="block text-sm font-medium text-slate-800">Cashier</span>
                           <span className="block text-xs text-slate-500">POS & Sales only</span>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Access Capabilities</span>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        {permissions.map((perm, idx) => (
                          <div key={idx} className="flex items-center text-xs">
                            {perm.access ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-2 flex-shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-300 mr-2 flex-shrink-0" />
                            )}
                            <span className={perm.access ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                              {perm.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 mt-6 border-t border-slate-100 space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-construction-orange text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    {editingId ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};