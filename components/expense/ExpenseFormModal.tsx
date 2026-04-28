import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory } from '../../types';
import { X, Check } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Expense | null;
  categories: ExpenseCategory[];
  onSave: (data: Partial<Expense>) => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen, onClose, initialData, categories, onSave
}) => {
  const { currentUser } = useGlobal();
  const [formData, setFormData] = useState<Partial<Expense>>({
    categoryId: categories[0]?.id || '',
    amount: 0,
    paymentMethod: 'cash',
    description: '',
    referenceNo: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        categoryId: categories[0]?.id || '',
        amount: 0,
        paymentMethod: 'cash',
        description: '',
        referenceNo: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.amount || !formData.description) return;
    
    onSave({
      ...formData,
      id: initialData?.id || `EXP-${Date.now()}`,
      recordedBy: initialData?.recordedBy || currentUser?.id || 'sys',
      recordedByName: initialData?.recordedByName || currentUser?.name || 'System',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
       <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <h3 className="text-xl font-bold text-slate-800">
                {initialData ? 'Edit Expense' : 'Record New Expense'}
             </h3>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
             </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Date *</label>
                <input 
                  type="date"
                  required
                  value={formData.date?.split('T')[0]}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500"
                />
             </div>
             
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500"
                >
                   {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>

             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Paid electricity bill"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500"
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Amount *</label>
                  <input 
                    type="number"
                    min="0.01" step="0.01" required
                    value={formData.amount || ''}
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 text-red-600 font-bold"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500"
                  >
                     <option value="cash">Cash</option>
                     <option value="transfer">Bank Transfer</option>
                     <option value="credit">Credit Card</option>
                  </select>
               </div>
             </div>

             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Receipt / Ref No. (Optional)</label>
                <input 
                  type="text"
                  value={formData.referenceNo}
                  onChange={e => setFormData({...formData, referenceNo: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500"
                />
             </div>

             <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
                   Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm flex items-center">
                   <Check className="w-5 h-5 mr-2" />
                   Save Expense
                </button>
             </div>
          </form>
       </div>
    </div>
  );
}
