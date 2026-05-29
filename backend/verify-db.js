import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file!');
  process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: {
    transport: ws
  }
});

async function testConnection() {
  try {
    console.log('Fetching products from database...');
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price');

    if (error) {
      console.error('Error fetching products:', error.message);
      console.log('\n❌ Tables might not be created yet. Please execute the SQL in schema.sql on your Supabase dashboard SQL Editor.');
      process.exit(1);
    }

    console.log(`\n✅ Connected successfully! Found ${products?.length || 0} products in the database.`);
    if (products && products.length > 0) {
      console.log('Seeded products sample:');
      products.slice(0, 3).forEach(p => {
        console.log(` - ${p.name}: ₹${p.price}`);
      });
    } else {
      console.log('⚠️ Database is connected but the products table is empty. Please check if the schema.sql seed queries ran.');
    }
  } catch (err) {
    console.error('Unexpected connection error:', err);
    process.exit(1);
  }
}

testConnection();
