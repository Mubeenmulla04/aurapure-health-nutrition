import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export const TrackOrderPage: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !phoneOrEmail) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get('/orders/track', {
        params: { orderNumber: orderNumber.trim(), phoneOrEmail: phoneOrEmail.trim() },
      });
      setResult(res.data?.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'No matching order found. Please check your credentials.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { key: 'CONFIRMED', label: 'Order Placed & Verified' },
    { key: 'PROCESSING', label: 'Freshly Packed at Warehouse' },
    { key: 'SHIPPED', label: 'Handed Over to Courier' },
    { key: 'DELIVERED', label: 'Successfully Delivered' },
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const orderLevels: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 1,
      PROCESSING: 2,
      SHIPPED: 3,
      OUT_FOR_DELIVERY: 3,
      DELIVERED: 4,
    };
    const currentLevel = orderLevels[currentStatus] || 1;
    const stepLevel = orderLevels[stepKey] || 1;

    if (currentLevel >= stepLevel) return 'completed';
    if (currentLevel + 1 === stepLevel) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-dark">Live Order Tracking</h1>
        <p className="text-sm text-brand-subtext max-w-md mx-auto">
          Enter your AuraPure Order Number and the mobile number or email used during checkout.
        </p>
      </div>

      {/* Tracking Form */}
      <div className="bg-white rounded-3xl border border-brand-muted/80 p-6 sm:p-8 shadow-subtle">
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-brand-dark block mb-1">Order Number *</label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. AP-2026-1001"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-muted text-sm uppercase font-semibold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-dark block mb-1">Phone or Email *</label>
              <input
                type="text"
                required
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder="9876543210 or your email"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !orderNumber || !phoneOrEmail}
            className="w-full btn-primary gap-2 !py-3.5 text-sm font-semibold shadow-card"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? 'Checking Logistics Network...' : 'Track Shipment Status'}</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-brand-error flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tracking Timeline Result */}
      {result && (
        <div className="bg-white rounded-3xl border border-brand-muted/80 p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-brand-muted/70 gap-2">
            <div>
              <span className="text-xs text-brand-subtext">Tracking Order:</span>
              <h3 className="font-serif text-xl font-bold text-brand-dark">{result.order.orderNumber}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-glow text-brand-primary">
                Status: {result.order.orderStatus}
              </span>
            </div>
          </div>

          {/* Stepper Visualizer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {steps.map((step, idx) => {
              const state = getStepStatus(step.key, result.order.orderStatus);
              return (
                <div key={idx} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      state === 'completed'
                        ? 'bg-brand-sage text-white'
                        : state === 'active'
                        ? 'bg-brand-primary text-white ring-4 ring-brand-glow'
                        : 'bg-brand-secondary text-brand-subtext'
                    }`}
                  >
                    {state === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span className="text-xs font-semibold text-brand-dark leading-tight">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Courier and AWB info */}
          {result.shipment && (
            <div className="p-4 rounded-2xl bg-brand-secondary/40 border border-brand-muted/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-brand-subtext block">Logistics Partner:</span>
                <strong className="text-brand-dark text-sm">{result.shipment.courierName || 'Shiprocket Air'}</strong>
                <span className="text-brand-subtext block mt-0.5">AWB: {result.shipment.awbCode || 'Pending Assignment'}</span>
              </div>

              {result.shipment.trackingUrl && (
                <a
                  href={result.shipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline !text-xs !py-2 gap-1.5 self-start sm:self-auto"
                >
                  <span>Live Courier Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
