
import React from 'react';
import { ArrowRightLeft, Truck, SlidersHorizontal, CheckSquare, CalendarClock } from 'lucide-react';

interface StockNavigationProps {
  activeTab: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment';
  setActiveTab: (tab: 'transfer' | 'count' | 'reservation' | 'receipt' | 'adjustment') => void;
}

export const StockNavigation: React.FC<StockNavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
    { id: 'receipt', label: 'Receipt (In)', icon: Truck },
    { id: 'adjustment', label: 'Adjustment', icon: SlidersHorizontal },
    { id: 'count', label: 'Count (Audit)', icon: CheckSquare },
    { id: 'reservation', label: 'Reservation', icon: CalendarClock },
  ] as const;

  return (
    <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 scrollbar-hide">
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
