import React, { useState, useEffect } from 'react';
import { Customer, CustomerLevel } from '../../types';
import { X, Store, User } from 'lucide-react';

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

  // Extended fields for RETAILER type
  const [customerType, setCustomerType] = useState<'RETAIL' | 'RETAILER'>('RETAIL');
  const [paymentTerms, setPaymentTerms] = useState(0);
  const [creditLimit, setCreditLimit] = useState('');
  const [businessType, setBusinessType] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setCustomerType((initialData as any).customer_type || 'RETAIL');
      setPaymentTerms((initialData as any).payment_terms || 0);
      setCreditLimit((initialData as any).credit_limit || '');
      setBusinessType((initialData as any).business_type || '');
    } else {
      setFormData({
        name: '',
        code: `CUST-${Date.now().toString().slice(-4)}`,
        phone: '',
        taxId: '',
        address: '',
        email: '',
        loyaltyPoints: 0,
        notes: '',
        levelId: ''
      });
      setCustomerType('RETAIL');
      setPaymentTerms(0);
      setCreditLimit('');
      setBusinessType('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const submission = { 
      ...formData, 
      id: initialData?.id,
      customer_type: customerType,
      payment_terms: paymentTerms,
      credit_limit: Number(creditLimit) || 0,
      business_type: businessType || undefined,
    } as any;
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
          {/* Customer Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setCustomerType('RETAIL')}
              className={`flex-1 py-2 px-4 rounded-lg border flex items-center justify-center gap-2 ${
                customerType === 'RETAIL' 
                  ? 'bg-blue-100 border-blue-500 text-blue-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              <User className="w-4 h-4" />
              ลูกค้าทั่วไป
            </button>
            <button
              type="button"
              onClick={() => setCustomerType('RETAILER')}
              className={`flex-1 py-2 px-4 rounded-lg border flex items-center justify-center gap-2 ${
                customerType === 'RETAILER' 
                  ? 'bg-purple-100 border-purple-500 text-purple-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              <Store className="w-4 h-4" />
              ร้านค้าส่ง
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {customerType === 'RETAILER' ? 'ื่อร้านค้า *' : ' Full Name *'}
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder={customerType === 'RETAILER' ? 'Phongsavanh Builder' : 'Mr. Somchai'}
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

          {/* RETAILER specific fields */}
          {customerType === 'RETAILER' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1">วงเงินเครดิต (฿)</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={e => setCreditLimit(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-1"> payment_terms (วัน)</label>
                <select
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value={0}>-- เลือก --</option>
                  <option value={15}>15 วัน</option>
                  <option value={30}>30 วัน</option>
                  <option value={60}>60 วัน</option>
                  <option value={90}>90 วัน</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-purple-700 mb-1">เลขผู้เสียภาษี</label>
                <input
                  type="text"
                  value={formData.taxId || ''}
                  onChange={e => setFormData({...formData, taxId: e.target.value})}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="เลข 14 หลัก"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-purple-700 mb-1">ประเภทธุรกิจ</label>
                <input
                  type="text"
                  value={businessType}
                  onChange={e => setBusinessType(e.target.value)}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="ร้านวัสดุก่อสร้าง"
                />
              </div>
            </div>
          )}

          {/* Regular fields for RETAIL */}
          {customerType === 'RETAIL' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID</label>
                <input
                  type="text"
                  value={formData.taxId || ''}
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
          )}

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
