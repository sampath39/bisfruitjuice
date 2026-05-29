import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: {
    transport: ws
  }
});

async function checkRpc() {
  try {
    // Let's try calling a common hacky RPC if any exists, or list database schema
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' });
    console.log('exec_sql result:', { data, error });
  } catch (err) {
    console.error('RPC check failed:', err);
  }
}

checkRpc();
