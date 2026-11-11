import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Download, MessageSquare, ArrowRight, Package, Home } from 'lucide-react';
import { api } from '../services/api';
import { Order } from '../types';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (orderId) {
      api
        .get(`/orders/${orderId}`)
        .then((res) => {
          if (res.data?.data) {
            setOrder(res.data.data.order);
            setInvoiceUrl(res.data.data.invoice?.pdfUrl || `/api/v1/invoices/${orderId}/download`);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      {/* Success Card Header */}
      <div className="bg-white rounded-3xl border border-brand-muted/80 p-8 sm:p-12 text-center space-y-4 shadow-card">
        <div className="w-16 h-16 rounded-full bg-brand-glow text-brand-primary mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-dark">
          Order Confirmed!
        </h1>
        <p className="text-sm text-brand-subtext max-w-md mx-auto">
          Thank you for fueling your wellness with AuraPure clean plant nutrition. Your order is being freshly prepared for dispatch.
        </p>

        <div className="inline-block px-4 py-2 rounded-2xl bg-brand-secondary/60 border border-brand-muted text-xs font-bold text-brand-primary">
          Order Number: {order?.orderNumber || orderId}
        </div>

        {/* WhatsApp Notice */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-center gap-2 max-w-md mx-auto">
          <MessageSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>We have dispatched your order details and invoice receipt to your WhatsApp number!</span>
        </div>

        {/* Download Invoice Action */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <a
            href={invoiceUrl ? `http://localhost:5000${invoiceUrl}` : '#'}
            target="_blank"
            rel="noreferrer"
            className="btn-primary gap-2 !py-3 !px-6 text-xs shadow-subtle"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Tax Invoice</span>
          </a>

          <Link to="/" className="btn-secondary gap-2 !py-3 !px-6 text-xs">
            <Home className="w-4 h-4" />
            <span>Return to Store</span>
          </Link>
        </div>
      </div>

      {/* Order Summary Details */}
      {order && (
        <div className="bg-white rounded-3xl border border-brand-muted/80 p-6 sm:p-8 space-y-6">
          <h3 className="font-serif text-xl font-bold text-brand-dark">Ordered Items</h3>

          <div className="divide-y divide-brand-muted/60">
            {order.items.map((item) => (
              <div key={item.variantId} className="py-3.5 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-brand-secondary overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-brand-dark">{item.title}</h4>
                  <p className="text-xs text-brand-subtext">
                    {item.flavor} • {item.packSize} • Qty: {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-bold text-brand-dark">₹{item.total}</span>
              </div>
            ))}
          </div>

          {/* Delivery Address & Financial Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-brand-muted/70 text-xs">
            <div>
              <span className="font-bold text-brand-dark uppercase tracking-wider block mb-1">Delivering To:</span>
              <p className="text-brand-subtext leading-relaxed">
                <strong className="text-brand-dark">{order.shippingAddress.fullName}</strong><br />
                {order.shippingAddress.addressLine1}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
                Phone: {order.shippingAddress.phone}
              </p>
            </div>

            <div className="space-y-1.5 text-right sm:border-l sm:border-brand-muted/60 sm:pl-6">
              <div className="flex justify-between text-brand-subtext">
                <span>Subtotal</span>
                <span>₹{order.pricing.subtotal}</span>
              </div>
              {order.pricing.couponDiscount > 0 && (
                <div className="flex justify-between text-brand-sage">
                  <span>Discount</span>
                  <span>-₹{order.pricing.couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-brand-subtext">
                <span>Shipping</span>
                <span>{order.pricing.shippingFee === 0 ? 'FREE' : `₹${order.pricing.shippingFee}`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-brand-dark pt-2 border-t border-brand-muted/70">
                <span>Total Paid</span>
                <span className="text-brand-primary">₹{order.pricing.finalTotal}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
