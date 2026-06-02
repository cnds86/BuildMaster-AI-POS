/**
 * MHX-POS — Quotations Routes
 * RESTful: GET /api/quotations, GET /api/quotations/:id, POST /api/quotations,
 *          PUT /api/quotations/:id, DELETE /api/quotations/:id,
 *          POST /api/quotations/:id/convert (convert to order)
 */
import { Elysia, t } from 'elysia'
import { db } from '../db.js'

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

// ─── Quotations CRUD ──────────────────────────────────────────────────────────
export const quotationsRoutes = (app: Elysia) =>
  app.group('/api/quotations', (app) =>
    app
      // GET /api/quotations — list with filters & pagination
      .get('/', async ({ query, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const {
          status,
          customer_id,
          date_from,
          date_to,
          page = '1',
          limit = '50'
        } = query ?? {}

        const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50))
        const offset = (pageNum - 1) * limitNum

        try {
          let q = db.selectFrom('quotations').selectAll()

          if (status) q = q.where('status', '=', status)
          if (customer_id) q = q.where('customer_id', '=', customer_id)
          if (date_from) q = q.where('created_at', '>=', new Date(date_from as string))
          if (date_to) {
            const endDate = new Date(date_to as string)
            endDate.setDate(endDate.getDate() + 1)
            q = q.where('created_at', '<', endDate)
          }

          const [quotations, countResult] = await Promise.all([
            q.orderBy('created_at', 'desc').limit(limitNum).offset(offset).execute(),
            db.selectFrom('quotations')
              .select((e) => e.fn.count('id').as('count'))
              .executeTakeFirst(),
          ])

          return {
            quotations,
            total: Number(countResult?.count ?? 0),
            page: pageNum,
            limit: limitNum,
          }
        } catch (err) {
          console.error('DB error:', err)
          return { quotations: [], error: 'Database error' }
        }
      })

      // GET /api/quotations/:id — single quotation with items
      .get('/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        try {
          const quotation = await db
            .selectFrom('quotations')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst()

          if (!quotation) {
            set.status = 404
            return { error: 'Not found' }
          }

          const items = await db
            .selectFrom('quotation_items')
            .selectAll()
            .where('quotation_id', '=', id)
            .execute()

          // Enrich with product names
          const productIds = items.map((i: any) => i.product_id)
          const products = productIds.length
            ? await db
                .selectFrom('products')
                .select(['id', 'name'])
                .where('id', 'in', productIds)
                .execute()
            : []

          const productMap: Record<string, string> = {}
          for (const p of products) {
            productMap[p.id] = (p as any).name
          }

          const enrichedItems = items.map((item: any) => ({
            ...item,
            productName: productMap[item.product_id] ?? 'Unknown',
          }))

          // Get customer info
          let customer = null
          if (quotation.customer_id) {
            customer = await db
              .selectFrom('customers')
              .select(['id', 'name', 'phone', 'address'])
              .where('id', '=', quotation.customer_id)
              .executeTakeFirst()
          }

          return { quotation, items: enrichedItems, customer }
        } catch (err) {
          console.error('DB error:', err)
          return { error: 'Database error' }
        }
      })

      // POST /api/quotations — create quotation
      .post('/', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const {
          customer_id,
          valid_until,
          status = 'draft',
          items,
          discount_amount = 0,
          note,
        } = body as {
          customer_id?: string
          valid_until?: string
          status?: string
          items: any[]
          discount_amount?: number
          note?: string
        }

        if (!items || items.length === 0) {
          set.status = 400
          return { error: 'Quotation must have at least one item' }
        }

        try {
          // Use total from frontend (frontend calculates subtotal, tax, discount)
          // DB only stores `total`
          const { subtotal: _subtotal, discount_amount: _discount, tax_amount: _tax, total } = body as {
            subtotal?: number; discount_amount?: number; tax_amount?: number; total: number
          }

          const quotation = await db
            .insertInto('quotations')
            .values({
              customer_id: customer_id || null,
              user_id: user.sub,
              total,
              valid_until: valid_until || null,
              status,
            } as any)
            .returningAll()
            .executeTakeFirst()

          const quotationItems = items.map((item: any) => ({
            quotation_id: quotation!.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          }))

          await db.insertInto('quotation_items').values(quotationItems).execute()

          return { quotation, items: quotationItems }, { status: 201 }
        } catch (err) {
          console.error('Create quotation error:', err)
          set.status = 500
          return { error: 'Failed to create quotation' }
        }
      }, {
        body: t.Object({
          customer_id: t.Optional(t.String()),
          valid_until: t.Optional(t.String()),
          status: t.Optional(t.String()),
          items: t.Array(t.Object({
            product_id: t.String(),
            quantity: t.Number(),
            unit_price: t.Number(),
          })),
          subtotal: t.Optional(t.Number()),
          discount_amount: t.Optional(t.Number()),
          tax_amount: t.Optional(t.Number()),
          total: t.Number(),
          note: t.Optional(t.String()),
        }),
      })

      // PUT /api/quotations/:id — update quotation
      .put('/:id', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        const {
          customer_id,
          valid_until,
          status,
          items,
          total,
          note,
        } = body as {
          customer_id?: string
          valid_until?: string
          status?: string
          items?: any[]
          total?: number
          note?: string
        }

        try {
          const existing = await db
            .selectFrom('quotations')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst()

          if (!existing) {
            set.status = 404
            return { error: 'Not found' }
          }

          // Build update object
          const updates: any = {}
          if (status !== undefined) updates.status = status
          if (valid_until !== undefined) updates.valid_until = valid_until
          if (customer_id !== undefined) updates.customer_id = customer_id
          if (total !== undefined) updates.total = total

          // Replace items if provided
          if (items) {
            await db.deleteFrom('quotation_items').where('quotation_id', '=', id).execute()
            const quotationItems = items.map((item: any) => ({
              quotation_id: id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
            }))
            await db.insertInto('quotation_items').values(quotationItems).execute()
          }

          if (Object.keys(updates).length > 0) {
            await db.updateTable('quotations').set(updates).where('id', '=', id).execute()
          }

          const updated = await db
            .selectFrom('quotations')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst()

          return { quotation: updated }
        } catch (err) {
          console.error('Update quotation error:', err)
          set.status = 500
          return { error: 'Failed to update quotation' }
        }
      })

      // DELETE /api/quotations/:id
      .delete('/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        try {
          const existing = await db
            .selectFrom('quotations')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst()

          if (!existing) {
            set.status = 404
            return { error: 'Not found' }
          }

          await db.deleteFrom('quotation_items').where('quotation_id', '=', id).execute()
          await db.deleteFrom('quotations').where('id', '=', id).execute()

          return { deleted: true }
        } catch (err) {
          console.error('Delete quotation error:', err)
          set.status = 500
          return { error: 'Failed to delete quotation' }
        }
      })

      // POST /api/quotations/:id/convert — convert quotation to sale/order
      .post('/:id/convert', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const {
          branch_id,
          payment_method = 'CASH',
          discount_amount = 0,
        } = body as { branch_id?: string; payment_method?: string; discount_amount?: number }

        try {
          const quotation = await db
            .selectFrom('quotations')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst()

          if (!quotation) {
            set.status = 404
            return { error: 'Quotation not found' }
          }

          if (quotation.status === 'converted' || quotation.status === 'expired') {
            set.status = 400
            return { error: `Cannot convert quotation with status: ${quotation.status}` }
          }

          const items = await db
            .selectFrom('quotation_items')
            .selectAll()
            .where('quotation_id', '=', id)
            .execute()

          if (items.length === 0) {
            set.status = 400
            return { error: 'Quotation has no items' }
          }

          const subtotal = items.reduce(
            (sum: number, item: any) => sum + item.unit_price * item.quantity,
            0,
          )
          const tax_amount = Math.round(subtotal * 0.07 * 100) / 100
          const total = Math.round((subtotal + tax_amount - discount_amount) * 100) / 100

          // Create sale
          const sale = await db
            .insertInto('sales')
            .values({
              branch_id: branch_id || null,
              user_id: user.sub,
              customer_id: quotation.customer_id,
              subtotal,
              discount_amount,
              tax_amount,
              total,
              payment_method,
              payment_status: 'PAID',
              status: 'completed',
            } as any)
            .returningAll()
            .executeTakeFirst()

          // Insert sale items
          const saleItems = items.map((item: any) => ({
            sale_id: sale!.id,
            product_id: item.product_id,
            quantity: item.quantity,
            sell_price: item.unit_price,
            sell_unit: null,
          }))

          await db.insertInto('sale_items').values(saleItems).execute()

          // Mark quotation as converted
          await db
            .updateTable('quotations')
            .set({ status: 'converted' })
            .where('id', '=', id)
            .execute()

          // Update product stock
          for (const item of items) {
            await db
              .updateTable('products')
              .set((eb) => ({ stock: eb('stock', '-', item.quantity) }))
              .where('id', '=', item.product_id)
              .executeTakeFirst()
          }

          return { order: sale, items: saleItems, quotation_id: id }
        } catch (err) {
          console.error('Convert quotation error:', err)
          set.status = 500
          return { error: 'Failed to convert quotation' }
        }
      }),
  )
