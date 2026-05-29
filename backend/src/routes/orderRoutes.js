import express from 'express';
import { 
  createOrder, 
  getMyOrders, 
  getAllOrders, 
  updateOrderStatus, 
  getAdminAnalytics,
  verifyDeliveryDistance,
  sendDeliveryOTP,
  verifyDeliveryOTP
} from '../controllers/orderController.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/authMiddleware.js';


const router = express.Router();

// Customer/Public routes
router.post('/verify-distance', verifyDeliveryDistance);
router.post('/', optionalAuth, createOrder);  // Allow guest orders
router.get('/my', requireAuth, getMyOrders);


// Admin-only routes
router.get('/', requireAdmin, getAllOrders);
router.put('/:id', requireAdmin, updateOrderStatus);
router.post('/:id/send-otp', requireAdmin, sendDeliveryOTP);
router.post('/:id/verify-otp', requireAdmin, verifyDeliveryOTP);
router.get('/analytics', requireAdmin, getAdminAnalytics);

export default router;
