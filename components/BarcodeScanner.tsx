import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw, Zap } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  isOpen: boolean;
  dummyCodes?: string[]; // List of codes to randomly pick from for simulation
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose, isOpen, dummyCodes = [] }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen) {
      startCamera();
    }

    async function startCamera() {
      try {
        setScanning(true);
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Camera Error:", err);
        setHasPermission(false);
        setError("Could not access camera. Please ensure you have granted permissions.");
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setScanning(false);
    };
  }, [isOpen]);

  // Simulation Logic: Mock scanning a random code after a click
  const handleSimulateScan = () => {
    if (dummyCodes.length > 0) {
      const randomCode = dummyCodes[Math.floor(Math.random() * dummyCodes.length)];
      // Visual feedback
      const overlay = document.getElementById('scan-overlay');
      if (overlay) {
        overlay.classList.add('bg-green-500/30');
        setTimeout(() => {
          overlay.classList.remove('bg-green-500/30');
          onScan(randomCode);
          onClose(); // Close after success
        }, 300);
      }
    } else {
        // Fallback generic code
        onScan("885000001");
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 absolute top-0 left-0 right-0 z-10 text-white">
        <h3 className="font-bold text-lg flex items-center">
          <Camera className="w-5 h-5 mr-2" /> Scan Barcode
        </h3>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden" onClick={handleSimulateScan}>
        {hasPermission === false ? (
          <div className="text-white text-center p-6">
            <Zap className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <p className="text-lg mb-2">Camera Access Denied</p>
            <p className="text-sm text-slate-400">{error}</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover opacity-80"
            />
            {/* Scan Overlay UI */}
            <div id="scan-overlay" className="absolute inset-0 flex flex-col items-center justify-center transition-colors duration-200">
               <div className="w-64 h-48 border-2 border-white/50 rounded-lg relative flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1"></div>
                  
                  {/* Scanning Line */}
                  <div className="w-full h-0.5 bg-red-500 absolute animate-scan"></div>
               </div>
               <p className="text-white mt-8 text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                  Align barcode within frame
               </p>
               <p className="text-xs text-white/50 mt-2 animate-pulse">
                  (Tap screen to simulate scan)
               </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
