const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();

neonConfig.webSocketConstructor = ws;

async function test() {
  const connectionString = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '').trim();
  console.log('Testing connection string:', connectionString ? (connectionString.substring(0, 20) + '...') : 'UNDEFINED');
  
  if (!connectionString) {
    console.error('DATABASE_URL is missing!');
    return;
  }

  const pool = new Pool({ connectionString });
  
  try {
    const client = await pool.connect();
    console.log('Successfully connected to Neon!');
    const res = await client.query('SELECT NOW()');
    console.log('Database time:', res.rows[0].now);
    client.release();
  } catch (err) {
    console.error('Connection failed:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await pool.end();
  }
}

test();
