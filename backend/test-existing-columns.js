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

async function checkColumns() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, customer_name, customer_mobile, delivery_address, total_amount, payment_method, payment_status, order_status, created_at')
      .limit(1);

    if (error) {
      console.error('Error fetching columns:', error);
    } else {
      console.log('Successfully fetched standard columns!', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

checkColumns();
