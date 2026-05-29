import { supabase, isMockMode } from '../config/db.js';
import dotenv from 'dotenv';
import axios from 'axios';
import { broadcast } from '../config/websocket.js';
import { 
  getMetadata, 
  setMetadata, 
  mergeOrderWithMetadata, 
  mergeOrdersWithMetadata,
  mapStatusToDb
} from '../utils/orderMetadata.js';

dotenv.config();

// Bismilla Fruit Juice Shop - Dasarapalli Village, Udayagiri Mandal, Nellore Dt, AP
const SHOP_LAT = parseFloat(process.env.SHOP_LATITUDE) || 14.876767;
const SHOP_LNG = parseFloat(process.env.SHOP_LONGITUDE) || 79.289523;
const MAX_RADIUS_KM = parseFloat(process.env.DELIVERY_RADIUS_KM) || 10.0;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

// STATEFUL IN-MEMORY ORDERS FOR MOCK BYPASS MODE
let inMemoryOrders = [
  {
    id: 'ord_mock_1',
    customer_name: 'Sampath Kumar',
    customer_mobile: '+91 79896 46180',
    delivery_address: 'Udayagiri Main Road, Udayagiri (Close)',
    distance_km: 1.45,
    total_amount: 278.00,
    payment_method: 'Razorpay',
    payment_status: 'paid',
    order_status: 'preparing',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    order_items: [
      { id: 'item_1', quantity: 2, price_at_order: 99, products: { id: 'j1', name: 'Mango Juice', category: 'Juices', price: 99 } },
      { id: 'item_2', quantity: 1, price_at_order: 80, products: { id: 'j3', name: 'Orange Juice', category: 'Juices', price: 89 } }
    ]
  },
  {
    id: 'ord_mock_2',
    customer_name: 'Imran Khan',
    customer_mobile: '+91 79896 46180',
    delivery_address: 'Dasarapalli Road near School, Udayagiri Mandal',
    distance_km: 5.20,
    total_amount: 140.00,
    payment_method: 'COD',
    payment_status: 'pending',
    order_status: 'pending',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    order_items: [
      { id: 'item_3', quantity: 1, price_at_order: 140, products: { id: 'j7', name: 'Strawberry Juice', category: 'Juices', price: 140 } }
    ]
  }
];

// Helper to get static product info for order line items in mock mode
const getMockProductInfo = (productId) => {
  const Fallback = [
    { id: 'j1', name: 'Mango Juice', category: 'Juices', price: 99 },
    { id: 'j2', name: 'Apple Juice', category: 'Juices', price: 120 },
    { id: 'j3', name: 'Orange Juice', category: 'Juices', price: 89 },
    { id: 'j4', name: 'Watermelon Juice', category: 'Juices', price: 79 },
    { id: 'j5', name: 'Pineapple Juice', category: 'Juices', price: 89 },
    { id: 'j6', name: 'Banana Shake', category: 'Juices', price: 99 },
    { id: 'j7', name: 'Strawberry Juice', category: 'Juices', price: 140 },
    { id: 'j8', name: 'Mixed Fruit Juice', category: 'Juices', price: 110 },
    { id: 'j9', name: 'Avocado Shake', category: 'Juices', price: 160 },
    { id: 'j10', name: 'Mosambi Juice', category: 'Juices', price: 79 },
    { id: 'c1', name: 'Classic Milds', category: 'Cigarettes', price: 190 },
    { id: 'c2', name: 'Gold Flake Kings', category: 'Cigarettes', price: 180 },
    { id: 'c3', name: 'Marlboro Advance', category: 'Cigarettes', price: 200 },
    { id: 'd1', name: 'Thums Up 250ml', category: 'Cool Drinks', price: 20 },
    { id: 'd2', name: 'Sprite 750ml', category: 'Cool Drinks', price: 45 },
    { id: 'd3', name: 'Coca Cola 1.25L', category: 'Cool Drinks', price: 70 },
    { id: 'w1', name: 'Bisleri Mineral Water 1L', category: 'Water Bottles', price: 20 },
    { id: 'w2', name: 'Kinley Drinking Water 2L', category: 'Water Bottles', price: 35 },
    { id: 'i1', name: 'Vanilla Delight Scoop', category: 'Ice Creams', price: 50 },
    { id: 'i2', name: 'Chocolate Fudge Sundae', category: 'Ice Creams', price: 90 },
    { id: 'i3', name: 'Butterscotch Cone', category: 'Ice Creams', price: 60 }
  ];
  return Fallback.find(p => p.id === productId) || { name: 'Fresh Juice', category: 'Juices', price: 80 };
};

