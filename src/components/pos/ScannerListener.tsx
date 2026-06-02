/**
 * ScannerListener — Global keyboard listener for barcode scanners
 * 
 * Usage:
 * <ScannerListener onScan={handleBarcode} />
 * 
 * Works with any keyboard-wedge barcode scanner (USB or Bluetooth)
 * Scanner acts as keyboard input — no special driver needed
 */

import React, { useEffect, useCallback } from 'react'
import { getBarcodeDetector, type BarcodeResult } from '../../lib/barcode'

interface ScannerListenerProps {
  onScan: (barcode: string, source: BarcodeResult['source']) => void
  enabled?: boolean
  minLength?: number
  className?: string
}

/**
 * Hook to use barcode detection in any component
 */
export function useBarcodeScanner(
  onScan: (barcode: string, source: BarcodeResult['source']) => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return

    const detector = getBarcodeDetector()
    detector.enable()

    const unsubscribe = detector.onBarcode((result) => {
      onScan(result.barcode, result.source)
    })

    return () => {
      detector.disable()
      unsubscribe()
    }
  }, [enabled, onScan])
}

/**
 * ScannerListener component — Place in your app root to enable global scanning
 * 
 * Features:
 * - Detects keyboard-wedge barcode scanners automatically
 * - Distinguishes between scanner input and manual keyboard typing
 * - Supports Enter-key termination (most scanners)
 * - Configurable minimum barcode length
 */
export const ScannerListener: React.FC<ScannerListenerProps> = ({
  onScan,
  enabled = true,
  minLength = 4,
  className,
}) => {
  const handleScan = useCallback((barcode: string, source: BarcodeResult['source']) => {
    if (barcode.length >= minLength) {
      onScan(barcode, source)
    }
  }, [onScan, minLength])

  useBarcodeScanner(handleScan, enabled)

  // This component doesn't render anything visible
  // It's a pure logic component
  return null
}

/**
 * Demo component to test barcode scanning
 * Shows a notification when a barcode is scanned
 */
export const BarcodeDemo: React.FC = {
  // Placeholder for demo — actual implementation would show a toast/notification
} as unknown as React.FC<{ onScan?: (barcode: string) => void }>

export default ScannerListener