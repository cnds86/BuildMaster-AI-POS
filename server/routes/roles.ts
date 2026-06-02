import { Elysia, t } from 'elysia'
import { ROLES, extractToken } from '../plugins/auth.js'

// ─── Roles Routes (system roles — seeded, not mutable via API) ─────────────
// These routes are read-only; roles are managed via seed.ts / DB migration.
// Clients can query role definitions for UI rendering.

const SYSTEM_ROLES = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full system access — all modules, all permissions',
    isSystem: true,
    permissions: ['*']
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Branch-level management — POS, inventory, reports, staff',
    isSystem: true,
    permissions: [
      'dashboard.view', 'reports.view',
      'pos.operate', 'sales.view', 'sales.void',
      'inventory.view', 'inventory.manage',
      'stock.view', 'stock.manage', 'approvals.manage',
      'customers.view', 'customers.manage', 'users.view',
      'expenses.view', 'promotions.manage'
    ]
  },
  {
    id: 'cashier',
    name: 'Cashier',
    description: 'POS operations — process sales, handle cash',
    isSystem: true,
    permissions: [
      'pos.operate', 'sales.view',
      'customers.view'
    ]
  },
  {
    id: 'staff',
    name: 'Stock Staff',
    description: 'Warehouse and stock management',
    isSystem: true,
    permissions: [
      'inventory.view', 'inventory.manage',
      'stock.view', 'stock.manage',
      'delivery.view'
    ]
  }
]

export const rolesRoutes = (app: Elysia) =>
  app.group('/api/roles', (app) =>
    app
      // GET /api/roles — list all system roles
      .get('/', async ({ jwt, cookie: { auth_token }, set , request }) => {
        const token = extractToken(auth_token, request)
        if (!token) { set.status = 401; return { error: 'Unauthorized' } }
        let payload: any
        try { payload = await jwt.verify(token) } catch { set.status = 401; return { error: 'Invalid token' } }
        if (!['ADMIN', 'MANAGER'].includes(payload.role?.toUpperCase())) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }
        return { roles: SYSTEM_ROLES }
      }, {
        detail: { tags: ['Roles'], security: [{ bearerAuth: [] }] }
      })

      // GET /api/roles/:id — get a specific role
      .get('/:id', async ({ params: { id }, jwt, cookie: { auth_token }, set , request }) => {
        const token = extractToken(auth_token, request)
        if (!token) { set.status = 401; return { error: 'Unauthorized' } }
        let payload: any
        try { payload = await jwt.verify(token) } catch { set.status = 401; return { error: 'Invalid token' } }
        if (!['ADMIN', 'MANAGER'].includes(payload.role?.toUpperCase())) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }
        const role = SYSTEM_ROLES.find(r => r.id === id.toLowerCase())
        if (!role) { set.status = 404; return { error: 'Role not found' } }
        return { role }
      }, {
        params: t.Object({ id: t.String() }),
        detail: { tags: ['Roles'], security: [{ bearerAuth: [] }] }
      })
  )