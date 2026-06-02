
import React, { useState, useEffect, useRef } from 'react';
import { User, Branch, UserRole } from '../../types';
import { X, UserCircle, Edit2, Lock, Mail, Briefcase, Building2, CheckCircle, Loader2 } from 'lucide-react';
import { processAndResizeImage } from '../../lib/utils';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any, isEdit: boolean) => void;
  initialData?: User;
  branches: Branch[];
  currentUser: User | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ 
  isOpen, onClose, onSubmit, initialData, branches, currentUser 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
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

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        username: initialData.username,
        name: initialData.name,
        email: initialData.email || '',
        role: initialData.role,
        avatarUrl: initialData.avatarUrl || '',
        password: '', 
        department: initialData.department || '',
        branchId: initialData.branchId || ''
      });
    } else {
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
  }, [initialData, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setIsProcessing(true);
    try {
      // Avatar resize: 300px is sufficient
      const resized = await processAndResizeImage(file, 300, 0.8);
      setFormData(prev => ({ ...prev, avatarUrl: resized }));
    } catch (err) {
      alert('Failed to process image');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, avatarUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.name || !formData.role) return;
    if (!initialData && !formData.password) {
        alert("Password is required for new users.");
        return;
    }
    // C3: Password complexity validation (8+ chars, uppercase, lowercase, number or special char)
    if (formData.password) {
      const pwd = formData.password;
      if (pwd.length < 8) { alert("Password must be at least 8 characters."); return; }
      if (!/[A-Z]/.test(pwd)) { alert("Password must contain at least one uppercase letter."); return; }
      if (!/[a-z]/.test(pwd)) { alert("Password must contain at least one lowercase letter."); return; }
      if (!/[0-9!@#$%^&*()_+\-=\[\]{};':\"\\,.<>\/?]/.test(pwd)) { alert("Password must contain at least one number or special character."); return; }
    }
    if (currentUser?.role !== 'ADMIN' && formData.role === 'ADMIN') {
       alert("You do not have permission to create Administrator accounts.");
       return;
    }
    onSubmit(formData, !!initialData);
  };

  const getRolePermissions = (role: UserRole) => {
    const p = (label: string, access: boolean) => ({ label, access });
    switch (role.toUpperCase()) {
      case 'ADMIN': return [p('Full Access', true)];
      case 'MANAGER': return [p('Dashboard', true), p('Approvals', true), p('Reports', true), p('Settings', false)];
      case 'STAFF': return [p('Inventory', true), p('Stock', true), p('POS', true), p('Reports', false)];
      case 'CASHIER': return [p('POS', true), p('Sales History', true), p('Shift Mgmt', true), p('Inventory', false)];
      default: return [];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
          <h3 className="text-xl font-bold text-slate-800">
            {initialData ? 'Edit User' : 'Add New User'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
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
                      onClick={() => !isProcessing && fileInputRef.current?.click()}
                      className="relative w-16 h-16 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-primary-400 transition-colors overflow-hidden group"
                    >
                      {isProcessing ? (
                         <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      ) : formData.avatarUrl ? (
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
                            disabled={isProcessing}
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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
                       <p className="text-[10px] text-slate-400 mt-1">Auto-resized (Max 300px)</p>
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
                    Password {initialData && <span className="text-xs font-normal text-slate-400">(Leave blank to keep current)</span>}
                  </label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                     <input
                      required={!initialData}
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
                  {currentUser?.role === 'ADMIN' && (
                    <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'ADMIN' ? 'bg-white border-primary-500 shadow-sm ring-1 ring-primary-500' : 'border-slate-200 hover:bg-white'}`}>
                      <input 
                        type="radio" 
                        name="role" 
                        value="ADMIN" 
                        checked={formData.role === 'ADMIN'}
                        onChange={e => setFormData({...formData, role: 'Admin'})}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                      />
                      <div className="ml-3">
                         <span className="block text-sm font-medium text-slate-800">Administrator</span>
                         <span className="block text-xs text-slate-500">Full system configuration</span>
                      </div>
                    </label>
                  )}
                  <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'MANAGER' ? 'bg-white border-primary-500 shadow-sm ring-1 ring-primary-500' : 'border-slate-200 hover:bg-white'}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="MANAGER" 
                      checked={formData.role === 'MANAGER'}
                      onChange={e => setFormData({...formData, role: 'MANAGER'})}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                    />
                    <div className="ml-3">
                       <span className="block text-sm font-medium text-slate-800">Manager</span>
                       <span className="block text-xs text-slate-500">Dashboard, Approvals & Stock</span>
                    </div>
                  </label>
                  <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'STAFF' ? 'bg-white border-primary-500 shadow-sm ring-1 ring-primary-500' : 'border-slate-200 hover:bg-white'}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="STAFF" 
                      checked={formData.role === 'STAFF'}
                      onChange={e => setFormData({...formData, role: 'STAFF'})}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                    />
                    <div className="ml-3">
                       <span className="block text-sm font-medium text-slate-800">Staff</span>
                       <span className="block text-xs text-slate-500">Inventory, Warehouse & Stock</span>
                    </div>
                  </label>
                  <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'CASHIER' ? 'bg-white border-primary-500 shadow-sm ring-1 ring-primary-500' : 'border-slate-200 hover:bg-white'}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="CASHIER" 
                      checked={formData.role === 'CASHIER'}
                      onChange={e => setFormData({...formData, role: 'CASHIER'})}
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
                    {getRolePermissions(formData.role as UserRole).map((perm, idx) => (
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
                onClick={onClose}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-construction-orange text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
              >
                {initialData ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
