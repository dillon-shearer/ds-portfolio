import { createPool } from '@vercel/postgres'

const pool = createPool({ connectionString: process.env.DATABASE_URL! })
export const sql = pool.sql.bind(pool)
