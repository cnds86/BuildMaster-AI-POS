
import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet } from 'lucide-react';
import { Product } from '../../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (products: Partial<Product>[], action: 'Create' | 'Update') => void;
  currencySymbol: string;
  formatPrice: (val: number) => string;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, formatPrice }) => {
  const [preview, setPreview] = useState<any[]>([]);
  const [stats, setStats] = useState({ new: 0, update: 0, error: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n');
      const parsed: any[] = [];
      let newCount = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!row) continue;
        
        parsed.push({
          id: row[0]?.replace(/"/g, ''),
          name: row[1]?.replace(/"/g, ''),
          category: row[2]?.replace(/"/g, ''),
          price: parseFloat(row[3]) || 0,
          stock: parseFloat(row[5]) || 0,
          sku: row[8]?.replace(/"/g, ''),
          action: 'Create' 
        });
        newCount++;
      }
      setPreview(parsed);
      setStats({ new: newCount, update: 0, error: 0 });
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
         <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center"><FileSpreadsheet className="w-5 h-5 mr-2 text-slate-500" /> Import CSV</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-6">
            {!preview.length ? (
               <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                  <Upload className="w-12 h-12 text-slate-400 mb-2" />
                  <p className="text-slate-600 font-medium">Click to Upload CSV</p>
                  <input type="file" ref={fileRef} className="hidden" accept=".csv" onChange={handleFile} />
               </div>
            ) : (
               <>
                  <div className="flex justify-between items-center mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                     <div className="text-blue-900"><span className="block font-bold text-lg">Result</span><span className="text-sm">Found {preview.length} rows</span></div>
                     <div className="text-center"><span className="block font-bold text-green-600 text-lg">{stats.new}</span><span className="text-slate-500 text-xs">Items</span></div>
                  </div>
                  <div className="overflow-x-auto border rounded-lg">
                     <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100"><tr><th className="p-2">Name</th><th className="p-2">SKU</th><th className="p-2">Price</th><th className="p-2">Stock</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                           {preview.slice(0, 5).map((r, i) => (
                              <tr key={i}><td className="p-2">{r.name}</td><td className="p-2">{r.sku}</td><td className="p-2">{formatPrice(r.price)}</td><td className="p-2">{r.stock}</td></tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </>
            )}
         </div>

         <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">Cancel</button>
            <button onClick={() => { onImport(preview, 'Create'); onClose(); }} disabled={!preview.length} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50">Confirm Import</button>
         </div>
      </div>
    </div>
  );
};
