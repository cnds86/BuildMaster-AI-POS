
import { Product, Category, Sale, UnitDefinition, CategoryItem, Branch, PosMachine, Warehouse, StorageLocation, StockTransfer, StockCount, StockReservation, StockReceipt, StockAdjustment, User } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    username: 'admin',
    password: '123', // Demo password
    email: 'admin@buildmaster.com',
    name: 'Owner Admin',
    role: 'Admin',
    avatarUrl: 'https://ui-avatars.com/api/?name=Owner+Admin&background=0ea5e9&color=fff'
  },
  {
    id: 'u2',
    username: 'manager',
    password: '123', 
    email: 'manager@buildmaster.com',
    name: 'Manager Somchai',
    role: 'Manager',
    avatarUrl: 'https://ui-avatars.com/api/?name=Manager+Somchai&background=8b5cf6&color=fff'
  },
  {
    id: 'u3',
    username: 'staff',
    password: '123', 
    name: 'Staff Somsri',
    role: 'Staff',
    avatarUrl: 'https://ui-avatars.com/api/?name=Staff+Somsri&background=10b981&color=fff'
  },
  {
    id: 'u4',
    username: 'cashier',
    password: '123', 
    name: 'Cashier Noi',
    role: 'Cashier',
    avatarUrl: 'https://ui-avatars.com/api/?name=Cashier+Noi&background=f97316&color=fff'
  }
];

export const INITIAL_UNITS: UnitDefinition[] = [
  // Length (Base: mm)
  { id: 'u1', name: 'Millimeter', symbol: 'mm', category: 'Length', baseFactor: 1, isBase: true },
  { id: 'u2', name: 'Centimeter', symbol: 'cm', category: 'Length', baseFactor: 10, isBase: false },
  { id: 'u3', name: 'Meter', symbol: 'm', category: 'Length', baseFactor: 1000, isBase: false },
  
  // Weight (Base: g)
  { id: 'u4', name: 'Gram', symbol: 'g', category: 'Weight', baseFactor: 1, isBase: true },
  { id: 'u5', name: 'Kilogram', symbol: 'kg', category: 'Weight', baseFactor: 1000, isBase: false },
  { id: 'u6', name: 'Ton', symbol: 'ton', category: 'Weight', baseFactor: 1000000, isBase: false },

  // Quantity (Base: pc)
  { id: 'u7', name: 'Piece', symbol: 'pc', category: 'Quantity', baseFactor: 1, isBase: true },
  { id: 'u8', name: 'Dozen', symbol: 'doz', category: 'Quantity', baseFactor: 12, isBase: false },
  { id: 'u9', name: 'Pack', symbol: 'pk', category: 'Quantity', baseFactor: 1, isBase: false }, // Variable, conceptually 1
  { id: 'u10', name: 'Box', symbol: 'box', category: 'Quantity', baseFactor: 1, isBase: false }, // Variable
];

