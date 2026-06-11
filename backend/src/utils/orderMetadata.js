import fs from 'fs';
import path from 'path';

const METADATA_FILE = path.join(process.cwd(), 'order-metadata-store.json');
let store = {};

// Load store on startup
try {
  if (fs.existsSync(METADATA_FILE)) {
    store = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  }
} catch (err) {
  console.error('[Order Metadata Store] Error loading metadata store:', err);
}

const saveStore = () => {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('[Order Metadata Store] Error saving metadata store:', err);
  }
};

export const getMetadata = (orderId) => {
  if (!orderId) return null;
  return store[orderId] || {
    otp_code: null,
    otp_verified: false,
    accepted_at: null,
    delivered_at: null,
    metadata_status: null
  };
};

export const setMetadata = (orderId, updates) => {
  if (!orderId) return null;
  
  const current = getMetadata(orderId);
  store[orderId] = {
    ...current,
    ...updates
  };
  saveStore();
  return store[orderId];
};

// Map rich statuses to Supabase allowed statuses
export const mapStatusToDb = (status) => {
  if (!status) return undefined;
  if (status === 'accepted') return 'preparing';
  if (status === 'otp_pending') return 'out_for_delivery';
  if (status === 'rejected') return 'rejected';
  return status; // 'pending', 'preparing', 'out_for_delivery', 'delivered', 'rejected'
};

export const mergeOrderWithMetadata = (order) => {
  if (!order) return null;
  const meta = getMetadata(order.id);
  const merged = {
    ...order,
    ...meta
  };
  
  // Custom Order Code fallback generation (BFJ-2026-XXXX) if order_code is null
  if (!merged.order_code) {
    const cleanId = order.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const shortHash = cleanId.substring(0, 4) || '7777';
    merged.order_code = `BFJ-2026-${shortHash}`;
  }

  // If rich status exists in metadata, override the db status
  if (meta.metadata_status) {
    merged.order_status = meta.metadata_status;
  }
  if (meta.payment_status) {
    merged.payment_status = meta.payment_status;
  }
  return merged;
};

export const mergeOrdersWithMetadata = (orders) => {
  if (!orders) return [];
  if (!Array.isArray(orders)) {
    return [mergeOrderWithMetadata(orders)];
  }
  return orders.map(mergeOrderWithMetadata);
};
