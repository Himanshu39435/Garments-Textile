import { Router } from 'express';
import { createAddress, deleteAddress, listAddresses, updateAddress } from '../controllers/AddressController.js';
import { protect } from '../middleware/AuthMiddleware.js';
import { validateBody } from '../middleware/ValidationMiddleware.js';
import { validateAddress } from '../validators/AddressValidator.js';

const router = Router();
router.use(protect);
router.get('/', listAddresses);
router.post('/', validateBody(validateAddress), createAddress);
router.put('/:id', validateBody(validateAddress), updateAddress);
router.delete('/:id', deleteAddress);

export default router;
