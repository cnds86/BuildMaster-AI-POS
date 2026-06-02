/**
 * ESC/POS Command Builder
 * Generates ESC/POS byte sequences for thermal receipt printers
 */

// ─── ESC/POS Commands ───────────────────────────────────────────────────────────

export const ESC = 0x1b
export const GS = 0x1d

// Initialize printer
export const INIT = Buffer.from([ESC, 0x40])

// Text formatting
export const BOLD_ON = Buffer.from([ESC, 0x45, 0x01])
export const BOLD_OFF = Buffer.from([ESC, 0x45, 0x00])
export const UNDERLINE_ON = Buffer.from([ESC, 0x2d, 0x01])
export const UNDERLINE_OFF = Buffer.from([ESC, 0x2d, 0x00])

// Font size
export const FONT_NORMAL = Buffer.from([ESC, 0x21, 0x00])
export const FONT_DOUBLE_HEIGHT = Buffer.from([ESC, 0x21, 0x10])
export const FONT_DOUBLE_WIDTH = Buffer.from([ESC, 0x21, 0x20])
export const FONT_DOUBLE = Buffer.from([ESC, 0x21, 0x30])

// Text alignment
export const ALIGN_LEFT = Buffer.from([ESC, 0x61, 0x00])
export const ALIGN_CENTER = Buffer.from([ESC, 0x61, 0x01])
export const ALIGN_RIGHT = Buffer.from([ESC, 0x61, 0x02])

// Line spacing
export const LINE_SPACING_DEFAULT = Buffer.from([ESC, 0x32])
export const LINE_SPACING_N = (n: number) => Buffer.from([ESC, 0x33, n])

// Feed and cut
export const FEED_LINES = (n: number) => Buffer.from([ESC, 0x64, n])
export const CUT_FULL = Buffer.from([GS, 0x56, 0x00])
export const CUT_PARTIAL = Buffer.from([GS, 0x56, 0x01])

// Cash drawer
export const DRAWER_KICK = Buffer.from([ESC, 0x70, 0x00, 0x19, 0xfa])

// ─── Line helpers ──────────────────────────────────────────────────────────────

export const NEWLINE = Buffer.from([0x0a])
export const CRLF = Buffer.from([0x0d, 0x0a])

/**
 * Convert string to bytes with Thai support (most ESC/POS printers support TIS-620 or CP874)
 * For simplicity, we'll use ASCII-safe output
 */
export function textToBytes(text: string): Buffer {
  // Replace Thai characters with approximations or remove non-printable
  // ESC/POS printers typically use TIS-620 encoding for Thai
  const encoder = new TextEncoder()
  // Try TIS-620 (Thai) if available, fall back to Latin-1
  try {
    return encoder.encode(text)
  } catch {
    return Buffer.from(text.replace(/[^\x00-\x7F]/g, '?'), 'latin1')
  }
}

/**
 * Pad text to width with spaces
 */
export function padText(text: string, width: number, align: 'left' | 'center' | 'right' = 'left'): string {
  const clean = text.replace(/[^\x00-\x7F]/g, '?') // Remove non-ASCII
  const padded = clean.padStart(clean.length).padEnd(width)
  if (align === 'left') return padded.substring(0, width)
  if (align === 'right') return padded.padStart(width).substring(padded.length - width)
  const leftPad = Math.floor((width - clean.length) / 2)
  return padded.substring(0, leftPad) + clean + padded.substring(leftPad + clean.length)
}

// ─── Receipt Builder ─────────────────────────────────────────────────────────

export interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface ReceiptData {
  shopName: string
  shopAddress?: string
  shopPhone?: string
  orderNo: string
  orderDate: string
  cashier: string
  items: ReceiptItem[]
  subtotal: number
  tax?: number
  total: number
  paymentMethod: string
  customerName?: string
  customerPhone?: string
  footerMessage?: string
}

