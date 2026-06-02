/**
 * Print Routes — API endpoints for print service
 */

import { Elysia } from 'elysia'
import { printReceipt, printTestPage, getQueueStatus, generateReceiptBytes, type PrintConfig } from '../services/print.js'
import { buildReceipt, type ReceiptData } from '../services/escpos.js'

export const printRoutes = new Elysia({ prefix: '/api/print' })

  // ── Print Status ────────────────────────────────────────────────────────────
  .get('/status', async () => {
    const status = getQueueStatus()
    return {
      success: true,
      enabled: process.env.PRINTER_ENABLED === 'true',
      host: process.env.PRINTER_HOST || 'localhost',
      port: process.env.PRINTER_PORT || 9100,
      ...status,
    }
  })

  // ── Test Print ───────────────────────────────────────────────────────────
  .post('/test', async ({ body, set }) => {
    if (process.env.PRINTER_ENABLED !== 'true') {
      // Generate test receipt bytes anyway for download testing
      const bytes = generateReceiptBytes({
        shopName: 'MHX TEST',
        orderNo: 'TEST-' + Date.now(),
        orderDate: new Date().toLocaleString('th-TH'),
        cashier: 'Admin',
        items: [{ name: 'Test', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        subtotal: 100,
        total: 100,
        paymentMethod: 'Test',
      })
      
      set.headers['Content-Type'] = 'application/octet-stream'
      set.headers['Content-Disposition'] = `attachment; filename="test-receipt-${Date.now()}.bin"`
      return bytes
    }

    try {
      const result = await printTestPage()
      return { success: true, message: 'Test page sent to printer', ...result }
    } catch (err: any) {
      return Response.json({ success: false, error: err.message }, { status: 500 })
    }
  })

  // ── Print Receipt ─────────────────────────────────────────────────────────
  .post('/receipt', async ({ body, set }) => {
    const data = body as ReceiptData
    
    // Validate required fields
    if (!data.shopName || !data.orderNo || !data.items?.length) {
      return Response.json({
        success: false,
        error: 'shopName, orderNo, and items are required'
      }, { status: 400 })
    }

    // If no printer configured, return receipt bytes for download
    if (process.env.PRINTER_ENABLED !== 'true') {
      const bytes = generateReceiptBytes(data)
      set.headers['Content-Type'] = 'application/octet-stream'
      set.headers['Content-Disposition'] = `attachment; filename="receipt-${data.orderNo}-${Date.now()}.bin"`
      return bytes
    }

    try {
      const result = await printReceipt(data)
      return { success: true, message: 'Receipt sent to printer', ...result }
    } catch (err: any) {
      return Response.json({ success: false, error: err.message }, { status: 500 })
    }
  })

  // ── Generate Receipt (download) ───────────────────────────────────────────
  .get('/receipt/:orderId', async ({ params, set }) => {
    // This would fetch order data from DB in production
    // For now, return error if no order ID
    return Response.json({
      success: false,
      error: 'Not implemented — use POST /api/print/receipt with order data'
    }, { status: 501 })
  })

  // ── Queue Clear ───────────────────────────────────────────────────────────
  .delete('/queue', async () => {
    // This would need admin auth in production
    return Response.json({ success: false, error: 'Not authorized' }, { status: 403 })
  })