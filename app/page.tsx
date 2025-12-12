'use client';

import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { Lock, Hammer, User as UserIcon, LogIn, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { setCurrentUser, t } = useGlobal();
  
  // Pre-fill credentials for better demo experience
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('123');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      // Direct Client-Side Authentication (Mock Mode)
      // Simulating a small network delay for realism
      await new Promise(resolve => setTimeout(resolve, 600));

      const DEMO_USERS = [
        { id: 'u1', username: 'admin', password: '123', name: 'Owner Admin', role: 'Admin', branchId: 'b1', avatarUrl: 'https://ui-avatars.com/api/?name=Owner+Admin&background=0ea5e9&color=fff' },
        { id: 'u2', username: 'manager', password: '123', name: 'Manager Somchai', role: 'Manager', branchId: 'b1', avatarUrl: 'https://ui-avatars.com/api/?name=Manager+Somchai&background=8b5cf6&color=fff' },
        { id: 'u3', username: 'staff', password: '123', name: 'Staff Somsri', role: 'Staff', branchId: 'b1', avatarUrl: 'https://ui-avatars.com/api/?name=Staff+Somsri&background=10b981&color=fff' },
        { id: 'u4', username: 'cashier', password: '123', name: 'Cashier Noi', role: 'Cashier', branchId: 'b1', avatarUrl: 'https://ui-avatars.com/api/?name=Cashier+Noi&background=f97316&color=fff' }
      ];

      // Robust check: case-insensitive username, trimmed whitespace for both
      const cleanUsername = loginUsername.trim().toLowerCase();
      const cleanPassword = loginPassword.trim();

      const match = DEMO_USERS.find(u => 
        u.username.toLowerCase() === cleanUsername && 
        u.password === cleanPassword
      );
      
      if (match) {
        const { password, ...safeUser } = match;
        setCurrentUser(safeUser as any);
      } else {
        throw new Error('Invalid username or password');
      }

    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900 z-50">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row mx-4 md:mx-0 animate-fade-in">
           
           {/* Left Brand Side */}
           <div className="md:w-1/2 bg-gradient-to-br from-orange-500 to-orange-700 p-12 text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
              
              <div className="bg-white/20 p-4 rounded-2xl mb-6 backdrop-blur-sm shadow-lg relative z-10">
                <Hammer className="w-16 h-16 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4 relative z-10">{t('app.name')}</h1>
              <p className="text-orange-100 text-lg relative z-10 max-w-xs">{t('app.subtitle')}</p>
           </div>
           
           {/* Right Login Form Side */}
           <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                  <LogIn className="w-6 h-6 mr-2 text-orange-600" />
                  {t('common.signIn')}
                </h2>
                <p className="text-slate-500 text-sm mt-1">Access your POS dashboard</p>
              </div>
              
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.username')}</label>
                   <div className="relative group">
                     <UserIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                     <input 
                       type="text"
                       required
                       value={loginUsername}
                       onChange={e => setLoginUsername(e.target.value)}
                       className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none bg-slate-50 focus:bg-white"
                       placeholder="Enter your username"
                     />
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.password')}</label>
                   <div className="relative group">
                     <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                     <input 
                       type="password"
                       required
                       value={loginPassword}
                       onChange={e => setLoginPassword(e.target.value)}
                       className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none bg-slate-50 focus:bg-white"
                       placeholder="Enter your password"
                     />
                   </div>
                 </div>

                 {loginError && (
                   <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-start animate-pulse">
                     <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                     {loginError}
                   </div>
                 )}
                 
                 <button 
                   type="submit"
                   disabled={loading}
                   className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 active:transform active:scale-[0.98] transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                 >
                   {loading ? (
                     <>
                       <Loader2 className="w-5 h-5 animate-spin mr-2" />
                       {t('common.loading')}
                     </>
                   ) : t('common.login')}
                 </button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                 <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
                   {t('common.demo')}
                 </p>
                 <div className="flex justify-center space-x-2 text-xs">
                    <button onClick={() => { setLoginUsername('admin'); setLoginPassword('123'); }} className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono hover:bg-slate-200 transition-colors">admin / 123</button>
                    <button onClick={() => { setLoginUsername('cashier'); setLoginPassword('123'); }} className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono hover:bg-slate-200 transition-colors">cashier / 123</button>
                 </div>
              </div>
           </div>
        </div>
    </div>
  );
}