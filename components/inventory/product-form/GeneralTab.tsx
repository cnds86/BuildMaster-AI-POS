
import React, { useState, useRef, useEffect } from 'react';
import { Product, CategoryItem, UnitDefinition } from '../../../types';
import { ImageIcon, Camera, X, RefreshCw, Sparkles } from 'lucide-react';
import { processAndResizeImage } from '../../../lib/utils';

interface GeneralTabProps {
  formData: Partial<Product>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  categoryOptions: { id: string; name: string; level: number }[];
  units: UnitDefinition[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyzeImage?: () => void;
  isAiAnalyzing?: boolean;
  errors?: Record<string, string>;
  submitAttempted?: boolean;
}

const inputBase = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500";
const errorClass = "border-red-500 bg-red-50";
const normalClass = "border-slate-300";

const FieldError = ({ show, msg }: { show: boolean; msg?: string }) => {
  if (!show || !msg) return null;
  return <p className="text-xs text-red-600 mt-1 font-medium" data-testid="field-error">⚠ {msg}</p>;
};

export const GeneralTab: React.FC<GeneralTabProps> = ({
  formData, setFormData, handleInputChange, categoryOptions, units, fileInputRef, onAnalyzeImage, isAiAnalyzing, errors = {}, submitAttempted = false
}) => {
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- File Upload Handler (Using Shared Utility) ---
  const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Resize to 800px width, 80% quality
      const resizedImage = await processAndResizeImage(file, 800, 0.8);
      setFormData(prev => ({ ...prev, imageUrl: resizedImage }));
    } catch (error) {
      console.error("Image resize failed", error);
      alert("Failed to process image.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Camera Functions ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setIsProcessing(true);
        stopCamera(); 
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              // Resize captured blob
              const resizedImage = await processAndResizeImage(blob, 800, 0.8);
              setFormData(prev => ({ ...prev, imageUrl: resizedImage }));
            } catch (e) {
              alert("Failed to process captured photo.");
            } finally {
              setIsProcessing(false);
            }
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
       
       {/* Camera Modal Overlay */}
       {isCameraOpen && (
         <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            <div className="relative flex-1 bg-black flex items-center justify-center">
               <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
               <button 
                 type="button" 
                 onClick={stopCamera} 
                 className="absolute top-4 right-4 p-3 bg-white/20 text-white rounded-full backdrop-blur-md z-10"
               >
                 <X className="w-6 h-6" />
               </button>
            </div>
            <div className="p-6 bg-black flex justify-center pb-10">
               <button 
                 type="button" 
                 onClick={capturePhoto} 
                 className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 active:scale-95 transition-transform shadow-lg flex items-center justify-center"
               >
                 <div className="w-16 h-16 bg-white rounded-full border-2 border-black"></div>
               </button>
            </div>
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 flex flex-col items-center">
             <label className="block text-sm font-medium text-slate-700 mb-2">Product Image</label>
             <div className="flex flex-col sm:flex-row gap-4 items-end">
               <div className="relative group w-40 h-40 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm">
                  {isProcessing ? (
                    <div className="flex flex-col items-center text-slate-400">
                       <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                       <span className="text-xs">Processing...</span>
                    </div>
                  ) : formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Product" />
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({...prev, imageUrl: ''}))}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                       <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                       <span className="text-xs font-medium">No Image</span>
                    </div>
                  )}
               </div>

               <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <button 
                    type="button"
                    onClick={startCamera}
                    className="flex items-center justify-center px-4 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors shadow-sm"
                  >
                    <Camera className="w-4 h-4 mr-2" /> Take Photo
                  </button>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" /> Upload File
                  </button>
                  {/* AI Analyze Button */}
                  {onAnalyzeImage && formData.imageUrl && (
                     <button
                        type="button"
                        onClick={onAnalyzeImage}
                        disabled={isAiAnalyzing}
                        className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all"
                     >
                        {isAiAnalyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {isAiAnalyzing ? 'Analyzing...' : 'AI Auto-Fill'}
                     </button>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleLocalImageUpload} 
                  />
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] leading-tight">
                    Take a photo to enable AI Auto-Fill details.
                  </p>
               </div>
             </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className={`${inputBase} ${errors.name && submitAttempted ? errorClass : normalClass}`} />
            <FieldError show={submitAttempted} msg={errors.name} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
            <select name="category" required value={formData.category} onChange={handleInputChange} className={`${inputBase} bg-white ${errors.category && submitAttempted ? errorClass : normalClass}`}>
               <option value="">Select</option>
               {categoryOptions.map(cat => <option key={cat.id} value={cat.id}>{'\u00A0'.repeat(cat.level * 3)}{cat.name}</option>)}
            </select>
            <FieldError show={submitAttempted} msg={errors.category} />
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label><input type="text" name="sku" value={formData.sku} onChange={handleInputChange} className={`${inputBase} font-mono ${errors.sku && submitAttempted ? errorClass : normalClass}`} /><FieldError show={submitAttempted} msg={errors.sku} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Barcode</label><input type="text" name="barcode" value={formData.barcode} onChange={handleInputChange} className={`${inputBase} font-mono`} /></div>

          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-sm font-medium text-slate-700 mb-1">Stock *</label><input type="number" name="stock" min="0" value={formData.stock} onChange={handleInputChange} className={`${inputBase} ${errors.stock && submitAttempted ? errorClass : normalClass}`} /><FieldError show={submitAttempted} msg={errors.stock} /></div>
             <div><label className="block text-sm font-medium text-slate-700 mb-1">Min. Order Qty</label><input type="number" name="minOrderQuantity" min="1" value={formData.minOrderQuantity || 1} onChange={handleInputChange} className={`${inputBase}`} placeholder="1" /></div>
          </div>

          <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit *</label><select name="unit" required value={formData.unit} onChange={handleInputChange} className={`${inputBase} bg-white ${errors.unit && submitAttempted ? errorClass : normalClass}`}><option value="">Select</option>{units.map(u => <option key={u.id} value={u.symbol}>{u.name} ({u.symbol})</option>)}</select><FieldError show={submitAttempted} msg={errors.unit} /></div>
       </div>
    </div>
  );
};
