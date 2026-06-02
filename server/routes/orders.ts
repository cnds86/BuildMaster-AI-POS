/**
 * MHX-POS — Orders Routes
 * RESTful: GET /api/orders, GET /api/orders/:id, POST /api/orders, PUT /api/orders/:id, DELETE /api/orders/:id
 * POST /api/orders/recalculate
 */
import { Elysia, t } from 'elysia'
import { db } from '../db.js'
import { ROLES } from '../plugins/auth.js'

// ─── Helper: auth guard ───────────────────────────────────────────────────────
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

// ─── Orders CRUD ──────────────────────────────────────────────────────────────
export const ordersRoutes = (app: Elysia) =>
  app.group('/api/orders', (app) =>
    app
      // GET /api/orders — list with filters & pagination
      .get('/', async ({ query, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { status, customer_id, date_from, date_to, page = '1', limit = '50' } = query ?? {}
        const pageNum = Math.max(1, parseInt(page, 10) || 1)
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50))
        const offset = (pageNum - 1) * limitNum

        try {
          let q = db.selectFrom('sales').selectAll()

          if (status) q = q.where('status', '=', status)
          if (customer_id) q = q.where('customer_id', '=', customer_id)
          if (date_from) q = q.where('created_at', '>=', new Date(date_from))
          if (date_to) {
            const endDate = new Date(date_to)
            endDate.setDate(endDate.getDate() + 1)
            q = q.where('created_at', '<', endDate)
          }

          const [orders, countResult] = await Promise.all([
            q.orderBy('created_at', 'desc').limit(limitNum).offset(offset).execute(),
            db.selectFrom('sales').select((e) => e.fn.count('id').as('count')).executeTakeFirst(),
          ])

          return { orders, total: Number(countResult?.count ?? 0), page: pageNum, limit: limitNum }
        } catch (err) {
          console.error('DB error:', err)
          return { orders: [], error: 'Database error' }
        }
      })

      // GET /api/orders/:id — single order with items
      .get('/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        try {
          const order = await db.selectFrom('sales').selectAll().where('id', '=', id).executeTakeFirst()
          if (!order) { set.status = 404; return { error: 'Not found' } }

          const items = await db
            .selectFrom('sale_items')
            .selectAll()
            .where('sale_id', '=', id)
            .execute()

          return { order, items }
        } catch { return { error: 'Database error' } }
      })

      // POST /api/orders — create new sale
      .post('/', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { branch_id, customer_id, items, payment_method = 'CASH', discount_amount = 0 } = body as {
          branch_id?: string; customer_id?: string; items: any[]; payment_method?: string; discount_amount?: number
        }

        if (!items || items.length === 0) {
          set.status = 400; return { error: 'Order must have at least one item' }
        }

        try {
          // Calculate totals from items
          const subtotal = items.reduce((sum: number, item: any) => sum + (item.sell_price * item.quantity), 0)
          const tax_amount = Math.round(subtotal * 0.07 * 100) / 100
          const total = Math.round((subtotal + tax_amount - discount_amount) * 100) / 100

          // Insert sale
          const sale = await db.insertInto('sales').values({
            branch_id: branch_id || null,
            user_id: user.sub,
            customer_id: customer_id || null,
            subtotal,
            discount_amount,
            tax_amount,
            total,
            payment_method,
            payment_status: 'PAID',
            status: 'completed',
          } as any).returningAll().executeTakeFirst()

          // Insert sale items
          const saleItems = items.map((item: any) => ({
            sale_id: sale!.id,
            product_id: item.product_id,
            quantity: item.quantity,
            sell_price: item.sell_price,
            sell_unit: item.sell_unit || null,
          }))

          await db.insertInto('sale_items').values(saleItems).execute()

          // Update product stock
          for (const item of items) {
            await db.updateTable('products')
              .set((eb) => ({ stock: eb('stock', '-', item.quantity) }))
              .where('id', '=', item.product_id)
              .executeTakeFirst()
          }

          return { order: sale, items: saleItems }, { status: 201 }
        } catch (err) {
          console.error('Create order error:', err)
          set.status = 500; return { error: 'Failed to create order' }
        }
      }, {
        body: t.Object({
          branch_id: t.Optional(t.String()),
          customer_id: t.Optional(t.String()),
          items: t.Array(t.Object({
            product_id: t.String(),
            quantity: t.Number(),
            sell_price: t.Number(),
            sell_unit: t.Optional(t.String()),
          })),
          payment_method: t.Optional(t.String()),
          discount_amount: t.Optional(t.Number()),
        }),
      })

      // PUT /api/orders/:id — update order status
      .put('/:id', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER) {
          set.status = 403; return { error: 'Manager or Admin only' }
        }

        const { status, payment_status } = body as { status?: string; payment_status?: string }
        try {
          const existing = await db.selectFrom('sales').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }

          const updates: any = {}
          if (status) updates.status = status
          if (payment_status) updates.payment_status = payment_status

          if (Object.keys(updates).length === 0) {
            set.status = 400; return { error: 'No valid fields to update' }
          }

          const updated = await db.updateTable('sales').set(updates).where('id', '=', id).returningAll().executeTakeFirst()
          return { order: updated }
        } catch { set.status = 500; return { error: 'Failed to update order' } }
      })

      // DELETE /api/orders/:id — soft delete (mark status = 'cancelled')
      .delete('/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER) {
          set.status = 403; return { error: 'Manager or Admin only' }
        }

        try {
          const existing = await db.selectFrom('sales').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }

          const updated = await db.updateTable('sales')
            .set({ status: 'cancelled' })
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirst()

          return { order: updated, deleted: true }
        } catch { set.status = 500; return { error: 'Failed to cancel order' } }
      })

      // POST /api/orders/recalculate — fix rounding errors
      .post('/recalculate', async ({ body, set }: any) => {
        const { order_id } = body as { order_id: string }
        if (!order_id) { set.status = 400; return { error: 'order_id required' } }

        try {
          const order = await db.selectFrom('sales').selectAll().where('id', '=', order_id).executeTakeFirst()
          if (!order) { set.status = 404; return { error: 'Order not found' } }

          const items = await db.selectFrom('sale_items').selectAll().where('sale_id', '=', order_id).execute()

          const subtotal = items.reduce((sum: number, item: any) => sum + (item.sell_price * item.quantity), 0)
          const tax_amount = Math.round(subtotal * 0.07 * 100) / 100
          const discount_amount = order.discount_amount ?? 0
          const total = Math.round((subtotal + tax_amount - discount_amount) * 100) / 100

          await db.updateTable('sales').set({ subtotal, tax_amount, total }).where('id', '=', order_id).execute()

          return { order_id, subtotal, tax_amount, discount_amount, total, recalculated: true }
        } catch (err) {
          console.error('Recalculate error:', err)
          return { error: 'Failed to recalculate' }
        }
      }, {
        body: t.Object({ order_id: t.String() }),
      })
  )