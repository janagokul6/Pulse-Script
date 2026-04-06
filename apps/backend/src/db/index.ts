import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from '../config/index.js';
import * as schema from './schema.js';
import cuid from 'cuid';

export const pool = new Pool({ connectionString: config.DATABASE_URL });
export const db = drizzle(pool, { schema });
export function createId(): string {
  return cuid();
}
export * from './schema.js';
