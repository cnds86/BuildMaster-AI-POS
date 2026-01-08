
import React, { useState } from 'react';
import { Customer, CustomerLevel } from '../../types';
import { Search, Plus, User, Phone, Mail, Award, Edit2, Trash2, Star, ChevronRight } from 'lucide-react';

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
    <div className="flex flex-col h-full space-y-4">
      {/* Header & Search */}
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
          className="flex items-center justify-center px-6 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Card List View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
           <h3 className="font-bold text-slate-700">Registered Customers</h3>
           <span className="text-xs font-bold bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">
              {filteredCustomers.length} Total
           </span>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3 bg-slate-50/50">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <User className="w-8 h-8 opacity-20" />
               </div>
               <p>{customers.length > 0 ? `No customers found matching "${searchTerm}"` : "No customers yet."}</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const level = customer.level || levels.find(l => l.id === customer.levelId);
              
              return (
                <div 
                  key={customer.id} 
                  onClick={() => onView(customer)}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden"
                >
                  {/* Left Highlight Bar based on Level Color */}
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: level?.color || '#e2e8f0' }}></div>

                  {/* Avatar & Info */}
                  <div className="flex items-center flex-1 w-full md:w-auto">
                     <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg mr-4 border border-slate-200 shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <h4 className="font-bold text-slate-800 truncate text-base">{customer.name}</h4>
                           <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                              {customer.code}
                           </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center text-sm text-slate-500 mt-0.5 gap-x-3">
                           {customer.phone && (
                              <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {customer.phone}</span>
                           )}
                           {customer.email && (
                              <span className="flex items-center"><Mail className="w-3 h-3 mr-1" /> {customer.email}</span>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end pl-16 md:pl-0">
                     {/* Level Badge */}
                     {level ? (
                        <div className="flex items-center px-3 py-1 rounded-full text-xs font-bold border" style={{ 
                           backgroundColor: `${level.color}15`, 
                           borderColor: `${level.color}30`,
                           color: level.color 
                        }}>
                           <Star className="w-3 h-3 mr-1.5 fill-current" />
                           {level.name}
                           <span className="ml-1 opacity-70">(-{level.discountPercentage}%)</span>
                        </div>
                     ) : (
                        <span className="text-xs text-slate-400 font-medium px-2">No Level</span>
                     )}

                     {/* Points Badge */}
                     <div className="flex items-center px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">
                        <Award className="w-3 h-3 mr-1.5" />
                        {customer.loyaltyPoints.toLocaleString()} pts
                     </div>
                  </div>

                  {/* Action Buttons (Visible on hover on desktop, always on mobile if needed) */}
                  <div className="flex items-center gap-2 pl-16 md:pl-0 w-full md:w-auto justify-end md:opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(customer); }} 
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                     >
                        <Edit2 className="w-4 h-4" />
                     </button>
                     <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(customer.id); }} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                     <ChevronRight className="w-5 h-5 text-slate-300 ml-1" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
