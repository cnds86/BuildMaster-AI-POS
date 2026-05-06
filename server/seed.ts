import { db } from './db';
import { sql } from 'kysely';

async function seed() {
  console.log('Seeding the database...');

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      branch_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      cost_price DECIMAL(10,2),
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER,
      unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
      sku VARCHAR(255) NOT NULL UNIQUE,
      barcode VARCHAR(255),
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS sales (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      total DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2),
      discount_amount DECIMAL(10,2) DEFAULT 0,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      payment_method VARCHAR(50) NOT NULL,
      payment_status VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'completed',
      user_id UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS cart_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sale_id UUID REFERENCES sales(id),
      product_id UUID REFERENCES products(id),
      quantity INTEGER NOT NULL,
      sell_price DECIMAL(10,2) NOT NULL,
      sell_unit VARCHAR(50) NOT NULL,
      sell_conversion_factor DECIMAL(10,4) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `.execute(db);

  console.log('Database synced successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Failed to seed:', err);
  process.exit(1);
});
