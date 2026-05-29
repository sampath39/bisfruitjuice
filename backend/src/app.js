import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading images across origins
}));
app.use(cors());
app.use(morgan('dev'));

// Setup body parsing with large limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic Health Check Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Bismilla Fruit Juice API Server!',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Register API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// 404 Route Not Found Middleware
app.use((req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal server error occurred',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

import { initWebSocket } from './config/websocket.js';

// Start Server
const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 BISMILLA FRUIT JUICE SERVER LISTENING ON PORT ${PORT}`);
  console.log(`🔗 API Base Url: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});

initWebSocket(server);

export default app;
