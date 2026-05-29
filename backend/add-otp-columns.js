import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL || `postgresql://postgres:${process.env.DB_PASSWORD}@db.lgztolrpwgdydrxxiejn.supabase.co:5432/postgres`;

async function run() {
  const hasPassword = process.env.DB_PASSWORD && process.env.DB_PASSWORD !== 'your_db_password';
  const hasDbUrl = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[YOUR-PASSWORD]');

  if (!hasPassword && !hasDbUrl) {
    console.log('\n======================================================');
    console.log('⚠️  DATABASE PASSWORD NOT PROVIDED IN .env');
    console.log('======================================================');
    console.log('Please copy and execute the following SQL query in the');
    console.log('Supabase SQL Editor (Dashboard -> SQL Editor -> New Query):');
    console.log('\n```sql');
    console.log('ALTER TABLE public.orders ');
    console.log('ADD COLUMN IF NOT EXISTS otp_code TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE,');
    console.log('ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,');
    console.log('ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;');
    console.log('');
    console.log('ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;');
    console.log("ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check CHECK (order_status IN ('pending', 'accepted', 'preparing', 'out_for_delivery', 'otp_pending', 'delivered', 'rejected'));");
    console.log('```\n');
    console.log('Alternatively, set your database password in backend/.env under DB_PASSWORD and run:');
    console.log('node add-otp-columns.js');
    console.log('======================================================\n');
    return;
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database...');
    
    // Add columns
    await client.query(`
      ALTER TABLE public.orders 
      ADD COLUMN IF NOT EXISTS otp_code TEXT,
      ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
    `);
    console.log('Added custom columns.');

    // Update constraint
    await client.query(`
      ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
      ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check CHECK (order_status IN ('pending', 'accepted', 'preparing', 'out_for_delivery', 'otp_pending', 'delivered', 'rejected'));
    `);
    console.log('Updated order_status check constraint.');
    
    console.log('✅ Successfully ran all database migrations!');
  } catch (err) {
    console.error('❌ Failed to run migration:', err.message);
  } finally {
    await client.end();
  }
}
run();
