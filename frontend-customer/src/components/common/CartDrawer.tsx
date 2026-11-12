import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { cart, isCartDrawerOpen, closeCartDrawer, updateQuantity, removeItem } = useCart();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCartDrawer}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-brand-muted/70 flex items-center justify-between bg-brand-bg/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-glow text-brand-primary flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark">
                  Your Shopping Bag
                </h3>
                <span className="text-[11px] text-brand-subtext font-medium">
                  {cart.totalItemsCount} {cart.totalItemsCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
            <button
              onClick={closeCartDrawer}
              className="w-10 h-10 rounded-full hover:bg-brand-muted/70 text-brand-subtext hover:text-brand-dark transition-colors flex items-center justify-center -mr-2"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="p-4 bg-brand-secondary/40 border-b border-brand-muted/60">
            {cart.isFreeShipping ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary">
                <CheckCircle2 className="w-4 h-4 text-brand-sage" />
                <span>Congratulations! You have unlocked Free Express Shipping!</span>
              </div>
            ) : (
              <div>
                <p className="text-xs text-brand-dark font-medium mb-1.5">
                  Add <strong className="text-brand-primary">₹{cart.freeShippingShortfall}</strong> more for{' '}
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

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-brand-muted/60">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-brand-secondary flex items-center justify-center text-brand-subtext">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <h4 className="font-serif text-xl font-bold text-brand-dark">Your bag is empty</h4>
                <p className="text-xs sm:text-sm text-brand-subtext max-w-xs">
                  Discover clean, functional nutrition crafted with Indian botanical adaptogens.
                </p>
                <Link
                  to="/collections/plant-protein-powder"
                  onClick={closeCartDrawer}
                  className="btn-primary !text-xs !py-3 !px-6 mt-2"
                >
                  Explore Plant Proteins
                </Link>
              </div>
            ) : (
              cart.items.map((item) => (
                <div key={item.variantId} className="py-3.5 sm:py-4 flex gap-3 sm:gap-4">
                  <div className="w-20 h-20 rounded-xl bg-brand-secondary/50 overflow-hidden flex-shrink-0 border border-brand-muted/40">
                    <img src={item.image} alt={item.productTitle} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-brand-dark line-clamp-1">{item.productTitle}</h4>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="w-8 h-8 -mr-1.5 -mt-1 flex items-center justify-center rounded-full text-brand-subtext hover:text-brand-error hover:bg-red-50 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[11px] sm:text-xs text-brand-subtext mt-0.5">
                        {item.flavor} • {item.packSize}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity Stepper (min 36px touch targets) */}
                      <div className="flex items-center border border-brand-muted rounded-full overflow-hidden bg-brand-bg/50">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-brand-subtext hover:text-brand-dark hover:bg-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-brand-dark">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-brand-subtext hover:text-brand-dark hover:bg-white transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-brand-dark">₹{item.total}</span>
                        {item.mrp > item.unitPrice && (
                          <span className="block text-[10px] text-brand-subtext line-through">
                            ₹{item.mrp * item.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-brand-muted/80 bg-brand-bg/40 space-y-3 pb-safe">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-brand-subtext">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brand-dark">₹{cart.subtotal}</span>
                </div>
                {cart.couponDiscount > 0 && (
                  <div className="flex justify-between text-brand-sage font-medium">
                    <span>Coupon Discount</span>
                    <span>-₹{cart.couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-brand-subtext">
                  <span>Estimated Shipping</span>
                  <span className="font-medium text-brand-dark">
                    {cart.shippingFee === 0 ? (
                      <span className="text-brand-sage font-semibold uppercase">Free</span>
                    ) : (
                      `₹${cart.shippingFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-brand-dark pt-2 border-t border-brand-muted/60">
                  <span>Estimated Total</span>
                  <span className="text-brand-primary">₹{cart.finalTotal}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    closeCartDrawer();
                    navigate('/cart');
                  }}
                  className="btn-outline !py-3 !text-xs font-semibold"
                >
                  View Full Bag
                </button>
                <button
                  onClick={() => {
                    closeCartDrawer();
                    navigate('/checkout');
                  }}
                  className="btn-primary !py-3 !text-xs font-semibold gap-1.5 shadow-card"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[10px] text-center text-brand-subtext">
                GST (18%) included • Free delivery above ₹999 • Razorpay Encrypted
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
