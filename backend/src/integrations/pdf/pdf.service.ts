import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { IOrder } from '../../models/order.model.js';
import { IInvoice } from '../../models/invoice.model.js';
import { CurrencyUtils } from '../../utils/currency.js';
import { logger } from '../../utils/logger.js';

export class InvoicePdfService {
  /**
   * Generates a PDF invoice for an order and returns the file path
   */
  static async generateInvoicePdf(order: IOrder, invoice: IInvoice): Promise<string> {
    const invoicesDir = path.resolve(process.cwd(), 'uploads', 'invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const filePath = path.join(invoicesDir, `${invoice.invoiceNumber}.pdf`);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header Brand Info
      doc
        .fillColor('#1B4332')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('AuraPure Nutrition', 40, 40);

      doc
        .fillColor('#5C5C60')
        .fontSize(9)
        .font('Helvetica')
        .text('100% Clean Plant Protein & Botanical Superfoods', 40, 68)
        .text('108 Bio-Valley Tech Park, Whitefield, Bengaluru, KA 560066', 40, 80)
        .text('GSTIN: 29ABCDE1234F1Z5 | PAN: ABCDE1234F | support@aurapure.in', 40, 92);

      // Invoice Badge on right
      doc
        .fillColor('#1B4332')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('TAX INVOICE', 400, 40, { align: 'right' });

      doc
        .fillColor('#1C1C1E')
        .fontSize(9)
        .font('Helvetica')
        .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 65, { align: 'right' })
        .text(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 400, 78, { align: 'right' })
        .text(`Order No: ${order.orderNumber}`, 400, 91, { align: 'right' });

      // Horizontal Divider
      doc.strokeColor('#EAE6E1').lineWidth(1).moveTo(40, 115).lineTo(555, 115).stroke();

      // Bill To / Ship To Section
      doc
        .fillColor('#1B4332')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('BILLED & SHIPPED TO:', 40, 130);

      doc
        .fillColor('#1C1C1E')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(order.shippingAddress.fullName, 40, 145);

      doc
        .font('Helvetica')
        .fillColor('#5C5C60')
        .text(order.shippingAddress.addressLine1, 40, 158)
        .text(
          `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
          40,
          170
        )
        .text(`Phone: ${order.shippingAddress.phone}`, 40, 182);

      // Payment Details Box on Right
      doc
        .fillColor('#1B4332')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('PAYMENT DETAILS:', 350, 130);

      doc
        .fillColor('#5C5C60')
        .fontSize(9)
        .font('Helvetica')
        .text(`Payment Gateway: Razorpay Secure`, 350, 145)
        .text(`Payment Status: ${order.paymentStatus}`, 350, 158)
        .text(`Payment Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 350, 170);

      // Items Table Header
      let y = 210;
      doc.rect(40, y, 515, 22).fill('#F4EFEA');

      doc
        .fillColor('#1B4332')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('ITEM DESCRIPTION', 48, y + 6)
        .text('SKU', 250, y + 6)
        .text('QTY', 340, y + 6)
        .text('PRICE', 410, y + 6)
        .text('TOTAL', 480, y + 6, { align: 'right', width: 65 });

      y += 28;

      // Table Rows
      order.items.forEach((item) => {
        doc
          .fillColor('#1C1C1E')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(item.title, 48, y, { width: 195 });

        doc
          .fillColor('#5C5C60')
          .fontSize(8)
          .font('Helvetica')
          .text(`${item.flavor} | ${item.packSize}`, 48, y + 12);

        doc.text(item.sku, 250, y);
        doc.text(item.quantity.toString(), 345, y);
        doc.text(CurrencyUtils.formatINR(item.unitPrice), 410, y);
        doc.text(CurrencyUtils.formatINR(item.total), 480, y, { align: 'right', width: 65 });

        y += 28;
      });

      // Divider
      doc.strokeColor('#EAE6E1').lineWidth(1).moveTo(40, y).lineTo(555, y).stroke();
      y += 15;

      // Financial Calculation Block
      const rightX = 380;
      doc.fontSize(9).font('Helvetica');

      doc.fillColor('#5C5C60').text('Subtotal (MRP/Base):', rightX, y);
      doc.fillColor('#1C1C1E').text(CurrencyUtils.formatINR(order.pricing.subtotal), 480, y, { align: 'right', width: 65 });
      y += 16;

      if (order.pricing.couponDiscount > 0) {
        doc.fillColor('#2A9D8F').text(`Discount (${order.pricing.couponCode || 'Coupon'}):`, rightX, y);
        doc.text(`-${CurrencyUtils.formatINR(order.pricing.couponDiscount)}`, 480, y, { align: 'right', width: 65 });
        y += 16;
      }

      doc.fillColor('#5C5C60').text('CGST (9%):', rightX, y);
      doc.fillColor('#1C1C1E').text(CurrencyUtils.formatINR(invoice.taxBreakup.cgst), 480, y, { align: 'right', width: 65 });
      y += 16;

      doc.fillColor('#5C5C60').text('SGST (9%):', rightX, y);
      doc.fillColor('#1C1C1E').text(CurrencyUtils.formatINR(invoice.taxBreakup.sgst), 480, y, { align: 'right', width: 65 });
      y += 16;

      doc.fillColor('#5C5C60').text('Shipping & Handling:', rightX, y);
      doc.fillColor('#1C1C1E').text(order.pricing.shippingFee === 0 ? 'FREE' : CurrencyUtils.formatINR(order.pricing.shippingFee), 480, y, { align: 'right', width: 65 });
      y += 18;

      // Total Line Highlight
      doc.rect(rightX - 10, y - 4, 185, 26).fill('#1B4332');
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold').text('Total Payable:', rightX, y + 4);
      doc.text(CurrencyUtils.formatINR(order.pricing.finalTotal), 480, y + 4, { align: 'right', width: 65 });

      // Footer
      doc
        .fillColor('#8C8C90')
        .fontSize(8)
        .font('Helvetica')
        .text(
          'This is a computer-generated invoice and requires no physical signature. Registered under the GST Act.',
          40,
          750,
          { align: 'center', width: 515 }
        )
        .text('Thank you for fueling your health with AuraPure Clean Plant Nutrition!', 40, 762, {
          align: 'center',
          width: 515,
        });

      doc.end();

      stream.on('finish', () => {
        logger.info(`Invoice PDF generated successfully at ${filePath}`);
        resolve(filePath);
      });

      stream.on('error', (err) => {
        logger.error('Error writing invoice PDF stream:', err);
        reject(err);
      });
    });
  }
}
