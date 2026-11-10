import { Router } from 'express';
import { changePassword, forgotPassword, getCurrentUser, login, register, resendOtp, resetPassword, verifyEmail } from '../controllers/AuthController.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { authLimiter, otpLimiter } from '../middleware/RateLimitMiddleware.js';
import { validateBody } from '../middleware/ValidationMiddleware.js';
import * as v from '../validators/AuthValidator.js';

const router = Router();
router.use(authLimiter);

router.post('/register', otpLimiter, validateBody(v.validateRegister), register);
router.post('/verify-otp', validateBody(v.validateVerifyOtp), verifyEmail);
router.post('/resend-otp', otpLimiter, validateBody(v.validateEmailOnly), resendOtp);
router.post('/login', validateBody(v.validateLogin), login);
router.post('/forgot-password', otpLimiter, validateBody(v.validateEmailOnly), forgotPassword);
router.post('/reset-password', validateBody(v.validateResetPassword), resetPassword);
router.get('/me', protect, getCurrentUser);
router.put('/password', protect, validateBody(v.validateChangePassword), changePassword);

export default router;
