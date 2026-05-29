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
      .select('id, otp_code, otp_verified, accepted_at, delivered_at, order_status')
      .limit(1);

    if (error) {
      console.error('Error fetching columns:', error);
    } else {
      console.log('Columns fetched successfully!', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

checkColumns();