// Haversine formula helper
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Distance validation helper
const getDeliveryDistance = async (custLat, custLng) => {
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${SHOP_LAT},${SHOP_LNG}&destinations=${custLat},${custLng}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await axios.get(url);
      if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
        return response.data.rows[0].elements[0].distance.value / 1000;
      }
    } catch (err) {
      console.error('Google Distance Matrix failed, falling back to Haversine:', err);
    }
  }
  return calculateHaversineDistance(SHOP_LAT, SHOP_LNG, custLat, custLng);
};

// Verify delivery eligibility
export const verifyDeliveryDistance = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const distance = await getDeliveryDistance(parseFloat(latitude), parseFloat(longitude));
    const isEligible = distance <= MAX_RADIUS_KM;

    res.json({
      distanceKm: parseFloat(distance.toFixed(2)),
      maxRadiusKm: MAX_RADIUS_KM,
      isEligible,
      shopLocation: { lat: SHOP_LAT, lng: SHOP_LNG }
    });
  } catch (err) {
    console.error('Error verifying delivery distance:', err);
    res.status(500).json({ error: 'Failed to verify delivery distance' });
  }
};

// UUID Validation Helper
const isValidUUID = (str) => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { 
      customer_name, 
      customer_mobile, 
      delivery_address, 
      latitude, 
      longitude, 
      payment_method,
      items,
      user_id
    } = req.body;

    if (!customer_name || !customer_mobile || !delivery_address || !payment_method || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    // Validate location & distance
    let distanceKm = 0;
    if (latitude && longitude) {
      distanceKm = await getDeliveryDistance(parseFloat(latitude), parseFloat(longitude));
      if (distanceKm > MAX_RADIUS_KM) {
        return res.status(400).json({ 
          error: `Delivery not available beyond ${MAX_RADIUS_KM}KM. Your distance: ${distanceKm.toFixed(2)} KM` 
        });
      }
    } else {
      return res.status(400).json({ error: 'Delivery location coordinates are required' });
    }

    // Calculate total amount
    let calculatedTotal = 0;
    for (const item of items) {
      calculatedTotal += parseFloat(item.price) * parseInt(item.quantity);
    }

    const { coupon_code } = req.body;
    if (coupon_code && coupon_code.toUpperCase() === 'FIRST20') {
      calculatedTotal = parseFloat((calculatedTotal * 0.8).toFixed(2));
    }

    const orderPayload = {
      customer_name,
      customer_mobile,
      delivery_address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      distance_km: parseFloat(distanceKm.toFixed(2)),
      total_amount: calculatedTotal,
      payment_method,
      payment_status: 'pending',
      order_status: 'pending'
    };

    if (isMockMode) {
      const mockOrderId = `ord_mock_${Math.random().toString(36).substring(2, 9)}`;
      const mockOrder = {
        id: mockOrderId,
        user_id: null,
        clerk_user_id: user_id || req.user?.id || 'mock_user_id',
        delivery_eta: '30 minutes',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...orderPayload,
        order_items: items.map((item, index) => ({
          id: `item_mock_${index}_${Date.now()}`,
          quantity: item.quantity,
          price_at_order: item.price,
          products: getMockProductInfo(item.product_id)
        }))
      };
      
      mockOrder.payment_status = payment_method === 'COD' ? 'NOT PAID' : 'pending';
      mockOrder.order_status = 'pending'; // rich status "Order Placed" maps to pending
      
      inMemoryOrders.unshift(mockOrder);
      broadcast({ type: 'NEW_ORDER', order: mockOrder });
      return res.status(201).json({
        message: 'Order created successfully (Mock Mode)',
        order: mockOrder
      });
    }

    // DB insert: Validate and verify profile user ID reference
    let finalUserId = user_id || req.user?.id || null;
    const clerkUserId = finalUserId;
    if (finalUserId) {
      if (!isValidUUID(finalUserId)) {
        console.warn(`[Order Controller] user_id "${finalUserId}" is not a valid UUID. Setting to null.`);
        finalUserId = null;
      } else {
        // Double-check if the profile exists in public.profiles to prevent foreign key errors
        const { data: profileExists } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', finalUserId)
          .single();
        
        if (!profileExists) {
          console.warn(`[Order Controller] user_id "${finalUserId}" does not exist in profiles table. Setting to null.`);
          finalUserId = null;
        }
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: finalUserId,
          ...orderPayload
        }
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Initialize rich metadata details immediately
    setMetadata(order.id, {
      clerk_user_id: clerkUserId,
      delivery_eta: '30 minutes',
      metadata_status: 'pending', // "Order Placed"
      payment_status: payment_method === 'COD' ? 'NOT PAID' : 'pending'
    });

    // Resolve mock product IDs to real Supabase product UUIDs if present
    const resolvedItems = [];
    const { data: dbProducts, error: dbProductsError } = await supabase
      .from('products')
      .select('id, name');
    
    for (const item of items) {
      let resolvedProductId = item.product_id;
      if (resolvedProductId && !isValidUUID(resolvedProductId)) {
        if (!dbProductsError && dbProducts && dbProducts.length > 0) {
          const fallbackProd = getMockProductInfo(resolvedProductId);
          if (fallbackProd) {
            const matchedDbProd = dbProducts.find(p => p.name.toLowerCase() === fallbackProd.name.toLowerCase());
            if (matchedDbProd) {
              resolvedProductId = matchedDbProd.id;
              console.log(`[Order Controller] Resolved mock product ID "${item.product_id}" to DB UUID "${resolvedProductId}" (${fallbackProd.name})`);
            }
          }
        }
      }
      resolvedItems.push({
        ...item,
        product_id: resolvedProductId
      });
    }

    // Insert order items
    const orderItemsToInsert = resolvedItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: parseInt(item.quantity),
      price_at_order: parseFloat(item.price)
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    // Fetch full order details (items + products) for broadcasting and frontend consistency
    const { data: fullOrder } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_order,
          products (
            id,
            name,
            image_url,
            category
          )
        )
      `)
      .eq('id', order.id)
      .single();

    const orderToReturn = mergeOrderWithMetadata(fullOrder || order);
    broadcast({ type: 'NEW_ORDER', order: orderToReturn });

    res.status(201).json({
      message: 'Order created successfully',
      order: orderToReturn
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};
// Get orders for current user or guest (based on ids query param)
export const getMyOrders = async (req, res) => {
  try {
    const guestOrderIds = req.query.ids ? req.query.ids.split(',') : [];

    if (isMockMode) {
      if (!req.user) {
        if (guestOrderIds.length === 0) return res.json([]);
        return res.json(inMemoryOrders.filter(o => guestOrderIds.includes(o.id)));
      }
      return res.json(inMemoryOrders.filter(o => o.clerk_user_id === req.user.id || o.user_id === req.user.id || guestOrderIds.includes(o.id)));
    }

    if (!req.user) {
      // Guest mode: fetch orders matching the given IDs
      if (guestOrderIds.length === 0) {
        return res.json([]);
      }
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price_at_order,
            products (
              id,
              name,
              image_url,
              category
            )
          )
        `)
        .in('id', guestOrderIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json(mergeOrdersWithMetadata(orders));
    }

    // Authenticated customer mode: fetch orders and filter safely using Clerk ID / metadata
    const userId = req.user.id;
    const { data: allOrders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_order,
          products (
            id,
            name,
            image_url,
            category
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const merged = mergeOrdersWithMetadata(allOrders);
    const userOrders = merged.filter(o => o.clerk_user_id === userId || o.user_id === userId || guestOrderIds.includes(o.id));
    res.json(userOrders);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ error: 'Failed to fetch your orders' });
  }
};


