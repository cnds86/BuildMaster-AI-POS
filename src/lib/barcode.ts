/**
 * Barcode Scanner Integration
 * Handles keyboard-wedge barcode scanners (most USB/Bluetooth scanners work this way)
 * 
 * Detection strategy:
 * 1. Rapid keystrokes (< 50ms between characters)
 * 2. Ends with Enter key
 * 3. Length > 3 characters (typical barcode)
 */

export interface BarcodeConfig {
  minKeyInterval: number   // Max ms between keystrokes to be considered scanner (default: 50)
  minLength: number         // Minimum barcode length (default: 4)
  maxLength: number         // Maximum barcode length (default: 30)
  prefix?: string           // Optional prefix to detect (e.g., '69' for some barcodes)
  suffixKeys?: number[]    // Keys that terminate barcode (default: [13] = Enter)
}

export interface BarcodeResult {
  barcode: string
  timestamp: number
  source: 'scanner' | 'keyboard'  // Whether it came from scanner or manual keyboard
}

const DEFAULT_CONFIG: BarcodeConfig = {
  minKeyInterval: 50,   // 50ms between keystrokes = scanner
  minLength: 4,
  maxLength: 30,
  suffixKeys: [13],    // Enter key
}

/**
 * BarcodeDetector — Global singleton for barcode scanning
 */
class BarcodeDetector {
  private buffer: string = ''
  private lastKeyTime: number = 0
  private config: BarcodeConfig
  private listeners: Set<(result: BarcodeResult) => void> = new Set()
  private enabled: boolean = false

  constructor(config: Partial<BarcodeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Start listening for barcode input
   */
  enable(): void {
    if (this.enabled) return
    this.enabled = true
    this.buffer = ''
    window.addEventListener('keydown', this.handleKeyDown)
    console.log('[BarcodeDetector] Enabled')
  }

  /**
   * Stop listening
   */
  disable(): void {
    this.enabled = false
    this.buffer = ''
    window.removeEventListener('keydown', this.handleKeyDown)
    console.log('[BarcodeDetector] Disabled')
  }

  /**
   * Subscribe to barcode events
   */
  onBarcode(callback: (result: BarcodeResult) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Check if currently enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled) return

    const now = Date.now()
    const timeSinceLastKey = now - this.lastKeyTime

    // Check if this is a suffix key (Enter, Tab, etc.)
    if (this.config.suffixKeys?.includes(event.keyCode)) {
      if (this.buffer.length >= this.config.minLength && this.buffer.length <= this.config.maxLength) {
        // Valid barcode detected
        const result: BarcodeResult = {
          barcode: this.buffer,
          timestamp: now,
          source: timeSinceLastKey < this.config.minKeyInterval ? 'scanner' : 'keyboard',
        }
        this.notifyListeners(result)
      }
      this.buffer = ''
      this.lastKeyTime = 0
      return
    }

    // Check timing — rapid keystrokes indicate scanner
    if (timeSinceLastKey > this.config.minKeyInterval && this.buffer.length > 0) {
      // Too slow — clear buffer (manual keyboard typing)
      this.buffer = ''
    }

    // Only accept printable characters
    if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      this.buffer += event.key
      this.lastKeyTime = now

      // Safety: clear buffer if it gets too long
      if (this.buffer.length > this.config.maxLength) {
        this.buffer = ''
      }
    }
  }

  private notifyListeners(result: BarcodeResult): void {
    this.listeners.forEach(cb => {
      try {
        cb(result)
      } catch (err) {
        console.error('[BarcodeDetector] Listener error:', err)
      }
    })
  }
}

// ─── Global singleton ───────────────────────────────────────────────────────

let detector: BarcodeDetector | null = null

/**
 * Get or create the global barcode detector
 */
export function getBarcodeDetector(config?: Partial<BarcodeConfig>): BarcodeDetector {
  if (!detector) {
    detector = new BarcodeDetector(config)
  }
  return detector
}

/**
 * Quick barcode lookup from product list
 * Returns product matching barcode, or null
 */
export function findProductByBarcode<T extends { barcode?: string; code?: string }>(
  barcode: string,
  products: T[]
): T | null {
  return products.find(p => p.barcode === barcode || p.code === barcode) || null
}

/**
 * Validate barcode format
 * Returns true if barcode looks valid
 */
export function isValidBarcode(barcode: string): boolean {
  if (!barcode || barcode.length < 4 || barcode.length > 30) return false
  
  // Most barcode formats are numeric or alphanumeric
  // Allow common patterns: pure numbers, EAN-13, UPC-A, Code 128, etc.
  const validPattern = /^[0-9A-Za-z-]+$/
  return validPattern.test(barcode)
}

// Export class for direct use
export { BarcodeDetector }
export type { BarcodeConfig, BarcodeResult }