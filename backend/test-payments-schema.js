import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: {
    transport: ws
  }
});

async function inspectPaymentsTable() {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching payments:', error);
    } else {
      console.log('Payments table exists! Data found:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

inspectPaymentsTable();
