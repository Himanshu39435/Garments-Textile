import 'dotenv/config';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase, getDatabaseState } from './config/databaseConfig.js';
import { notFoundHandler, errorHandler } from './middleware/ErrorMiddleware.js';
import ApiResponse from './utils/ApiResponse.js';
import { UPLOAD_DIR } from './services/CloudinaryService.js';
import newsletterRoutes from './routes/NewsletterRoutes.js';
import categoryRoutes from './routes/CategoryRoutes.js';
import productRoutes from './routes/ProductRoutes.js';
import authRoutes from './routes/AuthRoutes.js';
import customerRoutes from './routes/CustomerRoutes.js';
import adminRoutes from './routes/AdminRoutes.js';
import addressRoutes from './routes/AddressRoutes.js';
import cartRoutes from './routes/CartRoutes.js';
import orderRoutes from './routes/OrderRoutes.js';
import paymentRoutes from './routes/PaymentRoutes.js';
import quotationRoutes from './routes/QuotationRoutes.js';
import staffRoutes from './routes/StaffRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) app.set('trust proxy', 1); // correct client IPs for rate limiting behind a proxy/load balancer
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
// Razorpay signs the exact bytes it sends, so the webhook must receive the raw body (before express.json).
app.use('/api/payments/razorpay/webhook', express.raw({ type: 'application/json', limit: '1mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (!isProduction) app.use(morgan('dev'));

// Local image fallback used only in development when Cloudinary is not configured. The storefront is on another origin, so allow cross-origin image loads.
if (!isProduction) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  app.use('/uploads', (_req, res, next) => { res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); next(); }, express.static(UPLOAD_DIR, { maxAge: '7d' }));
}

app.get('/api/health', (_req, res) =>
  ApiResponse.ok(res, { status: 'ok', database: getDatabaseState(), uptime: process.uptime() }, 'NARANG TEXTILE API is running'),
);

app.use('/api', (_req, res, next) => {
  const database = getDatabaseState();
  if (database !== 'connected') {
    res.set('Retry-After', '5');
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Check the MongoDB connection and network access.',
      details: { database },
    });
  }
  return next();
});

// Feature routers are mounted here as each phase adds them.
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customer/addresses', addressRoutes); // before /api/customer so it is matched first
app.use('/api/customer', customerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));

async function connectWithRetry() {
  try {
    await connectDatabase();
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    if (isProduction) {
      process.exit(1);
      return;
    }
    console.warn('Continuing without a database (development only). Retrying in 5 seconds.');
    setTimeout(connectWithRetry, 5000);
  }
}

connectWithRetry();
