
import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable }) => {
  return (
    <div className={cn(
      'bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden',
      hoverable && 'hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300',
      className
    )}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('p-6 border-b border-slate-50 flex items-center justify-between', className)}>
    {children}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('p-6', className)}>
    {children}
  </div>
);
