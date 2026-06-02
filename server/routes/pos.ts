/**
 * MHX-POS — POS Routes
 * /api/pos/ — POS-specific operations: open-shift, close-shift, current-shift
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
    const payload = await (jwtFn as any).verify(token) as { role?: string; sub?: string; name?: string } | false
    if (!payload) { set.status = 401; return null }
    return payload
  } catch { set.status = 401; return null }
}

export const posRoutes = (app: Elysia) =>
  app.group('/api/pos', (app) =>
    app
      // GET /api/pos/current-shift — get current user's open shift
      .get('/current-shift', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          const shift = await db
            .selectFrom('shifts')
            .selectAll()
            .where('user_id', '=', user.sub)
            .where('status', '=', 'Open')
            .executeTakeFirst()

          return { shift: shift ?? null, hasOpenShift: !!shift }
        } catch { set.status = 500; return { error: 'Failed to fetch shift' } }
      })

      // POST /api/pos/open-shift — open shift (same as POST /api/shifts)
      .post('/open-shift', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { branchId, posMachineId, startingCash } = body as any

        try {
          const existing = await db
            .selectFrom('shifts')
            .selectAll()
            .where('user_id', '=', user.sub)
            .where('status', '=', 'Open')
            .executeTakeFirst()

          if (existing) {
            set.status = 409; return { error: 'Already have an open shift', shift: existing }
          }

          const shift = await db.insertInto('shifts').values({
            user_id: user.sub,
            branch_id: branchId || null,
            status: 'open',
            opening_cash: startingCash ?? 0,
          } as any).returningAll().executeTakeFirst()

          return { shift }, { status: 201 }
        } catch (err) {
          console.error('Open shift error:', err)
          set.status = 500; return { error: 'Failed to open shift' }
        }
      })

      // POST /api/pos/close-shift — close current shift
      .post('/close-shift', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { closing_cash, notes } = body as any

        try {
          const shift = await db
            .selectFrom('shifts')
            .selectAll()
            .where('user_id', '=', user.sub)
            .where('status', '=', 'Open')
            .executeTakeFirst()

          if (!shift) {
            set.status = 404; return { error: 'No open shift found' }
          }

          // Calculate expected cash: opening_cash + sales cash - expenses
          // For now, compute cash_difference as closing_cash - (shift.cash_in_drawer + expected_sales)
          const cash_difference = closing_cash !== undefined
            ? closing_cash - ((shift as any).cash_in_drawer ?? 0)
            : undefined

          const updated = await db.updateTable('shifts').set({
            status: 'Closed',
            closing_cash: closing_cash ?? null,
            cash_difference: cash_difference ?? null,
            closed_at: new Date().toISOString(),
          } as any).where('id', '=', shift.id).returningAll().executeTakeFirst()

          return { shift: updated }
        } catch (err) {
          console.error('Close shift error:', err)
          set.status = 500; return { error: 'Failed to close shift' }
        }
      }, {
        body: t.Object({ closing_cash: t.Optional(t.Number()), notes: t.Optional(t.String()) }),
      })
  )