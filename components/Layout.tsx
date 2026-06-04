import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  FolderTree,
  Store,
  Container,
  ClipboardList,
  FileCheck,
  Users,
  Settings,
  RefreshCw,
  Contact,
  Clock,
  Tv,
  BarChart4,
  Receipt,
  Scale,
  FileText,
  Truck,
  Wallet
} from 'lucide-react';
import { User, UserRole } from '../types';
import { useGlobal } from '../context/GlobalContext';
import { DesktopSidebar } from './layout/DesktopSidebar';
import { TopBar } from './layout/TopBar';
import { KeyboardShortcuts } from './layout/KeyboardShortcuts';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

interface NavItemConfig {
  id: string;
  icon: any;
  label: string;
  allowedRoles: UserRole[];
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', allowedRoles: ['ADMIN', 'MANAGER'] },
  { id: 'reports', icon: BarChart4, label: 'Reports & Analytics', allowedRoles: ['ADMIN', 'MANAGER'] },
  { id: 'pos', icon: ShoppingCart, label: 'Point of Sale', allowedRoles: ['ADMIN', 'MANAGER', 'STAFF', 'CASHIER'] },
  { id: 'shifts', icon: Clock, label: 'My Shift', allowedRoles: ['ADMIN', 'MANAGER', 'STAFF', 'CASHIER'] },
  { id: 'sales', icon: Receipt, label: 'Sales History', allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { id: 'expenses', icon: Wallet, label: 'Expenses', allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER', 'STAFF'] },
  { id: 'quotations', icon: FileText, label: 'Quotations', allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER'] }, 
  { id: 'inventory', icon: Package, label: 'Inventory', allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { id: 'stock', icon: ClipboardList, label: 'Stock Mgmt', allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { id: 'delivery', icon: Truck, label: 'Delivery & Fleet', allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { id: 'customers', icon: Contact, label: 'Customers', allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER', 'STAFF'] },
  { id: 'approvals', icon: FileCheck, label: 'Approvals', allowedRoles: ['ADMIN', 'MANAGER'] },
  { id: 'promotions', icon: Tv, label: 'Promotions', allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { id: 'sync', icon: RefreshCw, label: 'Data Sync', allowedRoles: ['ADMIN', 'MANAGER'] },
  { id: 'categories', icon: FolderTree, label: 'Categories', allowedRoles: ['ADMIN', 'STAFF', 'MANAGER'] },
  { id: 'units', icon: Scale, label: 'Unit Mgmt', allowedRoles: ['ADMIN', 'STAFF', 'MANAGER'] },
  { id: 'branches', icon: Store, label: 'Branches & POS', allowedRoles: ['ADMIN', 'MANAGER'] },
  { id: 'warehouses', icon: Container, label: 'Warehouse (WMS)', allowedRoles: ['ADMIN', 'STAFF', 'MANAGER'] },
  { id: 'users', icon: Users, label: 'Users & Roles', allowedRoles: ['ADMIN', 'MANAGER'] },
  { id: 'settings', icon: Settings, label: 'Settings', allowedRoles: ['ADMIN'] },
];

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, t, notifications, markNotificationRead, clearAllNotifications } = useGlobal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Derive activeTab from current location pathname (e.g. "/pos" → "pos")
  const activeTab = location.pathname.replace('/', '') || 'dashboard';

  const handleTabChange = (tabId: string) => {
    navigate(`/${tabId}`);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); navigate('/dashboard'); }
      if (e.key === 'F2') { e.preventDefault(); navigate('/pos'); }
      if (e.key === 'F3') { e.preventDefault(); navigate('/inventory'); }
      if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShowKeyboardHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Accessibility: skip to main content link. Hidden until keyboard focused. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-red-600 focus:outline-none focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
      <DesktopSidebar 
        navItems={NAV_ITEMS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentUser={currentUser}
        t={t}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <TopBar 
          setMobileMenuOpen={setMobileMenuOpen}
          mobileMenuOpen={mobileMenuOpen}
          onTabChange={handleTabChange}
          setShowKeyboardHelp={setShowKeyboardHelp}
          notifications={notifications}
          clearAllNotifications={clearAllNotifications}
          markNotificationRead={markNotificationRead}
          currentUser={currentUser}
          onLogout={onLogout}
        />

        {/* Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
          className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 relative scroll-smooth focus:outline-none"
        >
          {children}
        </main>
      </div>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <KeyboardShortcuts 
        isOpen={showKeyboardHelp} 
        onClose={() => setShowKeyboardHelp(false)} 
      />
    </div>
  );
};
