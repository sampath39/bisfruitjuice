import { supabase, isMockMode } from '../config/db.js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

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
        user_id: user_id || 'mock_user_id',
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
      
      inMemoryOrders.unshift(mockOrder);
      return res.status(201).json({
        message: 'Order created successfully (Mock Mode)',
        order: mockOrder
      });
    }

    // DB insert
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: user_id || req.user?.id || null,
          ...orderPayload
        }
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItemsToInsert = items.map(item => ({
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

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Get orders for current user
export const getMyOrders = async (req, res) => {
  try {
    if (isMockMode) {
      // In mock mode, return all in-memory orders associated with the user
      return res.json(inMemoryOrders);
    }

    const userId = req.user.id;
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orders);
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
    res.json(orders);
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
      
      if (order_status) inMemoryOrders[idx].order_status = order_status;
      if (payment_status) inMemoryOrders[idx].payment_status = payment_status;

      if (order_status === 'delivered' && inMemoryOrders[idx].payment_method === 'COD') {
        inMemoryOrders[idx].payment_status = 'paid';
      }

      return res.json({ message: 'Order updated successfully (Mock Mode)', order: inMemoryOrders[idx] });
    }

    if (!order_status && !payment_status) {
      return res.status(400).json({ error: 'At least order_status or payment_status is required' });
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (order_status) updateData.order_status = order_status;
    if (payment_status) updateData.payment_status = payment_status;

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
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
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
