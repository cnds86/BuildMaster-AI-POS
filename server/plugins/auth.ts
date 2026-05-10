import { Elysia, t } from 'elysia'
import { db } from '../db.js'
import * as bcrypt from 'bcryptjs'

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAREHOUSE: 'warehouse',
} as const
export type Role = typeof ROLES[keyof typeof ROLES]

// ─── Auth Routes ──────────────────────────────────────────────────────────────
export const authRoutes = (app: Elysia) =>
  app.group('/api/auth', (app) =>
    app
      .post('/login', async ({ body, jwt, set, cookie: { auth_token } }: any) => {
        const { username, password } = body as { username: string; password: string }

        const user = await db
          .selectFrom('users')
          .select(['id', 'username', 'password_hash', 'name', 'role', 'branch_id', 'active'])
          .where('username', '=', username)
          .executeTakeFirst()

        if (!user || !user.active) {
          set.status = 401
          return { error: 'Invalid credentials' }
        }

        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) {
          set.status = 401
          return { error: 'Invalid credentials' }
        }

        const token = await jwt.sign({
          sub: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          branch_id: user.branch_id ?? undefined,
        })

        // Set auth_token cookie for subsequent requests
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
        body: t.Object({ username: t.String({ minLength: 1 }), password: t.String({ minLength: 1 }) }),
      })

      .get('/me', async ({ jwt: jwtFn, cookie: { auth_token }, set }: any) => {
        const token = auth_token?.value
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
  )
