
import React, { useRef, useState } from 'react';
import { SystemSettings, BankAccount, Branch, PosMachine } from '../../types';
import { LayoutList, ImageIcon, Upload, Trash2, Landmark, PlusCircle } from 'lucide-react';
import { ReceiptPreview } from './ReceiptPreview';
import { processAndResizeImage } from '../../lib/utils';

interface ReceiptSettingsProps {
  formData: SystemSettings;
  setFormData: React.Dispatch<React.SetStateAction<SystemSettings>>;
  branches: Branch[];
  posMachines: PosMachine[];
}

export const ReceiptSettings: React.FC<ReceiptSettingsProps> = ({ formData, setFormData, branches, posMachines }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [newBank, setNewBank] = useState<BankAccount>({ id: '', bankName: '', accountName: '', accountNumber: '' });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'receiptLogoUrl' | 'receiptQrCodeUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG).');
      return;
    }

    try {
      // Resize to max 300px width for receipts
      const resizedBase64 = await processAndResizeImage(file, 300, 0.8);
      setFormData(prev => ({ ...prev, [field]: resizedBase64 }));
    } catch (error) {
      console.error("Image upload failed", error);
      alert("Failed to process image. Please try another file.");
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = (field: 'receiptLogoUrl' | 'receiptQrCodeUrl') => {
    setFormData(prev => ({ ...prev, [field]: '' }));
    if (field === 'receiptLogoUrl' && logoInputRef.current) logoInputRef.current.value = '';
    if (field === 'receiptQrCodeUrl' && qrInputRef.current) qrInputRef.current.value = '';
  };

  const handleAddBank = () => {
    if (!newBank.bankName || !newBank.accountNumber) {
      alert('Please fill in Bank Name and Account Number');
      return;
    }
    const bankEntry: BankAccount = { ...newBank, id: `ba-${Date.now()}` };
    setFormData(prev => ({ ...prev, bankAccounts: [...prev.bankAccounts, bankEntry] }));
    setNewBank({ id: '', bankName: '', accountName: '', accountNumber: '' });
  };

  const handleRemoveBank = (id: string) => {
    setFormData(prev => ({ ...prev, bankAccounts: prev.bankAccounts.filter(b => b.id !== id) }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Receipt & Print Settings</h3>
      <div className="flex flex-col xl:flex-row gap-8">
         <div className="flex-1 space-y-8">
            
            {/* Layout & Format Section */}
            <section className="space-y-4">
               <h4 className="font-bold text-slate-700 flex items-center text-sm uppercase tracking-wide">
                  <LayoutList className="w-4 h-4 mr-2" /> Layout & Format
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Paper Size</label>
                     <select value={formData.receiptPaperSize} onChange={e => setFormData({ ...formData, receiptPaperSize: e.target.value as any })} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                        <option value="58mm">Thermal 58mm (Small)</option>
                        <option value="80mm">Thermal 80mm (Standard)</option>
                        <option value="A4">A4 (Full Page)</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Print Copies</label>
                     <input type="number" min="1" max="5" value={formData.receiptCopies || 1} onChange={e => setFormData({ ...formData, receiptCopies: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                  </div>
               </div>
               <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <input type="checkbox" id="autoPrint" checked={formData.receiptAutoPrint} onChange={e => setFormData({ ...formData, receiptAutoPrint: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
                  <label htmlFor="autoPrint" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                     Automatically print receipt after sale completion
                  </label>
               </div>
            </section>

            {/* Content & Branding Section */}
            <section className="space-y-4">
               <h4 className="font-bold text-slate-700 flex items-center text-sm uppercase tracking-wide">
                  <ImageIcon className="w-4 h-4 mr-2" /> Content & Branding
               </h4>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Receipt Logo</label>
                    <div className="flex items-center space-x-4">
                      {formData.receiptLogoUrl ? (
                        <div className="relative w-16 h-16 border rounded-lg overflow-hidden bg-slate-50">
                           <img src={formData.receiptLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                           <button type="button" onClick={() => handleRemoveImage('receiptLogoUrl')} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg hover:bg-red-600"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => logoInputRef.current?.click()}
                          className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-400"
                        >
                          <Upload className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1">
                         <button type="button" onClick={() => logoInputRef.current?.click()} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Upload Image</button>
                         <p className="text-xs text-slate-400">Auto-resized to fit receipt width</p>
                         <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'receiptLogoUrl')} />
                      </div>
                    </div>
                  </div>

                  {/* QR Code Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Payment QR Code</label>
                    <div className="flex items-center space-x-4">
                      {formData.receiptQrCodeUrl ? (
                        <div className="relative w-16 h-16 border rounded-lg overflow-hidden bg-slate-50">
                           <img src={formData.receiptQrCodeUrl} alt="QR" className="w-full h-full object-contain" />
                           <button type="button" onClick={() => handleRemoveImage('receiptQrCodeUrl')} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg hover:bg-red-600"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => qrInputRef.current?.click()}
                          className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-400"
                        >
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Payment_Sample`} alt="QR Placeholder" className="w-10 h-10 opacity-20" />
                        </div>
                      )}
                      <div className="flex-1">
                         <button type="button" onClick={() => qrInputRef.current?.click()} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Upload QR</button>
                         <p className="text-xs text-slate-400">Printed at footer</p>
                         <input type="file" ref={qrInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'receiptQrCodeUrl')} />
                      </div>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Header Message</label>
                    <input type="text" value={formData.receiptHeader} onChange={e => setFormData({ ...formData, receiptHeader: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Footer Message</label>
                    <input type="text" value={formData.receiptFooter} onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                  </div>
               </div>

               <div className="flex gap-4 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                     <input type="checkbox" checked={formData.receiptShowTaxId} onChange={e => setFormData({ ...formData, receiptShowTaxId: e.target.checked })} className="rounded text-primary-600" />
                     <span className="text-sm text-slate-700">Show Tax ID</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                     <input type="checkbox" checked={formData.receiptShowCashier} onChange={e => setFormData({ ...formData, receiptShowCashier: e.target.checked })} className="rounded text-primary-600" />
                     <span className="text-sm text-slate-700">Show Cashier Name</span>
                  </label>
               </div>
            </section>

            {/* Payment & Bank Details */}
            <section className="space-y-4">
               <h4 className="font-bold text-slate-700 flex items-center text-sm uppercase tracking-wide">
                  <Landmark className="w-4 h-4 mr-2" /> Payment & Bank Details
               </h4>
               
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                     <label className="text-sm font-medium text-slate-700">Show Bank Info on Receipt</label>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.showBankInfoOnReceipt} onChange={e => setFormData({ ...formData, showBankInfoOnReceipt: e.target.checked })} />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                     </label>
                  </div>
                  
                  {formData.showBankInfoOnReceipt && (
                     <div className="space-y-4 animate-fade-in">
                        {/* Existing Bank Accounts List */}
                        {formData.bankAccounts && formData.bankAccounts.length > 0 && (
                           <div className="space-y-2">
                              {formData.bankAccounts.map((bank) => (
                                 <div key={bank.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <div className="text-sm">
                                       <p className="font-bold text-slate-800">{bank.bankName}</p>
                                       <p className="text-slate-600 font-mono text-xs">{bank.accountNumber}</p>
                                       <p className="text-slate-500 text-xs">{bank.accountName}</p>
                                    </div>
                                    <button 
                                       type="button" 
                                       onClick={() => handleRemoveBank(bank.id)}
                                       className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                              ))}
                           </div>
                        )}

                        {/* Add New Bank Form */}
                        <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                           <p className="text-xs font-bold text-blue-800 mb-2 uppercase">Add New Bank Account</p>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <input 
                                 type="text" 
                                 value={newBank.bankName} 
                                 onChange={e => setNewBank({ ...newBank, bankName: e.target.value })} 
                                 className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" 
                                 placeholder="Bank Name (e.g. KBank)" 
                              />
                              <input 
                                 type="text" 
                                 value={newBank.accountNumber} 
                                 onChange={e => setNewBank({ ...newBank, accountNumber: e.target.value })} 
                                 className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" 
                                 placeholder="Account Number" 
                              />
                              <input 
                                 type="text" 
                                 value={newBank.accountName} 
                                 onChange={e => setNewBank({ ...newBank, accountName: e.target.value })} 
                                 className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" 
                                 placeholder="Account Name" 
                              />
                           </div>
                           <button 
                              type="button" 
                              onClick={handleAddBank}
                              className="mt-2 w-full flex items-center justify-center py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
                           >
                              <PlusCircle className="w-4 h-4 mr-2" /> Add Bank Account
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </section>
         </div>

         {/* Live Preview Pane */}
         <div className="w-full xl:w-[360px] shrink-0">
            <div className="sticky top-6">
               <h4 className="font-bold text-slate-500 mb-3 text-sm text-center">Live Preview</h4>
               <ReceiptPreview 
                  settings={formData} 
                  branches={branches} 
                  posMachines={posMachines} 
               />
            </div>
         </div>
      </div>
    </div>
  );
};