export const INITIAL_CATEGORIES_TREE: CategoryItem[] = [
  { id: 'c1', name: 'Cement & Concrete', parentId: null },
  { id: 'c2', name: 'Steel & Metal', parentId: null },
  { id: 'c3', name: 'Wood & Lumber', parentId: null },
  { id: 'c4', name: 'Paints & Finishes', parentId: null },
  { id: 'c5', name: 'Tools & Hardware', parentId: null },
  { id: 'c6', name: 'Plumbing', parentId: null },
  { id: 'c7', name: 'Electrical', parentId: null },
  { id: 'c8', name: 'General Consumables', parentId: null },
  { id: 'c1-1', name: 'Bagged Cement', parentId: 'c1' },
  { id: 'c1-2', name: 'Ready Mix', parentId: 'c1' },
  { id: 'c2-1', name: 'Rebar', parentId: 'c2' },
  { id: 'c2-2', name: 'Structural Steel', parentId: 'c2' },
  { id: 'c3-1', name: 'Plywood', parentId: 'c3' },
  { id: 'c3-2', name: 'Dimensional Lumber', parentId: 'c3' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Portland Cement Type 1',
    category: 'c1-1', // Bagged Cement
    price: 6.50,
    stock: 450,
    minStock: 50,
    unit: 'bag',
    sku: 'CEM-001',
    barcode: '885000001',
    warehouseInventory: [
      { warehouseId: 'wh1', quantity: 400 },
      { warehouseId: 'wh2', quantity: 50 }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1590059598858-a57758372658?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'p2',
    name: 'Red Brick',
    category: 'c1', // Cement & Concrete (General)
    price: 0.85,
    stock: 12500,
    minStock: 2000,
    unit: 'pc',
    sku: 'BRK-002',
    barcode: '885000002',
    warehouseInventory: [
      { warehouseId: 'wh1', quantity: 12500 }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1590059598858-a57758372658?auto=format&fit=crop&q=80&w=300',
    variants: [
      { id: 'v2-1', name: 'Pallet', code: 'BRK-002-PAL', barcode: '885000002P', conversionFactor: 500, price: 400.00 }
    ]
  },
  {
    id: 'p3',
    name: 'Steel Rebar 12mm',
    category: 'c2-1', // Rebar
    price: 12.00,
    stock: 280,
    minStock: 100,
    unit: 'bar',
    sku: 'STL-003',
    barcode: '885000003',
    warehouseInventory: [
      { warehouseId: 'wh1', quantity: 280 }
    ]
  },
  {
    id: 'p4',
    name: 'Interior Paint White',
    category: 'c4', // Paints
    price: 24.50,
    stock: 15, // Low stock demo
    minStock: 30,
    unit: 'can',
    sku: 'PNT-004',
    barcode: '885000004',
    warehouseInventory: [
      { warehouseId: 'wh1', quantity: 15 }
    ]
  },
  {
    id: 'p5',
    name: 'Ceramic Floor Tile 60x60',
    category: 'c8', // Consumables (Example)
    price: 4.50, // Per Tile
    stock: 1000,
    minStock: 100,
    unit: 'tile',
    sku: 'TIL-005',
    barcode: '885000005',
    warehouseInventory: [
      { warehouseId: 'wh1', quantity: 1000 }
    ],
    variants: [
      { id: 'v5-1', name: 'Box', code: 'TIL-005-BOX', barcode: '885000005B', conversionFactor: 12, price: 54.00 } // 1 Box = 12 Tiles, Price 4.5 * 12
    ]
  },
  {
    id: 'p6',
    name: 'Drinking Water',
    category: 'c8',
    price: 0.50, // Per Bottle
    stock: 500,
    minStock: 50,
    unit: 'bottle',
    sku: 'WTR-006',
    barcode: '885000006',
    warehouseInventory: [
      { warehouseId: 'wh1', quantity: 500 }
    ],
    variants: [
      { id: 'v6-1', name: 'Pack', code: 'WTR-006-PK', barcode: '885000006P', conversionFactor: 24, price: 10.00 } // Bulk discount: 24 * 0.5 = 12, but sold at 10
    ]
  }
];

export const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Main HQ', address: '123 Construction Ave', phone: '02-123-4567', manager: 'Manager Somchai', isActive: true },
  { id: 'b2', name: 'Downtown Branch', address: '45 City Center Rd', phone: '02-987-6543', manager: 'Alice Smith', isActive: true },
];

export const INITIAL_POS_MACHINES: PosMachine[] = [
  { id: 'pm1', branchId: 'b1', machineNumber: 'POS-01', status: 'active' },
  { id: 'pm2', branchId: 'b1', machineNumber: 'POS-02', status: 'active' },
  { id: 'pm3', branchId: 'b2', machineNumber: 'POS-B1-01', status: 'active' },
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: 'wh1', branchId: 'b1', name: 'Main Warehouse', code: 'WH-HQ', type: 'General', description: 'Central storage for bulk items' },
  { id: 'wh2', branchId: 'b1', name: 'Showroom Floor', code: 'SH-HQ', type: 'Showroom', description: 'Items available for immediate pick' },
  { id: 'wh3', branchId: 'b2', name: 'Downtown Storage', code: 'WH-DT', type: 'General' },
];

