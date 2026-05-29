import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID || process.env.Test_api_key || 'rzp_test_placeholder';
const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.Test_Key_Secret || 'placeholder_secret';
const isRazorpayMock = keyId === 'rzp_test_placeholder';

let razorpay;
try {
  // Initialize Razorpay SDK
  razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
} catch (err) {
  console.error('Failed to initialize Razorpay SDK:', err);
}

// Create Razorpay Order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Fetch order details from Supabase database to prevent tampering
    const { data: order, error } = await supabase
      .from('orders')
      .select('total_amount, customer_name, customer_mobile')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found in database' });
    }

    // Razorpay amount is in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(parseFloat(order.total_amount) * 100);

    // If Razorpay keys are placeholders, run in mock mode
    if (isRazorpayMock) {
      console.log('Razorpay is running in Mock Mode. Returning dummy Razorpay details.');
      
      const mockRazorpayOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
      
      // Update order with mock ID
      await supabase
        .from('orders')
        .update({ razorpay_order_id: mockRazorpayOrderId })
        .eq('id', orderId);

      return res.json({
        isMock: true,
        key: 'rzp_test_placeholder',
        amount: amountInPaise,
        currency: 'INR',
        id: mockRazorpayOrderId,
        orderId,
        customer: {
          name: order.customer_name,
          mobile: order.customer_mobile
        }
      });
    }

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderId
    };

    const rzpOrder = await razorpay.orders.create(options);

    // Store Razorpay Order ID in the order table
    await supabase
      .from('orders')
      .update({ razorpay_order_id: rzpOrder.id })
      .eq('id', orderId);

    res.json({
      isMock: false,
      key: keyId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      id: rzpOrder.id,
      orderId,
      customer: {
        name: order.customer_name,
        mobile: order.customer_mobile
      }
    });
  } catch (err) {
    console.error('Error in createRazorpayOrder:', err);
    res.status(500).json({ error: 'Failed to initiate Razorpay payment order' });
  }
};

// Verify Razorpay Signature
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { 
      orderId, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      isMock 
    } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing verification fields' });
    }

    // Fetch order total to record in payments table
    const { data: order } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('id', orderId)
      .single();

    const amount = order ? order.total_amount : 0;

    // Handle Mock mode payment verification
    if (isMock) {
      console.log('Mock payment verified successfully.');
      
      // Update order payment status
      await supabase
        .from('orders')
        .update({ payment_status: 'paid', payment_id: razorpay_payment_id })
        .eq('id', orderId);

      // Insert into payments table
      await supabase
        .from('payments')
        .insert([
          {
            order_id: orderId,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature: 'mock_signature',
            amount,
            status: 'success'
          }
        ]);

      return res.json({ status: 'success', message: 'Mock payment verified successfully' });
    }

    // Verify signature using Crypto
    const secret = keySecret;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
      // Payment matches, update database
      await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid', 
          payment_id: razorpay_payment_id 
        })
        .eq('id', orderId);

      // Log in payments table
      await supabase
        .from('payments')
        .insert([
          {
            order_id: orderId,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            amount,
            status: 'success'
          }
        ]);

      res.json({ status: 'success', message: 'Payment verified and captured successfully' });
    } else {
      // Signature mismatch
      await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', orderId);

      // Log in payments table as failed
      await supabase
        .from('payments')
        .insert([
          {
            order_id: orderId,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            amount,
            status: 'failed'
          }
        ]);

      res.status(400).json({ status: 'failure', error: 'Payment signature verification failed' });
    }
  } catch (err) {
    console.error('Error in verifyRazorpayPayment:', err);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};
