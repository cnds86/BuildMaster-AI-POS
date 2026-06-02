/**
 * MHX-POS — Shifts Routes
 * RESTful: GET /api/shifts, POST /api/shifts, GET /api/shifts/:id, PUT /api/shifts/:id
 * Also handles /api/shifts/:id/close, /api/shifts/:id/cash-in, /api/shifts/:id/cash-out
 */
import { Elysia, t } from 'elysia'
import { db } from '../db.js'

// ─── Auth guard ───────────────────────────────────────────────────────────────
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

// ─── DB → Frontend shift mapper ───────────────────────────────────────────────
// API uses snake_case + UPPER status; frontend uses camelCase + PascalCase.
function toShift(s: any) {
  return {
    id: s.id,
    userId: s.user_id,
    userName: s.user_name || '',
    branchId: s.branch_id || '',
    posId: s.pos_machine_id || undefined,
    startTime: s.opened_at,
    endTime: s.closed_at || undefined,
    startCash: Number(s.opening_cash ?? s.starting_cash ?? 0),
    endCash: s.closing_cash != null ? Number(s.closing_cash) : undefined,
    cashInDrawer: Number(s.cash_in_drawer || 0),
    expectedCash: s.expected_cash != null ? Number(s.expected_cash) : undefined,
    cashDifference: s.cash_difference != null ? Number(s.cash_difference) : undefined,
    status: s.status === 'open' ? 'Open' : 'Closed',
    notes: s.notes || undefined,
    cashTransactions: s.cash_transactions || [],
  }
}

// ─── Shifts Routes ────────────────────────────────────────────────────────────
export const shiftsRoutes = (app: Elysia) =>
  app.group('/api/shifts', (app) =>
    app
      // GET /api/shifts — list all shifts
      .get('/', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          const apiShifts = await db
            .selectFrom('shifts')
            .selectAll()
            .orderBy('opened_at', 'desc')
            .limit(100)
            .execute()

          const shifts = apiShifts.map(s => toShift(s))
          return { shifts }
        } catch { set.status = 500; return { error: 'Failed to fetch shifts' } }
      })

      // GET /api/shifts/:id — single shift
      .get('/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        try {
          const apiShift = await db.selectFrom('shifts').selectAll().where('id', '=', id).executeTakeFirst()
          if (!apiShift) { set.status = 404; return { error: 'Not found' } }
          return { shift: toShift(apiShift) }
        } catch { set.status = 500; return { error: 'Failed to fetch shift' } }
      })

      // GET /api/shifts/me/open — get current user's open shift
      .get('/me/open', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          const apiShift = await db
            .selectFrom('shifts')
            .selectAll()
            .where('user_id', '=', user.sub)
            .where('status', '=', 'open')
            .executeTakeFirst()
          return { shift: apiShift ? toShift(apiShift) : null }
        } catch { set.status = 500; return { error: 'Failed to fetch shift' } }
      })

      // POST /api/shifts — open new shift
      .post('/', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { branchId, posMachineId, startingCash } = body as {
          branchId?: string; posMachineId?: string; startingCash?: number
        }

        try {
          // Check if user already has an open shift (DB uses 'OPEN')
          const existing = await db
            .selectFrom('shifts')
            .selectAll()
            .where('user_id', '=', user.sub)
            .where('status', '=', 'open')
            .executeTakeFirst()

          if (existing) {
            set.status = 409; return { error: 'You already have an open shift', shift: toShift(existing) }
          }

          const apiShift = await db.insertInto('shifts').values({
            user_id: user.sub,
            branch_id: branchId || null,
            status: 'open',
            opening_cash: startingCash ?? 0,
          } as any).returningAll().executeTakeFirst()

          return { shift: toShift(apiShift) }
        } catch (err) {
          console.error('Open shift error:', err)
          set.status = 500; return { error: 'Failed to open shift', detail: String(err) }
        }
      }, {
        body: t.Object({
          branchId: t.Optional(t.String()),
          posMachineId: t.Optional(t.String()),
          startingCash: t.Optional(t.Number()),
        }),
      })

      // PUT /api/shifts/:id — update shift
      .put('/:id', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        const { cash_in_drawer, expected_cash } = body as { cash_in_drawer?: number; expected_cash?: number }
        try {
          const existing = await db.selectFrom('shifts').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }

          const updates: any = {}
          if (cash_in_drawer !== undefined) updates.cash_in_drawer = cash_in_drawer
          if (expected_cash !== undefined) updates.expected_cash = expected_cash

          if (Object.keys(updates).length === 0) {
            set.status = 400; return { error: 'No fields to update' }
          }

          const updated = await db.updateTable('shifts').set(updates).where('id', '=', id).returningAll().executeTakeFirst()
          return { shift: toShift(updated) }
        } catch { set.status = 500; return { error: 'Failed to update shift' } }
      })

      // POST /api/shifts/:id/close — close shift
      .post('/:id/close', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { closing_cash, cash_difference, notes } = body as {
          closing_cash?: number; cash_difference?: number; notes?: string
        }

        try {
          const existing = await db.selectFrom('shifts').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }
          if (existing.status !== 'open') {
            set.status = 409; return { error: 'Shift is not open', status: existing.status }
          }

          const updated = await db.updateTable('shifts').set({
            status: 'closed',
            closing_cash: closing_cash ?? null,
            cash_difference: cash_difference ?? null,
            closed_at: new Date().toISOString(),
          } as any).where('id', '=', id).returningAll().executeTakeFirst()

          return { shift: toShift(updated) }
        } catch (err) {
          console.error('Close shift error:', err)
          set.status = 500; return { error: 'Failed to close shift' }
        }
      }, {
        body: t.Object({
          closing_cash: t.Optional(t.Number()),
          cash_difference: t.Optional(t.Number()),
          notes: t.Optional(t.String()),
        }),
      })

      // POST /api/shifts/:id/cash-in — add cash to drawer
      .post('/:id/cash-in', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { amount, reason } = body as { amount: number; reason: string }

        try {
          const existing = await db.selectFrom('shifts').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }
          if (existing.status !== 'open') {
            set.status = 409; return { error: 'Cannot add cash to a closed shift' }
          }

          // Append to cash_in_drawer
          const currentCash = Number(existing.cash_in_drawer || 0)
          const updated = await db.updateTable('shifts')
            .set({ cash_in_drawer: currentCash + amount })
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirst()

          return { success: true, shift: toShift(updated) }
        } catch (err) {
          console.error('Cash in error:', err)
          set.status = 500; return { error: 'Failed to add cash' }
        }
      }, {
        body: t.Object({
          amount: t.Number(),
          reason: t.String(),
        }),
      })

      // POST /api/shifts/:id/cash-out — remove cash from drawer
      .post('/:id/cash-out', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { amount, reason } = body as { amount: number; reason: string }

        try {
          const existing = await db.selectFrom('shifts').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }
          if (existing.status !== 'open') {
            set.status = 409; return { error: 'Cannot remove cash from a closed shift' }
          }

          // Subtract from cash_in_drawer (allow going negative if needed)
          const currentCash = Number(existing.cash_in_drawer || 0)
          const updated = await db.updateTable('shifts')
            .set({ cash_in_drawer: currentCash - amount })
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirst()

          return { success: true, shift: toShift(updated) }
        } catch (err) {
          console.error('Cash out error:', err)
          set.status = 500; return { error: 'Failed to remove cash' }
        }
      }, {
        body: t.Object({
          amount: t.Number(),
          reason: t.String(),
        }),
      })
  )
