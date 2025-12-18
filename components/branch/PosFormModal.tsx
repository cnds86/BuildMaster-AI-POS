
import React, { useState, useEffect } from 'react';
import { PosMachine } from '../../types';
import { XCircle } from 'lucide-react';

interface PosFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pos: Partial<PosMachine>) => void;
  initialData: PosMachine | null;
}

export const PosFormModal: React.FC<PosFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState<Partial<PosMachine>>({
    machineNumber: '', status: 'active'
  });

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({ machineNumber: '', status: 'active' });
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
         <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-lg font-bold text-slate-800">
            {initialData ? 'Edit POS Terminal' : 'Add POS Terminal'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">POS Machine Number / ID</label>
            <input 
              required
              type="text" 
              value={form.machineNumber} 
              onChange={e => setForm({...form, machineNumber: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono" 
              placeholder="e.g. POS-05"
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
             <select 
               value={form.status}
               onChange={e => setForm({...form, status: e.target.value as any})}
               className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
             >
               <option value="active">Active</option>
               <option value="maintenance">Maintenance</option>
               <option value="inactive">Inactive</option>
             </select>
          </div>
           <div className="flex justify-end pt-4">
            <button type="submit" className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium">Save Terminal</button>
          </div>
        </form>
      </div>
    </div>
  );
};