// Admin: Get all orders
export const getAllOrders = async (req, res) => {
  try {
    if (isMockMode) {
      return res.json(inMemoryOrders);
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_order,
          products (
            id,
            name,
            image_url,
            category
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(mergeOrdersWithMetadata(orders));
  } catch (err) {
    console.error('Error fetching all orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Admin: Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, payment_status } = req.body;

    if (isMockMode) {
      const idx = inMemoryOrders.findIndex(o => o.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Order not found' });
      
      if (order_status) {
        inMemoryOrders[idx].order_status = order_status;
        if (order_status === 'accepted') {
          inMemoryOrders[idx].accepted_at = new Date().toISOString();
          inMemoryOrders[idx].delivery_eta = '30 minutes';
        }
        if (order_status === 'delivered') inMemoryOrders[idx].delivered_at = new Date().toISOString();
      }
      if (payment_status) inMemoryOrders[idx].payment_status = payment_status;

      if (order_status === 'delivered' && inMemoryOrders[idx].payment_method === 'COD') {
        inMemoryOrders[idx].payment_status = 'paid';
      }

      broadcast({ type: 'ORDER_UPDATED', order: inMemoryOrders[idx] });
      return res.json({ message: 'Order updated successfully (Mock Mode)', order: inMemoryOrders[idx] });
    }

    if (!order_status && !payment_status) {
      return res.status(400).json({ error: 'At least order_status or payment_status is required' });
    }

    const updateData = { updated_at: new Date().toISOString() };
    const metaUpdates = {};
    if (order_status) {
      metaUpdates.metadata_status = order_status;
      updateData.order_status = mapStatusToDb(order_status);
      if (order_status === 'accepted') {
        metaUpdates.accepted_at = new Date().toISOString();
        metaUpdates.delivery_eta = '30 minutes'; // Customer receives delivery arriving within 30 minutes
      }
      if (order_status === 'delivered') {
        metaUpdates.delivered_at = new Date().toISOString();
      }
    }
    if (payment_status) updateData.payment_status = payment_status;

    if (order_status || Object.keys(metaUpdates).length > 0) {
      setMetadata(id, metaUpdates);
    }

    if (order_status === 'delivered') {
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('payment_method')
        .eq('id', id)
        .single();
      
      if (currentOrder && currentOrder.payment_method === 'COD') {
        updateData.payment_status = 'paid';
      }
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_order,
          products (
            id,
            name,
            image_url,
            category
          )
        )
      `)
      .single();

    if (error) throw error;
    
    const mergedOrder = mergeOrderWithMetadata(updatedOrder);
    broadcast({ type: 'ORDER_UPDATED', order: mergedOrder });
    res.json({ message: 'Order updated successfully', order: mergedOrder });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Admin: Send delivery OTP
export const sendDeliveryOTP = async (req, res) => {
  try {
    const { id } = req.params;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    if (isMockMode) {
      const idx = inMemoryOrders.findIndex(o => o.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Order not found' });

      inMemoryOrders[idx].order_status = 'otp_pending';
      inMemoryOrders[idx].otp_code = otp;
      inMemoryOrders[idx].updated_at = new Date().toISOString();

      console.log(`\n======================================================`);
      console.log(`💬 [SMS/WhatsApp Simulator] Sending OTP code to customer:`);
      console.log(`📲 Mobile: ${inMemoryOrders[idx].customer_mobile}`);
      console.log(`🔑 OTP Code: ${otp}`);
      console.log(`======================================================\n`);

      broadcast({ type: 'ORDER_UPDATED', order: inMemoryOrders[idx] });
      return res.json({ 
        message: 'OTP sent successfully (Mock Mode)', 
        order: inMemoryOrders[idx],
        otp_code: otp
      });
    }

    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !order) return res.status(404).json({ error: 'Order not found' });

    setMetadata(id, {
      otp_code: otp,
      metadata_status: 'otp_pending'
    });

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        order_status: mapStatusToDb('otp_pending'),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_order,
          products (
            id,
            name,
            image_url,
            category
          )
        )
      `)
      .single();

    if (error) throw error;

    console.log(`\n======================================================`);
    console.log(`💬 [SMS/WhatsApp Simulator] Sending OTP code to customer:`);
    console.log(`📲 Mobile: ${order.customer_mobile}`);
    console.log(`🔑 OTP Code: ${otp}`);
    console.log(`======================================================\n`);

    const mergedOrder = mergeOrderWithMetadata(updatedOrder);
    broadcast({ type: 'ORDER_UPDATED', order: mergedOrder });
    
    res.json({ 
      message: 'OTP sent successfully', 
      order: mergedOrder,
      otp_code: otp 
    });
  } catch (err) {
    console.error('Error sending delivery OTP:', err);
    res.status(500).json({ error: 'Failed to send delivery OTP' });
  }
};

// Admin: Verify delivery OTP
export const verifyDeliveryOTP = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' });
    }

    if (isMockMode) {
      const idx = inMemoryOrders.findIndex(o => o.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Order not found' });

      if (inMemoryOrders[idx].otp_code !== otp) {
        return res.status(400).json({ error: 'Invalid OTP code. Please check and try again.' });
      }

      inMemoryOrders[idx].order_status = 'delivered';
      inMemoryOrders[idx].otp_verified = true;
      inMemoryOrders[idx].delivered_at = new Date().toISOString();
      inMemoryOrders[idx].updated_at = new Date().toISOString();
      
      if (inMemoryOrders[idx].payment_method === 'COD') {
        inMemoryOrders[idx].payment_status = 'PAYMENT COMPLETED';
        inMemoryOrders[idx].payment_time = new Date().toISOString();
        inMemoryOrders[idx].razorpay_transaction_id = 'txn_cod_' + Date.now();
      }

      broadcast({ type: 'ORDER_UPDATED', order: inMemoryOrders[idx] });
      return res.json({ 
        message: 'OTP verified and order delivered successfully (Mock Mode)', 
        order: inMemoryOrders[idx] 
      });
    }

    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !order) return res.status(404).json({ error: 'Order not found' });

    const meta = getMetadata(id);
    if (meta.otp_code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP code. Please check and try again.' });
    }

    // Set rich metadata updates
    const nowStr = new Date().toISOString();
    const mockTxnId = 'txn_cod_' + Date.now();
    
    setMetadata(id, {
      otp_verified: true,
      delivered_at: nowStr,
      metadata_status: 'delivered',
      payment_status: 'PAYMENT COMPLETED',
      payment_time: nowStr,
      razorpay_transaction_id: mockTxnId,
      payment_method: 'COD'
    });

    const updatePayload = {
      order_status: mapStatusToDb('delivered'),
      updated_at: nowStr
    };

    if (order.payment_method === 'COD') {
      updatePayload.payment_status = 'paid';
    }

    // Log the cash payment in public.payments table
    try {
      const amount = order.total_amount || 0;
      await supabase
        .from('payments')
        .insert([
          {
            order_id: id,
            razorpay_payment_id: mockTxnId,
            razorpay_order_id: 'cod_order',
            razorpay_signature: 'COD', // signifies payment method
            amount,
            status: 'paid' // SUCCESS / PAYMENT COMPLETED
          }
        ]);
      console.log(`[Order Controller] Logged successful COD cash receipt in payments table for order ${id}.`);
    } catch (payErr) {
      console.error('[Order Controller] Failsafe: could not write payment row:', payErr.message);
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_order,
          products (
            id,
            name,
            image_url,
            category
          )
        )
      `)
      .single();

    if (error) throw error;

    const mergedOrder = mergeOrderWithMetadata(updatedOrder);
    broadcast({ type: 'ORDER_UPDATED', order: mergedOrder });
    
    res.json({ 
      message: 'OTP verified and order delivered successfully', 
      order: mergedOrder 
    });
  } catch (err) {
    console.error('Error verifying delivery OTP:', err);
    res.status(500).json({ error: 'Failed to verify delivery OTP' });
  }
};


// Admin: Dashboard Analytics
export const getAdminAnalytics = async (req, res) => {
  try {
    // Collect active order records source
    const orders = isMockMode ? inMemoryOrders : null;
    
    // If not mock mode, fetch from DB
    let activeOrdersList = orders;
    if (!isMockMode) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          payment_status,
          order_status,
          created_at,
          order_items (
            quantity,
            products (
              category
            )
          )
        `);
      if (error) throw error;
      activeOrdersList = data;
    }

    let totalOrders = activeOrdersList.length;
    let totalRevenue = 0;
    let pendingDeliveries = 0;
    let deliveredOrders = 0;

    const salesByDate = {};
    const salesByCategory = {};

    activeOrdersList.forEach(order => {
      const amt = parseFloat(order.total_amount);
      
      if (order.payment_status === 'paid') {
        totalRevenue += amt;
      }
      
      if (order.order_status === 'delivered') {
        deliveredOrders += 1;
      } else if (['pending', 'preparing', 'out_for_delivery'].includes(order.order_status)) {
        pendingDeliveries += 1;
      }

      const dateStr = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      salesByDate[dateStr] = (salesByDate[dateStr] || 0) + (order.payment_status === 'paid' ? amt : 0);

      order.order_items?.forEach(item => {
        const cat = item.products?.category || 'Classics';
        salesByCategory[cat] = (salesByCategory[cat] || 0) + item.quantity;
      });
    });

    // Provide default date series if empty
    if (Object.keys(salesByDate).length === 0) {
      salesByDate[new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
    }

    const chartData = Object.keys(salesByDate).map(date => ({
      date,
      sales: parseFloat(salesByDate[date].toFixed(2))
    })).slice(-7);

    const categoryData = Object.keys(salesByCategory).map(name => ({
      name,
      value: salesByCategory[name]
    }));

    // If category list is empty, fill with default structure
    const finalCategoryData = categoryData.length > 0 ? categoryData : [
      { name: 'Classics', value: 0 },
      { name: 'Citrus', value: 0 },
      { name: 'Shakes', value: 0 },
      { name: 'Berry', value: 0 }
    ];

    res.json({
      metrics: {
        totalOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        pendingDeliveries,
        deliveredOrders
      },
      charts: {
        salesHistory: chartData.length > 0 ? chartData : [{ date: 'Today', sales: 0 }],
        categoryPopularity: finalCategoryData
      }
    });
  } catch (err) {
    console.error('Error fetching admin analytics:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
};
