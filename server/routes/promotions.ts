/**
 * MHX-POS — Promotions Routes
 * RESTful: GET /api/promotions, POST /api/promotions, PUT /api/promotions/:id, DELETE /api/promotions/:id
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

// ─── Promotions Routes ─────────────────────────────────────────────────────────
export const promotionsRoutes = (app: Elysia) =>
  app.group('/api', (app) =>
    app
      // GET /api/promotions — list promotions
      .get('/promotions', async ({ query: { active, type, page = '1', limit = '50' } }) => {
        try {
          const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
          const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50))
          const offset = (pageNum - 1) * limitNum

          let q = db.selectFrom('promotions').selectAll()

          if (active !== undefined) q = q.where('active', '=', active === 'true' || active === '1')
          if (type) q = q.where('type', '=', type as string)

          const [promotions, countResult] = await Promise.all([
            q.orderBy('created_at', 'desc').limit(limitNum).offset(offset).execute(),
            db.selectFrom('promotions').select((e) => e.fn.count('id').as('count')).executeTakeFirst(),
          ])

          return {
            promotions,
            total: Number(countResult?.count ?? 0),
            page: pageNum,
            limit: limitNum,
          }
        } catch (err) {
          console.error('DB error:', err)
          return { promotions: [], error: 'Database error' }
        }
      })

      // GET /api/promotions/:id — single promotion
      .get('/promotions/:id', async ({ params: { id }, set }) => {
        try {
          const promo = await db.selectFrom('promotions').selectAll().where('id', '=', id).executeTakeFirst()
          if (!promo) { set.status = 404; return { error: 'Not found' } }
          return { promotion: promo }
        } catch { set.status = 500; return { error: 'Database error' } }
      })

      // POST /api/promotions — create promotion
      .post('/promotions', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role && !['ADMIN', 'MANAGER'].includes(user.role.toUpperCase())) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }
        try {
          const { name, type, startDate, endDate, active, description } = body as {
            name?: string; type?: string; startDate?: string; endDate?: string
            active?: boolean; description?: string
          }
          if (!name) { set.status = 400; return { error: 'name required' } }

          const promotion = await db.insertInto('promotions').values({
            name,
            type: type || 'percent_off_order',
            start_date: startDate || null,
            end_date: endDate || null,
            active: active !== undefined ? active : true,
            description: description || null,
            approval_status: 'pending',
          } as any).returningAll().executeTakeFirst()
          return { promotion }, { status: 201 }
        } catch (err) {
          console.error('DB error:', err)
          set.status = 500; return { error: 'Failed to create promotion' }
        }
      }, {
        body: t.Object({
          name: t.String(),
          type: t.Optional(t.String()),
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
          active: t.Optional(t.Boolean()),
          description: t.Optional(t.String()),
        }),
      })

      // PUT /api/promotions/:id — update promotion
      .put('/promotions/:id', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role && !['ADMIN', 'MANAGER'].includes(user.role.toUpperCase())) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }
        try {
          const existing = await db.selectFrom('promotions').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }

          const { name, type, startDate, endDate, active, description, approvalStatus } = body as any
          const updates: Record<string, unknown> = {}
          if (name !== undefined) updates.name = name
          if (type !== undefined) updates.type = type
          if (startDate !== undefined) updates.start_date = startDate
          if (endDate !== undefined) updates.end_date = endDate
          if (active !== undefined) updates.active = active
          if (description !== undefined) updates.description = description
          if (approvalStatus !== undefined) updates.approval_status = approvalStatus

          const updated = await db.updateTable('promotions').set(updates as any).where('id', '=', id).returningAll().executeTakeFirst()
          return { promotion: updated }
        } catch (err) {
          console.error('DB error:', err)
          set.status = 500; return { error: 'Failed to update promotion' }
        }
      })

      // DELETE /api/promotions/:id — delete promotion
      .delete('/promotions/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role && !['ADMIN', 'MANAGER'].includes(user.role.toUpperCase())) {
          set.status = 403; return { error: 'Insufficient permissions' }
        }
        try {
          const existing = await db.selectFrom('promotions').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }
          await db.deleteFrom('promotions').where('id', '=', id).execute()
          return { success: true }
        } catch (err) {
          console.error('DB error:', err)
          set.status = 500; return { error: 'Failed to delete promotion' }
        }
      })
  )