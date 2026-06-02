/**
 * MHX-POS — Sync Routes
 * Master ↔ Branch synchronization of products, customers, prices
 *
 * POST /api/sync/full         — full data sync
 * POST /api/sync/incremental  — delta sync since last sync
 * POST /api/sync/push         — master pushes to branch(es)
 * POST /api/sync/pull         — branch pulls from master
 * GET  /api/sync/logs         — sync history
 * GET  /api/sync/status       — pending changes / last sync time
 */
import { Elysia, t } from 'elysia'
import { db } from '../db.js'

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

function logSync(params: {
  sync_type: 'Auto' | 'Manual' | 'Push' | 'Pull'
  status: 'Success' | 'Failed' | 'Partial'
  details: string
  duration_ms?: number
  records_synced?: number
  error_message?: string
  branch_id?: string
}) {
  return db.insertInto('sync_logs').values({
    sync_type: params.sync_type,
    status: params.status,
    details: params.details,
    duration_ms: params.duration_ms ?? null,
    records_synced: params.records_synced ?? null,
    error_message: params.error_message ?? null,
    branch_id: params.branch_id ?? null,
  }).returningAll().executeTakeFirst()
}

// Simulate sync work (real implementation would call branch APIs)
async function performSync(type: 'full' | 'incremental', branchId?: string) {
  const start = Date.now()

  // Simulate fetching master data
  const [products, customers, categories] = await Promise.all([
    db.selectFrom('products').select(['id', 'name', 'category', 'price', 'sku', 'active']).where('active', '=', true).execute(),
    db.selectFrom('customers').select(['id', 'name', 'phone', 'level_id', 'loyalty_points', 'active']).where('active', '=', true).execute(),
    db.selectFrom('categories').select(['id', 'name', 'parent_id', 'sort_order', 'active']).where('active', '=', true).execute(),
  ])

  const recordsCount = products.length + customers.length + categories.length
  const durationMs = Date.now() - start

  await logSync({
    sync_type: type === 'full' ? 'Manual' : 'Auto',
    status: 'Success',
    details: type === 'full'
      ? `Full sync completed: ${recordsCount} records`
      : `Incremental sync completed: ${recordsCount} records`,
    duration_ms: durationMs,
    records_synced: recordsCount,
    branch_id: branchId ?? null,
  })

  return { success: true, recordsCount, durationMs }
}

