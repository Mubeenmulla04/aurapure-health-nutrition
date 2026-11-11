import { Router } from 'express';
import { InvoiceController } from './invoice.controller.js';

const router = Router();

router.get('/:orderId/download', InvoiceController.downloadInvoice);

export const invoiceRoutes = router;
