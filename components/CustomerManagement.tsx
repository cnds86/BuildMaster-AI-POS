
import React, { useState } from 'react';
import { Customer, CustomerLevel } from '../types';
import { Plus, Edit2, Trash2, Search, User, Phone, MapPin, Mail, Award, X, Check, Tag, Star, AlertCircle } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

interface CustomerManagementProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers = [], // Default to empty array to prevent map/filter crash
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer
}) => {
  // Safe destructuring with fallback
  const { customerLevels, addCustomerLevel, updateCustomerLevel, deleteCustomerLevel } = useGlobal();
  const safeLevels = customerLevels || []; 

  const [activeTab, setActiveTab] = useState<'customers' | 'levels'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  // Level Modal
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [levelForm, setLevelForm] = useState<Partial<CustomerLevel>>({
    name: '',
    discountPercentage: 0,
    color: '#64748b'
  });

  // Safe Filtering Logic
  const filteredCustomers = (customers || []).filter(c => {
    if (!c) return false;
    const term = searchTerm.toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(term);
    const phoneMatch = (c.phone || '').toLowerCase().includes(term);
    const codeMatch = (c.code || '').toLowerCase().includes(term);
    return nameMatch || phoneMatch || codeMatch;
  });

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      setFormData(customer);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        code: `CUST-${String((customers || []).length + 1).padStart(3, '0')}`,
        phone: '',
        taxId: '',
        address: '',
        email: '',
        loyaltyPoints: 0,
        notes: '',
        levelId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenLevelModal = (level?: CustomerLevel) => {
    if (level) {
      setEditingLevelId(level.id);
      setLevelForm(level);
    } else {
      setEditingLevelId(null);
      setLevelForm({
        name: '',
        discountPercentage: 0,
        color: '#64748b'
      });
    }
    setIsLevelModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingId) {
      onUpdateCustomer({ ...formData, id: editingId } as Customer);
    } else {
      onAddCustomer({ ...formData, id: `c-${Date.now()}` } as Customer);
    }
    setIsModalOpen(false);
  };

  const handleLevelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelForm.name) return;

    if (editingLevelId) {
      updateCustomerLevel({ ...levelForm, id: editingLevelId } as CustomerLevel);
    } else {
      addCustomerLevel({ ...levelForm, id: `lvl-${Date.now()}` } as CustomerLevel);
    }
    setIsLevelModalOpen(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Customer Management</h2>
          <p className="text-slate-500">Manage customer profiles and membership tiers.</p>
        </div>
        <div className="flex space-x-2">
           <button 
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'customers' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Customers
          </button>
          <button 
            onClick={() => setActiveTab('levels')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'levels' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Membership Levels
          </button>
        </div>
      </div>

      {activeTab === 'customers' && (
        <>
          <div className="flex gap-4">
            <div className="relative flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Name, Phone or Code..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center px-6 py-4 bg-construction-orange text-white rounded-xl hover:bg-orange-600 transition-colors font-medium shadow-sm whitespace-nowrap"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Customer
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Contact</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Membership</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Loyalty</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        {customers && customers.length > 0 
                          ? `No customers found matching "${searchTerm}"`
                          : "No customers yet. Click 'Add Customer' to start."}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => {
                      // Safe check for level association
                      const level = customer.level || safeLevels.find(l => l.id === customer.levelId);
                      
                      return (
                        <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                                <User className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">{customer.name}</div>
                                <div className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1">
                                  {customer.code}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            <div className="flex flex-col space-y-1">
                              {customer.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1.5 text-slate-400" />
                                  {customer.phone}
                                </div>
                              )}
                              {customer.email && (
                                <div className="flex items-center">
                                  <Mail className="w-3 h-3 mr-1.5 text-slate-400" />
                                  {customer.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             {level ? (
                               <span 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                                style={{ backgroundColor: level.color || '#64748b' }}
                               >
                                 <Star className="w-3 h-3 mr-1" fill="currentColor" />
                                 {level.name} ({level.discountPercentage}%)
                               </span>
                             ) : (
                               <span className="text-xs text-slate-400 italic">No Level</span>
                             )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">
                              <Award className="w-3 h-3 mr-1" />
                              {customer.loyaltyPoints || 0} pts
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => handleOpenModal(customer)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                   if(confirm(`Delete customer ${customer.name}?`)) onDeleteCustomer(customer.id);
                                }} 
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'levels' && (
        <div className="flex gap-6 h-full">
           <div className="w-1/3 flex flex-col gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-slate-800 mb-2">About Membership Levels</h3>
                 <p className="text-sm text-slate-500 mb-4">
                    Create tiers to automatically apply discounts at the POS. Assign customers to tiers to reward loyalty.
                 </p>
                 <button 
                    onClick={() => handleOpenLevelModal()}
                    className="w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium flex items-center justify-center"
                 >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Level
                 </button>
              </div>
           </div>

           <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                 <h3 className="font-bold text-slate-700">Active Membership Tiers</h3>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-3">
                 {safeLevels.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                       <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                       <p>No membership levels defined.</p>
                    </div>
                 ) : (
                    safeLevels.map(level => (
                       <div key={level.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all bg-white">
                          <div className="flex items-center">
                             <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm mr-4"
                                style={{ backgroundColor: level.color || '#64748b' }}
                             >
                                {level.discountPercentage}%
                             </div>
                             <div>
                                <h4 className="font-bold text-slate-800">{level.name}</h4>
                                <p className="text-xs text-slate-500">Auto-applies {level.discountPercentage}% discount</p>
                             </div>
                          </div>
                          <div className="flex space-x-2">
                             <button onClick={() => handleOpenLevelModal(level)} className="p-2 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50">
                                <Edit2 className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={() => {
                                   if(confirm('Delete this level?')) deleteCustomerLevel(level.id);
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
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
                    {safeLevels.map(lvl => (
                       <option key={lvl.id} value={lvl.id}>
                          {lvl.name} ({lvl.discountPercentage}% Off)
                       </option>
                    ))}
                 </select>
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
      )}

      {/* Level Modal */}
      {isLevelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-800">
                {editingLevelId ? 'Edit Level' : 'New Level'}
              </h3>
              <button onClick={() => setIsLevelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleLevelSubmit} className="p-6 space-y-4">
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Level Name</label>
                 <input
                   required
                   type="text"
                   value={levelForm.name}
                   onChange={e => setLevelForm({...levelForm, name: e.target.value})}
                   className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                   placeholder="e.g. Gold Member"
                 />
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Discount Percentage</label>
                 <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={levelForm.discountPercentage}
                      onChange={e => setLevelForm({...levelForm, discountPercentage: parseFloat(e.target.value) || 0})}
                      className="w-full pl-4 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Badge Color</label>
                 <div className="flex gap-2">
                    {['#64748b', '#eab308', '#94a3b8', '#8b5cf6', '#ef4444', '#22c55e', '#3b82f6'].map(color => (
                       <button
                          key={color}
                          type="button"
                          onClick={() => setLevelForm({...levelForm, color})}
                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${levelForm.color === color ? 'border-slate-800 ring-2 ring-slate-300' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                       />
                    ))}
                 </div>
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setIsLevelModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors shadow-sm"
                >
                  Save Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
