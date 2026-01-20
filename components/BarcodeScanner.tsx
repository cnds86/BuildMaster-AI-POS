
import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Zap, AlertTriangle } from 'lucide-react';

// Declare native BarcodeDetector for TypeScript
declare var BarcodeDetector: any;

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Scan Interval Ref
  const scanInterval = useRef<any>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen) {
      // Check if browser supports native barcode detection
      if (!('BarcodeDetector' in window)) {
        console.warn("BarcodeDetector API not supported in this browser.");
        setIsSupported(false);
      }

      startCamera();
    }

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          
          // Start detection loop if supported
          if ('BarcodeDetector' in window) {
             const barcodeDetector = new BarcodeDetector({ 
               formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] 
             });

             const detect = async () => {
                if (videoRef.current && videoRef.current.readyState === 4) { // HAVE_ENOUGH_DATA
                   try {
                      const barcodes = await barcodeDetector.detect(videoRef.current);
                      if (barcodes.length > 0) {
                         const code = barcodes[0].rawValue;
                         onScan(code);
                         stopScanner(); // Stop after successful scan
                      }
                   } catch (err) {
                      // Detection error, ignore frame
                   }
                }
             };
             
             // Check every 200ms
             scanInterval.current = setInterval(detect, 200);
          }
        }
      } catch (err) {
        console.error("Camera Error:", err);
        setHasPermission(false);
        setError("Could not access camera. Please ensure permissions are granted and you are on HTTPS.");
      }
    }

    function stopScanner() {
       if (scanInterval.current) clearInterval(scanInterval.current);
       if (stream) stream.getTracks().forEach(track => track.stop());
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 absolute top-0 left-0 right-0 z-10 text-white backdrop-blur-sm">
        <h3 className="font-bold text-lg flex items-center">
          <Camera className="w-5 h-5 mr-2" /> Scanner
        </h3>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {hasPermission === false ? (
          <div className="text-white text-center p-6 max-w-xs">
            <Zap className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <p className="text-lg mb-2 font-bold">Camera Access Denied</p>
            <p className="text-sm text-slate-400 mb-4">{error}</p>
            <button onClick={onClose} className="px-4 py-2 bg-white text-black rounded-lg font-bold">Close</button>
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
            
            {/* Scan Overlay UI */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <div className="w-72 h-48 border-2 border-white/50 rounded-xl relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1 rounded-br-lg"></div>
                  
                  {/* Scanning Line */}
                  <div className="w-full h-0.5 bg-red-500 absolute animate-scan shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
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
};
