import { Product, Category, Sale, UnitDefinition, VariantAttribute, CategoryItem, Branch, PosMachine, Warehouse, StorageLocation, StockTransfer, StockCount, StockReservation, StockReceipt, StockAdjustment, User, SystemSettings, SyncLog, Customer, CustomerLevel, ShiftSchedule, Promotion, AuditLog, Department, SystemRole } from '../types';

export const INITIAL_USERS: User[] = [
  { id: 'u1', username: 'admin', password: '123', name: 'Owner Admin', role: 'Admin', email: 'admin@buildmaster.com', branchId: 'b1', department: 'Management' },
  { id: 'u2', username: 'manager', password: '123', name: 'Manager Somchai', role: 'Manager', email: 'manager@buildmaster.com', branchId: 'b1', department: 'Operations' },
  { id: 'u3', username: 'staff', password: '123', name: 'Staff Somsri', role: 'Staff', branchId: 'b1', department: 'Warehouse' },
  { id: 'u4', username: 'cashier', password: '123', name: 'Cashier Noi', role: 'Cashier', branchId: 'b1', department: 'Sales' },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Management', description: 'Executive and strategic decision making', managerId: 'u1' },
  { id: 'dept-2', name: 'Operations', description: 'Day-to-day store operations', managerId: 'u2' },
  { id: 'dept-3', name: 'Sales', description: 'Front-of-house sales team' },
  { id: 'dept-4', name: 'Warehouse', description: 'Inventory and logistics' },
  { id: 'dept-5', name: 'Accounting', description: 'Financial and bookkeeping' }
];

export const INITIAL_ROLES: SystemRole[] = [
  { id: 'role-1', name: 'Admin', description: 'Full system access', isSystem: true, permissions: ['all'] },
  { id: 'role-2', name: 'Manager', description: 'Store operations, approvals, and reports', isSystem: true, permissions: ['dashboard.view', 'pos.operate', 'inventory.view', 'inventory.manage', 'stock.view', 'stock.manage', 'approvals.manage', 'reports.view', 'customers.view', 'users.view'] },
  { id: 'role-3', name: 'Staff', description: 'General staff, inventory and basic sales', isSystem: true, permissions: ['pos.operate', 'inventory.view', 'inventory.manage', 'stock.view', 'customers.view'] },
  { id: 'role-4', name: 'Cashier', description: 'POS and sales processing only', isSystem: true, permissions: ['pos.operate', 'customers.view', 'shifts.view'] },
];

