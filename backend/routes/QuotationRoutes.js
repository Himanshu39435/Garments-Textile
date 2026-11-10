import { Router } from 'express';
import { cancelMyQuotation, convertMyQuotation, getMyQuotation, listMyQuotations, requestQuotation } from '../controllers/QuotationController.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { validateBody, validateQuery } from '../middleware/ValidationMiddleware.js';
import { validateCheckout } from '../validators/OrderValidator.js';
import { validateQuotationQuery, validateQuoteRequest } from '../validators/QuotationValidator.js';

const router = Router();
router.use(protect);
router.post('/', validateBody(validateQuoteRequest), requestQuotation);
router.get('/', validateQuery(validateQuotationQuery), listMyQuotations);
router.get('/:id', getMyQuotation);
router.post('/:id/cancel', cancelMyQuotation);
router.post('/:id/convert', validateBody(validateCheckout), convertMyQuotation);

export default router;
