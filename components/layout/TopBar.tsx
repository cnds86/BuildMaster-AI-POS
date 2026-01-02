
import React, { useRef, useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Keyboard, 
  Bell, 
  UserCircle, 
  ChevronDown, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { User, AppNotification } from '../../types';

interface TopBarProps {
  setMobileMenuOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  onTabChange: (tab: string) => void;
  setShowKeyboardHelp: (show: boolean) => void;
  notifications: AppNotification[];
  clearAllNotifications: () => void;
  markNotificationRead: (id: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  setMobileMenuOpen,
  mobileMenuOpen,
  onTabChange,
  setShowKeyboardHelp,
  notifications,
  clearAllNotifications,
  markNotificationRead,
  currentUser,
  onLogout
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Removed F4 to avoid conflict with POS
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 md:px-6 z-20">
      <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 md:hidden text-slate-600 hover:bg-slate-50 rounded-lg">
        <Menu className="w-6 h-6" />
      </button>

      {/* Search Bar */}
      <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-64 lg:w-96 group focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
         <Search className="w-4 h-4 text-slate-400 mr-3 group-focus-within:text-orange-500" />
         <input 
           ref={searchInputRef}
           type="text" 
           placeholder="Global Search (Ctrl+K)..." 
           className="bg-transparent text-sm focus:outline-none w-full text-slate-700 placeholder:text-slate-400"
         />
         <kbd className="hidden lg:inline-flex items-center text-[10px] text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 ml-2 font-mono">
           ⌘K
         </kbd>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3 md:space-x-5">
         <button 
            onClick={() => setShowKeyboardHelp(true)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full hidden md:block transition-colors"
            title="Keyboard Shortcuts (Shift+?)"
         >
            <Keyboard className="w-5 h-5" />
         </button>

         {/* Notifications */}
         <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition-colors"
            >
               <Bell className="w-6 h-6" />
               {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
               )}
            </button>

            {showNotifications && (
               <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in origin-top-right ring-1 ring-black/5">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur-sm">
                     <h3 className="font-bold text-slate-800">Notifications</h3>
                     {notifications.length > 0 && (
                        <button onClick={clearAllNotifications} className="text-xs text-orange-600 hover:text-orange-700 font-medium">Clear all</button>
                     )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                     {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                           <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                           <p className="text-sm">No new notifications</p>
                        </div>
                     ) : (
                        <div className="divide-y divide-slate-100">
                           {notifications.map(n => (
                              <div 
                                key={n.id} 
                                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-orange-50/30 border-l-2 border-orange-500' : ''}`}
                                onClick={() => {
                                   markNotificationRead(n.id);
                                   if(n.link) onTabChange(n.link.replace('/', ''));
                                }}
                              >
                                 <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-sm font-semibold ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</h4>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                 </div>
                                 <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>

         {/* User Profile */}
         <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 hover:bg-slate-50 p-1.5 pr-3 rounded-full border border-transparent hover:border-slate-200 transition-all"
            >
               <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border border-slate-300 shadow-sm">
                  {currentUser?.avatarUrl ? (
                     <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                     <UserCircle className="w-6 h-6 text-slate-400" />
                  )}
               </div>
               <div className="hidden md:block text-left">
                  <p className="text-sm font-bold text-slate-700 leading-none">{currentUser?.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5 tracking-wide">{currentUser?.role}</p>
               </div>
               <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
            </button>

            {showUserMenu && (
               <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in origin-top-right ring-1 ring-black/5">
                  <div className="p-4 border-b border-slate-100 md:hidden bg-slate-50">
                     <p className="font-bold text-slate-800">{currentUser?.name}</p>
                     <p className="text-xs text-slate-500 font-medium uppercase mt-0.5">{currentUser?.role}</p>
                  </div>
                  <div className="p-1.5">
                     <button 
                       onClick={() => { onTabChange('profile'); setShowUserMenu(false); }}
                       className="flex items-center w-full px-3 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors mb-0.5"
                     >
                        <UserCircle className="w-4 h-4 mr-3 text-slate-400" /> My Profile
                     </button>
                     
                     {currentUser?.role === 'Admin' && (
                       <button 
                         onClick={() => { onTabChange('settings'); setShowUserMenu(false); }}
                         className="flex items-center w-full px-3 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors"
                       >
                          <Settings className="w-4 h-4 mr-3 text-slate-400" /> System Settings
                       </button>
                     )}
                     
                     <div className="border-t border-slate-100 my-1.5 mx-2"></div>
                     
                     <button 
                       onClick={onLogout}
                       className="flex items-center w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                     >
                        <LogOut className="w-4 h-4 mr-3" /> Logout
                     </button>
                  </div>
               </div>
            )}
         </div>
      </div>
    </header>
  );
};
