
import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { User, UserRole } from '../../types';
import { MhxIcon } from '../shared/MhxLogo';

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
  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(item => 
    currentUser && item.allowedRoles.includes(currentUser.role)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transition-transform duration-300 ease-in-out shadow-2xl flex flex-col
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0 w-[80%] max-w-[300px]' : '-translate-x-full'}
        ${isCollapsed ? 'md:w-20' : 'md:w-72'}
      `}>
        {/* Header */}
        <div className={`flex items-center h-20 border-b border-slate-800 bg-slate-950/50 shrink-0 relative ${isCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="text-red-500 shrink-0">
              <MhxIcon className="w-9 h-9" />
            </div>
            <h1 className={`text-lg font-bold tracking-tight text-white transition-opacity duration-200 whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              {t('app.name')}
            </h1>
          </div>
          
          {/* Mobile Close Button */}
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Desktop Collapse Button */}
          <button 
            onClick={onToggleCollapse}
            className="hidden md:flex absolute -right-3 top-7 bg-slate-800 text-slate-400 hover:text-white border border-slate-600 rounded-full w-6 h-6 items-center justify-center shadow-lg transition-colors z-50 hover:bg-slate-700"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
             {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>

        {/* Main Nav */}
        <div className="p-3 flex-1 overflow-y-auto max-h-[calc(100vh-80px)] scrollbar-hide">
          <nav className="space-y-1">
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
                  title={isCollapsed ? t(`nav.${item.id}`) : ''}
                  className={`flex items-center w-full px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md font-semibold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${isCollapsed ? '' : 'mr-3'}`} />
                  
                  {!isCollapsed && (
                     <span className="flex-1 text-left truncate text-sm">{t(`nav.${item.id}`)}</span>
                  )}
                  
                  {/* Shortcuts hint */}
                  {!isCollapsed && item.id === 'dashboard' && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/70 hidden xl:inline font-mono">F1</span>}
                  {!isCollapsed && item.id === 'pos' && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/70 hidden xl:inline font-mono">F2</span>}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                     <div className="absolute left-full ml-4 px-2 py-1.5 bg-slate-800 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 border border-slate-700 shadow-xl translate-x-2 group-hover:translate-x-0">
                        {t(`nav.${item.id}`)}
                        {/* Arrow for tooltip */}
                        <div className="absolute top-1/2 -left-1 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 transform rotate-45 -translate-y-1/2"></div>
                     </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        
        {!isCollapsed && (
           <div className="p-4 border-t border-slate-800 text-[10px] text-slate-600 text-center uppercase tracking-widest font-bold">
              MAHAXAY POS v1.0
           </div>
        )}
      </aside>
    </>
  );
};