export const syncRoutes = (app: Elysia) =>
  app.group('/api/sync', (app) =>
    app
      // GET /api/sync/logs — fetch sync history
      .get('/logs', async ({ query, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { page = '1', limit = '50', branch_id, status } = query ?? {}
        const pageNum = Math.max(1, parseInt(page, 10) || 1)
        const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50))
        const offset = (pageNum - 1) * limitNum

        try {
          let q = db.selectFrom('sync_logs').selectAll()
          if (branch_id) q = q.where('branch_id', '=', branch_id)
          if (status) q = q.where('status', '=', status)

          const logs = await q.orderBy('created_at', 'desc').limit(limitNum).offset(offset).execute()
          return { logs, page: pageNum, limit: limitNum }
        } catch (err) {
          console.error('[/api/sync/logs] DB error:', err)
          return { logs: [], error: 'Database error' }
        }
      })

      // GET /api/sync/status — current sync status (last success, pending count)
      .get('/status', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          const lastSuccess = await db
            .selectFrom('sync_logs')
            .selectAll()
            .where('status', '=', 'Success')
            .orderBy('created_at', 'desc')
            .limit(1)
            .executeTakeFirst()

          const pendingCount = await db
            .selectFrom('sales')
            .select(['id'])
            .where('sync_status', '=', 'pending')
            .execute()

          const failedCount = await db
            .selectFrom('sync_logs')
            .select(['id'])
            .where('status', '=', 'Failed')
            .where('created_at', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
            .execute()

          return {
            lastSyncAt: lastSuccess?.created_at ?? null,
            lastSyncType: lastSuccess?.sync_type ?? null,
            pendingSalesCount: pendingCount.length,
            failedSyncs24h: failedCount.length,
          }
        } catch (err) {
          console.error('[/api/sync/status] DB error:', err)
          return { lastSyncAt: null, pendingSalesCount: 0, failedSyncs24h: 0, error: 'Database error' }
        }
      })

      // POST /api/sync/full — full master sync
      .post('/full', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          const result = await performSync('full')
          return result
        } catch (err) {
          console.error('[/api/sync/full] error:', err)
          await logSync({
            sync_type: 'Manual',
            status: 'Failed',
            details: 'Full sync failed',
            error_message: String(err),
          })
          set.status = 500
          return { success: false, error: 'Full sync failed' }
        }
      })

      // POST /api/sync/incremental — delta sync since last sync
      .post('/incremental', async ({ jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        try {
          const result = await performSync('incremental')
          return result
        } catch (err) {
          console.error('[/api/sync/incremental] error:', err)
          await logSync({
            sync_type: 'Auto',
            status: 'Failed',
            details: 'Incremental sync failed',
            error_message: String(err),
          })
          set.status = 500
          return { success: false, error: 'Incremental sync failed' }
        }
      })

      // POST /api/sync/push — push master data to branch(es)
      .post('/push', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { branch_ids } = body as { branch_ids?: string[] }
        if (!branch_ids || branch_ids.length === 0) {
          set.status = 400
          return { error: 'branch_ids array is required' }
        }

        const start = Date.now()
        const results: { branch_id: string; success: boolean; records?: number; error?: string }[] = []

        for (const branchId of branch_ids) {
          try {
            // Verify branch exists
            const branch = await db.selectFrom('branches').select(['id', 'name']).where('id', '=', branchId).executeTakeFirst()
            if (!branch) {
              results.push({ branch_id: branchId, success: false, error: 'Branch not found' })
              continue
            }

            // Simulate push (real: POST to branch's sync endpoint)
            const [products, customers] = await Promise.all([
              db.selectFrom('products').select(['id', 'name', 'category', 'price', 'sku', 'active']).where('active', '=', true).execute(),
              db.selectFrom('customers').select(['id', 'name', 'phone', 'level_id', 'active']).where('active', '=', true).execute(),
            ])

            const records = products.length + customers.length

            await logSync({
              sync_type: 'Push',
              status: 'Success',
              details: `Pushed to branch "${branch.name}": ${records} records`,
              duration_ms: Date.now() - start,
              records_synced: records,
              branch_id: branchId,
            })

            results.push({ branch_id: branchId, success: true, records })
          } catch (err) {
            console.error(`[/api/sync/push] branch ${branchId}:`, err)
            await logSync({
              sync_type: 'Push',
              status: 'Failed',
              details: `Push to branch ${branchId} failed`,
              error_message: String(err),
              branch_id: branchId,
            })
            results.push({ branch_id: branchId, success: false, error: String(err) })
          }
        }

        const totalRecords = results.reduce((sum, r) => sum + (r.records ?? 0), 0)
        const failedCount = results.filter(r => !r.success).length

        return {
          success: failedCount === 0,
          partialSuccess: failedCount > 0 && failedCount < results.length,
          results,
          totalRecords,
          totalDurationMs: Date.now() - start,
        }
      }, {
        body: t.Object({
          branch_ids: t.Array(t.String()),
        }),
      })

      // POST /api/sync/pull — pull data from branch to master
      .post('/pull', async ({ body, jwt: jwtFn, cookie: { auth_token }, set, request }: any) => {
        const user = await authGuard(jwtFn, auth_token, set, request)
        if (!user) return { error: 'Authentication required' }

        const { branch_ids } = body as { branch_ids?: string[] }
        if (!branch_ids || branch_ids.length === 0) {
          set.status = 400
          return { error: 'branch_ids array is required' }
        }

        const start = Date.now()
        const results: { branch_id: string; success: boolean; records?: number; error?: string }[] = []

        for (const branchId of branch_ids) {
          try {
            const branch = await db.selectFrom('branches').select(['id', 'name']).where('id', '=', branchId).executeTakeFirst()
            if (!branch) {
              results.push({ branch_id: branchId, success: false, error: 'Branch not found' })
              continue
            }

            // Simulate pull: get branch sales not yet on master
            // Real implementation: GET from branch's /api/sync/sales endpoint
            const sales = await db
              .selectFrom('sales')
              .select(['id', 'total', 'created_at'])
              .where('branch_id', '=', branchId)
              .where('sync_status', '=', 'pending')
              .execute()

            // Mark as synced
            // Real: after successful import from branch, update sync_status

            await logSync({
              sync_type: 'Pull',
              status: 'Success',
              details: `Pulled from branch "${branch.name}": ${sales.length} sales`,
              duration_ms: Date.now() - start,
              records_synced: sales.length,
              branch_id: branchId,
            })

            results.push({ branch_id: branchId, success: true, records: sales.length })
          } catch (err) {
            console.error(`[/api/sync/pull] branch ${branchId}:`, err)
            await logSync({
              sync_type: 'Pull',
              status: 'Failed',
              details: `Pull from branch ${branchId} failed`,
              error_message: String(err),
              branch_id: branchId,
            })
            results.push({ branch_id: branchId, success: false, error: String(err) })
          }
        }

        const totalRecords = results.reduce((sum, r) => sum + (r.records ?? 0), 0)
        const failedCount = results.filter(r => !r.success).length

        return {
          success: failedCount === 0,
          partialSuccess: failedCount > 0 && failedCount < results.length,
          results,
          totalRecords,
          totalDurationMs: Date.now() - start,
        }
      }, {
        body: t.Object({
          branch_ids: t.Array(t.String()),
        }),
      })
  )