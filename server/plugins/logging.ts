import { Elysia, t } from 'elysia'
import { Elysia, t } from 'elysia'

export interface RequestLog {
  method: string
  path: string
  status: number
  duration: number
  ip: string
  userAgent: string
  userId?: string
  timestamp: string
}

// In-memory log buffer (Ring buffer style)
const LOG_BUFFER_SIZE = 1000
const requestLogs: RequestLog[] = []
let logIndex = 0

function addLog(entry: RequestLog): void {
  if (requestLogs.length < LOG_BUFFER_SIZE) {
    requestLogs.push(entry)
  } else {
    requestLogs[logIndex] = entry
    logIndex = (logIndex + 1) % LOG_BUFFER_SIZE
  }
}

export const loggingPlugin = new Elysia({ name: 'request-logging' })
  .onBeforeHandle(async ({ method, path, request, headers }) => {
    ;(request as any)._startTime = Date.now()
    ;(request as any)._ip = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown'
    ;(request as any)._userAgent = headers.get('user-agent') || 'unknown'
  })
  .onAfterHandle(async ({ method, path, request, response, set, error }) => {
    const startTime = (request as any)._startTime || Date.now()
    const duration = Date.now() - startTime
    const ip = (request as any)._ip
    const userAgent = (request as any)._userAgent
    const status = set.status || (error ? 500 : 200)

    // Skip logging for static assets and health checks to reduce noise
    if (path.startsWith('/dist') || path === '/api/health') return

    addLog({
      method,
      path,
      status: typeof status === 'number' ? status : 200,
      duration,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    })
  })

// ── API Endpoints ──────────────────────────────────────────────────────────

// GET /api/logs — Get recent request logs
export const logRoutes = new Elysia({ prefix: '/api/logs' })
  .use(loggingPlugin)
  .get('/', async () => {
    // Return logs in chronological order (oldest first)
    const logs = requestLogs.length < LOG_BUFFER_SIZE
      ? requestLogs
      : requestLogs.slice(logIndex).concat(requestLogs.slice(0, logIndex))
    return { logs, count: logs.length, bufferSize: LOG_BUFFER_SIZE }
  })
  .get('/recent', async ({ query: { limit = '100', path, method, status_min } }) => {
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 100))
    let filtered = requestLogs.slice(-500) // last 500 entries

    if (path) {
      filtered = filtered.filter(l => l.path.includes(path as string))
    }
    if (method) {
      filtered = filtered.filter(l => l.method === (method as string).toUpperCase())
    }
    if (status_min) {
      filtered = filtered.filter(l => l.status >= parseInt(status_min as string, 10))
    }

    const logs = filtered.slice(-limitNum)
    return { logs, count: logs.length }
  })
  .get('/stats', async () => {
    const now = Date.now()
    const lastHour = now - 3600000
    const last5min = now - 300000

    const stats = {
      total: requestLogs.length,
      bufferSize: LOG_BUFFER_SIZE,
      byMethod: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      slowRequests: [] as RequestLog[],
      errorRequests: [] as RequestLog[],
    }

    for (const log of requestLogs) {
      stats.byMethod[log.method] = (stats.byMethod[log.method] || 0) + 1
      const statusKey = String(log.status)
      stats.byStatus[statusKey] = (stats.byStatus[statusKey] || 0) + 1
      if (log.duration > 500) stats.slowRequests.push(log)
      if (log.status >= 500) stats.errorRequests.push(log)
    }

    return stats
  })
  .delete('/', async () => {
    requestLogs.length = 0
    logIndex = 0
    return { success: true, message: 'Logs cleared' }
  })
