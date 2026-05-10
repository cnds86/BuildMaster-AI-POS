import { ColumnType, Generated } from 'kysely'

export interface Database {
  users: UserTable
  branches: BranchTable
  products: ProductTable
  stock_ledger: StockLedgerTable
  sales: SaleTable
  sale_items: SaleItemTable
  categories: CategoryTable
  customers: CustomerTable
  customer_levels: CustomerLevelTable
  promotions: PromotionTable
  expense_categories: ExpenseCategoryTable
  expenses: ExpenseTable
  drivers: DriverTable
  vehicles: VehicleTable
  delivery_orders: DeliveryOrderTable
  quotations: QuotationTable
  quotation_items: QuotationItemTable
  shifts: ShiftTable
  audit_log: AuditLogTable
}

export interface UserTable {
  id: Generated<string>
  username: string
  password_hash: string
  name: string
  role: string
  branch_id: string | null
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface BranchTable {
  id: Generated<string>
  name: string
  code: string
  address: string | null
  phone: string | null
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface ProductTable {
  id: Generated<string>
  name: string
  category: string
  price: number
  cost_price: number | null
  stock: Generated<number>
  min_stock: number | null
  unit: Generated<string>
  sku: string
  barcode: string | null
  image_url: string | null
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface StockLedgerTable {
  id: Generated<string>
  product_id: string
  branch_id: string | null
  movement_type: 'IN' | 'OUT' | 'ADJUST' | 'SALE' | 'RETURN'
  quantity: number
  unit_cost: number | null
  reference_id: string | null
  note: string | null
  created_at: ColumnType<Date, string | undefined, never>
}

export interface SaleTable {
  id: Generated<string>
  branch_id: string | null
  user_id: string | null
  total: number
  subtotal: number | null
  discount_amount: Generated<number>
  tax_amount: Generated<number>
  payment_method: string
  payment_status: string
  status: Generated<string>
  customer_id: string | null
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface SaleItemTable {
  id: Generated<string>
  sale_id: string
  product_id: string
  quantity: number
  sell_price: number
  sell_unit: string | null
  created_at: ColumnType<Date, string | undefined, never>
}

export interface CategoryTable {
  id: Generated<string>
  name: string
  parent_id: string | null
  sort_order: Generated<number>
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
}

export interface CustomerTable {
  id: Generated<string>
  name: string
  phone: string | null
  email: string | null
  level_id: string | null
  debt: Generated<number>
  address: string | null
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface CustomerLevelTable {
  id: Generated<string>
  name: string
  discount_percent: Generated<number>
  point_rate: Generated<number>
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
}

export interface PromotionTable {
  id: Generated<string>
  name: string
  type: string
  start_date: string | null
  end_date: string | null
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
}

export interface ExpenseCategoryTable {
  id: Generated<string>
  name: string
  type: string
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
}

export interface ExpenseTable {
  id: Generated<string>
  branch_id: string | null
  category_id: string | null
  amount: number
  description: string | null
  date: string
  receipt_url: string | null
  user_id: string | null
  created_at: ColumnType<Date, string | undefined, never>
}

export interface DriverTable {
  id: Generated<string>
  name: string
  phone: string
  license_plate: string | null
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
}

export interface VehicleTable {
  id: Generated<string>
  plate_number: string
  vehicle_type: string | null
  driver_id: string | null
  active: Generated<boolean>
  created_at: ColumnType<Date, string | undefined, never>
}

export interface DeliveryOrderTable {
  id: Generated<string>
  sale_id: string | null
  driver_id: string | null
  vehicle_id: string | null
  status: string
  delivery_address: string | null
  delivered_at: string | null
  created_at: ColumnType<Date, string | undefined, never>
}

export interface QuotationTable {
  id: Generated<string>
  customer_id: string | null
  user_id: string | null
  total: number
  valid_until: string | null
  status: string
  created_at: ColumnType<Date, string | undefined, never>
}

export interface QuotationItemTable {
  id: Generated<string>
  quotation_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: ColumnType<Date, string | undefined, never>
}

export interface ShiftTable {
  id: Generated<string>
  branch_id: string | null
  user_id: string | null
  opening_cash: Generated<number>
  closing_cash: number | null
  cash_difference: number | null
  expected_cash: number | null
  status: string
  opened_at: ColumnType<Date, string | undefined, never>
  closed_at: string | null
}

export interface AuditLogTable {
  id: Generated<string>
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  old_value: unknown | null
  new_value: unknown | null
  ip_address: string | null
  created_at: ColumnType<Date, string | undefined, never>
}