export const INITIAL_LOCATIONS: StorageLocation[] = [
  { id: 'l1', warehouseId: 'wh1', zone: 'A', rack: '01', shelf: '1', bin: 'A', fullCode: 'A-01-1-A', type: 'Pallet' },
  { id: 'l2', warehouseId: 'wh1', zone: 'A', rack: '01', shelf: '1', bin: 'B', fullCode: 'A-01-1-B', type: 'Pallet' },
  { id: 'l3', warehouseId: 'wh1', zone: 'B', rack: '05', shelf: '2', bin: 'A', fullCode: 'B-05-2-A', type: 'Shelf' },
];

export const INITIAL_TRANSFERS: StockTransfer[] = [
  { 
    id: 'TR-1701234567', 
    date: '2023-10-25', 
    sourceWarehouseId: 'wh1', 
    targetWarehouseId: 'wh2', 
    status: 'Approved', 
    items: [{ productId: 'p1', productName: 'Portland Cement', unit: 'bag', quantity: 20 }],
    referenceNo: 'TR-2310-001'
  },
  { 
    id: 'TR-1701239999', 
    date: new Date().toISOString().split('T')[0], 
    sourceWarehouseId: 'wh1', 
    targetWarehouseId: 'wh3', 
    status: 'Draft', 
    items: [{ productId: 'p4', productName: 'Interior Paint White', unit: 'can', quantity: 50 }],
    referenceNo: 'TR-NEW-002'
  }
];

export const INITIAL_COUNTS: StockCount[] = [
  {
    id: 'SC-101',
    date: '2023-11-01',
    warehouseId: 'wh2',
    status: 'Completed',
    items: [
      { productId: 'p1', productName: 'Portland Cement', unit: 'bag', quantity: 50, systemQuantity: 48, countedQuantity: 50, diff: 2 }
    ],
    referenceNo: 'AUDIT-NOV',
    counterName: 'Staff Somsri',
    reason: 'Routine Check'
  }
];

export const INITIAL_RESERVATIONS: StockReservation[] = [];
export const INITIAL_RECEIPTS: StockReceipt[] = [];
export const INITIAL_ADJUSTMENTS: StockAdjustment[] = [];

// Helper to generate realistic historical sales data for the last 90 days
const generateHistoricalSales = (count: number): Sale[] => {
  const sales: Sale[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    // Random date within last 90 days
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    // Randomize items
    const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items per sale
    const items = [];
    let total = 0;

    for (let j = 0; j < numItems; j++) {
      const product = INITIAL_PRODUCTS[Math.floor(Math.random() * INITIAL_PRODUCTS.length)];
      const qty = Math.floor(Math.random() * 10) + 1;
      
      // Randomly choose variant if available
      let sellPrice = product.price;
      let sellUnit = product.unit;
      let conversion = 1;
      let variantId = undefined;

      if (product.variants && Math.random() > 0.7) {
        const v = product.variants[0];
        sellPrice = v.price;
        sellUnit = v.name;
        conversion = v.conversionFactor;
        variantId = v.id;
      }

      const itemTotal = sellPrice * qty;
      total += itemTotal;

      items.push({
        ...product,
        quantity: qty,
        selectedVariantId: variantId,
        sellPrice,
        sellUnit,
        sellConversionFactor: conversion
      });
    }

    // Add Tax
    total = total * 1.07;

    sales.push({
      id: `S-HIST-${i}`,
      date: date.toISOString(),
      items: items,
      total: parseFloat(total.toFixed(2)),
      paymentMethod: Math.random() > 0.5 ? 'cash' : 'card'
    });
  }
  
  // Sort by date descending
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const INITIAL_SALES: Sale[] = generateHistoricalSales(150); // Generate 150 historical sales