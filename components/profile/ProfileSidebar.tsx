
import React from 'react';
import { User, Department } from '../../types';
import { Briefcase, UserCircle, Shield, Mail, Smartphone, Hash } from 'lucide-react';

interface ProfileSidebarProps {
  user: User;
  // Fix: Added departments to props to lookup name from ID
  departments: Department[];
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ user, departments }) => {
  return (
    <div className="space-y-6">
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
             <Briefcase className="w-5 h-5 mr-2 text-slate-500" /> Professional Details
          </h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center"><Hash className="w-4 h-4 mr-2"/> Employee ID</span>
                <span className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{user.id.slice(0,8)}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center"><UserCircle className="w-4 h-4 mr-2"/> Username</span>
                <span className="text-sm font-bold text-slate-700">{user.username}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center"><Shield className="w-4 h-4 mr-2"/> Department</span>
                {/* Fix: Lookup department name by ID from the User object */}
                <span className="text-sm font-medium text-slate-700">{departments.find(d => d.id === user.departmentId)?.name || 'General'}</span>
             </div>
          </div>
       </div>

       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
             <Mail className="w-5 h-5 mr-2 text-slate-500" /> Contact Info
          </h3>
          <div className="space-y-4">
             <div className="flex items-start">
                <Mail className="w-4 h-4 text-slate-400 mt-1 mr-3" />
                <div>
                   <p className="text-xs text-slate-400 uppercase font-bold">Email Address</p>
                   <p className="text-sm font-medium text-slate-700">{user.email || 'No email provided'}</p>
                </div>
             </div>
             <div className="flex items-start">
                <Smartphone className="w-4 h-4 text-slate-400 mt-1 mr-3" />
                <div>
                   <p className="text-xs text-slate-400 uppercase font-bold">Phone Number</p>
                   <p className="text-sm font-medium text-slate-700">Not Linked</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};
