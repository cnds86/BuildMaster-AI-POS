/**
 * Print Service — Network printer support
 * Handles print jobs to ESC/POS network printers
 */

import { buildReceipt, buildTestReceipt, type ReceiptData } from './escpos.js'

export interface PrintConfig {
  printerHost: string
  printerPort: number
  enabled: boolean
}

const DEFAULT_PRINTER = {
  host: process.env.PRINTER_HOST || 'localhost',
  port: Number(process.env.PRINTER_PORT || 9100),
  enabled: process.env.PRINTER_ENABLED === 'true',
}

// ─── Print Queue ───────────────────────────────────────────────────────────────

interface PrintJob {
  id: string
  data: Buffer
  createdAt: Date
  status: 'pending' | 'printing' | 'done' | 'failed'
  error?: string
  retries: number
}

const printQueue: PrintJob[] = []
const MAX_RETRIES = 3

/**
 * Add a receipt to the print queue
 */
export async function printReceipt(data: ReceiptData, config?: Partial<PrintConfig>): Promise<{ success: boolean; jobId: string }> {
  const receipt = buildReceipt(data)
  const jobId = `JOB-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  
  const job: PrintJob = {
    id: jobId,
    data: receipt,
    createdAt: new Date(),
    status: 'pending',
    retries: 0,
  }

  printQueue.push(job)
  
  // Process queue asynchronously
  processQueue(config || DEFAULT_PRINTER).catch(console.error)
  
  return { success: true, jobId }
}

/**
 * Print a test page
 */
export async function printTestPage(config?: Partial<PrintConfig>): Promise<{ success: boolean; jobId: string }> {
  const testReceipt = buildTestReceipt()
  const jobId = `TEST-${Date.now()}`
  
  printQueue.push({
    id: jobId,
    data: testReceipt,
    createdAt: new Date(),
    status: 'pending',
    retries: 0,
  })
  
  processQueue(config || DEFAULT_PRINTER).catch(console.error)
  
  return { success: true, jobId }
}

/**
 * Get print queue status
 */
export function getQueueStatus(): { pending: number; printing: number; done: number; failed: number; jobs: PrintJob[] } {
  return {
    pending: printQueue.filter(j => j.status === 'pending').length,
    printing: printQueue.filter(j => j.status === 'printing').length,
    done: printQueue.filter(j => j.status === 'done').length,
    failed: printQueue.filter(j => j.status === 'failed').length,
    jobs: printQueue.slice(-50), // Last 50 jobs
  }
}

/**
 * Clear old completed/failed jobs
 */
export function clearQueue(): void {
  const keepStatuses = ['pending', 'printing']
  const toRemove = printQueue.filter(j => !keepStatuses.includes(j.status))
  toRemove.forEach(j => {
    const idx = printQueue.indexOf(j)
    if (idx > -1) printQueue.splice(idx, 1)
  })
}

// ─── Network Print ───────────────────────────────────────────────────────────

/**
 * Send raw data to network printer (port 9100 = raw print)
 */
async function sendToPrinter(data: Buffer, host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    // Dynamic import for Node.js net module
    import('node:net').then(({ Socket }) => {
      const client = new Socket()
      const timeout = 5000 // 5 second timeout
      
      client.setTimeout(timeout, () => {
        client.destroy()
        reject(new Error(`Connection to ${host}:${port} timed out`))
      })
      
      client.connect(port, host, () => {
        client.write(data, (err) => {
          if (err) {
            client.destroy()
            reject(err)
          } else {
            client.end()
            resolve()
          }
        })
      })
      
      client.on('error', (err) => {
        client.destroy()
        reject(err)
      })
    }).catch(reject)
  })
}

/**
 * Process print queue
 */
async function processQueue(config: PrintConfig): Promise<void> {
  if (!config.enabled) {
    console.log('[PrintService] Printer disabled — queue held')
    return
  }

  const pending = printQueue.find(j => j.status === 'pending')
  if (!pending) return

  pending.status = 'printing'

  try {
    await sendToPrinter(pending.data, config.host, config.port)
    pending.status = 'done'
    console.log(`[PrintService] Job ${pending.id} completed — ${config.host}:${config.port}`)
  } catch (err: any) {
    pending.retries++
    if (pending.retries >= MAX_RETRIES) {
      pending.status = 'failed'
      pending.error = err.message
      console.error(`[PrintService] Job ${pending.id} FAILED after ${MAX_RETRIES} retries: ${err.message}`)
    } else {
      pending.status = 'pending'
      console.warn(`[PrintService] Job ${pending.id} retry ${pending.retries}/${MAX_RETRIES}: ${err.message}`)
      // Schedule retry in 3 seconds
      setTimeout(() => processQueue(config).catch(console.error), 3000)
    }
  }
}

/**
 * Print via download (fallback for when no network printer available)
 * Returns raw ESC/POS bytes that can be saved as a file
 */
export function generateReceiptBytes(data: ReceiptData): Buffer {
  return buildReceipt(data)
}

/**
 * Print via download — for browsers without direct printer access
 * Returns a Blob that can trigger a download
 */
export function generateReceiptBlob(data: ReceiptData): Blob {
  const bytes = buildReceipt(data)
  return new Blob([bytes], { type: 'application/octet-stream' })
}