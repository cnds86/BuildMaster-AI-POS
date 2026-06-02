/**
 * MHX-POS — Settings Routes
 * System settings, branches, user management (admin only)
 */
import { Elysia, t } from 'elysia'
import { db } from '../db.js'
import { ROLES } from '../plugins/auth.js'

async function authGuard(jwtFn: any, authToken: any, set: any, request: any) {
  const token = (authToken?.value)
    || (request?.headers?.get?.("authorization")?.toLowerCase?.().startsWith("bearer ")
        ? request.headers.get("authorization").slice(7).trim()
        : null)
  if (!token) { set.status = 401; return null }
  try {
    const payload = await (jwtFn as any).verify(token) as { role?: string; sub?: string } | false
    if (!payload) { set.status = 401; return null }
    return payload
  } catch { set.status = 401; return null }
}

const SETTINGS_KEY = 'main'

export const settingsRoutes = (app: Elysia) =>
  app.group('/api/settings', (app) =>
    app
      // GET /api/settings — load system settings
      .get('/', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          const row = await db
            .selectFrom('system_settings')
            .selectAll()
            .where('key', '=', SETTINGS_KEY)
            .executeTakeFirst()

          if (row) {
            return { settings: JSON.parse(row.value), source: 'database' }
          }

          // First boot: seed defaults then return
          const { INITIAL_SETTINGS } = await import('../services/settingsData.js')
          const json = JSON.stringify(INITIAL_SETTINGS)
          await db.insertInto('system_settings').values({
            key: SETTINGS_KEY,
            value: json,
          }).execute()

          return { settings: INITIAL_SETTINGS, source: 'default' }
        } catch (err) {
          console.error('GET /api/settings error:', err)
          return { error: 'Failed to load settings' }
        }
      })

      // POST /api/settings — save system settings
      .post('/', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          const settings = body as Record<string, unknown>
          const json = JSON.stringify(settings)

          const existing = await db
            .selectFrom('system_settings')
            .select(['id'])
            .where('key', '=', SETTINGS_KEY)
            .executeTakeFirst()

          if (existing) {
            await db
              .updateTable('system_settings')
              .set({ value: json })
              .where('key', '=', SETTINGS_KEY)
              .execute()
          } else {
            await db.insertInto('system_settings').values({
              key: SETTINGS_KEY,
              value: json,
            }).execute()
          }

          return { success: true, settings }
        } catch (err) {
          console.error('POST /api/settings error:', err)
          set.status = 500
          return { error: 'Failed to save settings' }
        }
      }, {
        body: t.Any(),
      })

      // GET /api/settings/branches
      .get('/branches', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          const branches = await db.selectFrom('branches').selectAll().where('active', '=', true).execute()
          return { branches }
        } catch { return { branches: [] } }
      })

      // POST /api/settings/branches
      .post('/branches', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role !== ROLES.ADMIN) { set.status = 403; return { error: 'Admin only' } }

        const { name, code, address, phone } = body as any
        if (!name || !code) { set.status = 400; return { error: 'name and code are required' } }

        try {
          const branch = await db.insertInto('branches').values({
            name, code,
            address: address ?? null,
            phone: phone ?? null,
            active: true,
          } as any).returningAll().executeTakeFirst()
          return { branch }, { status: 201 }
        } catch (err) {
          console.error('Create branch error:', err)
          set.status = 500; return { error: 'Failed to create branch' }
        }
      }, {
        body: t.Object({
          name: t.String(),
          code: t.String(),
          address: t.Optional(t.String()),
          phone: t.Optional(t.String()),
        }),
      })

      // GET /api/settings/users (admin only)
      .get('/users', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role !== ROLES.ADMIN) { set.status = 403; return { error: 'Admin only' } }

        try {
          const users = await db
            .selectFrom('users')
            .select(['id', 'username', 'name', 'role', 'branch_id', 'active', 'created_at'])
            .where('active', '=', true)
            .execute()
          return { users }
        } catch { set.status = 500; return { error: 'Failed to fetch users' } }
      })

      // POST /api/settings/users
      .post('/users', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role !== ROLES.ADMIN) { set.status = 403; return { error: 'Admin only' } }

        const { username, password, name, role, branch_id } = body as any
        if (!username || !password || !name || !role) {
          set.status = 400; return { error: 'username, password, name, and role are required' }
        }
        if (!Object.values(ROLES).includes(role)) {
          set.status = 400; return { error: 'Invalid role' }
        }

        try {
          const existing = await db.selectFrom('users').select(['id']).where('username', '=', username).executeTakeFirst()
          if (existing) { set.status = 409; return { error: 'Username already exists' } }

          const bcrypt = await import('bcryptjs')
          const password_hash = await bcrypt.hash(password, 10)

          const newUser = await db.insertInto('users').values({
            username, password_hash, name, role,
            branch_id: branch_id ?? null,
            active: true,
          } as any).returningAll().executeTakeFirst()

          const { password_hash: _, ...safeUser } = newUser as any
          return { user: safeUser }, { status: 201 }
        } catch (err) {
          console.error('Create user error:', err)
          set.status = 500; return { error: 'Failed to create user' }
        }
      }, {
        body: t.Object({
          username: t.String(),
          password: t.String({ minLength: 8 }),
          name: t.String(),
          role: t.String(),
          branch_id: t.Optional(t.String()),
        }),
      })

      // PUT /api/settings/users/:id
      .put('/users/:id', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role !== ROLES.ADMIN) { set.status = 403; return { error: 'Admin only' } }

        const { name, role, branch_id, active, password } = body as any
        const updates: any = {}
        if (name !== undefined) updates.name = name
        if (role !== undefined) {
          if (!Object.values(ROLES).includes(role)) { set.status = 400; return { error: 'Invalid role' } }
          updates.role = role
        }
        if (branch_id !== undefined) updates.branch_id = branch_id
        if (active !== undefined) updates.active = active
        if (password) {
          const bcrypt = await import('bcryptjs')
          updates.password_hash = await bcrypt.hash(password, 10)
        }
        if (Object.keys(updates).length === 0) {
          set.status = 400; return { error: 'No fields to update' }
        }

        try {
          const existing = await db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }

          const updated = await db.updateTable('users').set(updates).where('id', '=', id).returningAll().executeTakeFirst()
          const { password_hash: _, ...safeUser } = updated as any
          return { user: safeUser }
        } catch (err) {
          console.error('Update user error:', err)
          set.status = 500; return { error: 'Failed to update user' }
        }
      })

      // GET /api/settings/dashboard/stats
      .get('/dashboard/stats', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          const today = new Date(); today.setHours(0, 0, 0, 0)
          const [totalProducts, totalCustomers, todaySales, openShifts] = await Promise.all([
            db.selectFrom('products').select((e) => e.fn.count('id').as('count')).where('active', '=', true).executeTakeFirst(),
            db.selectFrom('customers').select((e) => e.fn.count('id').as('count')).where('active', '=', true).executeTakeFirst(),
            db.selectFrom('sales').select((e) => e.fn.count('id').as('count')).where('created_at', '>=', today).executeTakeFirst(),
            db.selectFrom('shifts').select((e) => e.fn.count('id').as('count')).where('status', '=', 'Open').executeTakeFirst(),
          ])
          return {
            totalProducts: Number(totalProducts?.count ?? 0),
            totalCustomers: Number(totalCustomers?.count ?? 0),
            todaySales: Number(todaySales?.count ?? 0),
            openShifts: Number(openShifts?.count ?? 0),
          }
        } catch { return { totalProducts: 0, totalCustomers: 0, todaySales: 0, openShifts: 0 } }
      })
  )