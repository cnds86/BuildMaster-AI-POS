/**
 * MHX-POS — Categories Routes
 * RESTful: GET /api/categories, GET /api/categories/:id, POST /api/categories, PUT /api/categories/:id, DELETE /api/categories/:id
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
    const payload = await (jwtFn as any).verify(token) as { role?: string; sub?: string } | false
    if (!payload) { set.status = 401; return null }
    return payload
  } catch { set.status = 401; return null }
}

export const categoriesRoutes = (app: Elysia) =>
  app.group('/api/categories', (app) =>
    app
      // GET /api/categories — list distinct categories from products
      .get('/', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          const result = await db
            .selectFrom('products')
            .select(['category'])
            .distinct()
            .where('active', '=', true)
            .orderBy('category', 'asc')
            .execute()
          return { categories: result.map(r => r.category).filter(Boolean) }
        } catch (err) {
          console.error('DB error:', err)
          return { categories: [], error: 'Database error' }
        }
      })

      // GET /api/categories/:id
      .get('/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        try {
          const cat = await db.selectFrom('categories').selectAll().where('id', '=', id).executeTakeFirst()
          if (!cat) { set.status = 404; return { error: 'Not found' } }
          return { category: cat }
        } catch { return { error: 'Database error' } }
      })

      // POST /api/categories — create category
      .post('/', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER) {
          set.status = 403; return { error: 'Manager or Admin only' }
        }

        const { name, parent_id, sort_order } = body as { name: string; parent_id?: string; sort_order?: number }
        if (!name) { set.status = 400; return { error: 'name is required' } }

        try {
          const cat = await db.insertInto('categories').values({
            name,
            parent_id: parent_id ?? null,
            sort_order: sort_order ?? 0,
            active: true,
          } as any).returningAll().executeTakeFirst()
          return { category: cat }, { status: 201 }
        } catch (err) {
          console.error('Create category error:', err)
          set.status = 500; return { error: 'Failed to create category' }
        }
      }, {
        body: t.Object({
          name: t.String(),
          parent_id: t.Optional(t.String()),
          sort_order: t.Optional(t.Number()),
        }),
      })

      // PUT /api/categories/:id
      .put('/:id', async ({ params: { id }, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }
        if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER) {
          set.status = 403; return { error: 'Manager or Admin only' }
        }

        const { name, sort_order, active } = body as any
        const updates: any = {}
        if (name !== undefined) updates.name = name
        if (sort_order !== undefined) updates.sort_order = sort_order
        if (active !== undefined) updates.active = active
        if (Object.keys(updates).length === 0) {
          set.status = 400; return { error: 'No fields to update' }
        }

        try {
          const existing = await db.selectFrom('categories').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }

          const updated = await db.updateTable('categories').set(updates).where('id', '=', id).returningAll().executeTakeFirst()
          return { category: updated }
        } catch (err) {
          console.error('Update category error:', err)
          set.status = 500; return { error: 'Failed to update category' }
        }
      })

      // DELETE /api/categories/:id
      .delete('/:id', async ({ params: { id }, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }
        if (user.role !== ROLES.ADMIN) {
          set.status = 403; return { error: 'Admin only' }
        }

        try {
          const existing = await db.selectFrom('categories').selectAll().where('id', '=', id).executeTakeFirst()
          if (!existing) { set.status = 404; return { error: 'Not found' } }

          const updated = await db.updateTable('categories').set({ active: false }).where('id', '=', id).returningAll().executeTakeFirst()
          return { category: updated, deleted: true }
        } catch (err) {
          console.error('Delete category error:', err)
          set.status = 500; return { error: 'Failed to delete category' }
        }
      })
  )