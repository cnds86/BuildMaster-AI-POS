
import React, { useState, useEffect, useRef } from 'react';
import { User, Branch, UserRoleDefinition, Department } from '../../types';
import { X, UserCircle, Edit2, Lock, Mail, Briefcase, Building2, CheckCircle, ShieldCheck, Hash } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any, isEdit: boolean) => void;
  initialData?: User;
  branches: Branch[];
  departments: Department[];
  roles: UserRoleDefinition[];
  currentUser: User | null;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const UserFormModal: React.FC<UserFormModalProps> = ({ 
  isOpen, onClose, onSubmit, initialData, branches, departments, roles, currentUser 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'Cashier',
    avatarUrl: '',
    departmentId: '',
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
        departmentId: initialData.departmentId || '',
        branchId: initialData.branchId || ''
      });
    } else {
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        role: roles[0]?.name || 'Cashier',
        avatarUrl: '',
        departmentId: departments[0]?.id || '',
        branchId: branches[0]?.id || ''
      });
    }
  }, [initialData, isOpen, roles, departments, branches]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
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
    if (!formData.username || !formData.name || !formData.role) return;
    if (!initialData && !formData.password) {
        alert("Password is required for new users.");
        return;
    }
    if (currentUser?.role !== 'Admin' && formData.role === 'Admin') {
       alert("You do not have permission to create Administrator accounts.");
       return;
    }
    onSubmit(formData, !!initialData);
  };

  if (!isOpen) return null;

  const selectedRoleDef = roles.find(r => r.name === formData.role);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {initialData ? 'Edit Identity' : 'Register Identity'}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Staff Access & Profile Configuration</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Column: Form Fields */}
              <div className="space-y-6">
                <div className="flex items-center space-x-6 pb-6 border-b border-slate-50">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-24 h-24 rounded-[2rem] bg-slate-900 overflow-hidden flex items-center justify-center cursor-pointer border-4 border-white shadow-xl group transition-transform hover:scale-105"
                  >
                    {formData.avatarUrl ? (
                      <>
                        <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Edit2 className="w-5 h-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <UserCircle className="w-10 h-10 text-white/40" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Profile Image</p>
                     <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-slate-200 transition-all"
                        >
                          Change
                        </button>
                        {formData.avatarUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-4 py-2 bg-white border-2 border-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-600 hover:border-red-100 transition-all"
                          >
                            Remove
                          </button>
                        )}
                     </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>

                <Input 
                   label="Full Name"
                   required
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   placeholder="e.g. John Wick"
                />

                <div className="grid grid-cols-2 gap-6">
                  <Input 
                    label="Username"
                    required
                    icon={<Hash className="w-4 h-4" />}
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    placeholder="jwick"
                  />
                  <Input 
                    label={initialData ? "Update Password" : "Secure Password"}
                    required={!initialData}
                    type="password"
                    icon={<Lock className="w-4 h-4" />}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>

                <Input 
                   label="Email Address"
                   type="email"
                   icon={<Mail className="w-4 h-4" />}
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                   placeholder="wick@continental.com"
                />
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Unit / Dept</label>
                    <div className="relative group">
                       <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-construction-orange transition-colors" />
                       <select
                         value={formData.departmentId || ''}
                         onChange={e => setFormData({...formData, departmentId: e.target.value})}
                         className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-construction-orange transition-all outline-none font-bold text-slate-800 appearance-none"
                       >
                         <option value="">Unassigned</option>
                         {departments.map(d => (
                           <option key={d.id} value={d.id}>{d.name}</option>
                         ))}
                       </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Station / Branch</label>
                    <div className="relative group">
                       <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-construction-orange transition-colors" />
                       <select
                         value={formData.branchId || ''}
                         onChange={e => setFormData({...formData, branchId: e.target.value})}
                         className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-construction-orange transition-all outline-none font-bold text-slate-800 appearance-none"
                       >
                         <option value="">Select Station</option>
                         {branches.map(b => (
                           <option key={b.id} value={b.id}>{b.name}</option>
                         ))}
                       </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Role Selector */}
              <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 h-fit">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-6">Functional Permissions Role</label>
                
                <div className="space-y-4 mb-8">
                  {roles.map(role => {
                    if (role.name === 'Admin' && currentUser?.role !== 'Admin') return null;
                    
                    const isSelected = formData.role === role.name;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setFormData({...formData, role: role.name})}
                        className={`w-full flex items-start p-5 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden group ${
                          isSelected 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200 translate-x-1' 
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        <div className={`p-3 rounded-2xl mr-4 shrink-0 transition-colors ${isSelected ? 'bg-white/10' : 'bg-slate-50 text-slate-400'}`}>
                           <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                           <span className="block text-sm font-black uppercase tracking-widest mb-1">{role.name}</span>
                           <span className={`block text-[10px] font-medium leading-relaxed ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                              {role.description || 'Custom access matrix'}
                           </span>
                        </div>
                        {isSelected && (
                           <div className="absolute top-4 right-4">
                              <CheckCircle className="w-6 h-6 text-construction-orange" />
                           </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-200">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 flex items-center">
                     <Lock className="w-3.5 h-3.5 mr-2 text-construction-orange" /> Capabilities Matrix
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedRoleDef?.permissions.map((pId) => (
                      <div key={pId} className="flex items-center text-[11px] font-black uppercase tracking-wider text-slate-500 bg-white/50 px-4 py-2.5 rounded-xl border border-slate-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3"></div>
                        {pId}
                      </div>
                    ))}
                    {(!selectedRoleDef?.permissions || selectedRoleDef.permissions.length === 0) && (
                       <p className="text-[10px] text-slate-400 font-bold italic text-center py-4 uppercase">No specific capabilities mapped</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-10 mt-10 border-t border-slate-100 gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-10 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Discard Changes
              </button>
              <Button
                type="submit"
                variant="primary"
                size="xl"
                className="min-w-[280px] rounded-[2rem]"
              >
                {initialData ? 'Update Staff Member' : 'Confirm Registration'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
