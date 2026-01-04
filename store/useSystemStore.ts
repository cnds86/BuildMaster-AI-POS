
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, SystemSettings, Branch, PosMachine, AuditLog, SyncLog, AppNotification, UserRoleDefinition, Permission, Department } from '../types';
import { INITIAL_USERS, INITIAL_SETTINGS, INITIAL_BRANCHES, INITIAL_POS_MACHINES, INITIAL_AUDIT_LOGS, INITIAL_SYNC_LOGS } from '../services/data';
import { hashPasswordSync } from '../lib/auth';

interface SystemState {
  currentUser: User | null;
  users: User[];
  roles: UserRoleDefinition[];
  permissions: Permission[];
  departments: Department[];
  settings: SystemSettings;
  branches: Branch[];
  posMachines: PosMachine[];
  auditLogs: AuditLog[];
  syncLogs: SyncLog[];
  notifications: AppNotification[];

  setCurrentUser: (user: User | null) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  
  addRole: (role: UserRoleDefinition) => void;
  updateRole: (role: UserRoleDefinition) => void;
  deleteRole: (id: string) => void;

  addDepartment: (dept: Department) => void;
  updateDepartment: (dept: Department) => void;
  deleteDepartment: (id: string) => void;

  updateSettings: (settings: SystemSettings) => void;
  
  addBranch: (branch: Branch) => void;
  updateBranch: (branch: Branch) => void;
  deleteBranch: (id: string) => void;
  
  addPos: (pos: PosMachine) => void;
  updatePos: (pos: PosMachine) => void;
  deletePos: (id: string) => void;

  logAction: (log: AuditLog) => void;
  addSyncLog: (log: SyncLog) => void;
  
  addNotification: (n: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  restoreSystemData: (data: any) => void;
}

const DEFAULT_PERMISSIONS: Permission[] = [
  { id: 'dash', label: 'Dashboard Access', description: 'View analytics and revenue overviews', group: 'Analysis' },
  { id: 'pos_sell', label: 'POS Processing', description: 'Ability to conduct sales at the terminal', group: 'Sales' },
  { id: 'inv_edit', label: 'Inventory Control', description: 'Add, edit, or delete product records', group: 'Inventory' },
  { id: 'stock_mv', label: 'Stock Movements', description: 'Create transfers, counts and receipts', group: 'Inventory' },
  { id: 'user_mgmt', label: 'Personnel Control', description: 'Manage users, roles and permissions', group: 'System' },
  { id: 'sys_cfg', label: 'System Settings', description: 'Global configuration and device setup', group: 'System' },
];

const DEFAULT_ROLES: UserRoleDefinition[] = [
  { id: 'r1', name: 'Admin', description: 'Full system authorization', permissions: ['dash', 'pos_sell', 'inv_edit', 'stock_mv', 'user_mgmt', 'sys_cfg'], isSystem: true },
  { id: 'r2', name: 'Manager', description: 'Store operations and stock oversight', permissions: ['dash', 'pos_sell', 'inv_edit', 'stock_mv'], isSystem: true },
  { id: 'r3', name: 'Staff', description: 'Warehouse and floor operations', permissions: ['pos_sell', 'inv_edit', 'stock_mv'], isSystem: true },
  { id: 'r4', name: 'Cashier', description: 'Terminal checkout focused', permissions: ['pos_sell'], isSystem: true },
];

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Sales', description: 'Front-end sales and customer engagement' },
  { id: 'd2', name: 'Logistics', description: 'Warehousing and inventory management' },
  { id: 'd3', name: 'Finance', description: 'Accounting and financial reporting' },
];

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      currentUser: null,
      users: INITIAL_USERS.map(u => ({ ...u, password: hashPasswordSync(u.password || '123') })),
      roles: DEFAULT_ROLES,
      permissions: DEFAULT_PERMISSIONS,
      departments: DEFAULT_DEPARTMENTS,
      settings: INITIAL_SETTINGS,
      branches: INITIAL_BRANCHES,
      posMachines: INITIAL_POS_MACHINES,
      auditLogs: INITIAL_AUDIT_LOGS,
      syncLogs: INITIAL_SYNC_LOGS,
      notifications: [],

      setCurrentUser: (user) => set({ currentUser: user }),
      
      addUser: (user) => set((state) => ({ users: [...state.users, { ...user, password: user.password ? hashPasswordSync(user.password) : undefined }] })),
      updateUser: (user) => set((state) => {
        const existing = state.users.find(u => u.id === user.id);
        let passwordToStore = existing?.password;
        if (user.password && user.password !== existing?.password) {
           passwordToStore = hashPasswordSync(user.password);
        }
        return { users: state.users.map(u => u.id === user.id ? { ...user, password: passwordToStore } : u) };
      }),
      deleteUser: (id) => set((state) => ({ users: state.users.filter(u => u.id !== id) })),

      addRole: (role) => set((state) => ({ roles: [...state.roles, role] })),
      updateRole: (role) => set((state) => ({ roles: state.roles.map(r => r.id === role.id ? role : r) })),
      deleteRole: (id) => set((state) => ({ roles: state.roles.filter(r => r.id !== id) })),

      addDepartment: (dept) => set((state) => ({ departments: [...state.departments, dept] })),
      updateDepartment: (dept) => set((state) => ({ departments: state.departments.map(d => d.id === dept.id ? dept : d) })),
      deleteDepartment: (id) => set((state) => ({ departments: state.departments.filter(d => d.id !== id) })),

      updateSettings: (settings) => set({ settings }),

      addBranch: (branch) => set((state) => ({ branches: [...state.branches, branch] })),
      updateBranch: (branch) => set((state) => ({ branches: state.branches.map(b => b.id === branch.id ? branch : b) })),
      deleteBranch: (id) => set((state) => ({ branches: state.branches.filter(b => b.id !== id) })),

      addPos: (pos) => set((state) => ({ posMachines: [...state.posMachines, pos] })),
      updatePos: (pos) => set((state) => ({ posMachines: state.posMachines.map(p => p.id === pos.id ? pos : p) })),
      deletePos: (id) => set((state) => ({ posMachines: state.posMachines.filter(p => p.id !== id) })),

      logAction: (log) => set((state) => ({ auditLogs: [log, ...state.auditLogs] })),
      addSyncLog: (log) => set((state) => ({ syncLogs: [log, ...state.syncLogs] })),

      addNotification: (n) => set((state) => ({ notifications: [n, ...state.notifications] })),
      markNotificationRead: (id) => set((state) => ({ 
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n) 
      })),
      clearAllNotifications: () => set({ notifications: [] }),

      restoreSystemData: (data) => set((state) => ({
        ...state,
        users: data.users || state.users,
        roles: data.roles || state.roles,
        departments: data.departments || state.departments,
        settings: data.settings || state.settings,
        branches: data.branches || state.branches,
        posMachines: data.posMachines || state.posMachines,
      }))
    }),
    {
      name: 'bm_system_store',
      partialize: (state) => ({ 
        currentUser: state.currentUser,
        users: state.users,
        roles: state.roles,
        departments: state.departments,
        settings: state.settings,
        branches: state.branches,
        posMachines: state.posMachines,
        auditLogs: state.auditLogs,
        syncLogs: state.syncLogs
      })
    }
  )
);
