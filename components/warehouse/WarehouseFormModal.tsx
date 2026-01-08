
import React, { useState, useEffect } from 'react';
import { Warehouse } from '../../types';
import { XCircle } from 'lucide-react';

interface WarehouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Warehouse>) => void;
  initialData: Warehouse | null;
}

export const WarehouseFormModal: React.FC<WarehouseFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState<Partial<Warehouse>>({
    name: '', code: '', type: 'General', description: ''
  });

  useEffect(() => {
    if (initialData) setForm(initialData);
    else setForm({ name: '', code: '', type: 'General', description: '' });
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-lg font-bold text-slate-800">
            {initialData ? 'Edit Warehouse' : 'Add Warehouse'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
              <input
                required
                type="text"
                value={form.code}
                onChange={e => setForm({...form, code: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono uppercase"
                placeholder="WH-01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value as any})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="General">General</option>
                <option value="Cold Storage">Cold Storage</option>
                <option value="Hazardous">Hazardous</option>
                <option value="Showroom">Showroom</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none h-20"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-6 py-2 bg-construction-orange text-white rounded-lg hover:bg-orange-600 font-medium">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};
