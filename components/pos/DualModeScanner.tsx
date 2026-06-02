import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, ScanBarcode, Usb, AlertTriangle, CheckCircle } from 'lucide-react';

// Declare native BarcodeDetector for TypeScript
declare var BarcodeDetector: any;

interface DualModeScannerProps {
  onScan: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
  /** Show USB HID mode indicator */
  showHidStatus?: boolean;
}

export const DualModeScanner: React.FC<DualModeScannerProps> = ({
  onScan,
  isOpen,
  onClose,
  showHidStatus = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'hid'>('hid');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [hidConnected, setHidConnected] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [showCameraOverlay, setShowCameraOverlay] = useState(false);

  const scanIntervalRef = useRef<number | null>(null);
  const lastKeyTimeRef = useRef<number>(0);
  const bufferRef = useRef<string>('');

  // ── USB HID Scanner Detection ───────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    let hidBufferTimeout: number | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // USB scanners send keys < 50ms apart
      if (timeDiff > 50 && bufferRef.current.length > 0) {
        // Manual typing - clear buffer
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        if (code.length >= 4) {
          setLastScan(code);
          setHidConnected(true);
          onScan(code);
        }
        bufferRef.current = '';
        return;
      }

      // Only capture printable characters
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Monitor for HID scanner by checking if buffer keeps filling
    const monitorHid = setInterval(() => {
      if (bufferRef.current.length >= 4) {
        setHidConnected(true);
      }
    }, 1000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (hidBufferTimeout) clearTimeout(hidBufferTimeout);
      clearInterval(monitorHid);
    };
  }, [isOpen, onScan]);

  // ── Camera Scanner ────────────────────────────────────────
  const startCamera = async () => {
    setShowCameraOverlay(true);
    setScanMode('camera');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);

        if ('BarcodeDetector' in window) {
          startDetection();
        } else {
          setIsSupported(false);
        }
      }
    } catch (err: any) {
      console.error('Camera Error:', err);
      setHasPermission(false);
      setError(err.message || 'Camera access denied');
    }
  };

  const startDetection = () => {
    if (!('BarcodeDetector' in window) || !videoRef.current) return;

    const barcodeDetector = new BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'code_93', 'codabar'],
    });

    const detect = async () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            setLastScan(code);
            onScan(code);
            stopCamera();
            onClose();
          }
        } catch {
          // Ignore detection errors
        }
      }
    };

    scanIntervalRef.current = window.setInterval(detect, 200);
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setShowCameraOverlay(false);
    setScanMode('hid');
  };

  // ── Cleanup on close ─────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Camera Scanner Overlay ────────────────────────────────
  if (showCameraOverlay) {
    return (
      <div className="fixed inset-0 bg-black z-[60] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-black/50 absolute top-0 left-0 right-0 z-10 text-white backdrop-blur-sm">
          <h3 className="font-bold text-lg flex items-center">
            <Camera className="w-5 h-5 mr-2" /> Camera Scanner
          </h3>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {hasPermission === false ? (
            <div className="text-white text-center p-6 max-w-xs">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-lg mb-2 font-bold">Camera Access Denied</p>
              <p className="text-sm text-slate-400 mb-4">{error}</p>
              <button
                onClick={() => { stopCamera(); onClose(); }}
                className="px-4 py-2 bg-white text-black rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Scan Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-72 h-48 border-2 border-white/50 rounded-xl relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1 rounded-br-lg" />

                  {/* Scanning Line */}
                  <div className="w-full h-0.5 bg-red-500 absolute animate-scan shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                </div>

                <p className="text-white mt-8 text-sm bg-black/60 px-4 py-2 rounded-full backdrop-blur-md font-medium tracking-wide">
                  Align code within frame
                </p>

                {!isSupported && (
                  <div className="mt-4 flex items-center text-orange-300 bg-orange-900/50 px-3 py-1.5 rounded-lg border border-orange-500/30">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    <span className="text-xs">Native scanning not supported by this browser.</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Scanner Mode Selection ───────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg flex items-center">
            <ScanBarcode className="w-5 h-5 mr-2 text-primary-600" />
            Barcode Scanner
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* USB HID Status */}
          <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
            hidConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                hidConnected ? 'bg-green-100' : 'bg-gray-200'
              }`}>
                <Usb className={`w-5 h-5 ${hidConnected ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">USB HID Scanner</p>
                <p className="text-sm text-gray-500">
                  {hidConnected ? 'Connected - Ready to scan' : 'Waiting for input...'}
                </p>
              </div>
            </div>
            {hidConnected && (
              <CheckCircle className="w-6 h-6 text-green-500" />
            )}
          </div>

          {/* Last Scan */}
          {lastScan && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">Last Scan</p>
              <p className="text-lg font-mono font-bold text-blue-900">{lastScan}</p>
            </div>
          )}

          {/* Camera Scanner Button */}
          <button
            onClick={startCamera}
            className="w-full flex items-center justify-center p-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Camera className="w-5 h-5 mr-2" />
            <span className="font-medium">Use Camera Scanner</span>
          </button>

          {/* Instructions */}
          <div className="text-center text-sm text-gray-500 space-y-1">
            <p>• USB scanner: Connect and scan automatically</p>
            <p>• Camera: Tap button above to activate</p>
            <p>• Supports EAN, UPC, Code 128, QR Code</p>
          </div>
        </div>
      </div>
    </div>
  );
};
