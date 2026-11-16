import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ExternalLink,
  MapPin,
  CreditCard,
  Banknote,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Check,
  Sparkles,
} from 'lucide-react';
import { api, API_BASE_URL } from '../../services/api';
import { Order, ShipmentDetails } from '../../types';

interface OrderDetailsModalProps {
  orderId: string;
  onClose: () => void;
}

const PROGRESSION_STAGES = [
  { id: 'PENDING', label: 'Order Placed', desc: 'Order received and logged in system' },
  { id: 'CONFIRMED', label: 'Order Confirmed', desc: 'Payment or COD order verified' },
  { id: 'PROCESSING', label: 'Preparing Your Order', desc: 'Formulations being prepared & audited' },
  { id: 'READY_TO_SHIP', label: 'Ready for Pickup', desc: 'Packed and staged for courier collection' },
  { id: 'SHIPPED', label: 'Shipped', desc: 'Handed over to courier partner' },
  { id: 'IN_TRANSIT', label: 'In Transit', desc: 'Moving between logistics transit hubs' },
  { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Courier agent out for doorstep delivery' },
  { id: 'DELIVERED', label: 'Delivered', desc: 'Safely delivered to customer' },
];

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ orderId, onClose }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = () => {
    setIsLoading(true);
    setError(null);
    api
      .get(`/orders/${orderId}`)
      .then((res) => {
        if (res.data?.data) {
          setOrder(res.data.data.order);
          setShipment(res.data.data.shipment || res.data.data.order?.shipment || null);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error?.message || err.response?.data?.message || 'Could not load order details.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto" />
          <p className="text-xs font-semibold text-brand-dark">Loading verified order records...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 text-center">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-brand-dark">Order Access Notice</h3>
          <p className="text-xs text-brand-subtext">{error || 'Order record could not be found.'}</p>
          <button onClick={onClose} className="btn-primary !py-2.5 !px-6 !text-xs font-bold">
            Close
          </button>
        </div>
      </div>
    );
  }

  // Determine stage progression index based on genuine order.orderStatus
  const getStageIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PROCESSING':
      case 'PACKED':
        return 2;
      case 'READY_TO_SHIP':
        return 3;
      case 'SHIPPED':
        return 4;
      case 'IN_TRANSIT':
        return 5;
      case 'OUT_FOR_DELIVERY':
        return 6;
      case 'DELIVERED':
        return 7;
      default:
        return 1;
    }
  };

  const isExceptionStatus = [
    'CANCELLED',
    'RETURNED',
    'DELIVERY_FAILED',
    'FAILED_DELIVERY',
    'SHIPMENT_DELAYED',
    'RETURN_REQUESTED',
    'REFUND_INITIATED',
    'REFUNDED',
  ].includes(order.orderStatus);

  const effectiveStatus = order.orderStatus;
  const currentStageIndex = getStageIndex(effectiveStatus);

  // Match timeline events to stages
  const getTimelineEventForStage = (stageId: string) => {
    if (!order.orderTimeline || order.orderTimeline.length === 0) return null;
    if (stageId === 'PENDING') {
      return order.orderTimeline.find((t) => t.status === 'PLACED' || t.status === 'PENDING');
    }
    return order.orderTimeline.find((t) => t.status === stageId);
  };

  const awb = order.shipmentDetails?.awbNumber || shipment?.awbCode || shipment?.awbNumber;
  const courier = order.shipmentDetails?.courierName || shipment?.courierName || 'BlueDart Express Air';
  const trackingUrl = order.shipmentDetails?.trackingUrl || shipment?.trackingUrl || (awb ? `https://shiprocket.co/tracking/${awb}` : undefined);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-brand-muted/80 shadow-2xl relative flex flex-col">
        
        {/* Sticky Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 sm:px-8 py-4 border-b border-brand-muted/70 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-brand-dark">
                Order {order.orderNumber}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  order.orderStatus === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : order.orderStatus === 'CANCELLED'
                    ? 'bg-rose-100 text-rose-800'
                    : order.orderStatus === 'REFUNDED'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-brand-primary text-white'
                }`}
              >
                {order.orderStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-[11px] text-brand-subtext mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-brand-subtext hover:text-brand-dark hover:bg-brand-bg transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 flex-1">
          
          {/* Exception Banner (Cancelled / Delivery Failed / Return / Refunded) */}
          {isExceptionStatus && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
                order.orderStatus === 'CANCELLED'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : order.orderStatus === 'REFUNDED'
                  ? 'bg-purple-50 border-purple-200 text-purple-800'
                  : order.orderStatus === 'DELIVERY_FAILED'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {order.orderStatus === 'CANCELLED' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              ) : order.orderStatus === 'REFUNDED' ? (
                <RotateCcw className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold text-sm">Order Status: {order.orderStatus.replace(/_/g, ' ')}</p>
                {order.cancellationReason && (
                  <p className="text-[11px] leading-relaxed">Reason: {order.cancellationReason}</p>
                )}
                {order.orderStatus === 'REFUNDED' && (
                  <p className="text-[11px]">
                    The refund has been approved and credited back to your original payment method.
                  </p>
                )}
                {order.orderStatus === 'DELIVERY_FAILED' && (
                  <p className="text-[11px]">
                    Our courier executive attempted delivery but could not reach you. A reattempt is scheduled for tomorrow.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Genuine 8-Stage Progress Timeline */}
          {!isExceptionStatus && (
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-brand-bg/60 border border-brand-muted/70 space-y-4">
              {/* Contextual Milestone Notification Callout */}
              <div className="p-3 sm:p-4 rounded-xl bg-white border border-brand-primary/20 shadow-2xs flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
                  {currentStageIndex >= 7 ? (
                    <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
                  ) : currentStageIndex >= 4 ? (
                    <Truck className="w-5 h-5 text-brand-primary" />
                  ) : (
                    <Package className="w-5 h-5 text-brand-primary" />
                  )}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-brand-dark text-sm">
                    {currentStageIndex >= 7
                      ? 'Your order has been delivered successfully.'
                      : currentStageIndex === 6
                      ? 'Your order is out for delivery.'
                      : currentStageIndex === 5
                      ? 'Your order is in transit between logistics hubs.'
                      : currentStageIndex === 4
                      ? 'Your order has been shipped.'
                      : 'Your order is being prepared. We will share tracking updates once your shipment is dispatched.'}
                  </p>
                  <p className="text-[11px] text-brand-subtext mt-0.5">
                    {currentStageIndex >= 4 && awb
                      ? `Handed over to ${courier} (AWB: ${awb}).`
                      : 'Our quality team is preparing your package with tamper-evident seal.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Order Lifecycle Progress</span>
                </span>
                {shipment?.estimatedDeliveryDate && (
                  <span className="text-xs font-semibold text-brand-dark">
                    Est. Delivery: <strong>{new Date(shipment.estimatedDeliveryDate).toLocaleDateString('en-IN')}</strong>
                  </span>
                )}
              </div>

              {/* Progress Steps List */}
              <div className="relative pt-2">
                <div className="space-y-4">
                  {PROGRESSION_STAGES.map((stage, idx) => {
                    const isCompleted = idx <= currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    const event = getTimelineEventForStage(stage.id);

                    return (
                      <div key={stage.id} className="flex items-start gap-3.5 relative">
                        {/* Connecting Line */}
                        {idx < PROGRESSION_STAGES.length - 1 && (
                          <div
                            className={`absolute left-3.5 top-7 w-0.5 h-7 transition-colors ${
                              idx < currentStageIndex ? 'bg-brand-primary' : 'bg-brand-muted'
                            }`}
                          />
                        )}

                        {/* Step Check Icon */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-colors ${
                            isCurrent
                              ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20 shadow-xs'
                              : isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-brand-muted/60 text-brand-subtext'
                          }`}
                        >
                          {isCompleted && !isCurrent ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          )}
                        </div>

                        {/* Step Description & Actual Timestamps */}
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex items-baseline justify-between gap-2 flex-wrap">
                            <h4
                              className={`text-xs font-bold ${
                                isCurrent
                                  ? 'text-brand-primary text-sm'
                                  : isCompleted
                                  ? 'text-brand-dark'
                                  : 'text-brand-subtext'
                              }`}
                            >
                              {stage.label}
                            </h4>
                            {isCurrent && (
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-primary bg-brand-glow px-2 py-0.5 rounded-full">
                                Active Status
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-brand-subtext mt-0.5">{stage.desc}</p>

                          {/* Show genuine timestamp from timeline if completed */}
                          {isCompleted && event && (
                            <div className="text-[10px] font-medium text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 mt-1 border border-emerald-200">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              <span>
                                {new Date(event.timestamp).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {event.note && <span className="text-slate-600">• {event.note}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Logistics Tracking Card (If Dispatched) */}
          {awb ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-primary/30 ring-1 ring-brand-primary/10 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-brand-primary" />
                  <span className="text-xs font-bold text-brand-dark">
                    Carrier: {courier}
                  </span>
                </div>
                <div className="text-xs font-mono font-semibold text-brand-dark">
                  AWB: <span className="font-bold text-brand-primary">{awb}</span>
                </div>
              </div>

              {trackingUrl && (
                <div className="pt-1 flex justify-end">
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline !text-[11px] !py-1.5 !px-3 inline-flex items-center gap-1.5"
                  >
                    <span>Track Live on Courier Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            !isExceptionStatus && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-700" />
                  <span>Dispatch in Progress</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Your formulations are being carefully prepared and audited. We will update your tracking details and courier link once your package is dispatched from our central warehouse.
                </p>
              </div>
            )
          )}

          {/* Delivery Address & Customer Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-brand-bg/40 border border-brand-muted/70 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-brand-dark uppercase tracking-wider text-[10px]">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                <span>Delivery Address</span>
              </div>
              <p className="font-semibold text-brand-dark text-sm">{order.shippingAddress.fullName}</p>
              <p className="text-brand-subtext leading-relaxed">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                <span className="font-mono font-bold text-brand-dark">{order.shippingAddress.pincode}</span>
              </p>
              <p className="text-brand-subtext pt-1">
                Contact: <strong className="font-mono text-brand-dark">{order.shippingAddress.phone}</strong>
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-brand-bg/40 border border-brand-muted/70 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-brand-dark uppercase tracking-wider text-[10px]">
                <CreditCard className="w-3.5 h-3.5 text-brand-primary" />
                <span>Payment Summary</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-brand-subtext">Method:</span>
                <span className="font-bold text-brand-dark">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-subtext">Payment Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.paymentStatus === 'REFUNDED'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {order.paymentStatus === 'UNPAID' ? 'Cash on Delivery' : order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-brand-muted/60">
                <span className="font-bold text-brand-dark">Total Amount:</span>
                <span className="font-serif text-base font-bold text-brand-primary">
                  ₹{order.pricing.finalTotal}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark">
              Ordered Formulations ({order.items.length})
            </h4>

            <div className="divide-y divide-brand-muted/50 border border-brand-muted/70 rounded-2xl overflow-hidden bg-white">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-3.5 sm:p-4 flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-white border border-brand-muted p-1 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-brand-dark truncate">{item.title}</h5>
                    <p className="text-[11px] text-brand-subtext mt-0.5">
                      {item.flavor && `Flavor: ${item.flavor}`}
                      {item.packSize && ` • Pack: ${item.packSize}`}
                    </p>
                    <div className="text-[11px] text-brand-dark mt-1">
                      Qty: <strong>{item.quantity}</strong> × ₹{item.unitPrice}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-bold text-xs sm:text-sm text-brand-dark">
                      ₹{item.total || item.unitPrice * item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown Details */}
          <div className="p-4 rounded-2xl bg-brand-bg/40 border border-brand-muted/70 space-y-1.5 text-xs">
            <div className="flex justify-between text-brand-subtext">
              <span>Subtotal</span>
              <span className="font-mono text-brand-dark">₹{order.pricing.subtotal}</span>
            </div>
            {order.pricing.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>Coupon Discount ({order.pricing.couponCode})</span>
                <span className="font-mono">-₹{order.pricing.couponDiscount}</span>
              </div>
            )}
            <div className="flex justify-between text-brand-subtext">
              <span>GST (18% inclusive)</span>
              <span className="font-mono text-brand-dark">₹{order.pricing.taxGst}</span>
            </div>
            <div className="flex justify-between text-brand-subtext">
              <span>Shipping Fee</span>
              <span className="font-mono text-brand-dark">
                {order.pricing.shippingFee === 0 ? 'FREE' : `₹${order.pricing.shippingFee}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-brand-dark pt-2 border-t border-brand-muted/60">
              <span>Final Payable</span>
              <span className="font-serif text-brand-primary font-bold">
                ₹{order.pricing.finalTotal}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-brand-muted/60">
            {order.invoiceUrl ? (
              <a
                href={`${API_BASE_URL}${order.invoiceUrl}`}
                target="_blank"
                rel="noreferrer"
                className="btn-outline !text-xs !py-2.5 inline-flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Tax Invoice</span>
              </a>
            ) : (
              <span className="text-[11px] text-brand-subtext">Official tax invoice generated.</span>
            )}

            <button onClick={onClose} className="btn-primary !text-xs !py-2.5 !px-6 font-bold">
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
