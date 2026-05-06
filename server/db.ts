import { Kysely, PostgresDialect } from 'kysely'
import pkg from 'pg'
import dotenv from 'dotenv'
import type { Database } from './types/db' // Your generated/manual types

dotenv.config()
const { Pool } = pkg

// Fallback to avoid crashing if no DATABASE_URL is set
const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mahaxay_pos'

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString,
    max: 10,
  })
})

export const db = new Kysely<Database>({
  dialect,
})
