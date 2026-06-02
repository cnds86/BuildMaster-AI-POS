import React, { useState, useMemo, useCallback } from 'react';
import { Sale, Product } from '../types';
import {
  Download,
  Calendar,
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  Clock,
  Wallet,
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

// Sub-components
import { SalesAnalytics } from './reports/SalesAnalytics';
import { StaffPerformance } from './reports/StaffPerformance';
import { HourlyTraffic } from './reports/HourlyTraffic';
import { InventoryValuation } from './reports/InventoryValuation';

// jsPDF for PDF export
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ReportsManagementProps {
  sales: Sale[];
  products: Product[];
}

type ReportType = 'sales' | 'inventory' | 'low-stock' | 'staff' | 'hourly' | 'expenses';

// ─── API Fetch Helpers ───────────────────────────────────────────────────────
async function fetchAPI(url: string, params: Record<string, string> = {}): Promise<any> {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${url}${query ? `?${query}` : ''}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── PDF Export Helpers ──────────────────────────────────────────────────────
function buildPDF(title: string, tableHeaders: string[][], tableRows: (string | number)[][], meta?: { colWidths?: number[] }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text(title, 14, 12);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`, 14, 18);

  (doc as any).autoTable({
    head: [tableHeaders[0]],
    body: tableRows,
    startY: 22,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [60, 60, 60] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: meta?.colWidths
      ? Object.fromEntries(meta.colWidths.map((w, i) => [i, { cellWidth: w }]))
      : {},
    margin: { left: 14, right: 14 },
  });

  return doc;
}

function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}

function exportSalesPDF(data: any, formatPrice: (v: number) => string) {
  const rows = (data.chartData || []).map((d: any) => [
    d.date,
    formatPrice(d.revenue),
    formatPrice(d.profit),
    String(d.count),
    d.revenue > 0 ? `${((d.profit / d.revenue) * 100).toFixed(1)}%` : '0%',
  ]);
  const doc = buildPDF('Sales Analytics Report', [['Date', 'Revenue', 'Profit', 'Transactions', 'Margin %']], rows);
  downloadPDF(doc, `sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportStaffPDF(data: any, formatPrice: (v: number) => string) {
  const rows = (data.staffList || []).map((s: any, i: number) => [
    String(i + 1),
    s.name,
    String(s.count),
    formatPrice(s.count > 0 ? s.revenue / s.count : 0),
    formatPrice(s.revenue),
  ]);
  const doc = buildPDF('Staff Performance Report', [['Rank', 'Staff Name', 'Transactions', 'Avg Ticket', 'Total Revenue']], rows);
  downloadPDF(doc, `staff_report_${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportInventoryPDF(data: any, formatPrice: (v: number) => string) {
  const rows = (data.reportItems || []).map((p: any) => [
    p.name,
    p.sku,
    p.category,
    String(p.stock),
    p.unit,
    formatPrice(p.costPrice || 0),
    formatPrice(p.price),
    formatPrice(p.stockValue),
    formatPrice(p.retailValue),
  ]);
  const doc = buildPDF('Inventory Valuation Report', [['Product', 'SKU', 'Category', 'Stock', 'Unit', 'Cost', 'Sell Price', 'Cost Value', 'Retail Value']], rows);
  downloadPDF(doc, `inventory_report_${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportLowStockPDF(data: any, formatPrice: (v: number) => string) {
  const rows = ((data.items || data.reportItems) || []).map((p: any) => [
    p.name,
    p.sku,
    p.category,
    String(p.stock),
    p.unit,
    formatPrice(p.price),
    String(p.minStock || 0),
  ]);
  const doc = buildPDF('Low Stock Alert Report', [['Product', 'SKU', 'Category', 'Stock', 'Unit', 'Selling Price', 'Min Stock']], rows);
  downloadPDF(doc, `lowstock_report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── Component ────────────────────────────────────────────────────────────────
export const ReportsManagement: React.FC<ReportsManagementProps> = ({ sales, products }) => {
  const { formatPrice, expenses, expenseCategories } = useGlobal();
  const [activeTab, setActiveTab] = useState<ReportType>('sales');

  // Date Filters
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // ─── API State ───────────────────────────────────────────────────────────────
  const [salesData, setSalesData] = useState<any>(null);
  const [staffData, setStaffData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [hourlyData, setHourlyData] = useState<any>(null);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [lowStockData, setLowStockData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch Report Data ────────────────────────────────────────────────────
  const fetchReport = useCallback(async (tab: ReportType) => {
    setLoading(true);
    setError(null);
    try {
      const baseParams: Record<string, string> = {};
      if (tab === 'sales' || tab === 'staff' || tab === 'hourly') {
        baseParams.date_from = startDate;
        baseParams.date_to = endDate;
      }

      switch (tab) {
        case 'sales': {
          const d = await fetchAPI('/api/reports/sales', baseParams);
          setSalesData(d);
          break;
        }
        case 'staff': {
          const d = await fetchAPI('/api/reports/staff', baseParams);
          setStaffData(d);
          break;
        }
        case 'hourly': {
          const d = await fetchAPI('/api/reports/hourly', baseParams);
          setHourlyData(d);
          break;
        }
        case 'expenses': {
          const d = await fetchAPI('/api/reports/expenses', baseParams);
          setExpenseData(d);
          break;
        }
        case 'inventory': {
          const d = await fetchAPI('/api/reports/inventory', baseParams);
          setInventoryData(d);
          break;
        }
        case 'low-stock': {
          const d = await fetchAPI('/api/reports/low-stock');
          setLowStockData(d);
          break;
        }
      }
    } catch (err: any) {
      console.error(`[reports/${tab}]`, err);
      setError(`Failed to load ${tab} report`);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch when tab or date range changes
  React.useEffect(() => {
    if (activeTab) fetchReport(activeTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, startDate, endDate]);

  // ─── Client-side Fallback (when API fails) ───────────────────────────────
  const filteredSales = useMemo(() => {
    const [startY, startM, startD] = startDate.split('-').map(Number);
    const [endY, endM, endD] = endDate.split('-').map(Number);
    const start = new Date(startY, startM - 1, startD, 0, 0, 0);
    const end = new Date(endY, endM - 1, endD, 23, 59, 59, 999);
    return sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= start && saleDate <= end && s.status !== 'voided';
    });
  }, [sales, startDate, endDate]);

  const clientSalesReportData = useMemo(() => {
    const dailyData = new Map<string, { date: string; revenue: number; profit: number; count: number }>();
    let totalRevenue = 0, totalCost = 0, totalProfit = 0;

    filteredSales.forEach(sale => {
      let saleCost = 0;
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.id);
        const unitCost = product?.costPrice || 0;
        saleCost += unitCost * item.quantity;
      });
      const saleProfit = sale.total - saleCost;
      totalRevenue += sale.total;
      totalCost += saleCost;
      totalProfit += saleProfit;

      const dateKey = new Date(sale.date).toLocaleDateString('en-US');
      const existing = dailyData.get(dateKey) || { date: dateKey, revenue: 0, profit: 0, count: 0 };
      existing.revenue += sale.total;
      existing.profit += saleProfit;
      existing.count += 1;
      dailyData.set(dateKey, existing);
    });

    const chartData = Array.from(dailyData.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return { totalRevenue, totalCost, totalProfit, chartData };
  }, [filteredSales, products]);

  const clientStaffReportData = useMemo(() => {
    const staffAP = new Map<string, { id: string; name: string; revenue: number; count: number }>();
    filteredSales.forEach(s => {
      const uidAP = s.userId || 'unknown';
      const existing = staffAP.get(uidAP) || { id: uidAP, name: s.userName || 'Unknown Staff', revenue: 0, count: 0 };
      existing.revenue += s.total;
      existing.count += 1;
      staffAP.set(uidAP, existing);
    });
    return Array.from(staffAP.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  const clientHourlyData = useMemo(() => {
    const hours = Array(24).fill(0).map((_, i) => ({ hour: i, label: `${String(i).padStart(2, '0')}:00`, revenue: 0, count: 0 }));
    filteredSales.forEach(s => {
      const h = new Date(s.date).getHours();
      if (hours[h]) { hours[h].revenue += s.total; hours[h].count += 1; }
    });
    return hours;
  }, [filteredSales]);

  const clientInventoryReportData = useMemo(() => {
    let totalStockValue = 0, totalRetailValue = 0, totalItems = 0;
    const reportItems = products.map(p => {
      const stockVal = p.stock * (p.costPrice || 0);
      const retailVal = p.stock * p.price;
      totalStockValue += stockVal; totalRetailValue += retailVal; totalItems += p.stock;
      return { ...p, stockValue: stockVal, retailValue: retailVal, margin: p.costPrice ? ((p.price - p.costPrice) / p.price) * 100 : 100 };
    });
    return { reportItems, totalStockValue, totalRetailValue, totalItems };
  }, [products]);

  const clientExpenseReportData = useMemo(() => {
    let totalExpenses = 0;
    const categoryTotals: Record<string, number> = {};
    const dailyData = new Map<string, { date: string; amount: number }>();
    const filteredExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    });
    filteredExpenses.forEach(exp => {
      totalExpenses += exp.amount;
      categoryTotals[exp.categoryId] = (categoryTotals[exp.categoryId] || 0) + exp.amount;
      const dateKey = new Date(exp.date).toLocaleDateString('en-US');
      const existing = dailyData.get(dateKey) || { date: dateKey, amount: 0 };
      existing.amount += exp.amount;
      dailyData.set(dateKey, existing);
    });
    const chartData = Array.from(dailyData.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return { totalExpenses, categoryTotals, chartData, categories: expenseCategories };
  }, [expenses, expenseCategories, startDate, endDate]);

  // ─── Effective Data ─────────────────────────────────────────────────────────
  // Use API data when available, fall back to client-side computed data
  const effectiveSalesData = salesData || clientSalesReportData;
  const effectiveStaffData = staffData?.staffList ? { ...staffData, dataAP: staffData.staffList } : (staffData || clientStaffReportData);
  const effectiveHourlyData = hourlyData || clientHourlyData;
  const effectiveInventoryData = inventoryData || clientInventoryReportData;
  const effectiveExpenseData = expenseData || clientExpenseReportData;
  const effectiveLowStockData = lowStockData || { items: clientInventoryReportData.reportItems.filter((p: any) => p.stock <= (p.minStock || 0)) };

  // ─── Tab Metadata ───────────────────────────────────────────────────────────
  const tabMeta: Record<ReportType, { label: string; icon: React.ReactNode; hasDateRange: boolean; hasPDF: boolean }> = {
    sales: { label: 'Sales', icon: <TrendingUp className="w-4 h-4 mr-2" />, hasDateRange: true, hasPDF: true },
    staff: { label: 'Staff', icon: <Users className="w-4 h-4 mr-2" />, hasDateRange: true, hasPDF: true },
    hourly: { label: 'Hourly', icon: <Clock className="w-4 h-4 mr-2" />, hasDateRange: true, hasPDF: false },
    expenses: { label: 'Expenses', icon: <Wallet className="w-4 h-4 mr-2" />, hasDateRange: false, hasPDF: false },
    inventory: { label: 'Valuation', icon: <Package className="w-4 h-4 mr-2" />, hasDateRange: false, hasPDF: true },
    'low-stock': { label: 'Low Stock', icon: <AlertTriangle className="w-4 h-4 mr-2" />, hasDateRange: false, hasPDF: true },
  };

  // ─── Export Handler ────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    if (loading) return;
    try {
      if (activeTab === 'sales') exportSalesPDF(salesData || clientSalesReportData, formatPrice);
      else if (activeTab === 'staff') exportStaffPDF(staffData || { staffList: clientStaffReportData }, formatPrice);
      else if (activeTab === 'inventory') exportInventoryPDF(inventoryData || clientInventoryReportData, formatPrice);
      else if (activeTab === 'low-stock') exportLowStockPDF(lowStockData || { items: clientInventoryReportData.reportItems.filter((p: any) => p.stock <= (p.minStock || 0)) }, formatPrice);
    } catch (err) { console.error('PDF export error:', err); }
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === 'sales') {
      csvContent += "Date,Revenue,Profit,Transactions,Margin%\n";
      effectiveSalesData?.chartData?.forEach((d: any) => {
        csvContent += `${d.date},${d.revenue},${d.profit},${d.count},${d.revenue > 0 ? ((d.profit / d.revenue) * 100).toFixed(1) : 0}%\n`;
      });
    } else if (activeTab === 'staff') {
      const list = staffData?.staffList || clientStaffReportData;
      csvContent += "Staff Name,Transactions,Avg Ticket,Total Revenue\n";
      list.forEach((s: any) => {
        csvContent += `"${s.name}",${s.count},${s.count > 0 ? s.revenue / s.count : 0},${s.revenue}\n`;
      });
    } else if (activeTab === 'inventory' || activeTab === 'low-stock') {
      csvContent += "Name,SKU,Category,Stock,Unit,Cost Price,Sell Price,Total Cost Value,Total Retail Value\n";
      const items = activeTab === 'low-stock'
        ? (effectiveLowStockData?.items || [])
        : (effectiveInventoryData?.reportItems || []);
      items.forEach((p: any) => {
        csvContent += `"${p.name}",${p.sku},${p.category},${p.stock},${p.unit},${p.costPrice || 0},${p.price},${p.stockValue},${p.retailValue}\n`;
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
          <p className="text-slate-500">Business intelligence and financial insights.</p>
        </div>
        <div className="flex gap-2">
          {tabMeta[activeTab]?.hasPDF && (
            <button
              onClick={handleExportPDF}
              disabled={loading}
              className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold text-sm shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </button>
          )}
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold text-sm shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3 text-slate-500">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading report data…</span>
          </div>
        </div>
      )}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error} — showing client-side data.
        </div>
      )}

      {/* Tabs */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 scrollbar-hide">
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit min-w-max">
          {(Object.keys(tabMeta) as ReportType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tabMeta[tab].icon}
              {tabMeta[tab].label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Filters */}
      {tabMeta[activeTab]?.hasDateRange && (
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

      {/* ─── SALES TAB ────────────────────────────────────────── */}
      {activeTab === 'sales' && (
        <SalesAnalytics data={effectiveSalesData} formatPrice={formatPrice} />
      )}

      {/* ─── STAFF TAB ─────────────────────────────────────────── */}
      {activeTab === 'staff' && (
        <StaffPerformance
          data={staffData?.staffList || clientStaffReportData}
          formatPrice={formatPrice}
        />
      )}

      {/* ─── HOURLY TAB ────────────────────────────────────────── */}
      {activeTab === 'hourly' && (
        <HourlyTraffic data={effectiveHourlyData} formatPrice={formatPrice} />
      )}

      {/* ─── EXPENSES TAB ──────────────────────────────────────── */}
      {activeTab === 'expenses' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium mb-1">Total Period Expenses</p>
              <h3 className="text-3xl font-bold text-red-600">{formatPrice(effectiveExpenseData?.totalExpenses || 0)}</h3>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium mb-1">Operating Profit (Revenue - Expense)</p>
              <h3 className="text-3xl font-bold text-slate-800">
                {formatPrice((effectiveSalesData?.totalRevenue || 0) - (effectiveExpenseData?.totalExpenses || 0))}
              </h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px]">
            <h4 className="font-bold text-slate-700 mb-6">Expense Trend</h4>
            <SalesAnalytics
              data={{
                ...effectiveSalesData,
                chartData: (effectiveExpenseData?.chartData || []).map((d: any) => ({
                  ...d,
                  revenue: typeof d.amount === 'number' ? d.amount : 0,
                  profit: 0,
                })),
              }}
              formatPrice={formatPrice}
            />
          </div>
        </div>
      )}

      {/* ─── INVENTORY TAB ──────────────────────────────────────── */}
      {(activeTab === 'inventory' || activeTab === 'low-stock') && (
        <InventoryValuation
          data={effectiveInventoryData}
          mode={activeTab}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
};
