
import React, { useState, useMemo } from 'react';
import { User, Shift, Sale } from '../types';
import { 
  BarChart4, 
  TrendingUp, 
  Lock, 
  Globe 
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { verifyPasswordSync, hashPasswordSync } from '../lib/auth';

// Sub-components
import { ProfileHeader } from './profile/ProfileHeader';
import { ProfileSidebar } from './profile/ProfileSidebar';
import { OverviewTab } from './profile/tabs/OverviewTab';
import { PerformanceTab } from './profile/tabs/PerformanceTab';
import { SecurityTab } from './profile/tabs/SecurityTab';
import { SettingsTab } from './profile/tabs/SettingsTab';

interface UserProfileProps {
  user: User;
  shifts: Shift[];
  sales: Sale[];
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, shifts, sales }) => {
  // Fix: Added departments to destructured context values
  const { updateUser, branches, departments, formatPrice } = useGlobal();
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'security' | 'settings'>('overview');

  // Stats Logic
  const myShifts = useMemo(() => shifts.filter(s => s.userId === user.id), [shifts, user.id]);
  const mySales = useMemo(() => sales.filter(s => s.userId === user.id && s.status !== 'voided'), [sales, user.id]);
  const totalSalesValue = mySales.reduce((acc, s) => acc + s.total, 0);
  const branchName = branches.find(b => b.id === user.branchId)?.name || 'Unassigned';

  const stats = {
    shifts: myShifts.length,
    orders: mySales.length,
    revenue: formatPrice(totalSalesValue)
  };

  // Image Upload Handlers
  const handleUpdateAvatar = (file: File) => {
    if (file.size > 2 * 1024 * 1024) return alert('File too large (Max 2MB)');
    const reader = new FileReader();
    reader.onloadend = () => updateUser({ ...user, avatarUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleUpdateCover = (file: File) => {
    if (file.size > 3 * 1024 * 1024) return alert('File too large (Max 3MB)');
    const reader = new FileReader();
    reader.onloadend = () => updateUser({ ...user, coverUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  // Password Logic (Abstracted)
  const handleUpdatePassword = async (current: string, next: string) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword: current, newPassword: next })
      });

      if (!res.ok) {
        // Fallback for offline/demo
        const isValid = verifyPasswordSync(current, user.password || '');
        if (isValid) {
           const newHash = hashPasswordSync(next);
           updateUser({ ...user, password: newHash });
           return; 
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Password update failed');
      }
    } catch (err: any) {
       // Allow local update if API fails (Demo mode)
       try {
         const isValid = verifyPasswordSync(current, user.password || '');
         if (isValid) {
            const newHash = hashPasswordSync(next);
            updateUser({ ...user, password: newHash });
            return;
         }
       } catch (e) {
         throw err;
       }
       throw err;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <ProfileHeader 
        user={user} 
        branchName={branchName} 
        stats={stats}
        onUpdateAvatar={handleUpdateAvatar} 
        onUpdateCover={handleUpdateCover} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        {/* Fix: Pass departments to ProfileSidebar */}
        <ProfileSidebar user={user} departments={departments} />

        {/* Right Content */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
           <div className="flex border-b border-slate-100 overflow-x-auto">
              {[
                 { id: 'overview', label: 'Overview', icon: BarChart4 },
                 { id: 'performance', label: 'Performance', icon: TrendingUp },
                 { id: 'security', label: 'Security', icon: Lock },
                 { id: 'settings', label: 'Preferences', icon: Globe },
              ].map(tab => {
                 const Icon = tab.icon;
                 return (
                    <button 
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id as any)}
                       className={`flex items-center px-6 py-4 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${
                          activeTab === tab.id 
                             ? 'border-orange-500 text-orange-600 bg-orange-50/20' 
                             : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                       }`}
                    >
                       <Icon className="w-4 h-4 mr-2" />
                       {tab.label}
                    </button>
                 )
              })}
           </div>

           <div className="p-6 md:p-8 flex-1">
              {activeTab === 'overview' && <OverviewTab shifts={myShifts} totalSalesValue={totalSalesValue} formatPrice={formatPrice} />}
              {activeTab === 'performance' && <PerformanceTab sales={mySales} formatPrice={formatPrice} />}
              {activeTab === 'security' && <SecurityTab user={user} onUpdatePassword={handleUpdatePassword} />}
              {activeTab === 'settings' && <SettingsTab />}
           </div>
        </div>
      </div>
    </div>
  );
};
