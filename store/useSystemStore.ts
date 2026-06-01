
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, SystemSettings, Branch, PosMachine, AuditLog, SyncLog, AppNotification, Department, SystemRole } from '../types';
import { INITIAL_USERS, INITIAL_SETTINGS, INITIAL_BRANCHES, INITIAL_POS_MACHINES, INITIAL_AUDIT_LOGS, INITIAL_SYNC_LOGS, INITIAL_DEPARTMENTS, INITIAL_ROLES } from '../services/data';
import { hashPasswordSync } from '../lib/auth';
import { normalizeRole } from '../lib/roles';

interface SystemState {
  currentUser: User | null;
  users: User[];
  departments: Department[];
  systemRoles: SystemRole[];
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
  
  addDepartment: (dept: Department) => void;
  updateDepartment: (dept: Department) => void;
  deleteDepartment: (id: string) => void;

  addSystemRole: (role: SystemRole) => void;
  updateSystemRole: (role: SystemRole) => void;
  deleteSystemRole: (id: string) => void;

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

  // BUG-FE-05 FIX: Pull authoritative user list (real UUIDs from DB) into the
  // store so that shift.userId lookups can resolve against backend users.
  fetchUsersFromBackend: () => Promise<void>;

  restoreSystemData: (data: any) => void;
}

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      currentUser: null,
      users: INITIAL_USERS.map(u => ({ ...u, password: hashPasswordSync(u.password || '123') })), // Hash initial seeds
      departments: INITIAL_DEPARTMENTS,
      systemRoles: INITIAL_ROLES,
      settings: INITIAL_SETTINGS,
      branches: INITIAL_BRANCHES,
      posMachines: INITIAL_POS_MACHINES,
      auditLogs: INITIAL_AUDIT_LOGS,
      syncLogs: INITIAL_SYNC_LOGS,
      notifications: [],

      setCurrentUser: (user) => set({ currentUser: user ? { ...user, role: normalizeRole(user.role) } : null }),
      
      addUser: (user) => set((state) => {
        // Securely hash before storing in state/localstorage
        const secureUser = {
           ...user,
           role: normalizeRole(user.role),
           password: user.password ? hashPasswordSync(user.password) : undefined
        };
        return { users: [...state.users, secureUser] };
      }),

      updateUser: (user) => set((state) => {
        const existing = state.users.find(u => u.id === user.id);
        let passwordToStore = existing?.password; // Default to existing

        // If new password provided, hash it
        if (user.password && user.password !== existing?.password) {
           passwordToStore = hashPasswordSync(user.password);
        }

        const secureUser = { ...user, role: normalizeRole(user.role), password: passwordToStore };
        return { users: state.users.map(u => u.id === user.id ? secureUser : u) };
      }),

      deleteUser: (id) => set((state) => ({ users: state.users.filter(u => u.id !== id) })),

      addDepartment: (dept) => set((state) => ({ departments: [...state.departments, dept] })),
      updateDepartment: (dept) => set((state) => ({ departments: state.departments.map(d => d.id === dept.id ? dept : d) })),
      deleteDepartment: (id) => set((state) => ({ departments: state.departments.filter(d => d.id !== id) })),

      addSystemRole: (role) => set((state) => ({ systemRoles: [...state.systemRoles, role] })),
      updateSystemRole: (role) => set((state) => ({ systemRoles: state.systemRoles.map(r => r.id === role.id ? role : r) })),
      deleteSystemRole: (id) => set((state) => ({ systemRoles: state.systemRoles.filter(r => r.id !== id) })),

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

      fetchUsersFromBackend: async () => {
        try {
          // Use any token from localStorage (same pattern as CustomerManagement).
          let token = '';
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i) || '';
            const v = localStorage.getItem(k) || '';
            if (k === 'bm_session' || k === 'auth_token' || (k.toLowerCase().includes('token') && v.length > 20)) {
              token = v;
              break;
            }
          }
          const res = await fetch('http://localhost:6039/api/users?limit=200', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: 'include',
          });
          if (!res.ok) {
            console.warn('[useSystemStore] /api/users failed', res.status);
            return;
          }
          const data = await res.json();
          const list: User[] = Array.isArray(data) ? data
            : (data?.users || data?.data || data?.rows || []);
          if (list.length === 0) return;

          // Normalize each user to the local User shape and merge into the
          // existing users array (DB UUIDs take precedence over seed ids).
          set((state) => {
            const byId = new Map<string, User>();
            state.users.forEach((u) => byId.set(u.id, u));
            list.forEach((u: any) => {
              const id = u.id || u.user_id;
              if (!id) return;
              byId.set(id, {
                id,
                username: u.username || u.user_name || '',
                name: u.name || u.full_name || u.username || 'User',
                role: normalizeRole(u.role || 'STAFF'),
                email: u.email || '',
                branchId: u.branchId || u.branch_id || '',
                department: u.department || '',
                // Don't clobber a hashed password; leave it undefined.
                password: byId.get(id)?.password,
                active: u.active ?? true,
              } as User);
            });
            return { users: Array.from(byId.values()) };
          });
        } catch (err) {
          console.error('[useSystemStore] fetchUsersFromBackend failed', err);
        }
      },

      restoreSystemData: (data) => set((state) => ({
        ...state,
        users: data.users || state.users,
        settings: data.settings || state.settings,
        branches: data.branches || state.branches,
        posMachines: data.posMachines || state.posMachines,
        departments: data.departments || state.departments,
        systemRoles: data.systemRoles || state.systemRoles
      }))
    }),
    {
      name: 'bm_system_store',
      partialize: (state) => ({ 
        // Persist data
        currentUser: state.currentUser,
        users: state.users,
        settings: state.settings,
        branches: state.branches,
        posMachines: state.posMachines,
        auditLogs: state.auditLogs,
        syncLogs: state.syncLogs,
        departments: state.departments,
        systemRoles: state.systemRoles
      })
    }
  )
);
