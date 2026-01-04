
import React from 'react';
import { Hammer, ChevronLeft, ChevronRight } from 'lucide-react';
import { User, UserRole } from '../../types';
import { cn } from '../../lib/utils';

interface NavItemConfig {
  id: string;
  icon: any;
  label: string;
  allowedRoles: UserRole[];
}

interface DesktopSidebarProps {
  navItems: NavItemConfig[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: User | null;
  t: (key: string) => string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  navItems,
  activeTab,
  onTabChange,
  currentUser,
  t,
  mobileMenuOpen,
  setMobileMenuOpen,
  isCollapsed,
  onToggleCollapse
}) => {
  const visibleNavItems = navItems.filter(item => 
    currentUser && item.allowedRoles.includes(currentUser.role)
  );

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col border-r border-white/5 md:relative md:translate-x-0 shadow-2xl shadow-black/50",
      mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0',
      isCollapsed ? 'md:w-24' : 'md:w-72'
    )}>
      <div className={cn("flex items-center h-24 shrink-0 relative", isCollapsed ? 'justify-center' : 'px-8')}>
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="bg-gradient-to-br from-construction-orange to-orange-600 p-3 rounded-2xl shadow-xl shadow-orange-900/20 shrink-0 border border-white/10">
            <Hammer className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
             <div className="animate-fade-in">
                <h1 className="text-xl font-black tracking-tight text-white leading-none">BuildMaster</h1>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1.5">AI Construction POS</p>
             </div>
          )}
        </div>
        
        <button 
          onClick={onToggleCollapse}
          className="hidden md:flex absolute -right-3 top-9 bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-full w-7 h-7 items-center justify-center shadow-2xl transition-all z-50 hover:scale-110"
        >
           {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-1.5">
        {visibleNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setMobileMenuOpen(false);
              }}
              className={cn(
                "flex items-center w-full px-4 py-4 rounded-2xl transition-all duration-300 group relative",
                isActive 
                  ? 'bg-construction-orange text-white shadow-lg shadow-orange-900/20 font-bold' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-200',
                isCollapsed && 'justify-center'
              )}
            >
              <Icon className={cn("w-6 h-6 shrink-0 transition-transform", isActive ? 'scale-110' : 'group-hover:scale-110', !isCollapsed && 'mr-4')} />
              {!isCollapsed && (
                 <span className="flex-1 text-left truncate text-xs font-black uppercase tracking-wider">{t(`nav.${item.id}`)}</span>
              )}

              {isCollapsed && (
                 <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 whitespace-nowrap z-50 border border-slate-700 shadow-2xl translate-x-2 group-hover:translate-x-0">
                    {t(`nav.${item.id}`)}
                 </div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className={cn("p-6", isCollapsed && "p-2")}>
         <div className="bg-white/5 rounded-3xl p-4 text-center border border-white/5 backdrop-blur-sm">
            {!isCollapsed && <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Version 1.0.4</p>}
            <p className="text-[9px] text-construction-orange font-black mt-1">OFFLINE MODE</p>
         </div>
      </div>
    </aside>
  );
};
