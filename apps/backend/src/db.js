const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('./db/schema');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

function createId() {
  const { createId } = require('cuid');
  return createId();
}

module.exports = { db, ...schema, createId };
