import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeItem, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    try {
      setIsApplying(true);
      setCouponError(null);
      await applyCoupon(couponInput.trim());
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
    } finally {
      setIsApplying(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-brand-secondary mx-auto flex items-center justify-center text-brand-subtext">
          <ShoppingBag className="w-10 h-10 opacity-40" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-brand-dark">Your Shopping Bag is Empty</h1>
        <p className="text-sm text-brand-subtext max-w-sm mx-auto">
          Explore our certified organic plant protein isolates and Ayurvedic botanical powders.
        </p>
        <Link to="/collections/plant-protein-powder" className="btn-primary !px-8 !py-3.5 mt-4">
          Discover Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="font-serif text-3xl font-bold text-brand-dark">Shopping Bag ({cart.totalItemsCount})</h1>

      {/* Free Shipping Progress Callout */}
      <div className="p-4 rounded-2xl bg-brand-secondary/50 border border-brand-muted/80">
        {cart.isFreeShipping ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary">
            <CheckCircle2 className="w-4 h-4 text-brand-sage" />
            <span>You have unlocked Free Express Air Delivery on this order!</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs text-brand-dark font-medium">
              Add <strong className="text-brand-primary">₹{cart.freeShippingShortfall}</strong> more to unlock{' '}
              <span className="font-bold">Free Express Delivery</span>
            </p>
            <div className="w-full h-2 rounded-full bg-brand-muted overflow-hidden">
              <div
                className="h-full bg-brand-primary rounded-full transition-all duration-300"
                style={{ width: `${cart.freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Line Items Table */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-brand-muted/80 divide-y divide-brand-muted/60 overflow-hidden shadow-subtle">
          {cart.items.map((item) => (
            <div key={item.variantId} className="p-4 sm:p-6 flex gap-3.5 sm:gap-6 items-start sm:items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-brand-secondary/60 overflow-hidden flex-shrink-0 border border-brand-muted/40">
                <img src={item.image} alt={item.productTitle} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <Link
                    to={`/products/${item.productSlug}`}
                    className="font-serif text-sm sm:text-base font-bold text-brand-dark hover:text-brand-primary transition-colors line-clamp-1"
                  >
                    {item.productTitle}
                  </Link>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="w-8 h-8 -mr-1.5 -mt-1 flex sm:hidden items-center justify-center rounded-full text-brand-subtext hover:text-brand-error"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] sm:text-xs text-brand-subtext">
                  {item.flavor} • {item.packSize}
                </p>
                <div className="text-xs font-semibold text-brand-primary pt-0.5">₹{item.unitPrice} each</div>

                {/* Mobile Stepper & Price in same row */}
                <div className="flex sm:hidden items-center justify-between pt-2">
                  <div className="flex items-center border border-brand-muted rounded-full bg-brand-bg">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-brand-subtext hover:text-brand-dark"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-brand-dark">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-brand-subtext hover:text-brand-dark"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-sm font-bold text-brand-dark">₹{item.total}</span>
                </div>
              </div>

              {/* Desktop Stepper */}
              <div className="hidden sm:flex items-center border border-brand-muted rounded-full bg-brand-bg px-2">
                <button
                  onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                  className="p-2 text-brand-subtext hover:text-brand-dark"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-bold text-brand-dark">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                  className="p-2 text-brand-subtext hover:text-brand-dark"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Desktop Line Total & Remove */}
              <div className="hidden sm:flex items-center gap-4">
                <span className="text-base font-bold text-brand-dark min-w-[70px] text-right">₹{item.total}</span>
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-brand-subtext hover:text-brand-error hover:bg-red-50 transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Coupon Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-brand-muted/80 p-6 space-y-5">
            <h3 className="font-serif text-lg font-bold text-brand-dark">Order Summary</h3>

            {/* Coupon Code Section */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-brand-dark flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-primary" />
                <span>Promotional Coupon</span>
              </span>

              {cart.coupon ? (
                <div className="p-3 rounded-xl bg-brand-glow/40 border border-brand-sage/30 flex items-center justify-between text-xs font-semibold text-brand-primary">
                  <span>Code: {cart.coupon.code} (-₹{cart.coupon.discountAmount})</span>
                  <button onClick={removeCoupon} className="text-brand-error hover:underline text-[11px]">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-muted text-xs uppercase font-semibold text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                    <button
                      type="submit"
                      disabled={isApplying || !couponInput.trim()}
                      className="btn-primary !px-4 !py-2.5 !text-xs"
                    >
                      Apply
                    </button>
                  </form>
                  {/* Quick-tap coupon tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-brand-subtext">Quick Apply:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCouponInput('AURAPURE10');
                        applyCoupon('AURAPURE10');
                      }}
                      className="px-2.5 py-1 rounded-full bg-brand-secondary hover:bg-brand-muted text-[10px] font-bold text-brand-primary transition-colors border border-brand-muted/60"
                    >
                      AURAPURE10 (10% OFF)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCouponInput('WELCOME200');
                        applyCoupon('WELCOME200');
                      }}
                      className="px-2.5 py-1 rounded-full bg-brand-secondary hover:bg-brand-muted text-[10px] font-bold text-brand-primary transition-colors border border-brand-muted/60"
                    >
                      WELCOME200 (₹200 OFF)
                    </button>
                  </div>
                </div>
              )}

              {couponError && (
                <p className="text-xs text-brand-error flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{couponError}</span>
                </p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs text-brand-subtext pt-3 border-t border-brand-muted/60">
              <div className="flex justify-between">
                <span>Cart Subtotal</span>
                <span className="font-semibold text-brand-dark">₹{cart.subtotal}</span>
              </div>
              {cart.couponDiscount > 0 && (
                <div className="flex justify-between text-brand-sage font-medium">
                  <span>Coupon Discount</span>
                  <span>-₹{cart.couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Charges</span>
                <span className="font-semibold text-brand-dark">
                  {cart.shippingFee === 0 ? <span className="text-brand-sage uppercase">Free</span> : `₹${cart.shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST (18% inclusive)</span>
                <span className="font-semibold text-brand-dark">₹{cart.taxGst}</span>
              </div>

              <div className="flex justify-between text-base font-bold text-brand-dark pt-3 border-t border-brand-muted/80">
                <span>Total Amount</span>
                <span>₹{cart.finalTotal}</span>
              </div>
            </div>

            <button onClick={() => navigate('/checkout')} className="w-full btn-primary gap-2 !py-4 shadow-card">
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Checkout Bar */}
      <div className="fixed bottom-16 left-0 right-0 p-3.5 bg-white/95 backdrop-blur-md border-t border-brand-muted/80 shadow-floating sm:hidden z-30 flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-brand-subtext block uppercase font-medium">Payable Total</span>
          <span className="text-base font-bold text-brand-primary">₹{cart.finalTotal}</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="btn-primary !py-3 !px-6 !text-xs font-semibold gap-2 shadow-card"
        >
          <span>Checkout</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
