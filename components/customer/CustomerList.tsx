
import React, { useState } from 'react';
import { Customer, CustomerLevel } from '../../types';
import { Search, Plus, User, Phone, Mail, Award, Edit2, Trash2, Star } from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  levels: CustomerLevel[];
  onAdd: () => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onView: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ 
  customers, 
  levels, 
  onAdd, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(term);
    const phoneMatch = (c.phone || '').toLowerCase().includes(term);
    const codeMatch = (c.code || '').toLowerCase().includes(term);
    return nameMatch || phoneMatch || codeMatch;
  });

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
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
          onClick={onAdd}
          className="flex items-center justify-center px-6 py-4 bg-construction-orange text-white rounded-xl hover:bg-orange-600 transition-colors font-medium shadow-sm whitespace-nowrap"
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
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">Membership</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center whitespace-nowrap">Loyalty</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    {customers.length > 0 
                      ? `No customers found matching "${searchTerm}"`
                      : "No customers yet. Click 'Add Customer' to start."}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const level = customer.level || levels.find(l => l.id === customer.levelId);
                  
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => onView(customer)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-full group-hover:bg-blue-100 transition-colors">
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
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">
                          <Award className="w-3 h-3 mr-1" />
                          {customer.loyaltyPoints || 0} pts
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(customer); }} 
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                               e.stopPropagation();
                               onDelete(customer.id);
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
  );
};
