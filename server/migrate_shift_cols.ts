// Run migration using Bun with direct pg Pool (bypasses Kysely)
import { Pool } from 'pg'
import 'dotenv/config'

async function migrate() {
  console.log('Running shift columns migration...')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })

  const columns = [
    ['user_name', 'VARCHAR(255)'],
    ['pos_machine_id', 'VARCHAR(255)'],
    ['cash_in_drawer', 'DECIMAL(18,2) DEFAULT 0'],
    ['notes', 'TEXT'],
    ['starting_cash', 'DECIMAL(18,2) DEFAULT 0'],
  ]

  for (const [name, type] of columns) {
    try {
      const r = await pool.query(`ALTER TABLE shifts ADD COLUMN IF NOT EXISTS ${name} ${type}`)
      console.log(`✓ ${name} (rowCount=${r.rowCount})`)
    } catch (err: any) {
      if (err?.code === '42701') {
        console.log(`⚤ already exists: ${name}`)
      } else {
        console.error(`✗ ${name} — ${err?.message}`)
      }
    }
  }

  await pool.end()
  console.log('Done.')
  process.exit(0)
}

migrate().catch(err => { console.error(err); process.exit(1) })