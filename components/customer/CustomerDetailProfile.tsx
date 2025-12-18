
import React, { useMemo } from 'react';
import { Customer, Sale } from '../../types';
import { ArrowLeft, Edit2, User, Phone, Mail, Star, MapPin, History, ShoppingBag, CheckCircle, AlertCircle } from 'lucide-react';

interface CustomerDetailProfileProps {
  customer: Customer;
  sales: Sale[];
  onBack: () => void;
  onEdit: () => void;
  formatPrice: (amount: number) => string;
}

export const CustomerDetailProfile: React.FC<CustomerDetailProfileProps> = ({ 
  customer, 
  sales, 
  onBack, 
  onEdit, 
  formatPrice 
}) => {
  
  const customerStats = useMemo(() => {
    const customerSales = sales.filter(s => s.customerId === customer.id && s.status !== 'voided');
    const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
    const totalDebt = customerSales
      .filter(s => s.paymentStatus === 'unpaid' || s.paymentStatus === 'partial')
      .reduce((acc, s) => acc + (s.remainingAmount || 0), 0);
    const lastVisit = customerSales.length > 0 ? new Date(customerSales[0].date) : null;
    
    return {
      history: customerSales,
      totalSpent,
      totalDebt,
      lastVisit,
      visitCount: customerSales.length
    };
  }, [customer, sales]);

  const level = customer.level;

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      {/* Detail Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to List
        </button>
        <div className="flex space-x-2">
          <button onClick={onEdit} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 flex items-center">
            <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
         <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-start">
               <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border-2 border-white shadow-sm">
                  <User className="w-10 h-10" />
               </div>
               <div className="ml-4">
                  <h2 className="text-2xl font-bold text-slate-800">{customer.name}</h2>
                  <p className="text-slate-500 text-sm flex items-center mt-1">
                     <span className="font-mono bg-slate-100 px-1.5 rounded text-slate-600 mr-2">{customer.code}</span>
                     {customer.phone && <span className="flex items-center mr-3"><Phone className="w-3 h-3 mr-1" /> {customer.phone}</span>}
                     {customer.email && <span className="flex items-center"><Mail className="w-3 h-3 mr-1" /> {customer.email}</span>}
                  </p>
                  {level && (
                     <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm" style={{ backgroundColor: level.color || '#64748b' }}>
                        <Star className="w-3 h-3 mr-1" fill="currentColor" />
                        {level.name} Member ({level.discountPercentage}% Off)
                     </div>
                  )}
               </div>
            </div>
            
            {/* Key Stats */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 uppercase font-bold mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-blue-900">{formatPrice(customerStats.totalSpent)}</p>
               </div>
               <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <p className="text-xs text-orange-600 uppercase font-bold mb-1">Outstanding Debt</p>
                  <p className="text-2xl font-bold text-orange-900">{formatPrice(customerStats.totalDebt)}</p>
               </div>
               <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                  <p className="text-xs text-yellow-600 uppercase font-bold mb-1">Loyalty Points</p>
                  <p className="text-2xl font-bold text-yellow-900">{customer.loyaltyPoints}</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Last Visit</p>
                  <p className="text-lg font-bold text-slate-700">
                     {customerStats.lastVisit ? customerStats.lastVisit.toLocaleDateString() : 'Never'}
                  </p>
               </div>
            </div>
         </div>
         
         {customer.address && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-slate-600 flex items-start">
               <MapPin className="w-4 h-4 mr-2 mt-0.5 text-slate-400" />
               {customer.address}
            </div>
         )}
      </div>

      {/* Sales History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
         <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center">
               <History className="w-5 h-5 mr-2 text-slate-500" />
               Transaction History
            </h3>
            <span className="text-xs font-medium bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">
               {customerStats.visitCount} orders
            </span>
         </div>
         <div className="overflow-y-auto flex-1">
            {customerStats.history.length === 0 ? (
               <div className="text-center py-12 text-slate-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No purchase history found.</p>
               </div>
            ) : (
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold sticky top-0">
                     <tr>
                        <th className="px-6 py-3">Date / Invoice</th>
                        <th className="px-6 py-3">Items</th>
                        <th className="px-6 py-3 text-right">Total</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-center">Payment</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {customerStats.history.map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="font-medium text-slate-800">{new Date(sale.date).toLocaleDateString()}</div>
                              <div className="text-xs text-slate-500 font-mono">{sale.id}</div>
                           </td>
                           <td className="px-6 py-4 text-slate-600 text-sm">
                              {sale.items.length} items
                              <div className="text-xs text-slate-400 truncate max-w-[200px]">
                                 {sale.items.map(i => i.name).join(', ')}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right font-bold text-slate-800">
                              {formatPrice(sale.total)}
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                 sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                 sale.paymentStatus === 'partial' ? 'bg-orange-100 text-orange-700' :
                                 'bg-red-100 text-red-700'
                              }`}>
                                 {sale.paymentStatus === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                                 {sale.paymentStatus === 'unpaid' && <AlertCircle className="w-3 h-3 mr-1" />}
                                 {sale.paymentStatus}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-center text-sm capitalize text-slate-600">
                              {sale.paymentMethod}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            )}
         </div>
      </div>
    </div>
  );
};
