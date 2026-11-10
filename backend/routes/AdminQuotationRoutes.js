import { Router } from 'express';
import { approve, convert, getQuotation, listQuotations, reject } from '../controllers/AdminQuotationController.js';
import { validateBody, validateQuery } from '../middleware/ValidationMiddleware.js';
import { validateApproval, validateQuotationQuery, validateRejection } from '../validators/QuotationValidator.js';

const router = Router(); // mounted under /api/admin/quotations, for admin and staff (staff prepare and answer quotations)
router.get('/', validateQuery(validateQuotationQuery), listQuotations);
router.get('/:id', getQuotation);
router.put('/:id/approve', validateBody(validateApproval), approve);
router.put('/:id/reject', validateBody(validateRejection), reject);
router.post('/:id/convert', convert);
export default router;
