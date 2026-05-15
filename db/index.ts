import 'server-only'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Crear pool de conexiones PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/domicilios',
})

// Manejar errores de conexión
pool.on('error', (err) => {
  console.error('[DB POOL ERROR]', err)
})

// Inicializar Drizzle con el pool
export const db = drizzle(pool, { schema })

export * from './schema'
