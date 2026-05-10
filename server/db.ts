import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import 'dotenv/config'
import type { Database } from './types/db'

const connectionString = process.env.DATABASE_URL || 'postgresql://user:***@localhost:5432/mahaxay_pos'

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString,
    max: 10,
  })
})

export const db = new Kysely<Database>({
  dialect,
})
