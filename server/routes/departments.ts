import { Elysia, t } from 'elysia'
import { db } from '../db.js'
import { extractToken } from '../plugins/auth.js'

// ─── Departments Routes ────────────────────────────────────────────────────

export const departmentsRoutes = (app: Elysia) =>
  app.group('/api/departments', (app) =>
    app
      // GET /api/departments — list all departments
      .get('/', async ({ jwt, cookie: { auth_token }, set , request }) => {
        const token = extractToken(auth_token, request)
        if (!token) { set.status = 401; return { error: 'Unauthorized' } }
        let payload: any
        try { payload = await jwt.verify(token) } catch { set.status = 401; return { error: 'Invalid token' } }
        if (!['ADMIN', 'MANAGER'].includes(payload.role?.toUpperCase())) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }

        const departments = await db
          .selectFrom('departments')
          .select(['id', 'name', 'description', 'manager_id'])
          .orderBy('name', 'asc')
          .execute()

        return { departments }
      }, {
        detail: { tags: ['Departments'], security: [{ bearerAuth: [] }] }
      })

      // POST /api/departments — create department (admin only)
      .post('/', async ({ body, jwt, cookie: { auth_token }, set, request }: any) => {
        const token = extractToken(auth_token, request)
        if (!token) { set.status = 401; return { error: 'Unauthorized' } }
        let payload: any
        try { payload = await jwt.verify(token) } catch { set.status = 401; return { error: 'Invalid token' } }
        if (payload.role !== 'ADMIN') { set.status = 403; return { error: 'Only admins can create departments' } }

        const { name, description, managerId } = body as { name: string; description?: string; managerId?: string }

        const id = crypto.randomUUID()
        await db.insertInto('departments').values({
          id,
          name,
          description: description || null,
          manager_id: managerId || null,
        }).execute()

        return { id, name, description, manager_id: managerId || null }
      }, {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          description: t.Optional(t.String()),
          managerId: t.Optional(t.String()),
        }),
        detail: { tags: ['Departments'], security: [{ bearerAuth: [] }] }
      })

      // PUT /api/departments/:id — update department (admin only)
      .put('/:id', async ({ params: { id }, body, jwt, cookie: { auth_token }, set, request }: any) => {
        const token = extractToken(auth_token, request)
        if (!token) { set.status = 401; return { error: 'Unauthorized' } }
        let payload: any
        try { payload = await jwt.verify(token) } catch { set.status = 401; return { error: 'Invalid token' } }
        if (payload.role !== 'ADMIN') { set.status = 403; return { error: 'Only admins can update departments' } }

        const existing = await db.selectFrom('departments').select('id').where('id', '=', id).executeTakeFirst()
        if (!existing) { set.status = 404; return { error: 'Department not found' } }

        const { name, description, managerId } = body as {
          name?: string; description?: string; managerId?: string
        }

        const updates: any = {}
        if (name !== undefined) updates.name = name
        if (description !== undefined) updates.description = description
        if (managerId !== undefined) updates.manager_id = managerId

        await db.updateTable('departments').set(updates).where('id', '=', id).execute()
        return { success: true }
      }, {
        params: t.Object({ id: t.String() }),
        body: t.Object({
          name: t.Optional(t.String()),
          description: t.Optional(t.String()),
          managerId: t.Optional(t.String()),
        }),
        detail: { tags: ['Departments'], security: [{ bearerAuth: [] }] }
      })

      // DELETE /api/departments/:id — delete department (admin only)
      .delete('/:id', async ({ params: { id }, jwt, cookie: { auth_token }, set , request }) => {
        const token = extractToken(auth_token, request)
        if (!token) { set.status = 401; return { error: 'Unauthorized' } }
        let payload: any
        try { payload = await jwt.verify(token) } catch { set.status = 401; return { error: 'Invalid token' } }
        if (payload.role !== 'ADMIN') { set.status = 403; return { error: 'Only admins can delete departments' } }

        const existing = await db.selectFrom('departments').select('id').where('id', '=', id).executeTakeFirst()
        if (!existing) { set.status = 404; return { error: 'Department not found' } }

        await db.deleteFrom('departments').where('id', '=', id).execute()
        return { success: true }
      }, {
        params: t.Object({ id: t.String() }),
        detail: { tags: ['Departments'], security: [{ bearerAuth: [] }] }
      })
  )