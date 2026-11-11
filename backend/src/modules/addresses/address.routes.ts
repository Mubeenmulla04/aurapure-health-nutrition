import { Router } from 'express';
import { AddressController } from './address.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { addressSchema } from './address.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', AddressController.list);
router.post('/', validateRequest({ body: addressSchema }), AddressController.create);
router.put('/:id', validateRequest({ body: addressSchema.partial() }), AddressController.update);
router.delete('/:id', AddressController.remove);

export const addressRoutes = router;
