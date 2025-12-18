
import React from 'react';
import { Quotation } from '../../types';
import { FileText, CalendarClock, Eye } from 'lucide-react';

interface QuotationListProps {
  quotations: Quotation[];
  formatPrice: (amount: number) => string;
  onViewQuotation: (quote: Quotation) => void;
}

export const QuotationList: React.FC<QuotationListProps> = ({ quotations, formatPrice, onViewQuotation }) => {
  if (quotations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center w-full h-full">
          <FileText className="w-12 h-12 mb-2 opacity-20" />
          No quotations found.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date / Ref</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Customer</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Valid Until</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Total</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotations.map((quote) => {
               const isExpired = new Date(quote.validUntil) < new Date() && quote.status === 'active';
               
               return (
                  <tr 
                    key={quote.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => onViewQuotation(quote)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{new Date(quote.date).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{quote.referenceNo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{quote.customerName || 'Walk-in'}</div>
                      <div className="text-xs text-slate-500">{quote.items.length} items</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className={`flex items-center text-sm ${isExpired ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                           <CalendarClock className="w-3 h-3 mr-1" />
                           {new Date(quote.validUntil).toLocaleDateString()}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      {formatPrice(quote.total)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {quote.status === 'converted' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                          Converted
                        </span>
                      ) : isExpired || quote.status === 'expired' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onViewQuotation(quote); }}
                        className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
