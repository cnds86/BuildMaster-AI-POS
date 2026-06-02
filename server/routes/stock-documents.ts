/**
 * MHX-POS — Stock Documents Routes
 * Stock transfer, count, adjustment, receipt, reservation
 *
 * GET  /api/stock-documents          — list documents
 * POST /api/stock-documents          — create draft
 * GET  /api/stock-documents/:id      — get one document with items
 * PUT  /api/stock-documents/:id      — update draft
 * POST /api/stock-documents/:id/approve — approve (role-gated)
 * POST /api/stock-documents/:id/complete — complete (execute the stock movement)
 * DELETE /api/stock-documents/:id    — cancel (draft only)
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

function requireRole(payload: any, set: any, ...roles: string[]) {
  if (!payload || !roles.includes(payload.role)) {
    set.status = 403
    return false
  }
  return true
}

function nextRefNo(docType: string): string {
  const prefix: Record<string, string> = {
    transfer: 'TRF',
    count: 'CNT',
    adjustment: 'ADJ',
    receipt: 'RCV',
    reservation: 'RSV',
  }
  const p = prefix[docType] ?? 'DOC'
  const ts = Date.now().toString(36).toUpperCase()
  return `${p}-${ts}`
}

export const stockDocumentsRoutes = (app: Elysia) =>
  app.group('/api/stock-documents', (app) =>
    app
      // GET /api/stock-documents — list with filters
      .get('/', async ({ query, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { doc_type, status, date_from, date_to, page = '1', limit = '50' } = query ?? {}
        const pageNum = Math.max(1, parseInt(page, 10) || 1)
        const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50))
        const offset = (pageNum - 1) * limitNum

        try {
          let q = db.selectFrom('stock_documents').selectAll()
          if (doc_type) q = q.where('doc_type', '=', doc_type)
          if (status) q = q.where('status', '=', status)
          if (date_from) q = q.where('date', '>=', date_from)
          if (date_to) q = q.where('date', '<=', date_to)

          const docs = await q.orderBy('created_at', 'desc').limit(limitNum).offset(offset).execute()
          return { documents: docs, page: pageNum, limit: limitNum }
        } catch (err) {
          console.error('[/api/stock-documents] DB error:', err)
          return { documents: [], error: 'Database error' }
        }
      })

      // POST /api/stock-documents — create draft
      .post('/', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const {
          doc_type, date, note,
          // Transfer
          source_warehouse_id, target_warehouse_id,
          // Count
          counter_name,
          // Receipt
          vendor_name,
          // Reservation
          customer_name, expiry_date,
          // Adjustment
          reason,
          items,
        } = body as any

        const validTypes = ['transfer', 'count', 'adjustment', 'receipt', 'reservation']
        if (!doc_type || !validTypes.includes(doc_type)) {
          set.status = 400
          return { error: `doc_type must be one of: ${validTypes.join(', ')}` }
        }
        if (!date) {
          set.status = 400
          return { error: 'date is required' }
        }

        // Validate cross-field requirements
        if (doc_type === 'transfer') {
          if (!source_warehouse_id || !target_warehouse_id) {
            set.status = 400
            return { error: 'source_warehouse_id and target_warehouse_id are required for transfer' }
          }
          if (source_warehouse_id === target_warehouse_id) {
            set.status = 400
            return { error: 'Source and target warehouse cannot be the same' }
          }
        }
        if (['count', 'adjustment', 'receipt', 'reservation'].includes(doc_type)) {
          if (!body.warehouse_id) {
            set.status = 400
            return { error: `warehouse_id is required for ${doc_type}` }
          }
        }

        try {
          const id = crypto.randomUUID()
          const reference_no = nextRefNo(doc_type)

          const doc = await db.insertInto('stock_documents').values({
            id,
            doc_type,
            reference_no,
            date,
            status: 'Draft',
            source_warehouse_id: source_warehouse_id ?? null,
            target_warehouse_id: target_warehouse_id ?? null,
            warehouse_id: body.warehouse_id ?? null,
            counter_name: counter_name ?? null,
            vendor_name: vendor_name ?? null,
            customer_name: customer_name ?? null,
            expiry_date: expiry_date ?? null,
            reason: reason ?? null,
            total_items: items ? items.length : 0,
            note: note ?? null,
            created_by: user.sub ?? null,
          } as any).returningAll().executeTakeFirst()

          // Insert items
          if (items && items.length > 0) {
            const itemValues = items.map((item: any) => ({
              id: crypto.randomUUID(),
              stock_document_id: id,
              product_id: item.product_id ?? null,
              product_name: item.product_name ?? '',
              unit: item.unit ?? null,
              quantity: item.quantity ?? null,
              system_quantity: item.system_quantity ?? null,
              counted_quantity: item.counted_quantity ?? null,
              note: item.note ?? null,
            }))
            await db.insertInto('stock_document_items').values(itemValues as any).execute()
          }

          return { document: doc, success: true }
        } catch (err) {
          console.error('[/api/stock-documents] create error:', err)
          set.status = 500
          return { error: 'Failed to create document' }
        }
      }, {
        body: t.Object({
          doc_type: t.String(),
          date: t.String(),
          note: t.Optional(t.String()),
          source_warehouse_id: t.Optional(t.String()),
          target_warehouse_id: t.Optional(t.String()),
          warehouse_id: t.Optional(t.String()),
          counter_name: t.Optional(t.String()),
          vendor_name: t.Optional(t.String()),
          customer_name: t.Optional(t.String()),
          expiry_date: t.Optional(t.String()),
          reason: t.Optional(t.String()),
          items: t.Optional(t.Array(t.Any())),
        }),
      })

      // GET /api/stock-documents/:id — get one document with items
      .get('/:id', async ({ params, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        try {
          const doc = await db
            .selectFrom('stock_documents')
            .selectAll()
            .where('id', '=', params.id)
            .executeTakeFirst()

          if (!doc) {
            set.status = 404
            return { error: 'Document not found' }
          }

          const items = await db
            .selectFrom('stock_document_items')
            .selectAll()
            .where('stock_document_id', '=', params.id)
            .execute()

          return { document: doc, items }
        } catch (err) {
          console.error('[/api/stock-documents/:id] DB error:', err)
          return { error: 'Database error' }
        }
      })

      // PUT /api/stock-documents/:id — update draft
      .put('/:id', async ({ params, body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        try {
          const existing = await db
            .selectFrom('stock_documents')
            .select(['id', 'status'])
            .where('id', '=', params.id)
            .executeTakeFirst()

          if (!existing) {
            set.status = 404
            return { error: 'Document not found' }
          }
          if (existing.status !== 'Draft') {
            set.status = 400
            return { error: 'Only Draft documents can be updated' }
          }

          const {
            date, note,
            source_warehouse_id, target_warehouse_id,
            warehouse_id, counter_name, vendor_name,
            customer_name, expiry_date, reason, items,
          } = body as any

          await db.updateTable('stock_documents')
            .set({
              date: date ?? undefined,
              note: note ?? undefined,
              source_warehouse_id: source_warehouse_id ?? undefined,
              target_warehouse_id: target_warehouse_id ?? undefined,
              warehouse_id: warehouse_id ?? undefined,
              counter_name: counter_name ?? undefined,
              vendor_name: vendor_name ?? undefined,
              customer_name: customer_name ?? undefined,
              expiry_date: expiry_date ?? undefined,
              reason: reason ?? undefined,
              total_items: items ? items.length : undefined,
            } as any)
            .where('id', '=', params.id)
            .execute()

          // Replace items if provided
          if (items) {
            await db.deleteFrom('stock_document_items').where('stock_document_id', '=', params.id).execute()
            const itemValues = items.map((item: any) => ({
              id: crypto.randomUUID(),
              stock_document_id: params.id,
              product_id: item.product_id ?? null,
              product_name: item.product_name ?? '',
              unit: item.unit ?? null,
              quantity: item.quantity ?? null,
              system_quantity: item.system_quantity ?? null,
              counted_quantity: item.counted_quantity ?? null,
              note: item.note ?? null,
            }))
            await db.insertInto('stock_document_items').values(itemValues as any).execute()
          }

          const updated = await db.selectFrom('stock_documents').selectAll().where('id', '=', params.id).executeTakeFirst()
          return { document: updated, success: true }
        } catch (err) {
          console.error('[/api/stock-documents/:id] update error:', err)
          set.status = 500
          return { error: 'Failed to update document' }
        }
      })

      // POST /api/stock-documents/:id/approve — approve document
      .post('/:id/approve', async ({ params, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (!requireRole(user, set, ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE)) return { error: 'Insufficient permissions' }

        try {
          const existing = await db
            .selectFrom('stock_documents')
            .select(['id', 'status'])
            .where('id', '=', params.id)
            .executeTakeFirst()

          if (!existing) {
            set.status = 404
            return { error: 'Document not found' }
          }
          if (existing.status !== 'Draft') {
            set.status = 400
            return { error: 'Only Draft documents can be approved' }
          }

          await db.updateTable('stock_documents')
            .set({ status: 'Approved', approved_by: user.sub ?? null } as any)
            .where('id', '=', params.id)
            .execute()

          const updated = await db.selectFrom('stock_documents').selectAll().where('id', '=', params.id).executeTakeFirst()
          return { document: updated, success: true }
        } catch (err) {
          console.error('[/api/stock-documents/:id/approve] error:', err)
          set.status = 500
          return { error: 'Failed to approve document' }
        }
      })

      // POST /api/stock-documents/:id/complete — execute stock movement
      .post('/:id/complete', async ({ params, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }
        if (!requireRole(user, set, ROLES.ADMIN, ROLES.MANAGER, ROLES.WAREHOUSE)) return { error: 'Insufficient permissions' }

        try {
          const doc = await db
            .selectFrom('stock_documents')
            .selectAll()
            .where('id', '=', params.id)
            .executeTakeFirst()

          if (!doc) {
            set.status = 404
            return { error: 'Document not found' }
          }
          if (doc.status === 'Completed' || doc.status === 'Cancelled') {
            set.status = 400
            return { error: `Document is already ${doc.status.toLowerCase()}` }
          }

          const items = await db
            .selectFrom('stock_document_items')
            .selectAll()
            .where('stock_document_id', '=', params.id)
            .execute()

          // Execute stock movements based on doc type
          const movements: { product_id: string; warehouse_id: string | null; quantity: number; movement_type: 'IN' | 'OUT' | 'ADJUST' | 'SALE' | 'RETURN'; reference_id: string; note: string | null }[] = []

          for (const item of items) {
            if (!item.product_id) continue

            if (doc.doc_type === 'transfer') {
              // OUT from source
              movements.push({
                product_id: item.product_id,
                warehouse_id: doc.source_warehouse_id ?? null,
                quantity: item.quantity ?? 0,
                movement_type: 'OUT',
                reference_id: doc.id,
                note: `Transfer ${doc.reference_no}`,
              })
              // IN to target
              movements.push({
                product_id: item.product_id,
                warehouse_id: doc.target_warehouse_id ?? null,
                quantity: item.quantity ?? 0,
                movement_type: 'IN',
                reference_id: doc.id,
                note: `Transfer ${doc.reference_no}`,
              })
            } else if (doc.doc_type === 'count') {
              const sysQty = item.system_quantity ?? 0
              const cntQty = item.counted_quantity ?? 0
              const diff = cntQty - sysQty
              if (diff !== 0) {
                movements.push({
                  product_id: item.product_id,
                  warehouse_id: doc.warehouse_id ?? null,
                  quantity: Math.abs(diff),
                  movement_type: diff > 0 ? 'IN' : 'OUT',
                  reference_id: doc.id,
                  note: `Count ${doc.reference_no}: ${diff > 0 ? '+' : ''}${diff}`,
                })
              }
            } else if (doc.doc_type === 'adjustment') {
              const qty = item.quantity ?? 0
              const direction = qty >= 0 ? 'IN' : 'OUT'
              movements.push({
                product_id: item.product_id,
                warehouse_id: doc.warehouse_id ?? null,
                quantity: Math.abs(qty),
                movement_type: 'ADJUST',
                reference_id: doc.id,
                note: doc.reason ?? `Adjustment ${doc.reference_no}`,
              })
            } else if (doc.doc_type === 'receipt') {
              movements.push({
                product_id: item.product_id,
                warehouse_id: doc.warehouse_id ?? null,
                quantity: item.quantity ?? 0,
                movement_type: 'IN',
                reference_id: doc.id,
                note: `Receipt ${doc.vendor_name ?? ''} ${doc.reference_no}`,
              })
            } else if (doc.doc_type === 'reservation') {
              movements.push({
                product_id: item.product_id,
                warehouse_id: doc.warehouse_id ?? null,
                quantity: item.quantity ?? 0,
                movement_type: 'OUT',
                reference_id: doc.id,
                note: `Reservation ${doc.customer_name ?? ''} ${doc.reference_no}`,
              })
            }
          }

          // Batch insert ledger entries
          if (movements.length > 0) {
            await db.insertInto('stock_ledger').values(movements as any).execute()
          }

          await db.updateTable('stock_documents')
            .set({ status: 'Completed', completed_at: new Date().toISOString() } as any)
            .where('id', '=', params.id)
            .execute()

          const updated = await db.selectFrom('stock_documents').selectAll().where('id', '=', params.id).executeTakeFirst()
          return { document: updated, movementsExecuted: movements.length, success: true }
        } catch (err) {
          console.error('[/api/stock-documents/:id/complete] error:', err)
          set.status = 500
          return { error: 'Failed to complete document' }
        }
      })

      // DELETE /api/stock-documents/:id — cancel draft
      .delete('/:id', async ({ params, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        if (!user) return { error: 'Authentication required' }
        if (id !== undefined && typeof id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { set.status = 404; return { error: 'Not found' } }

        try {
          const existing = await db
            .selectFrom('stock_documents')
            .select(['id', 'status'])
            .where('id', '=', params.id)
            .executeTakeFirst()

          if (!existing) {
            set.status = 404
            return { error: 'Document not found' }
          }
          if (existing.status !== 'Draft') {
            set.status = 400
            return { error: 'Only Draft documents can be cancelled' }
          }

          await db.deleteFrom('stock_document_items').where('stock_document_id', '=', params.id).execute()
          await db.deleteFrom('stock_documents').where('id', '=', params.id).execute()

          return { success: true }
        } catch (err) {
          console.error('[/api/stock-documents/:id] delete error:', err)
          set.status = 500
          return { error: 'Failed to cancel document' }
        }
      })
  )