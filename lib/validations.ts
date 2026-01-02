
import { z } from "zod";

// --- Shift Schemas ---

export const shiftStartSchema = z.object({
  userId: z.string(),
  branchId: z.string(),
  posId: z.string().optional(),
  startCash: z.number().min(0),
  notes: z.string().optional()
});

export const shiftEndSchema = z.object({
  endCash: z.number().min(0),
  notes: z.string().optional()
});

// --- Product & Inventory Schemas ---

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.number().min(0),
  unit: z.string().min(1),
  stock: z.number().min(0).optional(),
  minStock: z.number().optional(),
  variants: z.array(z.object({
    name: z.string(),
    code: z.string(),
    barcode: z.string().optional(),
    price: z.number(),
    costPrice: z.number().optional(),
    stock: z.number().optional(),
    conversionFactor: z.number().optional()
  })).optional()
});

// --- Sales & Customer Schemas ---

export const saleSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().min(0.0001),
    sellPrice: z.number(),
  })),
  total: z.number(),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'qr', 'credit']),
  customerId: z.string().optional().nullable(),
  source: z.string().optional()
});

export const customerSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  loyaltyPoints: z.number().optional(),
  levelId: z.string().optional().nullable()
});

export const customerLevelSchema = z.object({
  name: z.string().min(1),
  discountPercentage: z.number().min(0).max(100),
  color: z.string().optional()
});

// --- Unit & Category Schemas ---

export const unitSchema = z.object({
  name: z.string().min(1),
  symbol: z.string().min(1),
  category: z.enum(['Weight', 'Length', 'Quantity']),
  baseFactor: z.number(),
  isBase: z.boolean()
});

export const categorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().nullable().optional(),
  description: z.string().optional()
});

// --- Branch & Warehouse Schemas ---

export const branchSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  manager: z.string().min(1),
  isActive: z.boolean()
});

export const warehouseSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(['General', 'Cold Storage', 'Hazardous', 'Showroom']),
  branchId: z.string(),
  description: z.string().optional()
});

export const locationSchema = z.object({
  warehouseId: z.string(),
  zone: z.string().min(1),
  rack: z.string().min(1),
  shelf: z.string().min(1),
  bin: z.string().min(1),
  type: z.enum(['Pallet', 'Shelf', 'Floor']).optional()
});

// --- User & Settings Schemas ---

export const userSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1).optional(),
  name: z.string().min(1),
  role: z.enum(['Admin', 'Manager', 'Staff', 'Cashier']),
  email: z.string().email().optional().or(z.literal('')),
  avatarUrl: z.string().optional(),
  department: z.string().optional(),
  branchId: z.string().optional()
});

export const settingsSchema = z.object({
  companyName: z.string().min(1),
  taxId: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  monthlyTarget: z.number().optional(),
  language: z.enum(['en', 'th', 'lo']),
  currencySymbol: z.string(),
  defaultItemsPerPage: z.number().optional(),
  tax: z.object({
    enabled: z.boolean(),
    rate: z.number(),
    calculationMode: z.enum(['included', 'excluded']),
    displayOnReceipt: z.boolean()
  }),
  cashDenominations: z.array(z.number()).optional(),
  customerDisplay: z.object({
    enabled: z.boolean(),
    welcomeMessage: z.string(),
    promotionInterval: z.number()
  }).optional(),
  loyaltyProgram: z.object({
    enabled: z.boolean(),
    earnRate: z.number(),
    redeemRate: z.number()
  }).optional(),
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
  receiptPaperSize: z.enum(['58mm', '80mm', 'A4']).optional(),
  receiptAutoPrint: z.boolean().optional(),
  receiptShowTaxId: z.boolean().optional(),
  receiptShowCashier: z.boolean().optional(),
  receiptCopies: z.number().optional(),
  showBankInfoOnReceipt: z.boolean().optional(),
  currentBranchId: z.string().optional(),
  currentPosId: z.string().optional(),
  deviceRole: z.enum(['Master', 'Slave']).optional(),
  masterApiUrl: z.string().optional(),
  autoSyncInterval: z.number().optional()
});

// --- Stock Document Schemas ---

export const stockItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  productName: z.string(),
  unit: z.string(),
  quantity: z.number(),
  note: z.string().optional()
});

export const stockTransferSchema = z.object({
  referenceNo: z.string().optional(),
  date: z.string(),
  sourceWarehouseId: z.string(),
  targetWarehouseId: z.string(),
  status: z.enum(['Draft', 'Approved', 'Completed', 'Cancelled']),
  items: z.array(stockItemSchema)
});

export const stockCountSchema = z.object({
  referenceNo: z.string().optional(),
  date: z.string(),
  warehouseId: z.string(),
  status: z.enum(['Draft', 'Approved', 'Completed', 'Cancelled']),
  counterName: z.string(),
  reason: z.string(),
  items: z.array(stockItemSchema.extend({
    systemQuantity: z.number().optional(),
    countedQuantity: z.number().optional(),
    diff: z.number().optional()
  }))
});

export const stockReceiptSchema = z.object({
  referenceNo: z.string().optional(),
  date: z.string(),
  warehouseId: z.string(),
  vendorName: z.string(),
  vendorInvoiceNo: z.string().optional(),
  status: z.enum(['Draft', 'Approved', 'Completed', 'Cancelled']),
  items: z.array(stockItemSchema.extend({
    costPrice: z.number()
  })),
  totalCost: z.number().optional()
});

export const stockAdjustmentSchema = z.object({
  referenceNo: z.string().optional(),
  date: z.string(),
  warehouseId: z.string(),
  status: z.enum(['Draft', 'Approved', 'Completed', 'Cancelled']),
  items: z.array(stockItemSchema),
  reason: z.string()
});

export const stockReservationSchema = z.object({
  referenceNo: z.string().optional(),
  date: z.string(),
  expiryDate: z.string(),
  warehouseId: z.string(),
  customerName: z.string(),
  status: z.enum(['Draft', 'Approved', 'Completed', 'Cancelled']),
  items: z.array(stockItemSchema)
});
