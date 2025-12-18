
import React, { useState, useEffect } from 'react';
import { Customer, CustomerLevel } from '../../types';
import { X } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: Customer) => void;
  initialData?: Customer;
  levels: CustomerLevel[];
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  levels 
}) => {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    code: '',
    phone: '',
    taxId: '',
    address: '',
    email: '',
    loyaltyPoints: 0,
    notes: '',
    levelId: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        code: `CUST-${Date.now().toString().slice(-4)}`, // Simple auto-gen
        phone: '',
        taxId: '',
        address: '',
        email: '',
        loyaltyPoints: 0,
        notes: '',
        levelId: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    // Pass ID if editing, otherwise parent handles new ID
    const submission = { ...formData, id: initialData?.id } as Customer;
    onSubmit(submission);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col animate-fade-in">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
          <h3 className="text-xl font-bold text-slate-800">
            {initialData ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Code *</label>
                <input
                  required
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
             <input
               type="email"
               value={formData.email}
               onChange={e => setFormData({...formData, email: e.target.value})}
               className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
             />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
             <textarea
               value={formData.address}
               onChange={e => setFormData({...formData, address: e.target.value})}
               className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 h-20 resize-none"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID</label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={e => setFormData({...formData, taxId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loyalty Points</label>
                <input
                  type="number"
                  value={formData.loyaltyPoints}
                  onChange={e => setFormData({...formData, loyaltyPoints: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
             </div>
          </div>

          <div className="pt-2 border-t border-slate-100 mt-2">
             <label className="block text-sm font-bold text-slate-700 mb-2">Membership Level</label>
             <select
                value={formData.levelId || ''}
                onChange={e => setFormData({...formData, levelId: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
             >
                <option value="">No Membership Level</option>
                {levels.map(lvl => (
                   <option key={lvl.id} value={lvl.id}>
                      {lvl.name} ({lvl.discountPercentage}% Off)
                   </option>
                ))}
             </select>
          </div>

          <div className="flex justify-end pt-4 space-x-3 mt-auto">
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
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
