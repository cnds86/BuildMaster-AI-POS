import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { cookie } from '@elysiajs/cookie'
import { jwt } from '@elysiajs/jwt'
import { db } from './db.js'
import { authRoutes, ROLES } from './plugins/auth.js'
import { aiRoutes } from './routes/ai.js'
import { printRoutes } from './routes/print.js'
import { expensesRoutes } from './routes/expenses.js'
import { promotionsRoutes } from './routes/promotions.js'
import { approvalsRoutes } from './routes/approvals.js'
import { logRoutes } from './plugins/logging.js'
import { errorHandler } from './plugins/error-handler.js'
import { productsRoutes } from './routes/products.js'
import { categoriesRoutes } from './routes/categories.js'
import { customersRoutes } from './routes/customers.js'
import { ordersRoutes } from './routes/orders.js'
import { quotationsRoutes } from './routes/quotations.js'
import { shiftsRoutes } from './routes/shifts.js'
import { zReportsRoutes } from './routes/z-reports.js'
import { inventoryRoutes } from './routes/inventory.js'
import { reportsRoutes } from './routes/reports.js'
import { settingsRoutes } from './routes/settings.js'
import { posRoutes } from './routes/pos.js'
import { syncRoutes } from './routes/sync.js'
import { stockDocumentsRoutes } from './routes/stock-documents.js'
import { deliveryRoutes } from './routes/delivery.js'
import { fleetRoutes } from './routes/fleet.js'
import { usersRoutes } from './routes/users.js'
import { rolesRoutes } from './routes/roles.js'
import { departmentsRoutes } from './routes/departments.js'
import { warehousesRoutes } from './routes/warehouses.js'
import 'dotenv/config'

const isProd = process.env.NODE_ENV === 'production'
const PORT = Number(process.env.PORT) || 3006
// CORS: support both 5173 (current Vite dev) and 5176 (legacy/dev.sh default)
// Bug fix 2026-06-02: CORS_ORIGIN was hardcoded to 5176 but Vite actually runs on 5173 → browser blocked → 500
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5176'

// C1: Fail-fast if JWT_SECRET not set — no silent fallback in prod
if (!process.env.JWT_SECRET) {
  if (isProd) throw new Error('FATAL: JWT_SECRET env var is required in production')
  console.warn('⚠️  JWT_SECRET not set — using insecure temporary key. Set JWT_SECRET in .env for production!')
}
const JWT_SECRET = process.env.JWT_SECRET || 'INSECURE_TEMP_KEY_REPLACE_ME'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'

// ─── Global Rate Limit Store ────────────────────────────────────────────────
interface RateLimitEntry { count: number; resetAt: number }
const globalRateLimitStore = new Map<string, RateLimitEntry>()

