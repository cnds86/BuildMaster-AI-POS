
import React from 'react';
import { User, Branch } from '../../types';
import { UserCircle, ShieldCheck, LayoutDashboard, ClipboardList, Store, Building2, Briefcase, Edit2, Trash2 } from 'lucide-react';
import { roleLabel } from '../../lib/roles';

interface UserListProps {
  users: User[];
  branches: Branch[];
  currentUser: User | null;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, branches, currentUser, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-500 text-sm">User</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-sm">Role</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-sm">Branch & Dept</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-sm text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                         {user.avatarUrl ? (
                           <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                         ) : (
                           <UserCircle className="w-6 h-6 text-slate-400" />
                         )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      user.role === 'MANAGER' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      user.role === 'STAFF' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      {user.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 mr-1"/>}
                      {user.role === 'MANAGER' && <LayoutDashboard className="w-3 h-3 mr-1"/>}
                      {user.role === 'Staff' && <ClipboardList className="w-3 h-3 mr-1"/>}
                      {user.role === 'CASHIER' && <Store className="w-3 h-3 mr-1"/>}
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex flex-col space-y-1">
                      {user.branchId ? (
                        <div className="flex items-center text-xs text-slate-700 font-medium">
                          <Building2 className="w-3 h-3 mr-1.5 text-slate-400"/>
                          {branches.find(b => b.id === user.branchId)?.name || 'Unknown Branch'}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No branch assigned</span>
                      )}
                      {user.department && (
                        <div className="flex items-center text-xs text-slate-500">
                          <Briefcase className="w-3 h-3 mr-1.5 text-slate-400"/>
                          {user.department}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                     <span className="text-sm text-slate-600">Active</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                       <button onClick={() => onEdit(user)} className={`p-1.5 rounded transition-colors ${user.role === 'ADMIN' && currentUser?.role !== 'ADMIN' ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-primary-600 hover:bg-slate-100'}`}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(user)} 
                        className={`p-1.5 rounded transition-colors ${user.role === 'ADMIN' && currentUser?.role !== 'ADMIN' ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  );
};
