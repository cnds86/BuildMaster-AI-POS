/**
 * MHX-POS — Z-Reports Routes
 * Generates end-of-day / end-of-shift reports.
 *
 * GET /api/z-reports/:shiftId  — fetch Z-report data for a specific shift
 *
 * Requires auth_token cookie (JWT).
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
    const payload = await (jwtFn as any).verify(token) as { sub?: string; name?: string; role?: string } | false
    if (!payload) { set.status = 401; return null }
    return payload
  } catch { set.status = 401; return null }
}

// ─── GET /api/z-reports/:shiftId ──────────────────────────────────────────────
export const zReportsRoutes = (app: Elysia) =>
  app.group('/api/z-reports', (app) =>
    app
      .get('/:shiftId', async ({ params: { shiftId }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          // Fetch the shift
          const shift = await db
            .selectFrom('shifts')
            .selectAll()
            .where('id', '=', shiftId)
            .executeTakeFirst()

          if (!shift) { set.status = 404; return { error: 'Shift not found' } }

          const start = new Date(shift.opened_at)
          const end = shift.closed_at ? new Date(shift.closed_at) : new Date()

          // Fetch all sales within the shift window
          const salesRows = await db
            .selectFrom('sales')
            .selectAll()
            .where('created_at', '>=', start)
            .where('created_at', '<=', end)
            .where('status', '!=', 'voided')
            .execute()

          // Aggregate by payment method
          const salesByMethod: Record<string, number> = {}
          let totalSales = 0
          let cashReceived = 0
          let cashChange = 0

          for (const sale of salesRows) {
            const method = sale.payment_method || 'unknown'
            salesByMethod[method] = (salesByMethod[method] || 0) + Number(sale.total)
            totalSales += Number(sale.total)

            if (method === 'cash') {
              // amount_received may be stored differently depending on schema
              const received = (sale as any).amount_received
              const change = (sale as any).change || 0
              cashReceived += Number(received || sale.total)
              cashChange += Number(change)
            }
          }

          const netCashSales = cashReceived - cashChange
          const startCash = Number(shift.opening_cash ?? shift.starting_cash ?? 0)
          const expectedCash = startCash + netCashSales
          const actualEndCash = Number(shift.closing_cash ?? 0)
          const discrepancy = actualEndCash - expectedCash

          // Fetch user & branch names
          let userName = shift.user_name || ''
          let branchName = ''
          let posMachine = shift.pos_machine_id || 'N/A'

          if (shift.user_id) {
            const dbUser = await db
              .selectFrom('users')
              .select(['name'])
              .where('id', '=', shift.user_id)
              .executeTakeFirst()
            if (dbUser) userName = dbUser.name
          }

          if (shift.branch_id) {
            const dbBranch = await db
              .selectFrom('branches')
              .select(['name'])
              .where('id', '=', shift.branch_id)
              .executeTakeFirst()
            if (dbBranch) branchName = dbBranch.name
          }

          const report = {
            shiftId: shift.id,
            user: userName,
            branch: branchName || 'Unknown',
            posMachine,
            start: start.toLocaleString(),
            end: shift.closed_at ? end.toLocaleString() : 'Running…',
            startCash,
            endCash: actualEndCash,
            totalSales,
            salesByMethod,
            cashReceived,
            cashChange,
            expectedCash,
            discrepancy,
            transactionCount: salesRows.length,
            cashIn: 0,  // TODO: track cash-in/out transactions separately if needed
            cashOut: 0,
            notes: shift.notes || undefined,
          }

          return { report }
        } catch (err) {
          console.error('Z-report error:', err)
          set.status = 500; return { error: 'Failed to generate Z-report' }
        }
      })
  )
