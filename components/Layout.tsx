import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Hammer, 
  LogOut,
  Menu,
  Scale,
  FolderTree,
  Store,
  Container,
  ClipboardList,
  FileCheck,
  UserCircle,
  Users,
  Settings,
  RefreshCw,
  Contact,
  Clock,
  Tv
} from 'lucide-react';
import { User, UserRole } from '../types';
import { useGlobal } from '../context/GlobalContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

interface NavItemConfig {
  id: string;
  icon: any;
  label: string;
  allowedRoles: UserRole[];
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', allowedRoles: ['Admin', 'Manager'] },
  { id: 'pos', icon: ShoppingCart, label: 'Point of Sale', allowedRoles: ['Admin', 'Manager', 'Staff', 'Cashier'] },
  { id: 'shifts', icon: Clock, label: 'My Shift', allowedRoles: ['Admin', 'Manager', 'Staff', 'Cashier'] },
  { id: 'inventory', icon: Package, label: 'Inventory', allowedRoles: ['Admin', 'Manager', 'Staff'] },
  { id: 'stock', icon: ClipboardList, label: 'Stock Mgmt', allowedRoles: ['Admin', 'Manager', 'Staff'] },
  { id: 'customers', icon: Contact, label: 'Customers', allowedRoles: ['Admin', 'Manager', 'Cashier', 'Staff'] },
  { id: 'approvals', icon: FileCheck, label: 'Approvals', allowedRoles: ['Admin', 'Manager'] },
  { id: 'promotions', icon: Tv, label: 'Promotions', allowedRoles: ['Admin', 'Manager', 'Staff'] },
  { id: 'sync', icon: RefreshCw, label: 'Data Sync', allowedRoles: ['Admin', 'Manager'] },
  { id: 'categories', icon: FolderTree, label: 'Categories', allowedRoles: ['Admin', 'Staff', 'Manager'] },
  { id: 'units', icon: Scale, label: 'Unit Mgmt', allowedRoles: ['Admin', 'Staff', 'Manager'] },
  { id: 'branches', icon: Store, label: 'Branches & POS', allowedRoles: ['Admin', 'Manager'] },
  { id: 'warehouses', icon: Container, label: 'Warehouse (WMS)', allowedRoles: ['Admin', 'Staff', 'Manager'] },
  { id: 'users', icon: Users, label: 'Users & Roles', allowedRoles: ['Admin', 'Manager'] },
  { id: 'settings', icon: Settings, label: 'Settings', allowedRoles: ['Admin'] },
];

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, currentUser, onLogout }) => {
  const { t } = useGlobal();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Filter nav items based on user role
  const visibleNavItems = NAV_ITEMS.filter(item => 
    currentUser && item.allowedRoles.includes(currentUser.role)
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar - Desktop */}
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

        {/* User Profile Mini-Card */}
        {currentUser && (
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
                <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 font-bold tracking-wide ${
                  currentUser.role === 'Admin' ? 'bg-purple-500/20 text-purple-300' : 
                  currentUser.role === 'Manager' ? 'bg-indigo-500/20 text-indigo-300' :
                  currentUser.role === 'Staff' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-green-500/20 text-green-300'
                }`}>
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        )}

        <nav className="p-4 mt-2 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-hide">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 mb-2 rounded-lg transition-colors duration-200 ${
                  activeTab === item.id 
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{t(`nav.${item.id}`)}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="flex items-center w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center space-x-2">
            <Hammer className="w-6 h-6 text-construction-orange" />
            <span className="font-bold text-slate-800">{t('app.name')}</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 relative">
          {children}
        </main>
      </div>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};