import express from 'express';
import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/paymentController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// optionalAuth: allows both logged-in users and guests to pay via Razorpay
router.post('/order', optionalAuth, createRazorpayOrder);
router.post('/verify', optionalAuth, verifyRazorpayPayment);

export default router;
