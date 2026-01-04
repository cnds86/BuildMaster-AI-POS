
'use client';

import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { Lock, Hammer, User as UserIcon, LogIn, AlertCircle } from 'lucide-react';
import { verifyPasswordSync } from '../lib/auth';
import { Button } from './ui/Button';

export const LoginPage: React.FC = () => {
  const { setCurrentUser, users } = useGlobal();
  
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('123');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const cleanUsername = loginUsername.trim().toLowerCase();
      const cleanPassword = loginPassword.trim();

      const clientMatch = users.find(u => u.username.toLowerCase() === cleanUsername);
      
      if (clientMatch && clientMatch.password) {
        const isValid = verifyPasswordSync(cleanPassword, clientMatch.password);
        if (isValid) {
          await new Promise(resolve => setTimeout(resolve, 800));
          const { password, ...safeUser } = clientMatch;
          setCurrentUser(safeUser as any);
          return;
        }
      }
      throw new Error('Invalid username or password');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900 z-50 p-4">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row animate-fade-in ring-1 ring-white/10">
           
           <div className="md:w-1/2 bg-gradient-to-br from-construction-orange to-orange-700 p-12 text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
              <div className="bg-white/20 p-6 rounded-[2.5rem] mb-8 backdrop-blur-xl shadow-2xl relative z-10 border border-white/30">
                <Hammer className="w-16 h-16 text-white" />
              </div>
              <h1 className="text-5xl font-black mb-4 relative z-10 tracking-tighter">BuildMaster</h1>
              <p className="text-orange-100 text-sm relative z-10 max-w-xs font-bold uppercase tracking-[0.3em] opacity-80">AI Construction POS</p>
           </div>
           
           <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-white">
              <div className="mb-10">
                <h2 className="text-4xl font-black text-slate-900 flex items-center tracking-tight">
                  Sign In
                </h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Local Instance • Pro Version</p>
              </div>
              
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                   <div className="relative group">
                     <UserIcon className="absolute left-4 top-4 w-5 h-5 text-slate-300 group-focus-within:text-construction-orange transition-colors" />
                     <input 
                       type="text"
                       required
                       value={loginUsername}
                       onChange={e => setLoginUsername(e.target.value)}
                       className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-construction-orange transition-all outline-none font-bold text-slate-800"
                       placeholder="Admin"
                     />
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                   <div className="relative group">
                     <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-300 group-focus-within:text-construction-orange transition-colors" />
                     <input 
                       type="password"
                       required
                       value={loginPassword}
                       onChange={e => setLoginPassword(e.target.value)}
                       className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-construction-orange transition-all outline-none font-bold text-slate-800"
                       placeholder="••••••••"
                     />
                   </div>
                 </div>

                 {loginError && (
                   <div className="bg-red-50 text-red-600 text-xs font-bold p-4 rounded-2xl border border-red-100 flex items-center animate-shake">
                     <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                     {loginError}
                   </div>
                 )}
                 
                 <Button 
                   type="submit"
                   variant="primary"
                   size="xl"
                   isLoading={loading}
                   className="w-full mt-4 rounded-[2rem]"
                 >
                   Login to System
                 </Button>
              </form>
           </div>
        </div>
    </div>
  );
};
