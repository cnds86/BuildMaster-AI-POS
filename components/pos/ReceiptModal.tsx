import React, { useState, useEffect } from 'react';
import { Sale, SystemSettings } from '../../types';
import { CheckCircle, X, Printer, Plus, Loader2 } from 'lucide-react';
import { PrintableReceipt } from '../shared/PrintableReceipt';
import { usePrint } from '../../lib/usePrint';
import { printReceipt, saleToReceiptData, getPrintStatus } from '../../lib/printApi';
import { IframePrintWarning } from '../shared/IframePrintWarning';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings?: SystemSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, sale, settings }) => {
  const { showIframeWarning, setShowIframeWarning, handlePrint: handleBrowserPrint } = usePrint();
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  // Auto-detect thermal printer — fetch on mount, default false (browser print)
  const [printerEnabled, setPrinterEnabled] = useState<boolean>(false);
  const [printerChecked, setPrinterChecked] = useState<boolean>(false);

  // Check if thermal printer is configured on the server
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const status = await getPrintStatus();
        if (!cancelled) {
          setPrinterEnabled(status?.enabled === true);
        }
      } catch {
        if (!cancelled) setPrinterEnabled(false);
      } finally {
        if (!cancelled) setPrinterChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  // ESC/POS Print — sends to network thermal printer
  const handleEscPosPrint = async () => {
    if (!sale) return

    setIsPrinting(true)
    setPrintError(null)

    try {
      const receiptData = saleToReceiptData(sale, settings)
      const result = await printReceipt(receiptData)

      if (result.success) {
        console.log('[ReceiptModal] Receipt printed:', result.jobId)
      } else {
        setPrintError(result.error || 'Print failed')
      }
    } catch (err: any) {
      console.error('[ReceiptModal] Print error:', err)
      setPrintError(err.message)
    } finally {
      setIsPrinting(false)
    }
  }

  // Single print button — auto-resolves to ESC/POS or browser based on config
  const handlePrint = () => {
    if (printerEnabled) {
      handleEscPosPrint()
    } else {
      handleBrowserPrint()
    }
  }

  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center print:hidden">
          <h3 className="font-bold flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-green-400" /> Sale Completed</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer transition-colors duration-200"><X className="w-5 h-5" /></button>
        </div>
        
        <IframePrintWarning show={showIframeWarning} onDismiss={() => setShowIframeWarning(false)} />

        <div className="p-6 bg-slate-50 flex-1 overflow-y-auto max-h-[60vh] print:p-0 print:max-h-none print:overflow-visible">
          <PrintableReceipt sale={sale} settings={settings} />
        </div>

        {/* Print Error */}
        {printError && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-100">
            <p className="text-xs text-red-600">Print error: {printError}</p>
          </div>
        )}

        <div className="p-4 bg-white border-t border-slate-100 flex gap-3 print:hidden">
          {/* Single Print Button — auto-detects ESC/POS thermal vs browser print.
              Style: clean white button (works for both thermal + browser cases). */}
          <button
            onClick={handlePrint}
            disabled={isPrinting || !printerChecked}
            data-testid="receipt-print-btn"
            data-printer-mode={printerEnabled ? 'escpos' : 'browser'}
            className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPrinting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Printing...</>
            ) : (
              <>
                <Printer className="w-5 h-5" />
                Print Receipt
              </>
            )}
          </button>
          {/* New Order */}
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 flex items-center justify-center transition-colors duration-200 cursor-pointer"
          >
            <Plus className="w-5 h-5 mr-2" /> New Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;