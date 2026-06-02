/**
 * MHX-POS — Expenses Routes
 * RESTful: GET /api/expenses, POST /api/expenses, PUT /api/expenses/:id
 * Also handles /api/expense-categories
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

// ─── Expenses Routes ──────────────────────────────────────────────────────────
export const expensesRoutes = (app: Elysia) =>
  app.group('/api', (app) =>
    app
      // GET /api/expense-categories — list all categories
      .get('/expense-categories', async () => {
        try {
          const categories = await db
            .selectFrom('expense_categories')
            .selectAll()
            .where('active', '=', true)
            .orderBy('name', 'asc')
            .execute()
          return { expenseCategories: categories }
        } catch (err) {
          console.error('DB error:', err)
          return { expenseCategories: [], error: 'Database error' }
        }
      })

      // POST /api/expense-categories — create category
      .post('/expense-categories', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role && !['ADMIN', 'MANAGER'].includes(user.role.toUpperCase())) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }
        try {
          const { name, type } = body as { name: string; type?: string }
          if (!name) { set.status = 400; return { error: 'name required' } }
          const category = await db.insertInto('expense_categories').values({
            name,
            type: type || 'general',
            active: true,
          } as any).returningAll().executeTakeFirst()
          return { expenseCategory: category }, { status: 201 }
        } catch (err) {
          console.error('DB error:', err)
          set.status = 500; return { error: 'Failed to create category' }
        }
      }, {
        body: t.Object({ name: t.String(), type: t.Optional(t.String()) }),
      })

      // GET /api/expenses — list expenses
      .get('/expenses', async ({ query: { status, category_id, date_from, date_to, page = '1', limit = '50' }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        try {
          const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
          const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50))
          const offset = (pageNum - 1) * limitNum

          let q = db.selectFrom('expenses').selectAll()

          if (status) q = q.where('approval_status', '=', status as string)
          if (category_id) q = q.where('category_id', '=', category_id as string)
          if (date_from) q = q.where('date', '>=', date_from as string)
          if (date_to) q = q.where('date', '<=', date_to as string)

          const [expenses, countResult] = await Promise.all([
            q.orderBy('created_at', 'desc').limit(limitNum).offset(offset).execute(),
            db.selectFrom('expenses').select((e) => e.fn.count('id').as('count')).executeTakeFirst(),
          ])

          // Fetch category names
          const catIds = [...new Set(expenses.map(e => e.category_id).filter(Boolean))]
          const categories = catIds.length > 0
            ? await db.selectFrom('expense_categories').select(['id', 'name']).where('id', 'in', catIds).execute()
            : []
          const catMap: Record<string, string> = {}
          categories.forEach(c => { catMap[c.id] = c.name })

          const enriched = expenses.map(e => ({
            ...e,
            categoryName: e.category_id ? (catMap[e.category_id] || e.category_id) : undefined,
          }))

          return {
            expenses: enriched,
            total: Number(countResult?.count ?? 0),
            page: pageNum,
            limit: limitNum,
          }
        } catch (err) {
          console.error('DB error:', err)
          return { expenses: [], error: 'Database error' }
        }
      })

      // GET /api/expenses/:id — single expense
      .get('/expenses/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        try {
          const expense = await db.selectFrom('expenses').selectAll().where('id', '=', id).executeTakeFirst()
          if (!expense) { set.status = 404; return { error: 'Not found' } }
          return { expense }
        } catch { set.status = 500; return { error: 'Database error' } }
      })

      // POST /api/expenses — create expense
      .post('/expenses', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        try {
          const { categoryId, amount, description, date, receiptUrl, branchId, paymentMethod } = body as {
            categoryId?: string; amount?: number; description?: string; date?: string
            receiptUrl?: string; branchId?: string; paymentMethod?: string
          }
          if (!amount || amount <= 0) { set.status = 400; return { error: 'amount required and must be > 0' } }
          if (!description) { set.status = 400; return { error: 'description required' } }

          const expense = await db.insertInto('expenses').values({
            category_id: categoryId || null,
            amount,
            description,
            date: date || new Date().toISOString().split('T')[0],
            receipt_url: receiptUrl || null,
            branch_id: branchId || (user as any).branch_id || null,
            user_id: user.sub,
            approval_status: 'pending',
          } as any).returningAll().executeTakeFirst()
          return { expense }, { status: 201 }
        } catch (err) {
          console.error('DB error:', err)
          set.status = 500; return { error: 'Failed to create expense' }
        }
      }, {
        body: t.Object({
          categoryId: t.Optional(t.String()),
          amount: t.Number(),
          description: t.String(),
          date: t.Optional(t.String()),
          receiptUrl: t.Optional(t.String()),
          branchId: t.Optional(t.String()),
          paymentMethod: t.Optional(t.String()),
        }),
      })

      // PUT /api/expenses/:id — update expense
      .put('/expenses/:id', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        try {
          const existing = await db.selectFrom('expenses').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }

          const { categoryId, amount, description, date, receiptUrl, approvalStatus } = body as any
          const updates: Record<string, unknown> = {}
          if (categoryId !== undefined) updates.category_id = categoryId
          if (amount !== undefined) updates.amount = amount
          if (description !== undefined) updates.description = description
          if (date !== undefined) updates.date = date
          if (receiptUrl !== undefined) updates.receipt_url = receiptUrl
          if (approvalStatus !== undefined) updates.approval_status = approvalStatus

          const updated = await db.updateTable('expenses').set(updates as any).where('id', '=', id).returningAll().executeTakeFirst()
          return { expense: updated }
        } catch (err) {
          console.error('DB error:', err)
          set.status = 500; return { error: 'Failed to update expense' }
        }
      })

      // DELETE /api/expenses/:id — delete expense
      .delete('/expenses/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        try {
          const existing = await db.selectFrom('expenses').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }
          // Only creator or admin can delete
          if (existing.user_id !== user.sub && !['ADMIN'].includes((user.role || '').toUpperCase())) {
            set.status = 403; return { error: 'Not authorized to delete this expense' }
          }
          await db.deleteFrom('expenses').where('id', '=', id).execute()
          return { success: true }
        } catch (err) {
          console.error('DB error:', err)
          set.status = 500; return { error: 'Failed to delete expense' }
        }
      })
  )