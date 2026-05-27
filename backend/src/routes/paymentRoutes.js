import express from 'express';
import { createRazorpayOrder, verifyRazorpayPayment } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/order', requireAuth, createRazorpayOrder);
router.post('/verify', requireAuth, verifyRazorpayPayment);

export default router;
