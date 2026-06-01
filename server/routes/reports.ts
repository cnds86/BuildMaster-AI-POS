/**
 * MHX-POS Reports API Router
 *
 * Aggregated analytics endpoints:
 *   GET /api/reports/sales          — revenue/profit by period/branch/category
 *   GET /api/reports/inventory      — stock valuation by warehouse/category
 *   GET /api/reports/hourly         — peak hours analysis
 *   GET /api/reports/staff          — per-staff sales & commission
 *   GET /api/reports/expenses       — expense summary by category
 *
 * All endpoints require auth_token cookie (JWT).
 */

import { Elysia, t } from 'elysia'
import { db } from '../db.js'

// ─── Auth guard helper ───────────────────────────────────────────────────────
async function authGuard(jwtFn: any, cookie: any, set: any) {
  const token = cookie?.auth_token?.value
  if (!token) { set.status = 401; return null }
  try {
    const payload = await (jwtFn as any).verify(token) as { sub?: string; name?: string; role?: string } | false
    if (!payload) { set.status = 401; return null }
    return payload
  } catch { set.status = 401; return null }
}

// ─── Shared query helpers ─────────────────────────────────────────────────────
function parseDateRange(date_from?: string, date_to?: string) {
  const from = date_from ? new Date(date_from) : new Date(0)
  const to = date_to
    ? new Date(new Date(date_to).getTime() + 24 * 60 * 60 * 999) // inclusive
    : new Date()
  return { from, to }
}

