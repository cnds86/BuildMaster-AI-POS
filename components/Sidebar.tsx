
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, ShoppingCart, Package, Hammer, LogOut, Menu, Scale,
  FolderTree, Store, Container, ClipboardList, FileCheck, Users, Settings, RefreshCw, UserCircle, Contact, Clock, Receipt, Tv
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { UserRole } from '../types';

interface NavItemConfig {
  id: string;
  href: string;
  icon: any;
  allowedRoles: UserRole[];
}

const NAV_ITEMS_BASE: NavItemConfig[] = [
  { id: 'dashboard', href: '/dashboard', icon: LayoutDashboard, allowedRoles: ['Admin', 'Manager'] },
  { id: 'pos', href: '/pos', icon: ShoppingCart, allowedRoles: ['Admin', 'Manager', 'Staff', 'Cashier'] },
  { id: 'shifts', href: '/shifts', icon: Clock, allowedRoles: ['Admin', 'Manager', 'Staff', 'Cashier'] },
  { id: 'sales', href: '/sales', icon: Receipt, allowedRoles: ['Admin', 'Manager', 'Cashier'] },
  { id: 'inventory', href: '/inventory', icon: Package, allowedRoles: ['Admin', 'Manager', 'Staff'] },
  { id: 'stock', href: '/stock', icon: ClipboardList, allowedRoles: ['Admin', 'Manager', 'Staff'] },
  { id: 'customers', href: '/customers', icon: Contact, allowedRoles: ['Admin', 'Manager', 'Cashier'] },
  { id: 'approvals', href: '/approvals', icon: FileCheck, allowedRoles: ['Admin', 'Manager'] },
  { id: 'promotions', href: '/promotions', icon: Tv, allowedRoles: ['Admin', 'Manager'] },
  { id: 'sync', href: '/sync', icon: RefreshCw, allowedRoles: ['Admin', 'Manager'] },
  { id: 'categories', href: '/categories', icon: FolderTree, allowedRoles: ['Admin'] },
  { id: 'units', href: '/units', icon: Scale, allowedRoles: ['Admin'] },
  { id: 'branches', href: '/branches', icon: Store, allowedRoles: ['Admin'] },
  { id: 'warehouses', href: '/warehouses', icon: Container, allowedRoles: ['Admin'] },
  { id: 'users', href: '/users', icon: Users, allowedRoles: ['Admin'] },
  { id: 'settings', href: '/settings', icon: Settings, allowedRoles: ['Admin', 'Manager'] },
];

export const Sidebar: React.FC = () => {
  const { currentUser, setCurrentUser, t } = useGlobal();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const visibleNavItems = NAV_ITEMS_BASE.filter(item => 
    item.allowedRoles.includes(currentUser.role)
  );

  return (
    <>
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-center h-20 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="bg-construction-orange p-2 rounded-lg">
              <Hammer className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">{t('app.name')}</h1>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
              <span className="text-xs px-2 py-0.5 rounded-full inline-block mt-1 font-bold tracking-wide bg-slate-700 text-slate-300">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 mt-2 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-hide">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center w-full px-4 py-3 mb-2 rounded-lg transition-colors duration-200 ${
                  isActive 
                    ? 'bg-sky-600 text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{t(`nav.${item.id}`)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <button 
            onClick={() => setCurrentUser(null)}
            className="flex items-center w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header Toggle */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
         <div className="flex items-center space-x-2">
            <Hammer className="w-6 h-6 text-construction-orange" />
            <span className="font-bold text-slate-800">{t('app.name')}</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
      </header>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};
