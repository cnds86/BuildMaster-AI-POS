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
 * Convert string to bytes with Thai support (TIS-620 / CP874).
 * Most Thai ESC/POS printers default to CP874; some accept TIS-620.
 * If the input is pure ASCII, we still emit ASCII bytes for max compatibility.
 */
let cachedTis620Encoder: ((input: string) => Buffer) | null = null

function getTis620Encoder(): ((input: string) => Buffer) | null {
  if (cachedTis620Encoder) return cachedTis620Encoder
  try {
    // Build a manual TIS-620 mapper. TIS-620 / ISO-8859-11 maps the
    // Thai Unicode block 0x0E01-0x0E5B to bytes 0xA1-0xDA. This is the
    // encoding most Thai ESC/POS thermal printers expect by default.
    cachedTis620Encoder = (s: string): Buffer => {
      const out = Buffer.allocUnsafe(s.length)
      for (let i = 0; i < s.length; i++) {
        const code = s.charCodeAt(i)
        if (code < 0x80) {
          out[i] = code
        } else if (code >= 0x0E01 && code <= 0x0E5B) {
          // Thai Unicode → TIS-620 byte
          out[i] = code - 0x0E01 + 0xA1
        } else {
          // Non-Thai (Lao, Chinese, emoji) — replace with `?`
          out[i] = 0x3F
        }
      }
      return out
    }
    return cachedTis620Encoder
  } catch {
    return null
  }
}

export function textToBytes(text: string): Buffer {
  const enc = getTis620Encoder()
  if (enc) return enc(text)
  // Fallback: Latin-1 with non-ASCII replaced (will look like `?` on Thai
  // printers without auto-detect, but won't crash the print job)
  return Buffer.from(text.replace(/[^\x00-\x7F]/g, '?'), 'latin1')
}

/**
 * Pad text to width with spaces. We pad using ASCII spaces — even
 * for Thai/Lao text — because ESC/POS printers advance the cursor on
 * a per-byte basis, so visible width approximates byte width for the
 * Thai/Lao scripts we print.
 */
export function padText(text: string, width: number, align: 'left' | 'center' | 'right' = 'left'): string {
  // For East-Asian/Thai/Lao text we approximate width = char count.
  // The final bytes are produced by textToBytes, which keeps Thai bytes
  // proportional to source length (1 Thai char → 1 byte in TIS-620).
  const displayWidth = text.length
  if (align === 'left') {
    return text + ' '.repeat(Math.max(0, width - displayWidth))
  }
  if (align === 'right') {
    return ' '.repeat(Math.max(0, width - displayWidth)) + text
  }
  const leftPad = Math.max(0, Math.floor((width - displayWidth) / 2))
  const rightPad = Math.max(0, width - displayWidth - leftPad)
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad)
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