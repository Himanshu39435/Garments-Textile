import { Router } from 'express';
import { subscribe } from '../controllers/NewsletterController.js';
import { validateBody } from '../middleware/ValidationMiddleware.js';
import { validateSubscribe } from '../validators/NewsletterValidator.js';

const router = Router();
router.post('/subscribe', validateBody(validateSubscribe), subscribe);

export default router;
