
import React, { useState } from 'react';
import { Department, User } from '../../types';
import { useGlobal } from '../../context/GlobalContext';
import { Plus, Edit2, Trash2, Building2, Search, X } from 'lucide-react';

export const DepartmentManager: React.FC = () => {
  const { departments, addDepartment, updateDepartment, deleteDepartment, users } = useGlobal();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Department>>({
     name: '', description: '', managerId: ''
  });

  const filteredDepts = departments.filter(d => 
     d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (dept?: Department) => {
     if (dept) {
        setEditingDept(dept);
        setFormData(dept);
     } else {
        setEditingDept(null);
        setFormData({ name: '', description: '', managerId: '' });
     }
     setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!formData.name) return;

     if (editingDept) {
        updateDepartment({ ...formData, id: editingDept.id } as Department);
     } else {
        addDepartment({ ...formData, id: `dept-${Date.now()}` } as Department);
     }
     setIsModalOpen(false);
  };

  return (
    <div className="flex gap-6 h-full">
       {/* List View */}
       <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center gap-4 bg-slate-50">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                   type="text" 
                   placeholder="Search departments..." 
                   className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <button 
                onClick={() => handleOpenModal()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm shadow-sm whitespace-nowrap"
             >
                <Plus className="w-4 h-4 mr-2" /> Add Dept
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                   <tr>
                      <th className="px-6 py-3">Department Name</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3">Manager / Lead</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {filteredDepts.map(dept => {
                      const manager = users.find(u => u.id === dept.managerId);
                      return (
                         <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                               <div className="flex items-center font-bold text-slate-800">
                                  <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                                  {dept.name}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{dept.description || '-'}</td>
                            <td className="px-6 py-4 text-sm">
                               {manager ? (
                                  <span className="font-medium text-slate-700 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{manager.name}</span>
                               ) : (
                                  <span className="text-slate-400 italic text-xs">Unassigned</span>
                               )}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2">
                                  <button onClick={() => handleOpenModal(dept)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4"/></button>
                                  <button onClick={() => { if(confirm('Delete department?')) deleteDepartment(dept.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4"/></button>
                               </div>
                            </td>
                         </tr>
                      );
                   })}
                   {filteredDepts.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-400">No departments found.</td></tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>

       {/* Modal */}
       {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                   <h3 className="font-bold text-slate-800 text-lg">{editingDept ? 'Edit Department' : 'New Department'}</h3>
                   <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Department Name *</label>
                      <input 
                         required
                         type="text" 
                         value={formData.name}
                         onChange={e => setFormData({ ...formData, name: e.target.value })}
                         className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                         placeholder="e.g. Sales"
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <textarea 
                         value={formData.description}
                         onChange={e => setFormData({ ...formData, description: e.target.value })}
                         className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Head of Department</label>
                      <select 
                         value={formData.managerId}
                         onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                         className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                         <option value="">Select Manager</option>
                         {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                         ))}
                      </select>
                   </div>
                   <div className="flex justify-end pt-4 space-x-3">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                      <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm">Save Department</button>
                   </div>
                </form>
             </div>
          </div>
       )}
    </div>
  );
};