export const INITIAL_CUSTOMER_LEVELS: CustomerLevel[] = [
  { id: 'l1', name: 'General', discountPercentage: 0, color: '#64748b' },
  { id: 'l2', name: 'Member', discountPercentage: 5, color: '#3b82f6' },
  { id: 'l3', name: 'VIP', discountPercentage: 10, color: '#eab308' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', code: 'CUST-001', name: 'General Customer', phone: '', loyaltyPoints: 0, levelId: 'l1' },
  { id: 'c2', code: 'CUST-002', name: 'ABC Construction Co.', phone: '020-5555-8888', taxId: '1234567890', address: '88 Lane Xang Ave', loyaltyPoints: 500, levelId: 'l2' },
  { id: 'c3', code: 'CUST-003', name: 'John Doe', phone: '020-9999-7777', loyaltyPoints: 120, email: 'john@example.com', levelId: 'l1' },
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  { 
    id: 'promo-1', 
    title: 'Summer Sale', 
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-cd1361ddee21?auto=format&fit=crop&q=80&w=1000', 
    isActive: true,
    startDate: '2023-01-01'
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  companyName: 'MAHAXAY Construction Supply',
  taxId: '1234567890123',
  address: '123 Lane Xang Avenue, Vientiane, Laos',
  phone: '021-123-4567',
  language: 'lo',
  currencySymbol: '₭',
  defaultItemsPerPage: 10,
  monthlyTarget: 500000000, 
  
  // Financials
  tax: {
    enabled: true,
    rate: 7.0,
    calculationMode: 'excluded', 
    displayOnReceipt: true
  },
  
  rounding: {
    enabled: true,
    interval: 500,
    displayOnReceipt: true
  },

  cashDenominations: [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500],

  // Customer Display
  customerDisplay: {
    enabled: true,
    welcomeMessage: 'ສະບາຍດີ! ຍິນດີຕ້ອນຮັບສູ່ MAHAXAY',
    promotionInterval: 5
  },

  // Loyalty Program
  loyaltyProgram: {
    enabled: true,
    earnRate: 10000, // 1 point per 10,000 Kip
    redeemRate: 100 // 1 point = 100 Kip discount
  },

  // Receipt Defaults
  receiptHeader: 'Thank you for shopping with us!',
  receiptFooter: 'No returns after 7 days.',
  receiptPaperSize: '80mm',
  receiptAutoPrint: false,
  receiptShowTaxId: true,
  receiptShowCashier: true,
  receiptCopies: 1,
  receiptLogoUrl: '',
  receiptQrCodeUrl: '',
  
  // Bank Accounts
  showBankInfoOnReceipt: true,
  bankAccounts: [
    {
      id: 'ba-1',
      bankName: 'BCEL',
      accountName: 'MAHAXAY Co., Ltd.',
      accountNumber: '123-12-3456789-0'
    }
  ],
  
  // Device Configuration
  currentBranchId: 'b1', 
  currentPosId: 'pm1',   
  deviceRole: 'Master',
  
  // Local Database
  localDatabase: {
    enabled: false,
    type: 'postgresql',
    host: 'localhost',
    port: '5432',
    databaseName: 'mahaxay_pos',
    username: 'postgres',
    password: ''
  },

  // Synchronization
  masterApiUrl: 'http://192.168.1.50:8000',
  autoSyncInterval: 0,
  lastSyncTime: '2023-12-05 18:30:00'
};

export const INITIAL_UNITS: UnitDefinition[] = [
  { id: 'u1', name: 'Millimeter', symbol: 'mm', category: 'Length', baseFactor: 1, isBase: true },
  { id: 'u2', name: 'Centimeter', symbol: 'cm', category: 'Length', baseFactor: 10, isBase: false },
  { id: 'u3', name: 'Meter', symbol: 'm', category: 'Length', baseFactor: 1000, isBase: false },
  { id: 'u4', name: 'Gram', symbol: 'g', category: 'Weight', baseFactor: 1, isBase: true },
  { id: 'u5', name: 'Kilogram', symbol: 'kg', category: 'Weight', baseFactor: 1000, isBase: false },
  { id: 'u6', name: 'Ton', symbol: 'ton', category: 'Weight', baseFactor: 1000000, isBase: false },
  { id: 'u7', name: 'Piece', symbol: 'pc', category: 'Quantity', baseFactor: 1, isBase: true },
  { id: 'u8', name: 'Dozen', symbol: 'doz', category: 'Quantity', baseFactor: 12, isBase: false },
  { id: 'u9', name: 'Pack', symbol: 'pk', category: 'Quantity', baseFactor: 1, isBase: false },
  { id: 'u10', name: 'Box', symbol: 'box', category: 'Quantity', baseFactor: 1, isBase: false },
  { id: 'u11', name: 'Gallon', symbol: 'gal', category: 'Quantity', baseFactor: 1, isBase: true },
  { id: 'u12', name: 'Bucket', symbol: 'bkt', category: 'Quantity', baseFactor: 1, isBase: false },
  { id: 'u13', name: 'Can', symbol: 'can', category: 'Quantity', baseFactor: 1, isBase: false },
];

export const INITIAL_VARIANT_ATTRIBUTES: VariantAttribute[] = [
  { id: 'va-1', name: 'Color', values: ['White', 'Black', 'Red', 'Blue', 'Green', 'Grey', 'Cream', 'Yellow'] },
  { id: 'va-2', name: 'Size', values: ['Small', 'Medium', 'Large', 'XL', '1L', '5L', '15L', '10mm', '12mm', '16mm'] },
  { id: 'va-3', name: 'Material', values: ['Steel', 'Wood', 'Plastic', 'Concrete', 'Aluminum', 'PVC'] },
  { id: 'va-4', name: 'Grade', values: ['A', 'B', 'Standard', 'Premium', 'Industrial'] },
  { id: 'va-5', name: 'Finish', values: ['Matte', 'Gloss', 'Satin', 'Polished', 'Rough'] },
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
  { id: 'c4-1', name: 'Interior Paint', parentId: 'c4' },
  { id: 'c4-2', name: 'Exterior Paint', parentId: 'c4' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Portland Cement Type 1',
    category: 'c1-1',
    price: 65000,
    costPrice: 52000,
    stock: 450,
    minStock: 50,
    unit: 'bag',
    physical: { weight: 50, width: 40, height: 10, depth: 60 },
    sku: 'CEM-001',
    barcode: '885000001',
    warehouseInventory: [{ warehouseId: 'wh1', quantity: 400 }, { warehouseId: 'wh2', quantity: 50 }],
    imageUrl: 'https://images.unsplash.com/photo-1590059598858-a57758372658?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'p2',
    name: 'Red Brick',
    category: 'c1',
    price: 1500,
    costPrice: 800,
    stock: 12500,
    minStock: 2000,
    unit: 'pc',
    sku: 'BRK-002',
    barcode: '885000002',
    warehouseInventory: [{ warehouseId: 'wh1', quantity: 12500 }],
    imageUrl: 'https://images.unsplash.com/photo-1590059598858-a57758372658?auto=format&fit=crop&q=80&w=300',
    variants: [
      { 
        id: 'v2-1', 
        name: 'Pallet', 
        code: 'BRK-002-PAL', 
        barcode: '885000002P', 
        conversionFactor: 500, 
        price: 700000, 
        costPrice: 350000,
        attributes: { 'Grade': 'Standard' }
      }
    ]
  },
  {
    id: 'p3',
    name: 'Steel Rebar',
    category: 'c2-1',
    price: 120000,
    costPrice: 95000,
    stock: 280,
    minStock: 100,
    unit: 'bar',
    sku: 'STL-003',
    barcode: '885000003',
    warehouseInventory: [{ warehouseId: 'wh1', quantity: 280 }],
    variants: [
      { id: 'v3-1', name: '10mm', code: 'STL-003-10', barcode: '885000003-10', conversionFactor: 1, price: 95000, costPrice: 75000, attributes: { 'Size': '10mm', 'Material': 'Steel' } },
      { id: 'v3-2', name: '12mm', code: 'STL-003-12', barcode: '885000003-12', conversionFactor: 1, price: 120000, costPrice: 95000, attributes: { 'Size': '12mm', 'Material': 'Steel' } },
      { id: 'v3-3', name: '16mm', code: 'STL-003-16', barcode: '885000003-16', conversionFactor: 1, price: 180000, costPrice: 145000, attributes: { 'Size': '16mm', 'Material': 'Steel' } }
    ]
  },
  {
    id: 'p4',
    name: 'Premium Interior Paint',
    category: 'c4-1',
    price: 450000,
    costPrice: 350000,
    stock: 45,
    minStock: 30,
    unit: 'can',
    sku: 'PNT-INT',
    barcode: '885000004',
    warehouseInventory: [{ warehouseId: 'wh1', quantity: 45 }],
    imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=300',
    variants: [
      { id: 'v4-1', name: 'White 1L', code: 'PNT-INT-W-1', barcode: '885000004-W1', conversionFactor: 1, price: 150000, costPrice: 100000, attributes: { 'Color': 'White', 'Size': '1L' } },
      { id: 'v4-2', name: 'White 5L', code: 'PNT-INT-W-5', barcode: '885000004-W5', conversionFactor: 1, price: 650000, costPrice: 480000, attributes: { 'Color': 'White', 'Size': '5L' } },
      { id: 'v4-3', name: 'Blue 1L', code: 'PNT-INT-B-1', barcode: '885000004-B1', conversionFactor: 1, price: 160000, costPrice: 110000, attributes: { 'Color': 'Blue', 'Size': '1L' } },
      { id: 'v4-4', name: 'Grey 1L', code: 'PNT-INT-G-1', barcode: '885000004-G1', conversionFactor: 1, price: 160000, costPrice: 110000, attributes: { 'Color': 'Grey', 'Size': '1L' } }
    ]
  },
  {
    id: 'p5',
    name: 'Ceramic Floor Tile 60x60',
    category: 'c8',
    price: 55000,
    costPrice: 40000,
    stock: 1000,
    minStock: 100,
    unit: 'tile',
    sku: 'TIL-005',
    barcode: '885000005',
    warehouseInventory: [{ warehouseId: 'wh1', quantity: 1000 }],
    variants: [
      { id: 'v5-1', name: 'Box (Cream)', code: 'TIL-005-BOX-C', barcode: '885000005B', conversionFactor: 12, price: 650000, costPrice: 450000, attributes: { 'Color': 'Cream', 'Finish': 'Gloss' } },
      { id: 'v5-2', name: 'Box (Grey)', code: 'TIL-005-BOX-G', barcode: '885000005BG', conversionFactor: 12, price: 650000, costPrice: 450000, attributes: { 'Color': 'Grey', 'Finish': 'Matte' } }
    ]
  },
  {
    id: 'p6',
    name: 'Drinking Water',
    category: 'c8',
    price: 5000,
    costPrice: 2000,
    stock: 500,
    minStock: 50,
    unit: 'bottle',
    sku: 'WTR-006',
    barcode: '885000006',
    warehouseInventory: [{ warehouseId: 'wh1', quantity: 500 }],
    variants: [
      { id: 'v6-1', name: 'Pack', code: 'WTR-006-PK', barcode: '885000006P', conversionFactor: 12, price: 50000, costPrice: 20000 }
    ]
  },
  {
    id: 'p7',
    name: 'PVC Pipe',
    category: 'c6',
    price: 35000,
    costPrice: 20000,
    stock: 200,
    minStock: 40,
    unit: 'pc',
    sku: 'PVC-007',
    barcode: '885000007',
    warehouseInventory: [{ warehouseId: 'wh1', quantity: 200 }],
    variants: [
        { id: 'v7-1', name: '1/2 inch', code: 'PVC-05', barcode: '885000007-05', conversionFactor: 1, price: 35000, costPrice: 20000, attributes: { 'Size': '10mm', 'Material': 'PVC' } },
        { id: 'v7-2', name: '3/4 inch', code: 'PVC-075', barcode: '885000007-075', conversionFactor: 1, price: 45000, costPrice: 28000, attributes: { 'Size': '16mm', 'Material': 'PVC' } }
    ]
  }
];

export const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Main HQ', address: '123 Lane Xang Ave', phone: '021-123-4567', manager: 'Manager Somchai', isActive: true },
  { id: 'b2', name: 'Downtown Branch', address: '45 Samsenthai Rd', phone: '021-987-6543', manager: 'Alice Smith', isActive: true },
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
        const v = product.variants[Math.floor(Math.random() * product.variants.length)];
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

    // Add Tax (Assume 7% excluded for historical)
    total = total * 1.07;
    
    // Determine sync status (newer items might be pending)
    let syncStatus: 'synced' | 'pending' | 'failed' = 'synced';
    if (daysAgo === 0 && Math.random() > 0.5) {
        syncStatus = 'pending';
    }

    // Assign random customer occasionally
    let customerId = undefined;
    let customerName = undefined;
    if (Math.random() > 0.7) {
       const cust = INITIAL_CUSTOMERS[Math.floor(Math.random() * INITIAL_CUSTOMERS.length)];
       customerId = cust.id;
       customerName = cust.name;
    }

    // Assign random user
    const randomUser = INITIAL_USERS[Math.floor(Math.random() * INITIAL_USERS.length)];

    sales.push({
      id: `S-HIST-${i}`,
      date: date.toISOString(),
      items: items,
      total: parseFloat(total.toFixed(0)), // Kip doesn't usually use decimals
      paymentMethod: Math.random() > 0.5 ? 'cash' : 'card',
      paymentStatus: 'paid',
      status: 'completed',
      syncStatus,
      customerId,
      customerName,
      userId: randomUser.id,
      userName: randomUser.name
    });
  }
  
  // Sort by date descending
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const INITIAL_SALES: Sale[] = generateHistoricalSales(150); // Generate 150 historical sales

export const INITIAL_SYNC_LOGS: SyncLog[] = [
  { id: 'log-1', timestamp: '2023-12-05 18:30:00', type: 'Auto', status: 'Success', details: 'Uploaded 5 sales, Downloaded 0 updates', durationMs: 450 },
  { id: 'log-2', timestamp: '2023-12-05 18:00:00', type: 'Auto', status: 'Success', details: 'Uploaded 2 sales', durationMs: 320 },
  { id: 'log-3', timestamp: '2023-12-05 12:00:00', type: 'Manual', status: 'Success', details: 'Full sync completed', durationMs: 1200 },
  { id: 'log-4', timestamp: '2023-12-04 09:00:00', type: 'Pull', status: 'Failed', details: 'Connection timeout', durationMs: 5000 },
];

export const INITIAL_SHIFT_SCHEDULES: ShiftSchedule[] = [
  { id: 'sch-1', userId: 'u4', branchId: 'b1', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '18:00', note: 'Morning Shift' },
  { id: 'sch-2', userId: 'u3', branchId: 'b1', date: new Date().toISOString().split('T')[0], startTime: '13:00', endTime: '22:00', note: 'Afternoon Shift' }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'aud-1', action: 'SETTINGS_UPDATE', userId: 'u1', userName: 'Owner Admin', details: 'Changed company tax rate to 7%', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), severity: 'medium' },
  { id: 'aud-2', action: 'USER_CREATE', userId: 'u1', userName: 'Owner Admin', details: 'Created user "Cashier Noi"', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), severity: 'medium' },
  { id: 'aud-3', action: 'STOCK_APPROVE', userId: 'u2', userName: 'Manager Somchai', details: 'Approved transfer TR-2310-001', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), severity: 'low' },
  { id: 'aud-4', action: 'SALE_VOID', userId: 'u2', userName: 'Manager Somchai', details: 'Voided sale S-HIST-5 due to wrong item entry', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), severity: 'high', resourceId: 'S-HIST-5' },
];
