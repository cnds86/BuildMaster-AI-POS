
import React, { useState } from 'react';
import { Department } from '../../types';
import { Briefcase, Plus, Edit2, Trash2, Hash, Layers } from 'lucide-react';
import { DepartmentFormModal } from './DepartmentFormModal';

interface DepartmentTabProps {
  departments: Department[];
  onAdd: (dept: Department) => void;
  onUpdate: (dept: Department) => void;
  onDelete: (id: string) => void;
}

export const DepartmentTab: React.FC<DepartmentTabProps> = ({ departments, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | undefined>(undefined);

  const handleOpenModal = (dept?: Department) => {
    setEditingDept(dept);
    setIsModalOpen(true);
  };

  const handleSave = (data: Partial<Department>) => {
    if (editingDept) {
      onUpdate({ ...editingDept, ...data } as Department);
    } else {
      onAdd({ ...data, id: `dept-${Date.now()}` } as Department);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in">
       <div className="flex justify-end">
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-8 py-4 bg-slate-900 text-white rounded-[2rem] hover:bg-slate-800 transition-all font-black text-sm shadow-xl active:scale-95"
          >
             <Plus className="w-5 h-5 mr-2" /> Register Department
          </button>
       </div>

       <div className="bg-white rounded-[2.5rem] border-2 border-slate-50 flex-1 overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto flex-1">
             <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sticky top-0 z-10">
                   <tr>
                      <th className="px-10 py-8">Unit Identity</th>
                      <th className="px-8 py-8">System ID</th>
                      <th className="px-8 py-8">Functional Domain</th>
                      <th className="px-10 py-8 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {departments.map(dept => (
                      <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="px-10 py-8">
                            <div className="flex items-center gap-5">
                               <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center border-2 border-white shadow-lg group-hover:scale-105 transition-transform group-hover:bg-construction-orange">
                                  <Briefcase className="w-6 h-6" />
                               </div>
                               <div>
                                  <span className="text-lg font-black text-slate-900 uppercase tracking-tighter block leading-none mb-1">{dept.name}</span>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organizational Node</span>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-8">
                            <div className="flex items-center font-mono text-[11px] font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 w-fit shadow-sm">
                               <Hash className="w-3.5 h-3.5 mr-2 text-construction-orange" /> {dept.id.toUpperCase()}
                            </div>
                         </td>
                         <td className="px-8 py-8">
                            <div className="max-w-md">
                               <p className="text-sm font-bold text-slate-500 leading-relaxed line-clamp-2">{dept.description || 'Central business unit responsible for multi-domain operations.'}</p>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                               <button onClick={() => handleOpenModal(dept)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-slate-100 transition-all">
                                  <Edit2 className="w-5 h-5" />
                               </button>
                               <button onClick={() => confirm('Permanently remove this organizational unit?') && onDelete(dept.id)} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                                  <Trash2 className="w-5 h-5" />
                               </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                   {departments.length === 0 && (
                      <tr>
                         <td colSpan={4} className="p-32 text-center">
                            <div className="bg-slate-50 inline-flex p-10 rounded-[3rem] mb-6 opacity-30">
                               <Layers className="w-20 h-20 text-slate-400" />
                            </div>
                            <p className="font-black uppercase text-xs tracking-[0.3em] text-slate-300">Hierarchy Empty</p>
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>

       <DepartmentFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
          initialData={editingDept}
       />
    </div>
  );
};