// ─── Router ──────────────────────────────────────────────────────────────────
export const reportsRoutes = new Elysia({ prefix: '/api/reports' })

  // GET /api/reports/sales
  // Query: date_from, date_to, branch_id, category (optional)
  .get('/sales', async ({ query, jwt: jwtFn, cookie, set }) => {
    const user = await authGuard(jwtFn, cookie, set)
    if (!user) return { error: 'Authentication required' }

    const { from, to } = parseDateRange(query.date_from as string, query.date_to as string)
    const { branch_id, category } = query as { date_from?: string; date_to?: string; branch_id?: string; category?: string }

    try {
      // Fetch sales records
      let salesQ = db
        .selectFrom('sales')
        .selectAll()
        .where('created_at', '>=', from)
        .where('created_at', '<=', to)
        .where('status', '!=', 'voided')

      if (branch_id) salesQ = salesQ.where('branch_id', '=', branch_id)

      const salesRows = await salesQ.execute()

      // Collect unique sale IDs
      const saleIds = salesRows.map(s => s.id)

      // Fetch sale items in one shot
      const items = saleIds.length
        ? await db.selectFrom('sale_items').selectAll().where('sale_id', 'in', saleIds).execute()
        : []

      // Index items by sale_id
      const itemsBySale = new Map<string, typeof items>()
      for (const item of items) {
        if (!itemsBySale.has(item.sale_id)) itemsBySale.set(item.sale_id, [])
        itemsBySale.get(item.sale_id)!.push(item)
      }

      // Fetch products for cost lookup
      const productIds = [...new Set(items.map(i => i.product_id))]
      const products = productIds.length
        ? await db.selectFrom('products').select(['id', 'name', 'category', 'cost_price', 'price', 'sku']).where('id', 'in', productIds).execute()
        : []
      const productMap = new Map(products.map(p => [p.id, p]))

      // Aggregate daily data + per-sale metrics
      const dailyMap = new Map<string, { date: string; revenue: number; cost: number; profit: number; count: number }>()
      let totalRevenue = 0, totalCost = 0, totalProfit = 0

      for (const sale of salesRows) {
        const saleItems = itemsBySale.get(sale.id) ?? []
        let saleCost = 0

        for (const item of saleItems) {
          const product = productMap.get(item.product_id)
          const unitCost = product?.cost_price ?? 0
          saleCost += unitCost * item.quantity
        }

        const saleProfit = sale.total - saleCost
        totalRevenue += sale.total
        totalCost += saleCost
        totalProfit += saleProfit

        const dateKey = new Date(sale.created_at).toLocaleDateString('en-US')
        const existing = dailyMap.get(dateKey) ?? { date: dateKey, revenue: 0, cost: 0, profit: 0, count: 0 }
        existing.revenue += sale.total
        existing.cost += saleCost
        existing.profit += saleProfit
        existing.count += 1
        dailyMap.set(dateKey, existing)
      }

      const chartData = Array.from(dailyMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      return {
        totalRevenue,
        totalCost,
        totalProfit,
        margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        chartData,
        recordCount: salesRows.length,
      }
    } catch (err) {
      console.error('[reports/sales]', err)
      return { error: 'Database error' }
    }
  })

  // GET /api/reports/inventory
  // Query: warehouse_id (optional), category (optional)
  .get('/inventory', async ({ query, jwt: jwtFn, cookie, set }) => {
    const user = await authGuard(jwtFn, cookie, set)
    if (!user) return { error: 'Authentication required' }

    try {
      let q = db.selectFrom('products').selectAll().where('active', '=', true)
      if (query.category) q = q.where('category', '=', query.category as string)

      const products = await q.execute()

      let totalStockValue = 0
      let totalRetailValue = 0
      let totalItems = 0

      const reportItems = products.map(p => {
        const stockVal = p.stock * (p.cost_price ?? 0)
        const retailVal = p.stock * p.price
        totalStockValue += stockVal
        totalRetailValue += retailVal
        totalItems += p.stock

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          stock: p.stock,
          unit: p.unit,
          minStock: p.min_stock,
          costPrice: p.cost_price,
          price: p.price,
          stockValue: stockVal,
          retailValue: retailVal,
          margin: p.cost_price ? ((p.price - p.cost_price) / p.price) * 100 : 100,
        }
      })

      return { reportItems, totalStockValue, totalRetailValue, totalItems, recordCount: products.length }
    } catch (err) {
      console.error('[reports/inventory]', err)
      return { error: 'Database error' }
    }
  })

  // GET /api/reports/hourly
  // Query: date_from, date_to, branch_id (optional)
  .get('/hourly', async ({ query, jwt: jwtFn, cookie, set }) => {
    const user = await authGuard(jwtFn, cookie, set)
    if (!user) return { error: 'Authentication required' }

    const { from, to } = parseDateRange(query.date_from as string, query.date_to as string)

    try {
      let q = db
        .selectFrom('sales')
        .selectAll()
        .where('created_at', '>=', from)
        .where('created_at', '<=', to)
        .where('status', '!=', 'voided')

      if (query.branch_id) q = q.where('branch_id', '=', query.branch_id as string)

      const salesRows = await q.execute()

      const hours = Array(24).fill(0).map((_, i) => ({
        hour: i,
        label: `${String(i).padStart(2, '0')}:00`,
        revenue: 0,
        count: 0,
      }))

      for (const sale of salesRows) {
        const h = new Date(sale.created_at).getHours()
        hours[h].revenue += sale.total
        hours[h].count += 1
      }

      return { hours, recordCount: salesRows.length }
    } catch (err) {
      console.error('[reports/hourly]', err)
      return { error: 'Database error' }
    }
  })

  // GET /api/reports/staff
  // Query: date_from, date_to, branch_id (optional)
  .get('/staff', async ({ query, jwt: jwtFn, cookie, set }) => {
    const user = await authGuard(jwtFn, cookie, set)
    if (!user) return { error: 'Authentication required' }

    const { from, to } = parseDateRange(query.date_from as string, query.date_to as string)

    try {
      let q = db
        .selectFrom('sales')
        .selectAll()
        .where('created_at', '>=', from)
        .where('created_at', '<=', to)
        .where('status', '!=', 'voided')

      if (query.branch_id) q = q.where('branch_id', '=', query.branch_id as string)

      const salesRows = await q.execute()

      const staffMap = new Map<string, { id: string; name: string; revenue: number; count: number }>()

      for (const sale of salesRows) {
        const uid = sale.user_id ?? 'unknown'
        // Try to resolve user name
        let name = `Staff ${uid.slice(-4)}`
        if (sale.user_id) {
          // Try to get from users table if user_id is set
        }
        const existing = staffMap.get(uid) ?? { id: uid, name: sale.user_name || name, revenue: 0, count: 0 }
        existing.revenue += sale.total
        existing.count += 1
        staffMap.set(uid, existing)
      }

      const staffList = Array.from(staffMap.values()).sort((a, b) => b.revenue - a.revenue)
      return { staffList, recordCount: salesRows.length }
    } catch (err) {
      console.error('[reports/staff]', err)
      return { error: 'Database error' }
    }
  })

  // GET /api/reports/expenses
  // Query: date_from, date_to, category_id (optional)
  .get('/expenses', async ({ query, jwt: jwtFn, cookie, set }) => {
    const user = await authGuard(jwtFn, cookie, set)
    if (!user) return { error: 'Authentication required' }

    const { from, to } = parseDateRange(query.date_from as string, query.date_to as string)

    try {
      let q = db
        .selectFrom('expenses')
        .selectAll()
        .where('created_at', '>=', from)
        .where('created_at', '<=', to)

      if (query.category_id) q = q.where('category_id', '=', query.category_id as string)

      const expenses = await q.execute()

      let totalExpenses = 0
      const categoryTotals: Record<string, number> = {}
      const dailyMap = new Map<string, { date: string; amount: number }>()

      for (const exp of expenses) {
        totalExpenses += exp.amount
        if (exp.category_id) categoryTotals[exp.category_id] = (categoryTotals[exp.category_id] ?? 0) + exp.amount

        const dateKey = new Date(exp.created_at).toLocaleDateString('en-US')
        const existing = dailyMap.get(dateKey) ?? { date: dateKey, amount: 0 }
        existing.amount += exp.amount
        dailyMap.set(dateKey, existing)
      }

      const chartData = Array.from(dailyMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      return { totalExpenses, categoryTotals, chartData, recordCount: expenses.length }
    } catch (err) {
      console.error('[reports/expenses]', err)
      return { error: 'Database error' }
    }
  })

  // GET /api/reports/low-stock
  .get('/low-stock', async ({ jwt: jwtFn, cookie, set }) => {
    const user = await authGuard(jwtFn, cookie, set)
    if (!user) return { error: 'Authentication required' }

    try {
      const lowStock = await db
        .selectFrom('products')
        .selectAll()
        .where('active', '=', true)
        .where('stock', '<=', db.raw('COALESCE(min_stock, 0)'))
        .execute()

      return {
        items: lowStock.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          stock: p.stock,
          minStock: p.min_stock,
          costPrice: p.cost_price,
          price: p.price,
        })),
        recordCount: lowStock.length,
      }
    } catch (err) {
      console.error('[reports/low-stock]', err)
      return { error: 'Database error' }
    }
  })

  // GET /api/reports/daily-summary
  // Query: range = 'today' (default) | '7d' | '30d' | '90d' | 'all'
  // Returns KPIs: totalRevenue, orderCount, topProducts, avgOrderValue
  // BUG-NEW-01 fix: previous version only returned today's data, leaving the
  // dashboard cards stuck at ₭0 whenever no sales occurred on the current
  // calendar day. Now accepts a range parameter to match Dashboard's filter.
  .get('/daily-summary', async ({ query, jwt: jwtFn, cookie, set }) => {
    const user = await authGuard(jwtFn, cookie, set)
    if (!user) return { error: 'Authentication required' }

    const range = (query.range as string) || 'today'

    try {
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      const startDate = new Date(today)

      if (range === '7d') startDate.setDate(startDate.getDate() - 6)
      else if (range === '30d') startDate.setDate(startDate.getDate() - 29)
      else if (range === '90d') startDate.setDate(startDate.getDate() - 89)
      else if (range === 'all') startDate.setTime(0)
      else {
        // Default: today only
        startDate.setHours(0, 0, 0, 0)
        today.setHours(23, 59, 59, 999)
      }

      if (range !== 'today') startDate.setHours(0, 0, 0, 0)

      const todaySales = await db
        .selectFrom('sales')
        .selectAll()
        .where('created_at', '>=', startDate)
        .where('created_at', '<=', today)
        .where('status', '!=', 'voided')
        .execute()

      const saleIds = todaySales.map(s => s.id)
      const items = saleIds.length
        ? await db.selectFrom('sale_items').selectAll().where('sale_id', 'in', saleIds).execute()
        : []

      const totalRevenue = todaySales.reduce((sum, s) => sum + s.total, 0)
      const orderCount = todaySales.length
      const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0

      // Top products by quantity sold today
      const prodQtyMap = new Map<string, { id: string; name: string; qty: number; revenue: number }>()
      for (const item of items) {
        const existing = prodQtyMap.get(item.product_id) ?? {
          id: item.product_id,
          name: item.name || item.product_id,
          qty: 0,
          revenue: 0,
        }
        existing.qty += item.quantity
        existing.revenue += item.sell_price * item.quantity
        prodQtyMap.set(item.product_id, existing)
      }
      const topProducts = Array.from(prodQtyMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      return { totalRevenue, orderCount, avgOrderValue, topProducts, recordCount: todaySales.length }
    } catch (err) {
      console.error('[reports/daily-summary]', err)
      return { error: 'Database error' }
    }
  })

  // GET /api/reports/sales-trend
  // Query: range = '7d' | '30d' | '90d' (default '30d')
  // Returns daily revenue array for chart rendering
  .get('/sales-trend', async ({ query, jwt: jwtFn, cookie, set }) => {
    const user = await authGuard(jwtFn, cookie, set)
    if (!user) return { error: 'Authentication required' }

    const range = (query.range as string) || '30d'
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const startDate = new Date(today)

    if (range === '7d') startDate.setDate(startDate.getDate() - 6)
    else if (range === '30d') startDate.setDate(startDate.getDate() - 29)
    else if (range === '90d') startDate.setDate(startDate.getDate() - 89)
    else startDate.setDate(startDate.getDate() - 29)

    startDate.setHours(0, 0, 0, 0)

    try {
      const salesRows = await db
        .selectFrom('sales')
        .selectAll()
        .where('created_at', '>=', startDate)
        .where('created_at', '<=', today)
        .where('status', '!=', 'voided')
        .execute()

      // Build complete date map for the range
      const dailyMap = new Map<string, number>()
      const daysToGenerate = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 30
      for (let i = daysToGenerate - 1; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        dailyMap.set(key, 0)
      }

      for (const sale of salesRows) {
        const key = new Date(sale.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (dailyMap.has(key)) {
          dailyMap.set(key, (dailyMap.get(key) ?? 0) + sale.total)
        }
      }

      const chartData = Array.from(dailyMap).map(([name, sales]) => ({ name, sales }))
      return { chartData, recordCount: salesRows.length }
    } catch (err) {
      console.error('[reports/sales-trend]', err)
      return { error: 'Database error' }
    }
  })
