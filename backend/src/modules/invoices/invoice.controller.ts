import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { Invoice } from '../../models/invoice.model.js';
import { Order } from '../../models/order.model.js';
import { InvoicePdfService } from '../../integrations/pdf/pdf.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class InvoiceController {
  static async downloadInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      let invoice = await Invoice.findOne({ orderId });

      if (!invoice) {
        ApiResponse.error({
          res,
          statusCode: 404,
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice has not been generated for this order yet.',
        });
        return;
      }

      // Check if file exists on disk, if not regenerate
      if (!invoice.pdfPath || !fs.existsSync(invoice.pdfPath)) {
        const order = await Order.findById(orderId);
        if (order) {
          const newPath = await InvoicePdfService.generateInvoicePdf(order, invoice);
          invoice.pdfPath = newPath;
          await invoice.save();
        }
      }

      if (invoice.pdfPath && fs.existsSync(invoice.pdfPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
        const fileStream = fs.createReadStream(invoice.pdfPath);
        fileStream.pipe(res);
      } else {
        ApiResponse.error({
          res,
          statusCode: 500,
          code: 'PDF_STREAM_ERROR',
          message: 'Could not stream PDF file.',
        });
      }
    } catch (error) {
      next(error);
    }
  }
}