// ─── App ────────────────────────────────────────────────────────────────────
const app = new Elysia()
  // ── Global Error Handler (must be first) ──────────────────────────────────
  .use(errorHandler)

  // ── Global Middleware ──────────────────────────────────────────────────────
  // Bug fix 2026-06-02: CORS origin must be array or function for multi-origin support
  .use(cors({
    origin: (request: Request) => {
      const origin = request.headers.get('origin') || ''
      const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5176')
        .split(',').map(s => s.trim()).filter(Boolean)
      return allowed.includes(origin) ? origin : allowed[0]
    },
    credentials: true,
  }))
  .use(cookie())
  .use(jwt({ name: 'jwt', secret: JWT_SECRET, exp: JWT_EXPIRES_IN }))

  // ── Global Rate Limiting ───────────────────────────────────────────────────
  .onTransform(({ path, method, headers, set }) => {
    if (!path.startsWith('/api/')) return
    const ip = headers['x-forwarded-for']?.split(',')[0]?.trim() || headers['x-real-ip'] || 'unknown'
    const key = `global:${ip}`
    const now = Date.now()
    const entry = globalRateLimitStore.get(key)
    if (!entry || now > entry.resetAt) {
      globalRateLimitStore.set(key, { count: 1, resetAt: now + 60_000 })
      set.headers['X-RateLimit-Limit'] = '200'
      set.headers['X-RateLimit-Remaining'] = '199'
      set.headers['X-RateLimit-Reset'] = '60'
      return
    }
    if (entry.count >= 200) {
      set.status = 429
      set.headers['X-RateLimit-Limit'] = '200'
      set.headers['X-RateLimit-Remaining'] = '0'
      set.headers['X-RateLimit-Reset'] = String(Math.ceil((entry.resetAt - now) / 1000))
      return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded — slow down', retryAfter: Math.ceil((entry.resetAt - now) / 1000) }), { status: 429, headers: { 'Content-Type': 'application/json' } })
    }
    entry.count++
    set.headers['X-RateLimit-Limit'] = '200'
    set.headers['X-RateLimit-Remaining'] = String(200 - entry.count)
    set.headers['X-RateLimit-Reset'] = String(Math.ceil((entry.resetAt - now) / 1000))
  })

  // ── Static Files (production only — skip in dev to avoid ENOENT on missing dist) ──
  // In dev, frontend is served by Vite on :5173 with proxy to backend
  // In production, backend serves built dist/ folder

  // ── WebSocket ───────────────────────────────────────────────────────────────
  .ws('/ws', {
    message(ws, message) {
      ws.send({ received: message })
    },
  })

  // ── Auth Routes ─────────────────────────────────────────────────────────────
  .use(authRoutes)

  // ── Modular API Routes ─────────────────────────────────────────────────────
  .use(productsRoutes)
  .use(categoriesRoutes)
  .use(customersRoutes)
  .use(ordersRoutes)
  .use(quotationsRoutes)
  .use(shiftsRoutes)
  .use(zReportsRoutes)
  .use(inventoryRoutes)
  .use(reportsRoutes)
  .use(settingsRoutes)
  .use(posRoutes)
  .use(fleetRoutes)
  .use(deliveryRoutes)
  .use(warehousesRoutes)

  // ── AI Routes (server-side Gemini proxy) ───────────────────────────────────
  .use(aiRoutes)

  // ── Sync Routes ─────────────────────────────────────────────────────────────
  .use(syncRoutes)

  // ── Stock Documents Routes ─────────────────────────────────────────────────
  .use(stockDocumentsRoutes)

  // ── Print Routes (ESC/POS) ─────────────────────────────────────────────────
  .use(printRoutes)

  // ── Expense Routes ─────────────────────────────────────────────────────────
  .use(expensesRoutes)

  // ── Promotions Routes ──────────────────────────────────────────────────────
  .use(promotionsRoutes)

  // ── Approvals Routes ───────────────────────────────────────────────────────
  .use(approvalsRoutes)

  // ── Users / Roles / Departments Routes ────────────────────────────────────
  .use(usersRoutes)
  .use(rolesRoutes)
  .use(departmentsRoutes)

  // ── Request Logging Routes ────────────────────────────────────────────────
  .use(logRoutes)

  // ── Health Check (root) ────────────────────────────────────────────────────
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  }))

  // ── SPA Fallback (skip if dist/ missing — dev mode) ──────────────────────────
  // Bug fix 2026-06-02: Bun.file() is lazy; ENOENT throws inside Response stream,
  // not at construction. Must check existence first.
  .get('*', async () => {
    const distFile = Bun.file('./dist/index.html')
    if (!(await distFile.exists())) {
      return new Response(
        'Frontend not built. Run `bun run dev` (Vite on :5173) or `bun run build` then start in production mode.',
        { status: 404, headers: { 'Content-Type': 'text/plain' } }
      )
    }
    return new Response(distFile, {
      headers: { 'Content-Type': 'text/html' },
    })
  })

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen({ port: PORT, hostname: '0.0.0.0' }, () => {
  console.log(`🦊 MHX-POS API running on http://0.0.0.0:${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   Database: ${process.env.DATABASE_URL ? 'PostgreSQL ✓' : '⚠️  Not configured'}`)
})

export type App = typeof app