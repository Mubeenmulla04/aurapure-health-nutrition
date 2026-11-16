import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useCart, CartItemData } from '../context/CartContext';
import { api } from '../services/api';
import { Product } from '../types';
import { ProductCard } from '../components/product/ProductCard';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeItem, applyCoupon, removeCoupon, isLoading } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [updatingVariantId, setUpdatingVariantId] = useState<string | null>(null);
  const [removingVariantId, setRemovingVariantId] = useState<string | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch featured products for the empty-cart recommendation grid
  useEffect(() => {
    if (cart.items.length === 0) {
      api
        .get('/products/featured')
        .then((res) => {
          if (res.data?.data?.products) {
            setFeaturedProducts(res.data.data.products.slice(0, 4));
          }
        })
        .catch(() => {});
    }
  }, [cart.items.length]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateQuantity = async (variantId: string, newQty: number, maxStock?: number) => {
    if (maxStock && newQty > maxStock) {
      showToast(`Maximum ${maxStock} units available for this formulation.`);
      return;
    }
    try {
      setUpdatingVariantId(variantId);
      await updateQuantity(variantId, newQty);
      if (newQty === 0) {
        showToast('Item removed from bag.');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not update quantity.');
    } finally {
      setUpdatingVariantId(null);
    }
  };

  const handleRemoveItem = async (item: CartItemData) => {
    try {
      setRemovingVariantId(item.variantId);
      await removeItem(item.variantId);
      showToast(`Removed ${item.productTitle} from bag.`);
    } catch (err: any) {
      showToast(err.message || 'Could not remove item.');
    } finally {
      setRemovingVariantId(null);
    }
  };

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) return;

    try {
      setIsApplyingCoupon(true);
      setCouponError(null);
      setCouponSuccess(null);
      await applyCoupon(code);
      setCouponSuccess(`Coupon ${code} applied successfully!`);
      setCouponInput('');
      showToast(`Promo code ${code} applied!`);
    } catch (err: any) {
      setCouponError(err.message || 'Invalid or inapplicable promotional coupon.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      setIsApplyingCoupon(true);
      setCouponError(null);
      setCouponSuccess(null);
      await removeCoupon();
      showToast('Coupon removed.');
    } catch (err: any) {
      setCouponError(err.message || 'Could not remove coupon.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // -------------------------------------------------------------
  // EMPTY SHOPPING BAG STATE (Premium Wellness Aesthetic)
  // -------------------------------------------------------------
  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
        {/* Empty State Banner */}
        <div className="max-w-2xl mx-auto text-center space-y-5 bg-white rounded-3xl p-8 sm:p-12 border border-brand-muted/80 shadow-subtle">
          <div className="w-20 h-20 rounded-full bg-brand-secondary/60 text-brand-primary mx-auto flex items-center justify-center border border-brand-muted/60 shadow-xs">
            <ShoppingBag className="w-9 h-9 stroke-[1.7]" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-primary">Clean Nutrition</span>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-brand-dark">Your Shopping Bag is Empty</h1>
            <p className="text-xs sm:text-sm text-brand-subtext max-w-md mx-auto leading-relaxed">
              You haven't added any clean-label formulations to your bag yet. Explore our cold-pressed plant proteins and Ayurvedic wellness essentials.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/collections"
              className="btn-primary !py-3.5 !px-8 text-xs sm:text-sm font-bold shadow-card active:scale-98 w-full sm:w-auto"
            >
              <span>Explore All Formulations</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
            <Link
              to="/"
              className="btn-secondary !py-3.5 !px-6 text-xs sm:text-sm font-semibold w-full sm:w-auto"
            >
              Return Home
            </Link>
          </div>
        </div>

        {/* Recommended Formulations Grid */}
        {featuredProducts.length > 0 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-primary">
                  Customer Favorites
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-dark mt-0.5">
                  Popular Clean Formulations
                </h2>
              </div>
              <Link to="/collections" className="text-xs font-bold text-brand-primary hover:underline">
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {featuredProducts.map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // FULL SHOPPING BAG (Non-Empty State)
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 pb-24 lg:pb-12">
      
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-muted/70 pb-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-brand-subtext mb-1">
            <Link to="/" className="hover:text-brand-primary">Home</Link>
            <span>/</span>
            <span className="font-semibold text-brand-dark">Shopping Bag</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-dark">
              Shopping Bag
            </h1>
            <span className="px-3 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
              {cart.totalItemsCount} {cart.totalItemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        <Link
          to="/collections"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {/* Free Shipping Progress Indicator */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-muted/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand-primary" />
            {cart.isFreeShipping ? (
              <span className="text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>You have unlocked <strong>Free Express Shipping</strong> across India!</span>
              </span>
            ) : (
              <span className="text-brand-dark">
                Add <strong className="text-brand-primary font-bold">₹{cart.freeShippingShortfall}</strong> more to unlock{' '}
                <strong className="text-brand-primary">Free Express Delivery</strong>
              </span>
            )}
          </div>
          <span className="text-[11px] text-brand-subtext hidden sm:inline">
            Free shipping threshold: ₹{cart.freeShippingThreshold}
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-brand-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              cart.isFreeShipping ? 'bg-emerald-600' : 'bg-brand-gold'
            }`}
            style={{ width: `${cart.freeShippingProgress}%` }}
          />
        </div>
      </div>

      {/* Main 2-Column Bag Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Column: Line Items List */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-brand-muted/80 divide-y divide-brand-muted/60 overflow-hidden shadow-subtle">
          <div className="p-4 sm:p-5 bg-brand-bg/50 border-b border-brand-muted/70 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-subtext">
            <span>Formulation Details</span>
            <span className="hidden sm:inline">Price & Quantity</span>
          </div>

          {cart.items.map((item) => {
            const isUpdating = updatingVariantId === item.variantId;
            const isRemoving = removingVariantId === item.variantId;
            const maxStock = item.availableStock || 99;

            return (
              <div
                key={item.variantId}
                className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center relative transition-colors hover:bg-brand-bg/20"
              >
                {/* Product Thumbnail with Contain fit */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border border-brand-muted/70 p-2 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=400&q=80'}
                    alt={item.productTitle}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Line Item Information */}
                <div className="flex-1 min-w-0 space-y-1.5 w-full sm:w-auto">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/products/${item.productSlug}`}
                      className="font-serif text-sm sm:text-base font-bold text-brand-dark hover:text-brand-primary transition-colors line-clamp-1"
                    >
                      {item.productTitle}
                    </Link>

                    {/* Mobile Remove Button */}
                    <button
                      type="button"
                      disabled={isRemoving || isUpdating}
                      onClick={() => handleRemoveItem(item)}
                      className="p-1.5 -mr-1 -mt-1 sm:hidden text-brand-subtext hover:text-rose-600 transition-colors"
                      aria-label="Remove item"
                    >
                      {isRemoving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Variant Attributes (Flavor, Pack Size, SKU) */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-brand-subtext">
                    <span className="px-2 py-0.5 rounded-md bg-brand-secondary font-medium text-brand-dark border border-brand-muted/50">
                      Flavor: <strong className="text-brand-primary">{item.flavor}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-brand-secondary font-medium text-brand-dark border border-brand-muted/50">
                      Pack: <strong className="text-brand-primary">{item.packSize}</strong>
                    </span>
                    {item.sku && (
                      <span className="text-[10px] text-brand-subtext uppercase">
                        SKU: {item.sku}
                      </span>
                    )}
                  </div>

                  {/* Unit Price and Stock Warning */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-xs font-bold text-brand-dark">₹{item.unitPrice} each</span>
                    {item.mrp > item.unitPrice && (
                      <span className="text-[11px] text-brand-subtext line-through">₹{item.mrp}</span>
                    )}
                    {item.availableStock && item.availableStock <= 5 && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Only {item.availableStock} left!
                      </span>
                    )}
                  </div>

                  {/* Mobile Quantity Stepper & Line Total Row */}
                  <div className="flex sm:hidden items-center justify-between pt-2">
                    <div className="flex items-center border border-brand-muted rounded-full bg-brand-bg">
                      <button
                        type="button"
                        disabled={isUpdating || isRemoving}
                        onClick={() => handleUpdateQuantity(item.variantId, item.quantity - 1, maxStock)}
                        className="w-8 h-8 flex items-center justify-center text-brand-subtext hover:text-brand-dark active:scale-90 disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-brand-dark">
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mx-auto text-brand-primary" /> : item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isUpdating || isRemoving || item.quantity >= maxStock}
                        onClick={() => handleUpdateQuantity(item.variantId, item.quantity + 1, maxStock)}
                        className="w-8 h-8 flex items-center justify-center text-brand-subtext hover:text-brand-dark active:scale-90 disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-base font-bold text-brand-dark">
                      ₹{item.total}
                    </span>
                  </div>
                </div>

                {/* Desktop Accessible Stepper */}
                <div className="hidden sm:flex items-center border border-brand-muted rounded-full bg-brand-bg px-1.5 py-0.5">
                  <button
                    type="button"
                    disabled={isUpdating || isRemoving}
                    onClick={() => handleUpdateQuantity(item.variantId, item.quantity - 1, maxStock)}
                    className="p-1.5 text-brand-subtext hover:text-brand-dark active:scale-90 transition-transform disabled:opacity-50"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-brand-dark min-w-[28px] text-center">
                    {isUpdating ? <Loader2 className="w-3 h-3 animate-spin mx-auto text-brand-primary" /> : item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isUpdating || isRemoving || item.quantity >= maxStock}
                    onClick={() => handleUpdateQuantity(item.variantId, item.quantity + 1, maxStock)}
                    className="p-1.5 text-brand-subtext hover:text-brand-dark active:scale-90 transition-transform disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Desktop Line Total & Delete Button */}
                <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                  <span className="text-base font-bold text-brand-dark min-w-[80px] text-right">
                    ₹{item.total}
                  </span>
                  <button
                    type="button"
                    disabled={isRemoving || isUpdating}
                    onClick={() => handleRemoveItem(item)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-brand-subtext hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-90"
                    aria-label="Remove item from bag"
                  >
                    {isRemoving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Authoritative Financial Order Summary & Coupon Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-brand-muted/80 p-5 sm:p-6 space-y-5 shadow-subtle sticky top-24">
            <h2 className="font-serif text-lg font-bold text-brand-dark flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-brand-subtext font-normal">Prices verified in INR</span>
            </h2>

            {/* Coupon Code Section */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-primary" />
                <span>Promotional Coupon</span>
              </label>

              {cart.coupon ? (
                <div className="p-3 rounded-2xl bg-brand-glow/40 border border-brand-sage/40 flex items-center justify-between text-xs font-semibold text-brand-primary">
                  <div className="space-y-0.5">
                    <p className="font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{cart.coupon.code}</span>
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Savings: ₹{cart.coupon.discountAmount} ({cart.coupon.description})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    disabled={isApplyingCoupon}
                    className="text-xs font-bold text-rose-600 hover:underline px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleApplyCoupon();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter promo code"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-muted text-xs uppercase font-semibold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="btn-primary !px-4 !py-2.5 !text-xs font-bold disabled:opacity-50"
                    >
                      {isApplyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                    </button>
                  </form>

                  {/* Quick-Apply Promo Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-brand-subtext font-medium">Quick Apply:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon('AURAPURE10')}
                      disabled={isApplyingCoupon}
                      className="px-2.5 py-1 rounded-full bg-brand-secondary hover:bg-brand-muted text-[10px] font-bold text-brand-primary transition-colors border border-brand-muted/60"
                    >
                      AURAPURE10 (10% OFF)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon('WELCOME200')}
                      disabled={isApplyingCoupon}
                      className="px-2.5 py-1 rounded-full bg-brand-secondary hover:bg-brand-muted text-[10px] font-bold text-brand-primary transition-colors border border-brand-muted/60"
                    >
                      WELCOME200 (₹200 OFF)
                    </button>
                  </div>
                </div>
              )}

              {couponError && (
                <p className="text-xs text-rose-600 flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{couponError}</span>
                </p>
              )}

              {couponSuccess && (
                <p className="text-xs text-emerald-700 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{couponSuccess}</span>
                </p>
              )}
            </div>

            {/* Price Calculations Breakdown (Authoritative from Backend) */}
            <div className="space-y-2.5 text-xs text-brand-subtext pt-3 border-t border-brand-muted/70">
              <div className="flex justify-between">
                <span>Subtotal ({cart.totalItemsCount} items)</span>
                <span className="font-semibold text-brand-dark">₹{cart.subtotal}</span>
              </div>

              {cart.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Promotional Discount</span>
                  <span>-₹{cart.couponDiscount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping Charges</span>
                <span className="font-semibold text-brand-dark">
                  {cart.shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase">Free</span>
                  ) : (
                    `₹${cart.shippingFee}`
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Estimated GST (18% inclusive)</span>
                <span className="font-semibold text-brand-dark">₹{cart.taxGst}</span>
              </div>

              {/* Final Amount */}
              <div className="flex justify-between items-baseline text-base sm:text-lg font-bold text-brand-dark pt-3 border-t border-brand-muted/80">
                <span>Payable Amount</span>
                <span className="text-xl sm:text-2xl text-brand-primary">₹{cart.finalTotal}</span>
              </div>
              <p className="text-[10px] text-brand-subtext text-right -mt-1">
                Taxes & duties included
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full btn-primary gap-2 !py-4 text-xs sm:text-sm font-bold shadow-card active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to="/collections"
                className="w-full btn-secondary !py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Shopping</span>
              </Link>
            </div>

            {/* D2C Assurance Badges */}
            <div className="pt-2 border-t border-brand-muted/60 space-y-1.5 text-[11px] text-brand-subtext">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                <span>256-Bit SSL Encrypted Checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                <span>Dispatched within 24 hours via Express Courier</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Success / Error Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-50 max-w-sm p-3.5 rounded-2xl bg-brand-dark text-white text-xs font-medium shadow-floating backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Mobile Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-brand-muted/80 shadow-2xl lg:hidden z-30 flex items-center justify-between gap-4 pb-safe">
        <div>
          <span className="text-[10px] text-brand-subtext block uppercase font-medium">Final Payable</span>
          <span className="text-base font-bold text-brand-primary">₹{cart.finalTotal}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/checkout')}
          className="btn-primary !py-2.5 !px-5 !text-xs font-bold gap-2 shadow-card active:scale-98"
        >
          <span>Checkout</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
