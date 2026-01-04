
import React, { useState, useEffect } from 'react';
import { Branch } from '../../types';
import { X, Check, Building2, User, Phone, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (branch: Partial<Branch>) => void;
  initialData: Branch | null;
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState<Partial<Branch>>({
    name: '', address: '', phone: '', manager: '', isActive: true
  });

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({ name: '', address: '', phone: '', manager: '', isActive: true });
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl flex flex-col overflow-hidden border border-white/20">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Building2 className="w-5 h-5 text-slate-400" />
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {initialData ? 'Edit Branch' : 'Register Branch'}
              </h3>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-7">Store Location Definition</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-6">
            <Input 
              label="Branch Name"
              icon={<Building2 className="w-5 h-5" />}
              required
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g. Downtown Store"
            />
            
            <Input 
              label="Physical Address"
              icon={<MapPin className="w-5 h-5" />}
              required
              value={form.address}
              onChange={e => setForm({...form, address: e.target.value})}
              placeholder="Full street address..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Contact Phone"
                icon={<Phone className="w-5 h-5" />}
                required
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                placeholder="021-XXX-XXXX"
              />
              <Input 
                label="Branch Manager"
                icon={<User className="w-5 h-5" />}
                required
                value={form.manager}
                onChange={e => setForm({...form, manager: e.target.value})}
                placeholder="Name of manager"
              />
            </div>

            <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only"
                    checked={form.isActive}
                    onChange={e => setForm({...form, isActive: e.target.checked})}
                  />
                  <div className={cn(
                    "w-12 h-6 rounded-full transition-all",
                    form.isActive ? "bg-emerald-500" : "bg-slate-300"
                  )}></div>
                  <div className={cn(
                    "absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm",
                    form.isActive && "translate-x-6"
                  )}></div>
                </div>
                <span className="ml-3 text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors">
                  Operational Status (Active)
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Discard
            </button>
            <Button
              type="submit"
              variant="primary"
              size="xl"
              className="min-w-[220px]"
            >
              <Check className="w-5 h-5 mr-2" />
              Save Branch
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