export function buildReceipt(data: ReceiptData, paperWidth = 48): Buffer {
  const { shopName, shopAddress, shopPhone, orderNo, orderDate, cashier, items, subtotal, tax, total, paymentMethod, customerName, customerPhone, footerMessage } = data
  const chunks: Buffer[] = []

  // Initialize
  chunks.push(INIT)
  chunks.push(LINE_SPACING_DEFAULT)

  // Header — Shop name (centered, double height)
  chunks.push(ALIGN_CENTER)
  chunks.push(FONT_DOUBLE)
  chunks.push(BOLD_ON)
  chunks.push(textToBytes(shopName))
  chunks.push(NEWLINE)
  chunks.push(BOLD_OFF)
  chunks.push(FONT_NORMAL)

  if (shopAddress) {
    chunks.push(textToBytes(shopAddress))
    chunks.push(NEWLINE)
  }
  if (shopPhone) {
    chunks.push(textToBytes(`โทร: ${shopPhone}`))
    chunks.push(NEWLINE)
  }

  // Separator
  chunks.push(textToBytes(padText('--------------------------------', paperWidth, 'left')))
  chunks.push(NEWLINE)

  // Order info
  chunks.push(ALIGN_LEFT)
  chunks.push(textToBytes(`เลขที่สั่งซื้อ: ${orderNo}`))
  chunks.push(NEWLINE)
  chunks.push(textToBytes(`วันที่: ${orderDate}`))
  chunks.push(NEWLINE)
  chunks.push(textToBytes(`แคชเชียร์: ${cashier}`))
  chunks.push(NEWLINE)

  if (customerName) {
    chunks.push(textToBytes(`ลูกค้า: ${customerName}`))
    chunks.push(NEWLINE)
  }
  if (customerPhone) {
    chunks.push(textToBytes(`โทร: ${customerPhone}`))
    chunks.push(NEWLINE)
  }

  // Separator
  chunks.push(textToBytes(padText('--------------------------------', paperWidth, 'left')))
  chunks.push(NEWLINE)

  // Items header
  chunks.push(BOLD_ON)
  chunks.push(textToBytes(padText('รายการ', 28, 'left') + padText('จำนวน', 10, 'right') + padText('ราคา', 10, 'right')))
  chunks.push(NEWLINE)
  chunks.push(BOLD_OFF)

  // Items
  for (const item of items) {
    const name = item.name.length > 20 ? item.name.substring(0, 20) + '..' : item.name
    const qty = `x${item.quantity}`
    const price = `฿${item.totalPrice.toLocaleString()}`
    chunks.push(textToBytes(padText(name, 28, 'left')))
    chunks.push(textToBytes(padText(qty, 10, 'right')))
    chunks.push(textToBytes(padText(price, 10, 'right')))
    chunks.push(NEWLINE)
    if (item.unitPrice !== item.totalPrice / item.quantity) {
      chunks.push(textToBytes(padText(`  ฿${item.unitPrice}/ชิ้น`, 48, 'left')))
      chunks.push(NEWLINE)
    }
  }

  // Separator
  chunks.push(textToBytes(padText('--------------------------------', paperWidth, 'left')))
  chunks.push(NEWLINE)

  // Totals
  const subtotalLine = padText('รวมย่อย', 38, 'left') + padText(`฿${subtotal.toLocaleString()}`, 10, 'right')
  chunks.push(textToBytes(subtotalLine))
  chunks.push(NEWLINE)

  if (tax !== undefined) {
    const taxLine = padText('ภาษี 7%', 38, 'left') + padText(`฿${tax.toLocaleString()}`, 10, 'right')
    chunks.push(textToBytes(taxLine))
    chunks.push(NEWLINE)
  }

  // Total (large, bold)
  chunks.push(FONT_DOUBLE_HEIGHT)
  chunks.push(BOLD_ON)
  const totalLine = padText('รวมทั้งสิ้น', 38, 'left') + padText(`฿${total.toLocaleString()}`, 10, 'right')
  chunks.push(textToBytes(totalLine))
  chunks.push(NEWLINE)
  chunks.push(BOLD_OFF)
  chunks.push(FONT_NORMAL)

  // Payment method
  chunks.push(textToBytes(padText('ชำระเงิน: ' + paymentMethod, 48, 'left')))
  chunks.push(NEWLINE)

  // Separator
  chunks.push(textToBytes(padText('================================', paperWidth, 'left')))
  chunks.push(NEWLINE)

  // Footer
  if (footerMessage) {
    chunks.push(ALIGN_CENTER)
    chunks.push(textToBytes(footerMessage))
    chunks.push(NEWLINE)
  }

  chunks.push(ALIGN_CENTER)
  chunks.push(textToBytes('ขอบคุณที่ใช้บริการ'))
  chunks.push(NEWLINE)
  chunks.push(textToBytes(new Date().toLocaleDateString('th-TH')))
  chunks.push(NEWLINE)

  // Feed and cut
  chunks.push(FEED_LINES(3))
  chunks.push(CUT_PARTIAL)

  return Buffer.concat(chunks)
}

/**
 * Build a simple test receipt for printer testing
 */
export function buildTestReceipt(): Buffer {
  return buildReceipt({
    shopName: 'MHX TEST SHOP',
    shopAddress: '123 Test Street, Bangkok',
    shopPhone: '02-123-4567',
    orderNo: 'TEST-' + Date.now(),
    orderDate: new Date().toLocaleString('th-TH'),
    cashier: 'Test User',
    items: [
      { name: 'Test Product A', quantity: 2, unitPrice: 100, totalPrice: 200 },
      { name: 'Test Product B', quantity: 1, unitPrice: 150, totalPrice: 150 },
    ],
    subtotal: 350,
    tax: 24.5,
    total: 374.5,
    paymentMethod: 'เงินสด',
    footerMessage: 'Test receipt - Hardware integration v0.1',
  })
}