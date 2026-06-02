
import React, { useState } from 'react';
import { User } from '../../../types';
import { Shield, Lock, Save, CheckCircle, AlertCircle, Globe, Smartphone } from 'lucide-react';

interface SecurityTabProps {
  user: User;
  onUpdatePassword: (current: string, next: string) => Promise<void>;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ user, onUpdatePassword }) => {
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'idle', message: '' });

    if (passForm.newPassword !== passForm.confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    if (passForm.newPassword.length < 8) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdatePassword(passForm.currentPassword, passForm.newPassword);
      setStatus({ type: 'success', message: 'Password changed successfully' });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to update password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
     <div className="max-w-lg mx-auto animate-fade-in">
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-8 flex items-start">
           <Shield className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
           <div>
              <h4 className="font-bold text-yellow-800 text-sm">Security Recommendations</h4>
              <ul className="text-xs text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                 <li>Use a strong password with at least 8 characters.</li>
                 <li>Include numbers and symbols.</li>
                 <li>Do not share your account credentials.</li>
              </ul>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Current Password</label>
              <div className="relative group">
                 <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                 <input 
                    type="password" 
                    required
                    value={passForm.currentPassword}
                    onChange={e => setPassForm({...passForm, currentPassword: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
                    placeholder="Enter current password"
                 />
              </div>
           </div>
           
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">New Password</label>
              <div className="relative group">
                 <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                 <input 
                    type="password" 
                    required
                    value={passForm.newPassword}
                    onChange={e => setPassForm({...passForm, newPassword: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
                    placeholder="At least 6 characters"
                 />
              </div>
           </div>

           <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirm New Password</label>
              <div className="relative group">
                 <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                 <input 
                    type="password" 
                    required
                    value={passForm.confirmPassword}
                    onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
                    placeholder="Re-enter new password"
                 />
              </div>
           </div>

           {status.message && (
              <div className={`p-4 rounded-xl text-sm flex items-start shadow-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                 {status.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0" />}
                 <span className="font-medium">{status.message}</span>
              </div>
           )}

           <div className="pt-2">
              <button 
                 type="submit" 
                 disabled={isSubmitting}
                 className="flex items-center justify-center w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold shadow-lg disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-xl transform active:scale-[0.98]"
              >
                 {isSubmitting ? 'Updating...' : <><Save className="w-4 h-4 mr-2" /> Update Password</>}
              </button>
           </div>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100">
           <h4 className="font-bold text-slate-800 mb-4 text-sm">Recent Login Sessions</h4>
           <div className="space-y-3">
              <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg">
                 <div className="flex items-center">
                    <Globe className="w-4 h-4 text-slate-400 mr-2" />
                    <span className="font-medium text-slate-700">Chrome on Windows</span>
                 </div>
                 <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full border border-green-100">Active Now</span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 bg-white border border-slate-100 rounded-lg">
                 <div className="flex items-center">
                    <Smartphone className="w-4 h-4 text-slate-400 mr-2" />
                    <span className="font-medium text-slate-600">Safari on iPhone</span>
                 </div>
                 <span className="text-slate-400 text-xs">2 days ago</span>
              </div>
           </div>
        </div>
     </div>
  );
};
