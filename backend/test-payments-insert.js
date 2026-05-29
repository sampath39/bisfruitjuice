import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: {
    transport: ws
  }
});

async function testInsert() {
  try {
    // 1. Get a valid order ID
    const { data: orders } = await supabase.from('orders').select('id').limit(1);
    if (!orders || orders.length === 0) {
      console.log('No orders in database. Cannot run test.');
      return;
    }
    const orderId = orders[0].id;
    console.log('Testing with Order ID:', orderId);

    // 2. Try inserting a full payment record
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          order_id: orderId,
          payment_method: 'COD',
          payment_status: 'PAID',
          amount: 99.00,
          razorpay_transaction_id: 'txn_mock_123',
          payment_time: new Date().toISOString(),
          failure_reason: null
        }
      ])
      .select();

    if (error) {
      console.error('Insert returned error:', error.message, error.code);
    } else {
      console.log('Insert succeeded! Table already has these columns!', data);
      
      // Clean up the test row
      await supabase.from('payments').delete().eq('id', data[0].id);
      console.log('Cleaned up test row.');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testInsert();
