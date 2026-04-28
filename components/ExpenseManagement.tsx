import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, User, Branch } from '../types';
import { Plus, Search, Filter, Trash2, Edit2, FileText, Download } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { ExpenseFormModal } from './expense/ExpenseFormModal';

interface ExpenseManagementProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  users: User[];
  branches: Branch[];
}

export const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ 
  expenses, categories, users, branches 
}) => {
  const { addExpense, updateExpense, deleteExpense, formatPrice, currentUser } = useGlobal();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today'|'week'|'month'|'all'>('month');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Filter Data
  const filteredExpenses = useMemo(() => {
    let result = expenses;
    
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(e => 
        e.description.toLowerCase().includes(q) || 
        e.referenceNo?.toLowerCase().includes(q)
      );
    }
    
    // Category
    if (filterCategory !== 'all') {
      result = result.filter(e => e.categoryId === filterCategory);
    }

    // Date
    const today = new Date();
    if (dateRange === 'today') {
      const dString = today.toISOString().split('T')[0];
      result = result.filter(e => e.date.startsWith(dString));
    } else if (dateRange === 'week') {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      result = result.filter(e => new Date(e.date) >= lastWeek);
    } else if (dateRange === 'month') {
      const lastMonth = new Date(today);
      lastMonth.setDate(lastMonth.getDate() - 30);
      result = result.filter(e => new Date(e.date) >= lastMonth);
    }

    return result.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm, filterCategory, dateRange]);

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleOpenForm = (exp?: Expense) => {
    setEditingExpense(exp || null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Expenses</h2>
          <p className="text-slate-500">Track store spending, petty cash, and utilities.</p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" /> Record Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-4">
               <FileText className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-slate-500 font-medium mb-1">Total Selected Expenses</p>
               <h3 className="text-2xl font-bold text-slate-800">{formatPrice(totalExpense)}</h3>
            </div>
         </div>
         {/* Categories overview or generic stats could go here */}
      </div>

      <div className="flex flex-col md:flex-row gap-4 shrink-0">
         <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500"
            />
         </div>
         <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700"
         >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
         </select>
         <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700"
         >
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
            <option value="all">All Time</option>
         </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
         <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                     <th className="p-4 font-bold text-slate-700">Date</th>
                     <th className="p-4 font-bold text-slate-700">Description</th>
                     <th className="p-4 font-bold text-slate-700">Category</th>
                     <th className="p-4 font-bold text-slate-700">Recorded By</th>
                     <th className="p-4 font-bold text-slate-700 text-right">Amount</th>
                     <th className="p-4 font-bold text-slate-700 text-center">Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredExpenses.length === 0 ? (
                     <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                           No expenses found.
                        </td>
                     </tr>
                  ) : (
                     filteredExpenses.map(exp => (
                        <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                           <td className="p-4 text-sm font-medium text-slate-600">
                              {new Date(exp.date).toLocaleDateString()}
                           </td>
                           <td className="p-4">
                              <p className="text-sm font-bold text-slate-800">{exp.description}</p>
                              {exp.referenceNo && <span className="text-xs text-slate-400">Ref: {exp.referenceNo}</span>}
                           </td>
                           <td className="p-4 text-sm">
                              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                 {categories.find(c => c.id === exp.categoryId)?.name || 'Uncategorized'}
                              </span>
                           </td>
                           <td className="p-4 text-sm text-slate-600">
                              {users.find(u => u.id === exp.recordedBy)?.name || exp.recordedByName || 'Unknown'}
                           </td>
                           <td className="p-4 text-sm font-bold text-red-600 text-right">
                              {formatPrice(exp.amount)}
                           </td>
                           <td className="p-4 flex justify-center space-x-2">
                              <button onClick={() => handleOpenForm(exp)} className="p-2 text-slate-400 hover:text-primary-600 transition-colors bg-white border border-slate-200 rounded shadow-sm">
                                 <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => { if(confirm('Delete expense?')) deleteExpense(exp.id); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white border border-slate-200 rounded shadow-sm">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      <ExpenseFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingExpense}
        categories={categories}
        onSave={(data) => {
           if (editingExpense) updateExpense(data as Expense);
           else addExpense(data as Expense);
        }}
      />
    </div>
  );
};
