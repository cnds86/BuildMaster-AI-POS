/**
 * Print API — Frontend service for ESC/POS printing
 */

const baseUrl = import.meta.env.BASE_URL || '/'

/**
 * Get print service status
 */
export async function getPrintStatus() {
  const res = await fetch(`${baseUrl}api/print/status`)
  return res.json()
}

/**
 * Print a receipt via ESC/POS
 */
export async function printReceipt(receiptData: {
  shopName: string
  shopAddress?: string
  shopPhone?: string
  orderNo: string
  orderDate: string
  cashier: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  subtotal: number
  tax?: number
  total: number
  paymentMethod: string
  customerName?: string
  customerPhone?: string
  footerMessage?: string
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const res = await fetch(`${baseUrl}api/print/receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(receiptData),
  })
  
  // If printer not enabled, backend returns raw bytes as binary
  // We can detect this and offer download instead
  if (res.status === 200 && res.headers.get('content-type')?.includes('octet-stream')) {
    const blob = await res.blob()
    const filename = `receipt-${receiptData.orderNo}-${Date.now()}.bin`
    
    // Offer download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    
    return { success: true, jobId: filename }
  }
  
  return res.json()
}

/**
 * Test print — sends test page to printer
 */
export async function testPrint(): Promise<{ success: boolean; jobId?: string; error?: string }> {
  const res = await fetch(`${baseUrl}api/print/test`, { method: 'POST' })
  
  if (res.status === 200 && res.headers.get('content-type')?.includes('octet-stream')) {
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-receipt-${Date.now()}.bin`
    a.click()
    URL.revokeObjectURL(url)
    return { success: true }
  }
  
  return res.json()
}

/**
 * Convert Sale object to ReceiptData format
 */
export function saleToReceiptData(sale: any, settings?: any): any {
  return {
    shopName: settings?.companyName || 'MAHAXAY',
    shopAddress: settings?.address,
    shopPhone: settings?.phone,
    orderNo: sale.id?.slice(-8) || `SALE-${Date.now()}`,
    orderDate: new Date(sale.date).toLocaleString('th-TH'),
    cashier: sale.userName || 'Cashier',
    items: sale.items?.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.sellPrice,
      totalPrice: item.quantity * item.sellPrice,
    })) || [],
    subtotal: sale.subtotal || sale.total,
    tax: sale.taxAmount,
    total: sale.total,
    paymentMethod: sale.paymentMethod?.toUpperCase() || 'CASH',
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    footerMessage: 'ขอบคุณที่ใช้บริการ',
  }
}