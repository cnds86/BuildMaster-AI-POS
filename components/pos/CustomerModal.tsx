
import React, { useMemo, useState } from 'react';
import { Customer } from '../../types';
import { Search, X } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onSelectCustomer: (customer: Customer) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, customers, onSelectCustomer }) => {
  const [customerSearch, setCustomerSearch] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone.includes(customerSearch) ||
      c.code.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customers, customerSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
       <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <h3 className="font-bold text-slate-800 text-lg">Select Customer</h3>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-4 flex-1 overflow-hidden flex flex-col">
             <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                <input 
                   autoFocus
                   placeholder="Search name, phone, code..." 
                   className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                   value={customerSearch}
                   onChange={e => setCustomerSearch(e.target.value)}
                />
             </div>
             <div className="overflow-y-auto flex-1 space-y-2">
                {filteredCustomers.length === 0 ? (
                   <div className="text-center py-8 text-slate-400">No customers found.</div>
                ) : (
                   filteredCustomers.map(c => (
                      <button 
                         key={c.id} 
                         onClick={() => onSelectCustomer(c)}
                         className="w-full text-left p-3 hover:bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center transition-colors group"
                      >
                         <div>
                            <div className="font-bold text-slate-800 group-hover:text-blue-600">{c.name}</div>
                            <div className="text-xs text-slate-500">{c.code} {c.phone && `• ${c.phone}`}</div>
                         </div>
                         {c.loyaltyPoints > 0 && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-bold border border-yellow-100">{c.loyaltyPoints} pts</span>}
                      </button>
                   ))
                )}
             </div>
          </div>
       </div>
    </div>
  );
};
