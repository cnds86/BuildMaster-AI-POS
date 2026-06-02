/**
 * MHX-POS — Approvals Routes
 * Handles expense and promotion approval workflow
 * GET /api/approvals/pending, POST /api/approvals/:type/:id/approve, POST /api/approvals/:type/:id/reject
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
    const payload = await (jwtFn as any).verify(token) as { role?: string; sub?: string; name?: string } | false
    if (!payload) { set.status = 401; return null }
    return payload
  } catch { set.status = 401; return null }
}

// ─── Approvals Routes ─────────────────────────────────────────────────────────
export const approvalsRoutes = (app: Elysia) =>
  app.group('/api/approvals', (app) =>
    app
      // GET /api/approvals/pending — list all pending items (expenses + promotions)
      .get('/pending', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        // Only ADMIN/MANAGER can view approvals
        if (user.role && !['ADMIN', 'MANAGER'].includes(user.role.toUpperCase())) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }
        try {
          const [expenses, promotions] = await Promise.all([
            db.selectFrom('expenses')
              .selectAll()
              .where('approval_status', '=', 'pending')
              .orderBy('created_at', 'asc')
              .limit(100)
              .execute(),
            db.selectFrom('promotions')
              .selectAll()
              .where('approval_status', '=', 'pending')
              .orderBy('created_at', 'asc')
              .limit(100)
              .execute(),
          ])

          // Enrich expenses with category names
          const catIds = [...new Set(expenses.map(e => e.category_id).filter(Boolean))]
          const categories = catIds.length > 0
            ? await db.selectFrom('expense_categories').select(['id', 'name']).where('id', 'in', catIds).execute()
            : []
          const catMap: Record<string, string> = {}
          categories.forEach(c => { catMap[c.id] = c.name })

          const enrichedExpenses = expenses.map(e => ({
            ...e,
            categoryName: e.category_id ? (catMap[e.category_id] || e.category_id) : undefined,
            _type: 'expense' as const,
            _typeLabel: 'Expense',
          }))

          return {
            pending: [
              ...enrichedExpenses,
              ...promotions.map(p => ({ ...p, _type: 'promotion' as const, _typeLabel: 'Promotion' })),
            ],
          }
        } catch (err) {
          console.error('DB error:', err)
          return { pending: [], error: 'Database error' }
        }
      })

      // POST /api/approvals/expense/:id/approve
      .post('/expense/:id/approve', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role && !['ADMIN', 'MANAGER'].includes(user.role.toUpperCase())) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }
        try {
          const existing = await db.selectFrom('expenses').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Expense not found' } }
          if (existing.approval_status !== 'pending') {
            set.status = 400; return { error: 'Expense is not pending' }
          }
          const updated = await db.updateTable('expenses')
            .set({ approval_status: 'approved' } as any)
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirst()
          return { expense: updated, action: 'approved' }
        } catch (err) {
          console.error('DB error:', err)
          set.status = 500; return { error: 'Failed to approve expense' }
        }
      })

      // POST /api/approvals/expense/:id/reject
      .post('/expense/:id/reject', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role && !['ADMIN', 'MANAGER'].includes(user.role.toUpperCase())) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }
        try {
          const existing = await db.selectFrom('expenses').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Expense not found' } }
          if (existing.approval_status !== 'pending') {
            set.status = 400; return { error: 'Expense is not pending' }
          }
          const updated = await db.updateTable('expenses')
            .set({ approval_status: 'rejected' } as any)
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirst()
          return { expense: updated, action: 'rejected' }
        } catch (err) {
          console.error('DB error:', err)
          set.status = 500; return { error: 'Failed to reject expense' }
        }
      })

      // POST /api/approvals/promotion/:id/approve
      .post('/promotion/:id/approve', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role && !['ADMIN', 'MANAGER'].includes(user.role.toUpperCase())) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }
        try {
          const existing = await db.selectFrom('promotions').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Promotion not found' } }
          if (existing.approval_status !== 'pending') {
            set.status = 400; return { error: 'Promotion is not pending' }
          }
          const updated = await db.updateTable('promotions')
            .set({ approval_status: 'approved' } as any)
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirst()
          return { promotion: updated, action: 'approved' }
        } catch (err) {
          console.error('DB error:', err)
          set.status = 500; return { error: 'Failed to approve promotion' }
        }
      })

      // POST /api/approvals/promotion/:id/reject
      .post('/promotion/:id/reject', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role && !['ADMIN', 'MANAGER'].includes(user.role.toUpperCase())) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }
        try {
          const existing = await db.selectFrom('promotions').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Promotion not found' } }
          if (existing.approval_status !== 'pending') {
            set.status = 400; return { error: 'Promotion is not pending' }
          }
          const updated = await db.updateTable('promotions')
            .set({ approval_status: 'rejected' } as any)
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirst()
          return { promotion: updated, action: 'rejected' }
        } catch (err) {
          console.error('DB error:', err)
          set.status = 500; return { error: 'Failed to reject promotion' }
        }
      })
  )