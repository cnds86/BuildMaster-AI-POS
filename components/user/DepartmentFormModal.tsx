
import React, { useState, useEffect } from 'react';
import { Department } from '../../types';
import { X, CheckCircle2, Briefcase, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Department>) => void;
  initialData?: Department;
}

export const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({ 
  isOpen, onClose, onSubmit, initialData 
}) => {
  const [form, setForm] = useState<Partial<Department>>({
    name: '', description: ''
  });

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({ name: '', description: '' });
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    onSubmit(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-white/20">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl">
                <Briefcase className="w-8 h-8" />
             </div>
             <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {initialData ? 'Edit Structure' : 'New Department'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mt-1">Organizational Unit Registry</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="space-y-6">
            <Input 
              label="Department Designation"
              required
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g. Fulfillment Center"
              className="text-xl font-black uppercase tracking-tighter"
            />
            
            <div className="space-y-2">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scope of Operations</label>
               <textarea
                 value={form.description || ''}
                 onChange={e => setForm({...form, description: e.target.value})}
                 className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] p-8 transition-all outline-none font-bold text-slate-800 focus:ring-4 focus:ring-orange-100 focus:border-construction-orange focus:bg-white resize-none h-48 placeholder:text-slate-300"
                 placeholder="Define the primary functions, responsibilities, and oversight of this business unit..."
               />
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
             <div className="p-2 bg-white rounded-xl shadow-sm">
                <Info className="w-5 h-5 text-blue-500" />
             </div>
             <p className="text-xs font-bold text-blue-700 leading-relaxed">
                Departments allow you to categorize staff for reporting and organizational visibility. They do not impact functional system permissions which are handled by Roles.
             </p>
          </div>

          <div className="flex items-center justify-end space-x-6 pt-4 border-t border-slate-100">
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
              size="lg"
              className="min-w-[320px] rounded-[2rem] py-5 shadow-2xl"
            >
              <CheckCircle2 className="w-6 h-6 mr-3" />
              Save Unit Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
