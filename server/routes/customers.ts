/**
 * MHX-POS — Customers Routes
 * RESTful: GET /api/customers, GET /api/customers/:id, POST /api/customers, PUT /api/customers/:id, DELETE /api/customers/:id
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

export const customersRoutes = (app: Elysia) =>
  app.group('/api/customers', (app) =>
    app
      // GET /api/customers
      .get('/', async ({ query, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { search, level_id, page = '1', limit = '100' } = query ?? {}
        const pageNum = Math.max(1, parseInt(page, 10) || 1)
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 100))
        const offset = (pageNum - 1) * limitNum

        try {
          let q = db.selectFrom('customers').selectAll().where('active', '=', true)
          if (level_id) q = q.where('level_id', '=', level_id)
          if (search) {
            q = q.where((eb) => eb.or([
              eb('name', 'ilike', `%${search}%`),
              eb('phone', 'ilike', `%${search}%`),
              eb('email', 'ilike', `%${search}%`),
            ]))
          }

          const [customers, countResult] = await Promise.all([
            q.orderBy('name', 'asc').limit(limitNum).offset(offset).execute(),
            db.selectFrom('customers').select((e) => e.fn.count('id').as('count')).where('active', '=', true).executeTakeFirst(),
          ])

          return { customers, total: Number(countResult?.count ?? 0), page: pageNum, limit: limitNum }
        } catch (err) {
          console.error('DB error:', err)
          return { customers: [], error: 'Database error' }
        }
      })

      // GET /api/customers/:id
      .get('/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        try {
          const customer = await db.selectFrom('customers').selectAll().where('id', '=', id).where('active', '=', true).executeTakeFirst()
          if (!customer) { set.status = 404; return { error: 'Not found' } }
          return { customer }
        } catch { return { error: 'Database error' } }
      })

      // POST /api/customers
      .post('/', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        const userRole = String(user.role || '').toLowerCase()
        if (userRole !== ROLES.ADMIN && userRole !== ROLES.MANAGER && userRole !== ROLES.CASHIER) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }

        const { name, phone, email, level_id, address } = body as any
        if (!name) { set.status = 400; return { error: 'name is required' } }

        try {
          const customer = await db.insertInto('customers').values({
            name,
            phone: phone ?? null,
            email: email ?? null,
            level_id: level_id ?? null,
            address: address ?? null,
            active: true,
          } as any).returningAll().executeTakeFirst()
          return { customer }, { status: 201 }
        } catch (err) {
          console.error('Create customer error:', err)
          set.status = 500; return { error: 'Failed to create customer' }
        }
      }, {
        body: t.Object({
          name: t.String(),
          phone: t.Optional(t.String()),
          email: t.Optional(t.String()),
          level_id: t.Optional(t.String()),
          address: t.Optional(t.String()),
        }),
      })

      // PUT /api/customers/:id
      .put('/:id', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        const fields = ['name', 'phone', 'email', 'level_id', 'address']
        const updates: any = {}
        for (const field of fields) {
          if ((body as any)[field] !== undefined) updates[field] = (body as any)[field]
        }
        if (Object.keys(updates).length === 0) {
          set.status = 400; return { error: 'No fields to update' }
        }

        try {
          const existing = await db.selectFrom('customers').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }

          const updated = await db.updateTable('customers').set(updates).where('id', '=', id).returningAll().executeTakeFirst()
          return { customer: updated }
        } catch (err) {
          console.error('Update customer error:', err)
          set.status = 500; return { error: 'Failed to update customer' }
        }
      })

      // DELETE /api/customers/:id — soft delete
      .delete('/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER) {
          set.status = 403; return { error: 'Admin or Manager only' }
        }

        try {
          const existing = await db.selectFrom('customers').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }

          const updated = await db.updateTable('customers').set({ active: false }).where('id', '=', id).returningAll().executeTakeFirst()
          return { customer: updated, deleted: true }
        } catch (err) {
          console.error('Delete customer error:', err)
          set.status = 500; return { error: 'Failed to delete customer' }
        }
      })
  )