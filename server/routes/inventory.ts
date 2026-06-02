/**
 * MHX-POS — Inventory Routes
 * Stock movements, adjustments, ledger
 * POST /api/inventory/adjust, GET /api/inventory/ledger
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

export const inventoryRoutes = (app: Elysia) =>
  app.group('/api/inventory', (app) =>
    app
      // GET /api/inventory/ledger — stock movement history
      .get('/ledger', async ({ query, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { product_id, branch_id, movement_type, date_from, date_to, page = '1', limit = '100' } = query ?? {}
        const pageNum = Math.max(1, parseInt(page, 10) || 1)
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 100))
        const offset = (pageNum - 1) * limitNum

        try {
          let q = db.selectFrom('stock_ledger').selectAll()
          if (product_id) q = q.where('product_id', '=', product_id)
          if (branch_id) q = q.where('branch_id', '=', branch_id)
          if (movement_type) q = q.where('movement_type', '=', movement_type)
          if (date_from) q = q.where('created_at', '>=', new Date(date_from))
          if (date_to) q = q.where('created_at', '<=', new Date(date_to))

          const entries = await q.orderBy('created_at', 'desc').limit(limitNum).offset(offset).execute()
          return { entries, page: pageNum, limit: limitNum }
        } catch (err) {
          console.error('DB error:', err)
          return { entries: [], error: 'Database error' }
        }
      })

      // POST /api/inventory/adjust — stock adjustment
      .post('/adjust', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER && user.role !== ROLES.WAREHOUSE) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }

        const { product_id, branch_id, movement_type, quantity, unit_cost, reference_id, note } = body as any
        if (!product_id || !movement_type || quantity === undefined) {
          set.status = 400; return { error: 'product_id, movement_type, and quantity are required' }
        }

        if (!['IN', 'OUT', 'ADJUST'].includes(movement_type)) {
          set.status = 400; return { error: 'movement_type must be IN, OUT, or ADJUST' }
        }

        try {
          // Insert ledger entry
          const entry = await db.insertInto('stock_ledger').values({
            product_id,
            branch_id: branch_id ?? null,
            movement_type,
            quantity,
            unit_cost: unit_cost ?? null,
            reference_id: reference_id ?? null,
            note: note ?? null,
          } as any).returningAll().executeTakeFirst()

          // Update product stock
          const delta = movement_type === 'OUT' ? -quantity : quantity
          await db.updateTable('products')
            .set((eb) => ({ stock: eb('stock', '+', delta) }))
            .where('id', '=', product_id)
            .executeTakeFirst()

          return { entry }, { status: 201 }
        } catch (err) {
          console.error('Inventory adjust error:', err)
          set.status = 500; return { error: 'Failed to adjust stock' }
        }
      }, {
        body: t.Object({
          product_id: t.String(),
          branch_id: t.Optional(t.String()),
          movement_type: t.String(),
          quantity: t.Number(),
          unit_cost: t.Optional(t.Number()),
          reference_id: t.Optional(t.String()),
          note: t.Optional(t.String()),
        }),
      })

      // GET /api/inventory/summary — current stock summary for all products
      .get('/summary', async ({ query, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { low_stock } = query ?? {}

        try {
          let q = db.selectFrom('products').select(['id', 'name', 'category', 'stock', 'min_stock', 'unit']).where('active', '=', true)
          if (low_stock === 'true' || low_stock === '1') {
            q = q.where((eb) => eb.or([
              eb('stock', '<', eb.ref('min_stock')),
              eb.and([eb('stock', '<', 20), eb('min_stock', 'is', null)]),
            ]))
          }

          const products = await q.orderBy('stock', 'asc').execute()
          return { products }
        } catch (err) {
          console.error('DB error:', err)
          return { products: [], error: 'Database error' }
        }
      })
  )