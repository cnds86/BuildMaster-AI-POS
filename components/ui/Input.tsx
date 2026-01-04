
import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, icon, error, className, ...props 
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-construction-orange transition-colors">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 transition-all outline-none font-bold text-slate-800 placeholder:text-slate-300",
            "focus:ring-4 focus:ring-orange-100 focus:border-construction-orange focus:bg-white",
            icon ? "pl-12 pr-4" : "px-4",
            error && "border-red-200 focus:ring-red-100 focus:border-red-500",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{error}</p>}
    </div>
  );
};
