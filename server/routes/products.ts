/**
 * MHX-POS — Products Routes
 * RESTful: GET /api/products, GET /api/products/:id, POST /api/products, PUT /api/products/:id, DELETE /api/products/:id
 * GET /api/products/low-stock, GET /api/products/categories
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

// ─── Products Routes ──────────────────────────────────────────────────────────
export const productsRoutes = (app: Elysia) =>
  app.group('/api/products', (app) =>
    app
      // GET /api/products — list with filters & pagination
      .get('/', async ({ query, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { category, low_stock, search, page = '1', limit = '50' } = query ?? {}
        const pageNum = Math.max(1, parseInt(page, 10) || 1)
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50))
        const offset = (pageNum - 1) * limitNum

        try {
          let q = db.selectFrom('products').selectAll().where('active', '=', true)

          if (low_stock === 'true' || low_stock === '1') {
            q = q.where((eb) => eb.or([
              eb('stock', '<', eb.ref('min_stock')),
              eb.and([eb('stock', '<', 20), eb('min_stock', 'is', null)]),
            ]))
          }

          if (category) q = q.where('category', '=', category)
          if (search) {
            q = q.where((eb) => eb.or([
              eb('name', 'ilike', `%${search}%`),
              eb('sku', 'ilike', `%${search}%`),
              eb('category', 'ilike', `%${search}%`),
            ]))
          }

          const products = await q.orderBy('name', 'asc').limit(limitNum).offset(offset).execute()
          return { products, page: pageNum, limit: limitNum }
        } catch (err) {
          console.error('DB error:', err)
          return { products: [], error: 'Database unavailable' }
        }
      })

      // GET /api/products/low-stock — low stock items
      .get('/low-stock', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          const products = await db
            .selectFrom('products')
            .selectAll()
            .where('active', '=', true)
            .where((eb) => eb.or([
              eb('stock', '<', eb.ref('min_stock')),
              eb.and([eb('stock', '<', 20), eb('min_stock', 'is', null)]),
            ]))
            .orderBy('stock', 'asc')
            .execute()
          return { products }
        } catch (err) {
          console.error('DB error:', err)
          return { products: [], error: 'Database unavailable' }
        }
      })

      // GET /api/products/:id
      .get('/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        try {
          const product = await db
            .selectFrom('products')
            .selectAll()
            .where('id', '=', id)
            .where('active', '=', true)
            .executeTakeFirst()
          if (!product) { set.status = 404; return { error: 'Not found' } }
          return { product }
        } catch { return { error: 'Database error' } }
      })

      // POST /api/products — create product
      .post('/', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER && user.role !== ROLES.WAREHOUSE) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }

        const { name, category, price, cost_price, stock, min_stock, unit, sku, barcode, image_url } = body as any
        if (!name || !category || price === undefined) {
          set.status = 400; return { error: 'name, category, and price are required' }
        }

        try {
          const product = await db.insertInto('products').values({
            name, category, price,
            cost_price: cost_price ?? null,
            stock: stock ?? 0,
            min_stock: min_stock ?? null,
            unit: unit ?? 'piece',
            sku: sku ?? '',
            barcode: barcode ?? null,
            image_url: image_url ?? null,
            active: true,
          } as any).returningAll().executeTakeFirst()
          return { product }, { status: 201 }
        } catch (err) {
          console.error('Create product error:', err)
          set.status = 500; return { error: 'Failed to create product' }
        }
      }, {
        body: t.Object({
          name: t.String(),
          category: t.String(),
          price: t.Number(),
          cost_price: t.Optional(t.Number()),
          stock: t.Optional(t.Number()),
          min_stock: t.Optional(t.Number()),
          unit: t.Optional(t.String()),
          sku: t.Optional(t.String()),
          barcode: t.Optional(t.String()),
          image_url: t.Optional(t.String()),
        }),
      })

      // PUT /api/products/:id
      .put('/:id', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER && user.role !== ROLES.WAREHOUSE) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }

        const fields = ['name', 'category', 'price', 'cost_price', 'stock', 'min_stock', 'unit', 'sku', 'barcode', 'image_url']
        const updates: any = {}
        for (const field of fields) {
          if ((body as any)[field] !== undefined) updates[field] = (body as any)[field]
        }
        if (Object.keys(updates).length === 0) {
          set.status = 400; return { error: 'No fields to update' }
        }

        try {
          const existing = await db.selectFrom('products').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }

          const updated = await db.updateTable('products').set(updates).where('id', '=', id).returningAll().executeTakeFirst()
          return { product: updated }
        } catch (err) {
          console.error('Update product error:', err)
          set.status = 500; return { error: 'Failed to update product' }
        }
      })

      // DELETE /api/products/:id — soft delete
      .delete('/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER) {
          set.status = 403; return { error: 'Admin or Manager only' }
        }

        try {
          const existing = await db.selectFrom('products').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }

          const updated = await db.updateTable('products').set({ active: false }).where('id', '=', id).returningAll().executeTakeFirst()
          return { product: updated, deleted: true }
        } catch (err) {
          console.error('Delete product error:', err)
          set.status = 500; return { error: 'Failed to delete product' }
        }
      })
  )