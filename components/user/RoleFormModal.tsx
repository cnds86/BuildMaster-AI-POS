
import React, { useState, useEffect } from 'react';
import { UserRoleDefinition, Permission } from '../../types';
import { X, Check, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<UserRoleDefinition>) => void;
  initialData?: UserRoleDefinition;
  allPermissions: Permission[];
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({ 
  isOpen, onClose, onSubmit, initialData, allPermissions 
}) => {
  const [form, setForm] = useState<Partial<UserRoleDefinition>>({
    name: '', description: '', permissions: []
  });

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({ name: '', description: '', permissions: [] });
  }, [initialData, isOpen]);

  const togglePermission = (id: string) => {
     setForm(prev => {
        const current = prev.permissions || [];
        const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
        return { ...prev, permissions: next };
     });
  };

  const handleSelectAll = () => {
     setForm(prev => ({ ...prev, permissions: allPermissions.map(p => p.id) }));
  };

  const handleClearAll = () => {
     setForm(prev => ({ ...prev, permissions: [] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    onSubmit(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl">
                <ShieldCheck className="w-8 h-8" />
             </div>
             <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {initialData ? 'Edit Permissions' : 'Define Access Role'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure functional access boundaries</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
             <div className="space-y-6">
                <Input 
                  label="Role Title"
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Master Logistics"
                  className="text-xl font-black uppercase tracking-tighter"
                />
                
                <div className="space-y-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Functional Mandate</label>
                   <textarea
                     value={form.description || ''}
                     onChange={e => setForm({...form, description: e.target.value})}
                     className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] p-6 transition-all outline-none font-bold text-slate-800 focus:ring-4 focus:ring-orange-100 focus:border-construction-orange focus:bg-white resize-none h-40 placeholder:text-slate-300"
                     placeholder="Detailed responsibilities for this role profile..."
                   />
                </div>
             </div>

             <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between px-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-construction-orange" /> Capability Matrix
                   </label>
                   <div className="flex gap-4">
                      <button type="button" onClick={handleSelectAll} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Grant All</button>
                      <button type="button" onClick={handleClearAll} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Revoke All</button>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {allPermissions.map(p => {
                     const isSelected = form.permissions?.includes(p.id);
                     return (
                       <button
                         key={p.id}
                         type="button"
                         onClick={() => togglePermission(p.id)}
                         className={`group flex items-start p-6 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden ${isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-xl translate-x-1' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                       >
                          <div className={`mt-0.5 w-6 h-6 rounded-xl border-2 shrink-0 mr-4 flex items-center justify-center transition-all ${isSelected ? 'bg-construction-orange border-construction-orange' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
                             {isSelected && <Check className="w-4 h-4 text-white font-black" />}
                          </div>
                          <div>
                             <p className={`text-sm font-black uppercase tracking-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>{p.label}</p>
                             <p className={`text-[10px] font-medium leading-relaxed mt-1 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>{p.description}</p>
                          </div>
                       </button>
                     )
                   })}
                </div>
             </div>
          </div>

          <div className="flex items-center justify-end space-x-6 pt-10 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Discard Changes
            </button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="min-w-[320px] rounded-[2rem] py-5 shadow-2xl"
            >
              <CheckCircle2 className="w-6 h-6 mr-3" />
              Authorize Access Role
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
