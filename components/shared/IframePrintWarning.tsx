import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface IframePrintWarningProps {
  show: boolean;
  onDismiss: () => void;
}

export const IframePrintWarning: React.FC<IframePrintWarningProps> = ({ show, onDismiss }) => {
  if (!show) return null;
  
  return (
    <div className="p-4 m-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3 print:hidden animate-fade-in">
      <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-orange-800">Print Unavailable in Preview</p>
        <p className="text-sm text-orange-700 mt-1">To print, please open the application in a new tab by clicking the <ExternalLink className="inline w-3 h-3 mx-1" /> icon at the top right.</p>
        <button 
           onClick={onDismiss}
           className="mt-3 text-xs font-bold text-orange-600 hover:text-orange-800 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
