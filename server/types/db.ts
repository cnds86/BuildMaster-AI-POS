import { ColumnType, Generated } from 'kysely'

export interface Database {
  users: UserTable
  products: ProductTable
  sales: SaleTable
  cart_items: CartItemTable
}

export interface UserTable {
  id: Generated<string>
  username: string
  password_hash: string
  name: string
  role: string
  branch_id: string | null
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
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface SaleTable {
  id: Generated<string>
  total: number
  subtotal: number | null
  discount_amount: Generated<number>
  tax_amount: Generated<number>
  date: ColumnType<Date, string | undefined, never>
  payment_method: string
  payment_status: string
  status: Generated<string>
  user_id: string | null
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface CartItemTable {
  id: Generated<string>
  sale_id: string
  product_id: string
  quantity: number
  sell_price: number
  sell_unit: string
  sell_conversion_factor: Generated<number>
}
