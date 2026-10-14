import { createPool } from '@vercel/postgres'

let pool: ReturnType<typeof createPool> | null = null
type SqlValue = string | number | boolean | undefined | null

function getPool() {
  if (!pool) pool = createPool({ connectionString: process.env.DATABASE_URL! })
  return pool
}

// Delay pool construction until a query actually runs. This keeps development-only
// UI fixtures independent of the production database while preserving live queries.
export function sql(strings: TemplateStringsArray, ...values: SqlValue[]) {
  return getPool().sql(strings, ...values)
}
