
import React, { useState, useEffect } from 'react';
import { Branch } from '../../types';
import { XCircle } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-xl font-bold text-slate-800">
            {initialData ? 'Edit Branch' : 'Add New Branch'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Branch Name</label>
            <input 
              required
              type="text" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
              placeholder="e.g. Downtown Store"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input 
              type="text" 
              value={form.address} 
              onChange={e => setForm({...form, address: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input 
                type="text" 
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Manager</label>
              <input 
                type="text" 
                value={form.manager} 
                onChange={e => setForm({...form, manager: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox" 
              id="branchActive"
              checked={form.isActive}
              onChange={e => setForm({...form, isActive: e.target.checked})}
              className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
            />
            <label htmlFor="branchActive" className="text-sm font-medium text-slate-700">Branch is Active</label>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="px-6 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">Save Branch</button>
          </div>
        </form>
      </div>
    </div>
  );
};
