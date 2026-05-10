import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { cookie } from '@elysiajs/cookie'
import { staticPlugin } from '@elysiajs/static'
import { jwt } from '@elysiajs/jwt'
import { db } from './db.js'
import { authRoutes, ROLES } from './plugins/auth.js'
import { aiRoutes } from './routes/ai.js'
import { logRoutes } from './plugins/logging.js'
import { errorHandler } from './plugins/error-handler.js'
import 'dotenv/config'

const isProd = process.env.NODE_ENV === 'production'
const PORT = Number(process.env.PORT) || 3006
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5176'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_change_in_prod'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'

// ─── App ──────────────────────────────────────────────────────────────────────
const app = new Elysia()
  // ── Global Error Handler (must be first) ──────────────────────────────────────
  .use(errorHandler)
  // ── Global Middleware ──────────────────────────────────────────────────────
  .use(cors({ origin: CORS_ORIGIN, credentials: true }))
  .use(cookie())
  .use(jwt({ name: 'jwt', secret: JWT_SECRET, exp: JWT_EXPIRES_IN }))

  // ── Static Files (production) ───────────────────────────────────────────────
  .use(staticPlugin({ assets: './dist', prefix: '/' }))

  // ── WebSocket ───────────────────────────────────────────────────────────────
  .ws('/ws', {
    message(ws, message) {
      ws.send({ received: message })
    },
  })

  // ── Auth Routes ────────────────────────────────────────────────────────────
  .use(authRoutes)

  // ── Protected API Routes ──────────────────────────────────────────────────
  .group('/api', (app) =>
    app
      // Health Check
      .get('/health', () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      }))

      // Products — with optional filtering & pagination
      .get('/products', async ({ query: { category, low_stock, search, page = '1', limit = '50' } }) => {
        try {
          const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
          const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50))
          const offset = (pageNum - 1) * limitNum

          let q = db.selectFrom('products').selectAll().where('active', '=', true)

          if (low_stock === 'true' || low_stock === '1') {
            // Low stock = stock < min_stock when min_stock is set,
            // OR stock < 20 when min_stock is NULL
            q = q.where((eb) => eb.or([
              eb('stock', '<', eb.ref('min_stock')),
              eb.and([eb('stock', '<', 20), eb('min_stock', 'is', null)]),
            ]))
          }

          if (category) {
            q = q.where('category', '=', category as string)
          }

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

      // Low-stock products — dedicated endpoint
      .get('/products/low-stock', async () => {
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

      // Categories — distinct product categories
      .get('/categories', async () => {
        try {
          const result = await db
            .selectFrom('products')
            .select(['category'])
            .distinct()
            .where('active', '=', true)
            .orderBy('category', 'asc')
            .execute()
          return { categories: result.map(r => r.category).filter(Boolean) }
        } catch (err) {
          console.error('DB error:', err)
          return { categories: [], error: 'Database error' }
        }
      })

      .get('/products/:id', async ({ params: { id } }) => {
        try {
          const product = await db.selectFrom('products').selectAll().where('id', '=', id).where('active', '=', true).executeTakeFirst()
          if (!product) return { error: 'Not found' }
          return { product }
        } catch { return { error: 'Database error' } }
      })

      // Branches
      .get('/branches', async () => {
        try {
          const branches = await db.selectFrom('branches').selectAll().where('active', '=', true).execute()
          return { branches }
        } catch { return { branches: [] } }
      })

      // Users — admin only (role check inline)
      .get('/users', async ({ jwt: jwtFn, cookie: { auth_token }, set }) => {
        const token = auth_token?.value
        if (!token) { set.status = 401; return { error: 'Auth required' } }
        try {
          const payload = await (jwtFn as any).verify(token) as { role?: string; sub?: string } | false
          if (!payload || payload.role?.toLowerCase() !== ROLES.ADMIN) {
            set.status = 403; return { error: 'Admin only' }
          }
          const users = await db.selectFrom('users').select(['id', 'username', 'name', 'role', 'branch_id', 'active', 'created_at']).where('active', '=', true).execute()
          return { users }
        } catch { set.status = 401; return { error: 'Invalid token' } }
      })

      // Shifts — get all shifts (for POS active shift detection)
      .get('/shifts', async ({ jwt: jwtFn, cookie: { auth_token }, set }) => {
        const token = auth_token?.value
        if (!token) { set.status = 401; return { error: 'Auth required' } }
        try {
          const payload = await (jwtFn as any).verify(token) as { role?: string; sub?: string } | false
          if (!payload) { set.status = 401; return { error: 'Invalid token' } }
          const shifts = await db
            .selectFrom('shifts')
            .selectAll()
            .orderBy('opened_at', 'desc')
            .limit(100)
            .execute()
          return { shifts }
        } catch { set.status = 500; return { error: 'Failed to fetch shifts' } }
      })

      // Customers
      .get('/customers', async () => {
        try {
          const customers = await db
            .selectFrom('customers')
            .selectAll()
            .where('active', '=', true)
            .orderBy('name', 'asc')
            .execute()
          return { customers }
        } catch (err) {
          console.error('DB error:', err)
          return { customers: [], error: 'Database error' }
        }
      })

      .get('/customers/:id', async ({ params: { id } }) => {
        try {
          const customer = await db
            .selectFrom('customers')
            .selectAll()
            .where('id', '=', id)
            .where('active', '=', true)
            .executeTakeFirst()
          if (!customer) return { error: 'Not found' }
          return { customer }
        } catch { return { error: 'Database error' } }
      })

      // Orders (Sales)
      .get('/orders', async ({ query: { status, customer_id, date_from, date_to, page = '1', limit = '50' }, jwt: jwtFn, cookie: { auth_token } }) => {
        try {
          const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
          const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50))
          const offset = (pageNum - 1) * limitNum

          let q = db.selectFrom('sales').selectAll()

          if (status) {
            q = q.where('status', '=', status as string)
          }

          if (customer_id) {
            q = q.where('customer_id', '=', customer_id as string)
          }

          if (date_from) {
            q = q.where('created_at', '>=', new Date(date_from as string))
          }

          if (date_to) {
            const endDate = new Date(date_to as string)
            endDate.setDate(endDate.getDate() + 1)
            q = q.where('created_at', '<', endDate)
          }

          const [orders, countResult] = await Promise.all([
            q.orderBy('created_at', 'desc').limit(limitNum).offset(offset).execute(),
            db.selectFrom('sales').select((e) => e.fn.count('id').as('count')).executeTakeFirst(),
          ])

          return {
            orders,
            total: Number(countResult?.count ?? 0),
            page: pageNum,
            limit: limitNum,
          }
        } catch (err) {
          console.error('DB error:', err)
          return { orders: [], error: 'Database error' }
        }
      })

      .get('/orders/:id', async ({ params: { id } }) => {
        try {
          const order = await db.selectFrom('sales').selectAll().where('id', '=', id).executeTakeFirst()
          if (!order) return { error: 'Not found' }

          const items = await db
            .selectFrom('sale_items')
            .selectAll()
            .where('sale_id', '=', id)
            .execute()

          return { order, items }
        } catch { return { error: 'Database error' } }
      })

      // Recalculate order totals (fix rounding errors)
      .post('/orders/recalculate', async ({ body, set }) => {
        try {
          const { order_id } = body as { order_id: string }
          if (!order_id) { set.status = 400; return { error: 'order_id required' } }

          const order = await db.selectFrom('sales').selectAll().where('id', '=', order_id).executeTakeFirst()
          if (!order) { set.status = 404; return { error: 'Order not found' } }

          const items = await db
            .selectFrom('sale_items')
            .selectAll()
            .where('sale_id', '=', order_id)
            .execute()

          // Recalculate subtotal and totals
          const subtotal = items.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0)
          const tax_amount = Math.round(subtotal * 0.07 * 100) / 100
          const discount_amount = order.discount_amount ?? 0
          const total = Math.round((subtotal + tax_amount - discount_amount) * 100) / 100

          await db
            .updateTable('sales')
            .set({ subtotal, tax_amount, total })
            .where('id', '=', order_id)
            .execute()

          return {
            order_id,
            subtotal,
            tax_amount,
            discount_amount,
            total,
            recalculated: true,
          }
        } catch (err) {
          console.error('Recalculate error:', err)
          return { error: 'Failed to recalculate' }
        }
      }, {
        body: t.Object({ order_id: t.String() }),
      })

      // Shifts — open new shift
      .post('/shifts', async ({ body, jwt: jwtFn, cookie: { auth_token }, set }) => {
        const token = auth_token?.value
        if (!token) { set.status = 401; return { error: 'Auth required' } }
        try {
          const payload = await (jwtFn as any).verify(token) as { role?: string; sub?: string; name?: string } | false
          if (!payload) { set.status = 401; return { error: 'Invalid token' } }
          const { branchId, posMachineId, startingCash } = body as { branchId?: string; posMachineId?: string; startingCash?: number }
          // Check if user already has an open shift
          const existing = await db
            .selectFrom('shifts')
            .selectAll()
            .where('user_id', '=', payload.sub)
            .where('status', '=', 'Open')
            .executeTakeFirst()
          if (existing) {
            set.status = 409; return { error: 'You already have an open shift', shift: existing }
          }
          const shift = await db.insertInto('shifts').values({
            user_id: payload.sub,
            user_name: payload.name || '',
            branch_id: branchId || null,
            pos_machine_id: posMachineId || null,
            status: 'Open',
            starting_cash: startingCash || 0,
            cash_in_drawer: startingCash || 0,
          } as any).returningAll().executeTakeFirst()
          return { shift }
        } catch { set.status = 500; return { error: 'Failed to open shift' } }
      })

      // Dashboard Stats
      .get('/dashboard/stats', async () => {
        try {
          const today = new Date().toISOString().split('T')[0]
          const [totalProducts, totalCustomers, todaySales] = await Promise.all([
            db.selectFrom('products').select((e) => e.fn.count('id').as('count')).where('active', '=', true).executeTakeFirst(),
            db.selectFrom('customers').select((e) => e.fn.count('id').as('count')).where('active', '=', true).executeTakeFirst(),
            db.selectFrom('sales').select((e) => e.fn.count('id').as('count')).where('created_at', '>=', new Date()).executeTakeFirst(),
          ])
          return {
            totalProducts: Number(totalProducts?.count ?? 0),
            totalCustomers: Number(totalCustomers?.count ?? 0),
            todaySales: Number(todaySales?.count ?? 0),
          }
        } catch { return { totalProducts: 0, totalCustomers: 0, todaySales: 0 } }
      })
  )

  // ── AI Routes (server-side Gemini proxy) ────────────────────────────────────
  .use(aiRoutes)

  // ── Request Logging Routes ────────────────────────────────────────────────────
  .use(logRoutes)

  // ── SPA Fallback ───────────────────────────────────────────────────────────
  .get('*', () => new Response(Bun.file('./dist/index.html'), {
    headers: { 'Content-Type': 'text/html' },
  }))

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen({ port: PORT, hostname: '0.0.0.0' }, () => {
  console.log(`🦊 MHX-POS API running on http://0.0.0.0:${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   Database: ${process.env.DATABASE_URL ? 'PostgreSQL ✓' : '⚠️  Not configured'}`)
})

export type App = typeof app
