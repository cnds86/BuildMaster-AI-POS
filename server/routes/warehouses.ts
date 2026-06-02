/**
 * MHX-POS — Warehouses Routes
 * RESTful: GET /api/warehouses, GET /api/warehouses/:id, POST /api/warehouses, PUT /api/warehouses/:id
 * Warehouses are referenced by stock_documents (transfer source/target), stock_ledger (branch-level inventory).
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

export const warehousesRoutes = (app: Elysia) =>
  app.group('/api/warehouses', (app) =>
    app
      // GET /api/warehouses — list all active warehouses
      .get('/', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          const warehouses = await db
            .selectFrom('warehouses')
            .selectAll()
            .where('active', '=', true)
            .orderBy('name', 'asc')
            .execute()
          return { warehouses }
        } catch { return { warehouses: [], error: 'Database error' } }
      })

      // GET /api/warehouses/:id — single warehouse
      .get('/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        try {
          const warehouse = await db
            .selectFrom('warehouses')
            .selectAll()
            .where('id', '=', id)
            .where('active', '=', true)
            .executeTakeFirst()
          if (!warehouse) { set.status = 404; return { error: 'Warehouse not found' } }
          return { warehouse }
        } catch { return { error: 'Database error' } }
      })

      // POST /api/warehouses — create warehouse (admin/manager only)
      .post('/', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }

        const { name, code, warehouse_type, branch_id, address, phone } = body as {
          name: string; code: string; warehouse_type?: string
          branch_id?: string; address?: string; phone?: string
        }
        if (!name || !code) { set.status = 400; return { error: 'name and code are required' } }

        const validTypes = ['main', 'branch', 'external']
        if (warehouse_type && !validTypes.includes(warehouse_type)) {
          set.status = 400; return { error: `warehouse_type must be one of: ${validTypes.join(', ')}` }
        }

        try {
          const warehouse = await db.insertInto('warehouses').values({
            name,
            code,
            warehouse_type: (warehouse_type as any) ?? 'main',
            branch_id: branch_id ?? null,
            address: address ?? null,
            phone: phone ?? null,
            manager_id: null,
            active: true,
          } as any).returningAll().executeTakeFirst()
          return { warehouse }, { status: 201 }
        } catch (err) {
          console.error('Create warehouse error:', err)
          set.status = 500; return { error: 'Failed to create warehouse' }
        }
      }, {
        body: t.Object({
          name: t.String(),
          code: t.String(),
          warehouse_type: t.Optional(t.Union([t.Literal('main'), t.Literal('branch'), t.Literal('external')])),
          branch_id: t.Optional(t.String()),
          address: t.Optional(t.String()),
          phone: t.Optional(t.String()),
        }),
      })

      // PUT /api/warehouses/:id — update warehouse
      .put('/:id', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }

        const { name, code, warehouse_type, branch_id, address, phone, active } = body as any
        const updates: any = {}
        if (name !== undefined) updates.name = name
        if (code !== undefined) updates.code = code
        if (warehouse_type !== undefined) updates.warehouse_type = warehouse_type
        if (branch_id !== undefined) updates.branch_id = branch_id
        if (address !== undefined) updates.address = address
        if (phone !== undefined) updates.phone = phone
        if (active !== undefined) updates.active = active
        updates.updated_at = new Date().toISOString()

        if (Object.keys(updates).length === 1 && !updates.updated_at) {
          set.status = 400; return { error: 'No fields to update' }
        }

        try {
          const existing = await db.selectFrom('warehouses').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Warehouse not found' } }

          const updated = await db.updateTable('warehouses').set(updates).where('id', '=', id).returningAll().executeTakeFirst()
          return { warehouse: updated }
        } catch (err) {
          console.error('Update warehouse error:', err)
          set.status = 500; return { error: 'Failed to update warehouse' }
        }
      })

      // DELETE /api/warehouses/:id — soft-delete
      .delete('/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }
        if (user.role !== ROLES.ADMIN) { set.status = 403; return { error: 'Admin only' } }

        try {
          const existing = await db.selectFrom('warehouses').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Warehouse not found' } }

          const updated = await db.updateTable('warehouses')
            .set({ active: false, updated_at: new Date().toISOString() })
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirst()
          return { warehouse: updated, deleted: true }
        } catch { set.status = 500; return { error: 'Failed to delete warehouse' } }
      })
  )
