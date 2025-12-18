
import React, { useState, useMemo } from 'react';
import { Sale, Product } from '../types';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  Users,
  Clock,
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

// Sub-components
import { SalesAnalytics } from './reports/SalesAnalytics';
import { StaffPerformance } from './reports/StaffPerformance';
import { HourlyTraffic } from './reports/HourlyTraffic';
import { InventoryValuation } from './reports/InventoryValuation';

interface ReportsManagementProps {
  sales: Sale[];
  products: Product[];
}

type ReportType = 'sales' | 'inventory' | 'low-stock' | 'staff' | 'hourly';

export const ReportsManagement: React.FC<ReportsManagementProps> = ({ sales, products }) => {
  const { formatPrice } = useGlobal();
  const [activeTab, setActiveTab] = useState<ReportType>('sales');
  
  // Date Filters
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // --- Filtered Sales Helper ---
  const filteredSales = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return sales.filter(s => {
      const d = new Date(s.date);
      return d >= start && d <= end && s.status !== 'voided';
    });
  }, [sales, startDate, endDate]);

  // --- Sales Report Logic ---
  const salesReportData = useMemo(() => {
    const dailyData = new Map<string, { date: string; revenue: number; profit: number; count: number }>();
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalCost = 0;

    filteredSales.forEach(sale => {
      const dateKey = new Date(sale.date).toLocaleDateString('en-US');
      
      let saleCost = 0;
      sale.items.forEach(item => {
         const product = products.find(p => p.id === item.id);
         let unitCost = product?.costPrice || 0;
         
         if (item.selectedVariantId && product?.variants) {
            const variant = product.variants.find(v => v.id === item.selectedVariantId);
            if (variant && variant.costPrice) {
               unitCost = variant.costPrice;
            } else if (variant && variant.conversionFactor) {
               unitCost = (product?.costPrice || 0) / variant.conversionFactor;
            }
         }
         saleCost += unitCost * item.quantity;
      });

      const saleProfit = sale.total - saleCost;
      totalRevenue += sale.total;
      totalCost += saleCost;
      totalProfit += saleProfit;

      const existing = dailyData.get(dateKey) || { date: dateKey, revenue: 0, profit: 0, count: 0 };
      existing.revenue += sale.total;
      existing.profit += saleProfit;
      existing.count += 1;
      dailyData.set(dateKey, existing);
    });

    const chartData = Array.from(dailyData.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { totalRevenue, totalCost, totalProfit, chartData };
  }, [filteredSales, products]);

  // --- Inventory Report Logic ---
  const inventoryReportData = useMemo(() => {
    let totalStockValue = 0; 
    let totalRetailValue = 0; 
    let totalItems = 0;

    const reportItems = products.map(p => {
      const stockVal = p.stock * (p.costPrice || 0);
      const retailVal = p.stock * p.price;
      
      totalStockValue += stockVal;
      totalRetailValue += retailVal;
      totalItems += p.stock;

      return {
        ...p,
        stockValue: stockVal,
        retailValue: retailVal,
        margin: p.costPrice ? ((p.price - p.costPrice) / p.price) * 100 : 100
      };
    });

    return { reportItems, totalStockValue, totalRetailValue, totalItems };
  }, [products]);

  // --- Staff Performance Logic ---
  const staffReportData = useMemo(() => {
    const staffMap = new Map<string, { id: string; name: string; revenue: number; count: number }>();

    filteredSales.forEach(s => {
        const uid = s.userId || 'unknown';
        const uName = s.userName || 'Unknown Staff';
        
        const existing = staffMap.get(uid) || { id: uid, name: uName, revenue: 0, count: 0 };
        existing.revenue += s.total;
        existing.count += 1;
        staffMap.set(uid, existing);
    });

    return Array.from(staffMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  // --- Hourly Heatmap Logic ---
  const hourlyReportData = useMemo(() => {
    const hours = Array(24).fill(0).map((_, i) => ({ 
        hour: i, 
        label: `${String(i).padStart(2, '0')}:00`, 
        revenue: 0, 
        count: 0 
    }));

    filteredSales.forEach(s => {
        const h = new Date(s.date).getHours();
        if (hours[h]) {
            hours[h].revenue += s.total;
            hours[h].count += 1;
        }
    });

    return hours;
  }, [filteredSales]);

  // --- CSV Export Logic ---
  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === 'sales') {
      csvContent += "Date,Invoice ID,Customer,Items,Total,Profit,Payment Method\n";
      filteredSales.forEach(s => {
        let cost = 0;
        s.items.forEach(i => {
           const p = products.find(prod => prod.id === i.id);
           cost += (p?.costPrice || 0) * i.quantity;
        });
        const profit = s.total - cost;
        csvContent += `${new Date(s.date).toLocaleDateString()},${s.id},"${s.customerName || 'Walk-in'}",${s.items.length},${s.total},${profit},${s.paymentMethod}\n`;
      });
    } else if (activeTab === 'inventory' || activeTab === 'low-stock') {
      csvContent += "Name,SKU,Category,Stock,Unit,Cost Price,Sell Price,Total Cost Value,Total Retail Value\n";
      const targetList = activeTab === 'low-stock' 
        ? inventoryReportData.reportItems.filter(p => p.stock <= (p.minStock || 0))
        : inventoryReportData.reportItems;

      targetList.forEach(p => {
        csvContent += `"${p.name}",${p.sku},${p.category},${p.stock},${p.unit},${p.costPrice || 0},${p.price},${p.stockValue},${p.retailValue}\n`;
      });
    } else if (activeTab === 'staff') {
      csvContent += "Staff Name,Transactions,Revenue,Avg Ticket\n";
      staffReportData.forEach(s => {
        csvContent += `"${s.name}",${s.count},${s.revenue},${s.count > 0 ? s.revenue/s.count : 0}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
          <p className="text-slate-500">Business intelligence and financial insights.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold text-sm shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Tabs - Style A: Pill Toggle */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 scrollbar-hide">
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit min-w-max">
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'sales' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <TrendingUp className="w-4 h-4 mr-2" /> Sales
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users className="w-4 h-4 mr-2" /> Staff
          </button>
          <button
            onClick={() => setActiveTab('hourly')}
            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'hourly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Clock className="w-4 h-4 mr-2" /> Hourly
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Package className="w-4 h-4 mr-2" /> Valuation
          </button>
          <button
            onClick={() => setActiveTab('low-stock')}
            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'low-stock' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <AlertTriangle className="w-4 h-4 mr-2" /> Low Stock
          </button>
        </div>
      </div>

      {/* Date Filters (Hidden for Inventory/Low Stock) */}
      {(activeTab === 'sales' || activeTab === 'staff' || activeTab === 'hourly') && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 flex-wrap animate-fade-in">
           <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 px-3 py-2 rounded-xl">
                 <Calendar className="w-5 h-5 text-slate-400 mr-2" />
                 <input 
                   type="date" 
                   value={startDate} 
                   onChange={e => setStartDate(e.target.value)} 
                   className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 p-0"
                 />
              </div>
              <span className="text-slate-400 font-bold">-</span>
              <div className="flex items-center bg-slate-100 px-3 py-2 rounded-xl">
                 <input 
                   type="date" 
                   value={endDate} 
                   onChange={e => setEndDate(e.target.value)} 
                   className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 p-0"
                 />
              </div>
           </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <SalesAnalytics data={salesReportData} formatPrice={formatPrice} />
      )}

      {activeTab === 'staff' && (
        <StaffPerformance data={staffReportData} formatPrice={formatPrice} />
      )}

      {activeTab === 'hourly' && (
         <HourlyTraffic data={hourlyReportData} formatPrice={formatPrice} />
      )}

      {(activeTab === 'inventory' || activeTab === 'low-stock') && (
         <InventoryValuation data={inventoryReportData} mode={activeTab} formatPrice={formatPrice} />
      )}
    </div>
  );
};
