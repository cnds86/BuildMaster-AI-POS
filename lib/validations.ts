
// ... (imports)
import { z } from "zod";

// ... (other schemas)

export const shiftStartSchema = z.object({
  userId: z.string(),
  branchId: z.string(),
  posId: z.string().optional(), // Added field
  startCash: z.number().min(0),
  notes: z.string().optional()
});

export const shiftEndSchema = z.object({
  endCash: z.number().min(0),
  notes: z.string().optional()
});

// ... (rest of file)
export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  price: z.number().min(0),
  stock: z.number().min(0),
  minStock: z.number().int().default(20),
  unit: z.string().min(1),
  variants: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    code: z.string(),
    price: z.number(),
    conversionFactor: z.number(),
  })).optional()
});

export const saleSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().min(0.0001),
    sellPrice: z.number(),
  })),
  total: z.number(),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'qr', 'credit']),
  customerId: z.string().optional(),
  source: z.enum(['pos', 'back-office']).default('pos').optional(),
});

export const customerLevelSchema = z.object({
// ... (rest of file remains unchanged)
  name: z.string().min(1, "Name is required"),
  discountPercentage: z.number().min(0).max(100),
  color: z.string().optional()
});

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  taxId: z.string().optional(),
  loyaltyPoints: z.number().default(0),
  levelId: z.string().optional(),
});

export const unitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  symbol: z.string().min(1, "Symbol is required"),
  category: z.enum(['Weight', 'Length', 'Quantity']),
  baseFactor: z.number().min(0),
  isBase: z.boolean()
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  parentId: z.string().nullable().optional(),
  description: z.string().optional()
});

// Common Item Schema for Stock Docs
const stockItemSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
  productName: z.string().optional(),
  unit: z.string().optional(),
  // Count specific
  systemQuantity: z.number().optional(),
  countedQuantity: z.number().optional(),
  diff: z.number().optional(),
  // Receipt specific
  costPrice: z.number().optional(),
});

export const stockTransferSchema = z.object({
  referenceNo: z.string(),
  date: z.string().or(z.date()),
  status: z.string(),
  sourceWarehouseId: z.string(),
  targetWarehouseId: z.string(),
  items: z.array(stockItemSchema)
});

export const stockCountSchema = z.object({
  referenceNo: z.string(),
  date: z.string().or(z.date()),
  status: z.string(),
  warehouseId: z.string(),
  counterName: z.string(),
  reason: z.string().optional(),
  items: z.array(stockItemSchema)
});

export const stockReceiptSchema = z.object({
  referenceNo: z.string(),
  date: z.string().or(z.date()),
  status: z.string(),
  warehouseId: z.string(),
  vendorName: z.string(),
  vendorInvoiceNo: z.string().optional(),
  totalCost: z.number().optional(),
  items: z.array(stockItemSchema)
});

export const stockAdjustmentSchema = z.object({
  referenceNo: z.string(),
  date: z.string().or(z.date()),
  status: z.string(),
  warehouseId: z.string(),
  reason: z.string(),
  items: z.array(stockItemSchema)
});

export const stockReservationSchema = z.object({
  referenceNo: z.string(),
  date: z.string().or(z.date()),
  status: z.string(),
  warehouseId: z.string(),
  customerName: z.string(),
  expiryDate: z.string().or(z.date()),
  items: z.array(stockItemSchema)
});

// --- New Schemas ---

export const branchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  manager: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const posMachineSchema = z.object({
  machineNumber: z.string().min(1, "Machine Number is required"),
  branchId: z.string().min(1, "Branch is required"),
  status: z.enum(['active', 'maintenance', 'inactive']).default('active')
});

export const warehouseSchema = z.object({
  branchId: z.string().min(1, "Branch is required"),
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  type: z.enum(['General', 'Cold Storage', 'Hazardous', 'Showroom']),
  description: z.string().optional()
});

export const locationSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  zone: z.string(),
  rack: z.string(),
  shelf: z.string(),
  bin: z.string(),
  type: z.enum(['Pallet', 'Shelf', 'Floor']).default('Shelf')
});

export const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 chars"),
  password: z.string().min(1, "Password is required").optional(), // Optional for updates
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(['Admin', 'Manager', 'Staff', 'Cashier']),
  avatarUrl: z.string().optional(),
  coverUrl: z.string().optional(), // Added coverUrl
  department: z.string().optional(),
  branchId: z.string().optional()
});

export const settingsSchema = z.object({
  companyName: z.string(),
  taxId: z.string(),
  address: z.string(),
  phone: z.string(),
  language: z.enum(['en', 'th', 'lo']),
  currencySymbol: z.string(),
  defaultItemsPerPage: z.number(),
  
  tax: z.object({
    enabled: z.boolean(),
    rate: z.number(),
    calculationMode: z.enum(['included', 'excluded']),
    displayOnReceipt: z.boolean()
  }),

  receiptHeader: z.string(),
  receiptFooter: z.string(),
  receiptLogoUrl: z.string().optional(),
  receiptQrCodeUrl: z.string().optional(),
  receiptPaperSize: z.enum(['58mm', '80mm', 'A4']),
  receiptAutoPrint: z.boolean(),
  receiptShowTaxId: z.boolean(),
  receiptShowCashier: z.boolean(),
  receiptCopies: z.number(),

  currentBranchId: z.string().optional(),
  currentPosId: z.string().optional(),
  deviceRole: z.enum(['Master', 'Slave']).optional(),
  
  localDatabase: z.object({
    enabled: z.boolean(),
    type: z.enum(['postgresql', 'sqlite', 'mysql']),
    host: z.string(),
    port: z.string(),
    databaseName: z.string(),
    username: z.string(),
    password: z.string(),
  }).optional(),

  masterApiUrl: z.string().optional(),
  autoSyncInterval: z.number().optional(),
});
