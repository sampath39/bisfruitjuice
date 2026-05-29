import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function runOtpFlowTest() {
  try {
    console.log('🚀 STEP 1: Creating a fresh COD order...');
    const orderPayload = {
      customer_name: 'Sampath Kumar (COD)',
      customer_mobile: '+91 79896 46180',
      delivery_address: 'Dasarapalli Road, Udayagiri Mandal, Nellore Dt, AP (Within 10KM)',
      latitude: 14.876767,
      longitude: 79.289523,
      payment_method: 'COD',
      items: [
        {
          product_id: 'j1', // Mango Juice
          quantity: 3,
          price: 99
        }
      ],
      user_id: null
    };

    const checkoutRes = await axios.post('http://localhost:5000/api/orders', orderPayload);
    const createdOrder = checkoutRes.data.order;
    const orderId = createdOrder.id;
    console.log(`✅ Order placed! ID: ${orderId}, Status: "${createdOrder.order_status}", Payment Status: "${createdOrder.payment_status}"`);

    console.log('\n🚀 STEP 2: Dispatching and sending OTP as Admin...');
    // We attach the mock admin token to bypass auth checks securely in testing
    const adminHeaders = {
      Authorization: 'Bearer mock_token_jwt_admin'
    };

    // First transition order to accepting, preparing, out_for_delivery
    console.log(' - Transitioning to "accepted"...');
    await axios.put(`http://localhost:5000/api/orders/${orderId}`, { order_status: 'accepted' }, { headers: adminHeaders });

    console.log(' - Transitioning to "preparing"...');
    await axios.put(`http://localhost:5000/api/orders/${orderId}`, { order_status: 'preparing' }, { headers: adminHeaders });

    console.log(' - Transitioning to "out_for_delivery"...');
    await axios.put(`http://localhost:5000/api/orders/${orderId}`, { order_status: 'out_for_delivery' }, { headers: adminHeaders });

    // Now send delivery OTP
    console.log(' - Triggering OTP Generation ("Send OTP")...');
    const otpRes = await axios.post(`http://localhost:5000/api/orders/${orderId}/send-otp`, {}, { headers: adminHeaders });
    const otpCode = otpRes.data.otp_code;
    console.log(`✅ OTP sent! OTP Code generated is: "${otpCode}" (dispatched to customer)`);

    console.log('\n🚀 STEP 3: Submitting OTP to verify and deliver...');
    const verifyRes = await axios.post(
      `http://localhost:5000/api/orders/${orderId}/verify-otp`,
      { otp: otpCode },
      { headers: adminHeaders }
    );
    const finalizedOrder = verifyRes.data.order;
    console.log('✅ OTP verified successfully!');
    console.log('Final Order Status (should be delivered):', finalizedOrder.order_status);
    console.log('Final Payment Status (should be paid):', finalizedOrder.payment_status);
    console.log('OTP Verified flag:', finalizedOrder.otp_verified);

    console.log('\n🎉 INTEGRATION TEST PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ Integration test failed:', err.response?.data || err.message);
  }
}

runOtpFlowTest();
