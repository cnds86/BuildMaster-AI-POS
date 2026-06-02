
'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { Lock, User as UserIcon, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { verifyPasswordSync } from '../lib/auth';
import { MhxIcon } from './shared/MhxLogo';

export const LoginPage: React.FC = () => {
  const { setCurrentUser, users, t } = useGlobal();
  const navigate = useNavigate();
  
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const cleanUsername = loginUsername.trim().toLowerCase();
      const cleanPassword = loginPassword.trim();

      // 1. Server-Side / API Check (Robust auth)
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include', // ✅ needed to receive auth_token cookie
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanUsername, password: cleanPassword })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            // ✅ Save JWT token in localStorage so api.ts fetches can use it
            if (data.token && typeof window !== 'undefined') {
              try { localStorage.setItem('mhx_auth_token', data.token) } catch {}
            }
            setCurrentUser(data.user);
            setLoading(false);
            // Navigate to default route after successful login
            const role = data.user.role?.toUpperCase();
            const defaultRoute = role === 'CASHIER' ? '/pos'
              : role === 'STAFF' ? '/inventory'
              : '/dashboard';
            navigate(defaultRoute, { replace: true });
            return;
          }
        } else {
           console.warn(`API returned ${res.status}`);
        }
      } catch (apiError) {
        console.warn("API Login failed, attempting local fallback only", apiError);
      }

      // 2. Client-Side Check (Fallback)
      const clientMatch = users.find(u => 
        u.username.toLowerCase() === cleanUsername
      );
      
      if (clientMatch && clientMatch.password) {
        const isValid = verifyPasswordSync(cleanPassword, clientMatch.password);
        if (isValid) {
          document.cookie = `user_role=${clientMatch.role}; path=/; max-age=86400`;
          await new Promise(resolve => setTimeout(resolve, 600));
          const { password, ...safeUser } = clientMatch;
          setCurrentUser(safeUser as any);
          setLoading(false);
          // Navigate to default route after successful login
          const role = safeUser.role?.toUpperCase();
          const defaultRoute = role === 'CASHIER' ? '/pos'
            : role === 'STAFF' ? '/inventory'
            : '/dashboard';
          navigate(defaultRoute, { replace: true });
          return;
        }
      }

      throw new Error('Invalid username or password');

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
           
           {/* Left Brand Side - Red Theme */}
           <div className="md:w-1/2 bg-gradient-to-br from-red-600 to-red-800 p-12 text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
              
              <div className="bg-white/20 p-6 rounded-3xl mb-6 backdrop-blur-sm shadow-lg relative z-10 border border-white/10">
                <MhxIcon className="w-20 h-20 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4 relative z-10">{t('app.name')}</h1>
              <p className="text-red-100 text-lg relative z-10 max-w-xs">{t('app.subtitle')}</p>
           </div>
           
           {/* Right Login Form Side */}
           <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                  <LogIn className="w-6 h-6 mr-2 text-red-600" />
                  {t('common.signIn')}
                </h2>
                <p className="text-slate-500 text-sm mt-1">Access your POS dashboard</p>
              </div>
              
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.username')}</label>
                   <div className="relative group">
                     <UserIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                     <input 
                       type="text"
                       required
                       value={loginUsername}
                       onChange={e => setLoginUsername(e.target.value)}
                       className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none bg-slate-50 focus:bg-white"
                       placeholder="Enter your username"
                     />
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.password')}</label>
                   <div className="relative group">
                     <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                     <input 
                       type="password"
                       required
                       value={loginPassword}
                       onChange={e => setLoginPassword(e.target.value)}
                       className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none bg-slate-50 focus:bg-white"
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
                   className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-red-600 active:bg-red-700 active:scale-[0.98] transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
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
                 <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">
                   {t('common.demo')}
                 </p>
                 <div className="flex flex-wrap justify-center gap-2 text-xs">
                    <button onClick={() => { setLoginUsername('admin'); setLoginPassword('password123'); }} className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 font-mono hover:bg-slate-200 transition-colors border border-slate-200">admin</button>
                    <button onClick={() => { setLoginUsername('manager'); setLoginPassword('password123'); }} className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 font-mono hover:bg-slate-200 transition-colors border border-slate-200">manager</button>
                    <button onClick={() => { setLoginUsername('staff01'); setLoginPassword('password123'); }} className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 font-mono hover:bg-slate-200 transition-colors border border-slate-200">staff01</button>
                    <button onClick={() => { setLoginUsername('cashier01'); setLoginPassword('password123'); }} className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 font-mono hover:bg-slate-200 transition-colors border border-slate-200">cashier01</button>
                 </div>
                 <p className="text-xs text-slate-400 mt-2">Password: <span className="font-mono text-slate-600">password123</span> ทุก account</p>
              </div>
           </div>
        </div>
    </div>
  );
};
