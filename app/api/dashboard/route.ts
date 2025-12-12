import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    // 1. Get Sales for the last quarter
    const sales = await prisma.sale.findMany({
      where: {
        date: { gte: ninetyDaysAgo }
      },
      include: { items: true },
      orderBy: { date: 'asc' }
    });

    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    const totalOrders = sales.length;

    // 2. Aggregate Sales Data for Charts
    // Weekly Trend (or last 14 days)
    const trendMap = new Map<string, number>();
    const last14Days = new Date(today);
    last14Days.setDate(today.getDate() - 14);

    sales.filter(s => s.date >= last14Days).forEach(sale => {
      const dateStr = sale.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + sale.total);
    });
    
    const trendData = Array.from(trendMap).map(([name, sales]) => ({ name, sales }));

    // 3. Top Products
    // We need to aggregate SaleItems. Since Prisma doesn't support complex deep grouping easily in one go with relations,
    // we iterate the fetched sales (which are already limited to 90 days, so usually manageable).
    const productStats = new Map<string, { name: string; revenue: number; qty: number }>();

    // We need to fetch product names efficiently
    const productIds = new Set<string>();
    sales.forEach(s => s.items.forEach(i => productIds.add(i.productId)));
    
    const products = await prisma.product.findMany({
      where: { id: { in: Array.from(productIds) } },
      select: { id: true, name: true, unit: true }
    });
    
    // Use explicit map population to ensure type safety and avoid 'unknown' inference
    const productLookup = new Map<string, { name: string; unit: string }>();
    products.forEach(p => productLookup.set(p.id, p));

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const p = productLookup.get(item.productId);
        const pName = p ? p.name : 'Unknown Product';
        
        const existing = productStats.get(item.productId) || { name: pName, revenue: 0, qty: 0 };
        existing.revenue += (item.sellPrice * item.quantity);
        existing.qty += item.quantity;
        productStats.set(item.productId, existing);
      });
    });

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 4. Low Stock Alerts
    const lowStockItems = await prisma.product.findMany({
      where: {
        // This is a rough check. For precise checking against minStock per row, 
        // we might need raw query or filtering in application code if minStock is dynamic.
        // Prisma doesn't support `where: { stock: { lt: db.minStock } }` natively yet.
      },
      include: { inventory: true },
      take: 50
    });

    const alerts = lowStockItems.map(p => {
        const totalStock = p.inventory.reduce((acc, i) => acc + i.quantity, 0);
        return {
            ...p,
            stock: totalStock
        };
    }).filter(p => p.stock <= p.minStock);

    return NextResponse.json({
      metrics: {
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
      trendData,
      topProducts,
      alerts: alerts.slice(0, 10)
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: 'Failed to generate dashboard statistics' }, { status: 500 });
  }
}