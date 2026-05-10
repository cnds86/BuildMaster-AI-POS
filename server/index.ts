import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { cookie } from '@elysiajs/cookie'
import { staticPlugin } from '@elysiajs/static'
import { jwt } from '@elysiajs/jwt'
import { db } from './db.js'
import { authRoutes, ROLES } from './plugins/auth.js'
import { aiRoutes } from './routes/ai.js'
import 'dotenv/config'

const isProd = process.env.NODE_ENV === 'production'
const PORT = Number(process.env.PORT) || 3006
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5176'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret_change_in_prod'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'

// ─── App ──────────────────────────────────────────────────────────────────────
const app = new Elysia()
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

  // ── Health Check ───────────────────────────────────────────────────────────
  .get('/api/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  }))

  // ── Protected API Routes ───────────────────────────────────────────────────
  .group('/api', (app) =>
    app
      // Products
      .get('/products', async () => {
        try {
          const products = await db.selectFrom('products').selectAll().where('active', '=', true).execute()
          return { products }
        } catch (err) {
          console.error('DB error:', err)
          return { products: [], error: 'Database unavailable' }
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
