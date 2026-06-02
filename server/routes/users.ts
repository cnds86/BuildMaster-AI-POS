import { Elysia, t } from 'elysia'
import { db } from '../db.js'
import * as bcrypt from 'bcryptjs'
import { ROLES, extractToken } from '../plugins/auth.js'

// ─── Helpers ────────────────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

function denyNonAdmin(role: string | undefined) {
  return role?.toUpperCase() !== ROLES.ADMIN.toUpperCase()
}

// ─── Users Routes ───────────────────────────────────────────────────────────
export const usersRoutes = (app: Elysia) =>
  app.group('/api/users', (app) =>
    app
      // GET /api/users — list all users (admin/manager only)
      .get('/', async ({ jwt, cookie: { auth_token }, set , request }) => {
        const token = extractToken(auth_token, request)
        if (!token) { set.status = 401; return { error: 'Unauthorized' } }
        let payload: any
        try { payload = await jwt.verify(token) } catch { set.status = 401; return { error: 'Invalid token' } }
        if (denyNonAdmin(payload.role)) { set.status = 403; return { error: 'Forbidden' } }

        const users = await db
          .selectFrom('users')
          .select(['id', 'username', 'name', 'email', 'role', 'branch_id', 'active', 'created_at'])
          .orderBy('name', 'asc')
          .execute()

        return { users }
      }, {
        detail: { tags: ['Users'], security: [{ bearerAuth: [] }] }
      })

      // GET /api/users/:id — get single user
      .get('/:id', async ({ params: { id }, jwt, cookie: { auth_token }, set , request }) => {
        const token = extractToken(auth_token, request)
        if (!token) { set.status = 401; return { error: 'Unauthorized' } }
        let payload: any
        try { payload = await jwt.verify(token) } catch { set.status = 401; return { error: 'Invalid token' } }
        if (denyNonAdmin(payload.role)) { set.status = 403; return { error: 'Forbidden' } }

        const user = await db
          .selectFrom('users')
          .select(['id', 'username', 'name', 'email', 'role', 'branch_id', 'active', 'created_at'])
          .where('id', '=', id)
          .executeTakeFirst()

        if (!user) { set.status = 404; return { error: 'User not found' } }
        return { user }
      }, {
        params: t.Object({ id: t.String() }),
        detail: { tags: ['Users'], security: [{ bearerAuth: [] }] }
      })

      // POST /api/users — create user (admin only)
      .post('/', async ({ body, jwt, cookie: { auth_token }, set, request }: any) => {
        const token = extractToken(auth_token, request)
        if (!token) { set.status = 401; return { error: 'Unauthorized' } }
        let payload: any
        try { payload = await jwt.verify(token) } catch { set.status = 401; return { error: 'Invalid token' } }
        if (denyNonAdmin(payload.role)) { set.status = 403; return { error: 'Only admins can create users' } }

        const { username, password, name, email, role, branchId } = body as {
          username: string; password: string; name: string;
          email?: string; role: string; branchId?: string;
        }

        // Check duplicate username
        const existing = await db.selectFrom('users').select('id').where('username', '=', username).executeTakeFirst()
        if (existing) { set.status = 409; return { error: 'Username already taken' } }

        const passwordHash = await hashPassword(password)
        const id = crypto.randomUUID()

        await db.insertInto('users').values({
          id,
          username,
          password_hash: passwordHash,
          name,
          email: email || null,
          role: role?.toUpperCase() || 'CASHIER',
          branch_id: branchId || null,
          active: true,
        }).execute()

        await db.insertInto('audit_log').values({
          user_id: payload.sub,
          action: 'USER_CREATE',
          entity_type: 'users',
          entity_id: id,
        }).execute()

        return { id, username, name, email, role, branch_id: branchId || null, active: true }
      }, {
        body: t.Object({
          username: t.String({ minLength: 3 }),
          password: t.String({ minLength: 8 }),
          name: t.String({ minLength: 1 }),
          email: t.Optional(t.String()),
          role: t.String(),
          branchId: t.Optional(t.String()),
        }),
        detail: { tags: ['Users'], security: [{ bearerAuth: [] }] }
      })

      // PUT /api/users/:id — update user (admin only, or self)
      .put('/:id', async ({ params: { id }, body, jwt, cookie: { auth_token }, set, request }: any) => {
        const token = extractToken(auth_token, request)
        if (!token) { set.status = 401; return { error: 'Unauthorized' } }
        let payload: any
        try { payload = await jwt.verify(token) } catch { set.status = 401; return { error: 'Invalid token' } }

        // Managers can edit non-admin users; self-edit allowed; only admins can edit admins
        const target = await db.selectFrom('users').select(['id', 'role']).where('id', '=', id).executeTakeFirst()
        if (!target) { set.status = 404; return { error: 'User not found' } }

        if (target.role === 'ADMIN' && payload.role !== 'ADMIN') {
          set.status = 403; return { error: 'Only admins can edit admin accounts' }
        }
        if (payload.role !== 'ADMIN' && payload.sub !== id) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }

        const { name, email, role, branchId, password, active } = body as {
          name?: string; email?: string; role?: string;
          branchId?: string; password?: string; active?: boolean;
        }

        const updates: any = {}
        if (name !== undefined) updates.name = name
        if (email !== undefined) updates.email = email
        if (role !== undefined) updates.role = role.toUpperCase()
        if (branchId !== undefined) updates.branch_id = branchId
        if (active !== undefined) updates.active = active
        if (password !== undefined) updates.password_hash = await hashPassword(password)
        updates.updated_at = new Date().toISOString()

        await db.updateTable('users').set(updates).where('id', '=', id).execute()

        await db.insertInto('audit_log').values({
          user_id: payload.sub,
          action: 'USER_UPDATE',
          entity_type: 'users',
          entity_id: id,
        }).execute()

        return { success: true }
      }, {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          name: t.Optional(t.String()),
          email: t.Optional(t.String()),
          role: t.Optional(t.String()),
          branchId: t.Optional(t.String()),
          password: t.Optional(t.String()),
          active: t.Optional(t.Boolean()),
        }),
        detail: { tags: ['Users'], security: [{ bearerAuth: [] }] }
      })

      // DELETE /api/users/:id — delete user (admin only)
      .delete('/:id', async ({ params: { id }, jwt, cookie: { auth_token }, set , request }) => {
        const token = extractToken(auth_token, request)
        if (!token) { set.status = 401; return { error: 'Unauthorized' } }
        let payload: any
        try { payload = await jwt.verify(token) } catch { set.status = 401; return { error: 'Invalid token' } }
        if (denyNonAdmin(payload.role)) { set.status = 403; return { error: 'Only admins can delete users' } }

        const target = await db.selectFrom('users').select(['id', 'role']).where('id', '=', id).executeTakeFirst()
        if (!target) { set.status = 404; return { error: 'User not found' } }
        if (target.role === 'ADMIN') { set.status = 403; return { error: 'Cannot delete admin accounts' } }

        await db.deleteFrom('users').where('id', '=', id).execute()

        await db.insertInto('audit_log').values({
          user_id: payload.sub,
          action: 'USER_DELETE',
          entity_type: 'users',
          entity_id: id,
        }).execute()

        return { success: true }
      }, {
        params: t.Object({ id: t.String() }),
        detail: { tags: ['Users'], security: [{ bearerAuth: [] }] }
      })
  )