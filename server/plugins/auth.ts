import { Elysia, t } from 'elysia'
import { db } from '../db.js'
import * as bcrypt from 'bcryptjs'
import { recordFailedAuthAttempt, checkRateLimit } from './rate-limit.js'

// C4: No card data is stored. All card payments are processed via PromptPay QR only.
// Card PAN / CVV / track data NEVER touches this system.

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAREHOUSE: 'warehouse',
} as const
export type Role = typeof ROLES[keyof typeof ROLES]

/**
 * Extract JWT from cookie OR Authorization: Bearer header.
 * Frontend sends Bearer; older clients may rely on cookie only.
 */
export function extractToken(cookieAuthToken: any, request: Request): string | null {
  // 1. Try cookie first
  const cookieToken = cookieAuthToken?.value
  if (cookieToken) return cookieToken
  // 2. Fall back to Authorization: Bearer
  const auth = request.headers.get('authorization')
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }
  return null
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────
export const authRoutes = (app: Elysia) =>
  app.group('/api/auth', (app) =>
    app
      .post('/login', async ({ body, jwt, set, cookie: { auth_token }, request }: any) => {
        // C2: Check rate limit before processing
        const { username, password } = body as { username: string; password: string }
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || request.headers.get('x-real-ip')
          || 'unknown'

        const rateLimitResult = checkRateLimit(clientIp, username)
        if (rateLimitResult) { set.status = 429; return rateLimitResult }

        const user = await db
          .selectFrom('users')
          .select(['id', 'username', 'password_hash', 'name', 'role', 'branch_id', 'active'])
          .where('username', '=', username)
          .executeTakeFirst()

        if (!user || !user.active) {
          set.status = 401
          recordFailedAuthAttempt(clientIp, username)
          return { error: 'Invalid credentials' }
        }

        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) {
          set.status = 401
          // C2: Record failed attempt for rate limiting
          recordFailedAuthAttempt(clientIp, username)
          return { error: 'Invalid credentials' }
        }

        const token = await jwt.sign({
          sub: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          branch_id: user.branch_id ?? undefined,
        })

        auth_token.set({ value: token, httpOnly: true, path: '/', maxAge: 8 * 60 * 60, sameSite: 'lax' })

        await db.insertInto('audit_log').values({
          user_id: user.id,
          action: 'LOGIN',
          entity_type: 'users',
          entity_id: user.id,
        }).execute()

        return {
          user: { id: user.id, username: user.username, name: user.name, role: user.role, branch_id: user.branch_id },
          token,
        }
      }, {
        body: t.Object({ username: t.String({ minLength: 1 }), password: t.String({ minLength: 8, error: 'Password must be at least 8 characters' }) }),
      })

      .get('/me', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const token = extractToken(auth_token, request)
        if (!token) { set.status = 401; return { error: 'No token' } }

        try {
          const payload = await (jwtFn as any).verify(token)
          if (!payload || typeof payload === 'boolean') {
            set.status = 401; return { error: 'Invalid token' }
          }
          return {
            user: {
              id: payload.sub,
              username: payload.username,
              name: payload.name,
              role: payload.role,
              branch_id: payload.branch_id,
            },
          }
        } catch { set.status = 401; return { error: 'Invalid token' } }
      })

      .post('/logout', async ({ cookie: { auth_token } }: any) => {
        auth_token.remove()
        return { success: true }
      })
  )