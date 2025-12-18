
import React from 'react';
import { X, FileText, Printer } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

export interface ZReportData {
  shiftId: string;
  user: string;
  branch: string;
  posMachine: string;
  start: string;
  end: string;
  startCash: number;
  endCash: number;
  totalSales: number;
  salesByMethod: Record<string, number>;
  cashReceived: number;
  cashChange: number;
  expectedCash: number;
  discrepancy: number;
  transactionCount: number;
  cashIn: number;
  cashOut: number;
  notes?: string;
}

interface ZReportModalProps {
  report: ZReportData | null;
  onClose: () => void;
}

export const ZReportModal: React.FC<ZReportModalProps> = ({ report, onClose }) => {
  const { settings, formatPrice } = useGlobal();

  if (!report) return null;

  const receiptWidthClass = settings?.receiptPaperSize === '58mm' ? 'print-w-58mm' : settings?.receiptPaperSize === 'A4' ? 'print-w-A4' : 'print-w-80mm';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4 backdrop-blur-sm print:p-0 print:bg-white print:static print:block">
       <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
             <h3 className="font-bold text-slate-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-slate-500" />
                Shift Report
             </h3>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 print:p-0 print:bg-white">
             <div id="printable-report" className={`bg-white p-4 shadow-sm border border-slate-200 text-xs font-mono text-black mx-auto ${receiptWidthClass} print:shadow-none print:border-none`}>
                <div className="text-center mb-4">
                   <h2 className="text-lg font-bold mb-1">{settings.companyName}</h2>
                   <p className="font-bold border-b border-black pb-1 mb-1">X-REPORT / SHIFT SUMMARY</p>
                   <p>{new Date().toLocaleString()}</p>
                </div>

                <div className="space-y-1 mb-3">
                   <div className="flex justify-between"><span>Shift ID:</span><span>#{report.shiftId.slice(-6)}</span></div>
                   <div className="flex justify-between"><span>Staff:</span><span>{report.user}</span></div>
                   <div className="flex justify-between"><span>Branch:</span><span>{report.branch}</span></div>
                   <div className="flex justify-between"><span>POS:</span><span>{report.posMachine}</span></div>
                   <div className="flex justify-between"><span>Start:</span><span>{report.start}</span></div>
                   <div className="flex justify-between"><span>End:</span><span>{report.end}</span></div>
                </div>

                <div className="border-b border-dashed border-black my-2"></div>

                <div className="space-y-1 mb-3">
                   <div className="flex justify-between font-bold"><span>Total Sales:</span><span>{formatPrice(report.totalSales)}</span></div>
                   <div className="flex justify-between"><span>Transactions:</span><span>{report.transactionCount}</span></div>
                </div>

                <div className="mb-3">
                   <p className="font-bold border-b border-black mb-1">Payment Methods</p>
                   {Object.entries(report.salesByMethod).map(([method, amount]) => (
                      <div key={method} className="flex justify-between capitalize">
                         <span>{method}:</span>
                         <span>{formatPrice(amount)}</span>
                      </div>
                   ))}
                </div>

                <div className="mb-3">
                   <p className="font-bold border-b border-black mb-1">Cash Drawer</p>
                   <div className="flex justify-between"><span>Opening Cash:</span><span>{formatPrice(report.startCash)}</span></div>
                   <div className="flex justify-between"><span>Cash Sales:</span><span>{formatPrice(report.cashReceived - report.cashChange)}</span></div>
                   <div className="flex justify-between"><span>Cash In:</span><span>+{formatPrice(report.cashIn)}</span></div>
                   <div className="flex justify-between"><span>Cash Out:</span><span>-{formatPrice(report.cashOut)}</span></div>
                   <div className="border-t border-dashed border-black my-1"></div>
                   <div className="flex justify-between font-bold"><span>Expected Cash:</span><span>{formatPrice(report.expectedCash)}</span></div>
                   <div className="flex justify-between"><span>Actual Count:</span><span>{formatPrice(report.endCash)}</span></div>
                   <div className="flex justify-between"><span>Difference:</span><span className={report.discrepancy < 0 ? 'text-red-600 font-bold' : ''}>{formatPrice(report.discrepancy)}</span></div>
                </div>
                
                {report.notes && (
                   <div className="mt-4 border-t border-black pt-2">
                      <p className="font-bold">Notes:</p>
                      <p>{report.notes}</p>
                   </div>
                )}

                <div className="text-center mt-6">
                   <p>--- END OF REPORT ---</p>
                </div>
             </div>
          </div>

          <div className="p-4 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 print:hidden">
             <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100">
                Close
             </button>
             <button onClick={() => window.print()} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 shadow-sm flex items-center">
                <Printer className="w-4 h-4 mr-2" /> Print
             </button>
          </div>
       </div>
    </div>
  );
};
