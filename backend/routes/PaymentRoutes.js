import { Router } from 'express';
import { createRazorpayOrder, razorpayWebhook, verifyRazorpayPayment } from '../controllers/PaymentController.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { validateBody } from '../middleware/ValidationMiddleware.js';
import { validateRazorpayVerification } from '../validators/OrderValidator.js';

const router = Router();

// Called by Razorpay's servers, authenticated by signature (not a login). Receives the raw body: see server.js.
router.post('/razorpay/webhook', razorpayWebhook);

router.post('/razorpay/order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, validateBody(validateRazorpayVerification), verifyRazorpayPayment);

export default router;
