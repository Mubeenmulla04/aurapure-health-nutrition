import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Heart,
  ShoppingBag,
  ArrowRight,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  X,
  Check,
  Banknote,
  ZoomIn,
  Loader2,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { Product, ProductVariant, Review, FAQItem } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/product/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'benefits' | 'ingredients' | 'howToUse'>('benefits');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Desktop Hover Zoom State
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Mobile Touch Swipe State
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Pincode Delivery Check State
  const [pincode, setPincode] = useState('');
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeServiceability, setPincodeServiceability] = useState<any>(null);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Review Form Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewName, setNewReviewName] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setNotFound(false);
        const res = await api.get(`/products/${slug}`);
        if (res.data?.data?.product) {
          const prod = res.data.data.product;
          setProduct(prod);
          setRelatedProducts(res.data.data.relatedProducts || []);
          if (prod.variants && prod.variants.length > 0) {
            setSelectedVariant(prod.variants[0]);
          }

          // Fetch reviews and FAQs in parallel
          Promise.all([
            api.get(`/reviews/product/${prod._id}`).catch(() => ({ data: { data: { reviews: [] } } })),
            api.get('/faqs').catch(() => ({ data: { data: { faqs: [] } } })),
          ]).then(([revRes, faqRes]) => {
            if (revRes.data?.data?.reviews) {
              setReviews(revRes.data.data.reviews);
            }
            if (faqRes.data?.data?.faqs) {
              setFaqs(faqRes.data.data.faqs);
            }
          });
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Catalog Update</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-dark">Product Not Found</h1>
        <p className="text-sm text-brand-subtext max-w-md mx-auto">
          The formulation you are looking for may have been archived or moved.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link to="/collections" className="btn-primary !text-xs !py-3">
            Browse All Formulations
          </Link>
          <Link to="/" className="btn-secondary !text-xs !py-3">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !product || !selectedVariant) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const isWishlisted = isInWishlist(product._id);
  const images = selectedVariant.images && selectedVariant.images.length > 0
    ? selectedVariant.images
    : ['https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80'];

  const discountPercent =
    selectedVariant.discountPercent ||
    (selectedVariant.mrp > selectedVariant.sellingPrice
      ? Math.round(((selectedVariant.mrp - selectedVariant.sellingPrice) / selectedVariant.mrp) * 100)
      : 0);

  // Desktop Hover Zoom Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45 && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex((prev) => prev + 1);
    } else if (diff < -45 && selectedImageIndex > 0) {
      setSelectedImageIndex((prev) => prev - 1);
    }
    setTouchStartX(null);
  };

  // Add to Bag (Non-intrusive, updates count, does not force cart drawer open)
  const handleAddToCart = async () => {
    if (!selectedVariant.inStock || isAdding) return;
    try {
      setIsAdding(true);
      await addItem(selectedVariant._id, quantity, false);
      setToastMessage(`Added ${quantity} × ${product.title} to bag!`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add item to bag.');
    } finally {
      setIsAdding(false);
    }
  };

  // Buy Now: Adds to cart & navigates directly to checkout
  const handleBuyNow = async () => {
    if (!selectedVariant.inStock) return;
    try {
      await addItem(selectedVariant._id, quantity, false);
      navigate('/checkout');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Could not proceed to checkout.');
    }
  };

  // Pincode Serviceability Check
  const handleCheckPincode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pincode.length !== 6 || !/^[1-9][0-9]{5}$/.test(pincode)) {
      setPincodeError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    try {
      setIsCheckingPincode(true);
      setPincodeError(null);
      const res = await api.get(`/shipping/serviceability?pincode=${pincode}`);
      if (res.data?.data) {
        setPincodeServiceability(res.data.data);
      }
    } catch {
      setPincodeError('Unable to check pincode right now. Express shipping is active.');
    } finally {
      setIsCheckingPincode(false);
    }
  };

  // Submit Review Form
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingReview(true);
      await api.post('/reviews', {
        productId: product._id,
        rating: newReviewRating,
        title: newReviewTitle,
        comment: newReviewComment,
        userName: newReviewName,
      });
      setIsReviewModalOpen(false);
      setNewReviewTitle('');
      setNewReviewComment('');
      setNewReviewName('');
      setToastMessage('Thank you! Your verified review has been published.');
      setTimeout(() => setToastMessage(null), 3000);

      // Refresh reviews
      const revRes = await api.get(`/reviews/product/${product._id}`);
      if (revRes.data?.data?.reviews) {
        setReviews(revRes.data.data.reviews);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Could not submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8 sm:space-y-12 pb-28 sm:pb-20">
      
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-brand-subtext">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/collections" className="hover:text-brand-primary">Collections</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-brand-dark truncate max-w-[180px] sm:max-w-xs">{product.title}</span>
      </nav>

      {/* Main Two-Column Product Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
        
        {/* Left Column: Image Gallery with Object-fit Contain & Desktop Hover Magnifier */}
        <div className="lg:col-span-6 space-y-3 sm:space-y-4">
          <div
            className="aspect-square sm:aspect-[4/3] lg:aspect-square max-h-[500px] w-full rounded-2xl sm:rounded-3xl bg-white border border-brand-muted/80 shadow-subtle relative overflow-hidden flex items-center justify-center p-3 sm:p-6 select-none cursor-crosshair"
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Main Product Image with Object-fit Contain */}
            <img
              src={images[selectedImageIndex] || images[0]}
              alt={product.title}
              style={{
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transform: isZooming ? 'scale(1.6)' : 'scale(1)',
              }}
              className="w-full h-full object-contain transition-transform duration-150 ease-out"
            />

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <span className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 rounded-full bg-brand-gold text-brand-dark text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-xs pointer-events-none">
                Save {discountPercent}%
              </span>
            )}

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={() => toggleWishlist(product._id, selectedVariant._id)}
              className={`absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                isWishlisted
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-white/80 text-brand-subtext hover:text-brand-primary hover:bg-white shadow-xs'
              }`}
              aria-label="Save to Wishlist"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>

            {/* Desktop Zoom Hint Pill */}
            <div className="hidden lg:flex absolute bottom-3 right-3 items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 text-white text-[10px] font-medium backdrop-blur-md pointer-events-none">
              <ZoomIn className="w-3 h-3 text-brand-gold" />
              <span>Hover to Zoom</span>
            </div>

            {/* Mobile Dot Indicators */}
            {images.length > 1 && (
              <div className="lg:hidden absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`h-1.5 rounded-full transition-all pointer-events-auto ${
                      selectedImageIndex === idx ? 'w-5 bg-brand-primary' : 'w-1.5 bg-black/30'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1">
              {images.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden border-2 bg-white flex-shrink-0 transition-all p-1 ${
                    selectedImageIndex === idx
                      ? 'border-brand-primary shadow-subtle ring-2 ring-brand-primary/20'
                      : 'border-brand-muted opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Product Thumbnail" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Purchasing Details & Conversion Controls */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-6">
          
          {/* Header Badges & Rating */}
          <div className="flex items-center justify-between">
            {product.rating > 0 ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="font-bold text-brand-dark">{product.rating}</span>
                <span className="text-brand-subtext text-[11px] sm:text-xs">
                  ({reviews.length > 0 ? reviews.length : product.reviewCount} verified reviews)
                </span>
              </div>
            ) : (
              <span className="text-xs text-brand-subtext">Verified 100% Plant Fuel</span>
            )}

            {product.isBestSeller && (
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-brand-primary bg-brand-glow px-2.5 py-0.5 rounded-full">
                Best Seller
              </span>
            )}
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className="font-serif text-xl sm:text-3xl lg:text-4xl font-bold text-brand-dark leading-tight">
              {product.title}
            </h1>
            <p className="text-xs sm:text-sm text-brand-subtext mt-1.5 leading-relaxed">{product.subtitle}</p>
          </div>

          {/* Pricing Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-brand-secondary/40 border border-brand-muted/70 flex items-baseline gap-2.5 flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold text-brand-dark">₹{selectedVariant.sellingPrice}</span>
            {selectedVariant.mrp > selectedVariant.sellingPrice && (
              <span className="text-sm sm:text-base text-brand-subtext line-through">₹{selectedVariant.mrp}</span>
            )}
            {discountPercent > 0 && (
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                Save {discountPercent}%
              </span>
            )}
            <span className="text-[11px] text-brand-subtext ml-auto">
              Inclusive of GST (18%)
            </span>
          </div>

          {/* Variant Selection: Flavor */}
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center justify-between">
                <span>Flavor: <strong className="text-brand-primary">{selectedVariant.flavor}</strong></span>
              </label>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(product.variants.map((v) => v.flavor))).map((flavorName) => {
                  const matchingVar = product.variants.find((v) => v.flavor === flavorName);
                  const isCurrent = selectedVariant.flavor === flavorName;
                  return (
                    <button
                      type="button"
                      key={flavorName}
                      onClick={() => {
                        if (matchingVar) {
                          setSelectedVariant(matchingVar);
                          setSelectedImageIndex(0);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isCurrent
                          ? 'border-brand-primary bg-brand-primary text-white shadow-xs'
                          : 'border-brand-muted bg-white text-brand-dark hover:border-brand-primary'
                      }`}
                    >
                      {flavorName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variant Selection: Pack Size */}
          {product.variants && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center justify-between">
                <span>Pack Size: <strong className="text-brand-primary">{selectedVariant.packSize}</strong></span>
                {selectedVariant.weightGrams && (
                  <span className="text-[11px] text-brand-subtext font-normal">{selectedVariant.weightGrams}g Net</span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants
                  .filter((v) => !selectedVariant.flavor || v.flavor === selectedVariant.flavor)
                  .map((v) => {
                    const isSelected = selectedVariant._id === v._id;
                    return (
                      <button
                        type="button"
                        key={v._id}
                        onClick={() => {
                          setSelectedVariant(v);
                          setSelectedImageIndex(0);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'border-brand-primary bg-brand-glow text-brand-primary ring-2 ring-brand-primary/20 font-bold'
                            : 'border-brand-muted bg-white text-brand-dark hover:border-brand-primary'
                        }`}
                      >
                        <span>{v.packSize}</span>
                        <span className="text-[11px] font-bold">₹{v.sellingPrice}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Stock Availability */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {selectedVariant.inStock ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-emerald-800">
                  In Stock ({selectedVariant.stockQuantity} units) • Ready to dispatch
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-600">Currently Out of Stock</span>
              </>
            )}
          </div>

          {/* Quantity Stepper & Dual CTAs */}
          <div className="space-y-3 pt-1">
            <div className="flex gap-2.5 sm:gap-4">
              {/* Accessible Quantity Stepper */}
              <div className="flex items-center border border-brand-muted rounded-full bg-white px-2 min-h-[44px]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-brand-subtext hover:text-brand-dark active:scale-95"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2.5 sm:px-3 text-xs sm:text-sm font-bold text-brand-dark">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-brand-subtext hover:text-brand-dark active:scale-95"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdding || !selectedVariant.inStock}
                className="flex-1 btn-primary gap-2 min-h-[44px] !py-3 shadow-card active:scale-98 text-xs sm:text-sm"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Adding to Bag...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>
            </div>

            {/* Buy Now Express Checkout Button */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!selectedVariant.inStock}
              className="w-full min-h-[44px] py-3 px-6 rounded-full bg-brand-gold hover:bg-amber-400 text-brand-dark font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Buy Now (Express Checkout)</span>
            </button>
          </div>

          {/* Pincode Delivery Checker */}
          <div className="p-4 rounded-2xl bg-white border border-brand-muted/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-brand-dark">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-brand-primary" />
                <span>Check Delivery & Serviceability</span>
              </span>
              {pincodeServiceability && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Serviceable
                </span>
              )}
            </div>

            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit PIN code"
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-brand-muted bg-brand-bg/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <button
                type="submit"
                disabled={pincode.length !== 6 || isCheckingPincode}
                className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover disabled:opacity-50 transition-all"
              >
                {isCheckingPincode ? 'Checking...' : 'Check'}
              </button>
            </form>

            {pincodeError && (
              <p className="text-[11px] text-rose-600">{pincodeError}</p>
            )}

            {pincodeServiceability && (
              <p className="text-[11px] text-emerald-800 flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>
                  Delivery in <strong>{pincodeServiceability.estimatedDeliveryDays} business days</strong> via{' '}
                  {pincodeServiceability.courierName}.
                </span>
              </p>
            )}
          </div>

          {/* D2C Confidence Icons */}
          <div className="p-3 sm:p-4 rounded-2xl bg-brand-secondary/30 border border-brand-muted/70">
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-brand-dark">
              <div className="space-y-0.5">
                <Banknote className="w-4 h-4 text-emerald-700 mx-auto" />
                <p className="font-bold text-[11px]">Cash on Delivery</p>
                <p className="text-[9px] text-brand-subtext">Pay at doorstep</p>
              </div>
              <div className="space-y-0.5 border-x border-brand-muted/70 px-1">
                <Truck className="w-4 h-4 text-brand-primary mx-auto" />
                <p className="font-bold text-[11px]">Free Shipping</p>
                <p className="text-[9px] text-brand-subtext">On orders over ₹999</p>
              </div>
              <div className="space-y-0.5">
                <ShieldCheck className="w-4 h-4 text-brand-gold mx-auto" />
                <p className="font-bold text-[11px]">Zero Bloat Guarantee</p>
                <p className="text-[9px] text-brand-subtext">Gentle on Indian stomachs</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Nutritional Highlights Grid (From Actual MongoDB Product Data) */}
      {product.nutritionalHighlights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-brand-secondary/40 border border-brand-muted/80">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-brand-muted/60 text-center space-y-0.5">
            <span className="text-[10px] sm:text-xs text-brand-subtext uppercase font-semibold">Protein / Serving</span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-brand-primary">
              {product.nutritionalHighlights.proteinPerServing}
            </p>
            <span className="text-[10px] text-brand-subtext">Bioavailable Isolate</span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-brand-muted/60 text-center space-y-0.5">
            <span className="text-[10px] sm:text-xs text-brand-subtext uppercase font-semibold">BCAAs</span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-brand-primary">
              {product.nutritionalHighlights.bcaa}
            </p>
            <span className="text-[10px] text-brand-subtext">Naturally Occurring</span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-brand-muted/60 text-center space-y-0.5">
            <span className="text-[10px] sm:text-xs text-brand-subtext uppercase font-semibold">Added Sugar</span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-brand-primary">
              {product.nutritionalHighlights.addedSugar}
            </p>
            <span className="text-[10px] text-brand-subtext">Monk Fruit Sweetened</span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-brand-muted/60 text-center space-y-0.5">
            <span className="text-[10px] sm:text-xs text-brand-subtext uppercase font-semibold">Servings Per Tub</span>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-brand-primary">
              {product.nutritionalHighlights.servingsPerTub}
            </p>
            <span className="text-[10px] text-brand-subtext">Full 30-Day Ritual</span>
          </div>
        </div>
      )}

      {/* Tabs: Benefits, Ingredients & How to Use (From Actual MongoDB Product Data) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-brand-muted/80 p-5 sm:p-10 space-y-6">
        <div className="flex border-b border-brand-muted/80 gap-4 sm:gap-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'benefits', label: 'Health Benefits' },
            { id: 'ingredients', label: 'Ingredients & Sourcing' },
            { id: 'howToUse', label: 'How to Enjoy' },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap relative ${
                activeTab === tab.id ? 'text-brand-primary font-bold' : 'text-brand-subtext hover:text-brand-dark'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div>
          {/* Health Benefits */}
          {activeTab === 'benefits' && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {product.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-brand-dark">
                  <CheckCircle2 className="w-4 h-4 text-brand-sage flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Ingredients & Formulation */}
          {activeTab === 'ingredients' && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-brand-subtext leading-relaxed">
                Full formulation transparency. Never disguised behind proprietary blends or artificial emulsifiers.
              </p>
              <div className="flex flex-wrap gap-2">
                {product.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full bg-brand-secondary text-xs font-medium text-brand-dark border border-brand-muted/60"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* How to Enjoy Steps */}
          {activeTab === 'howToUse' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {product.howToUse.map((step, i) => (
                <div key={i} className="p-4 sm:p-5 rounded-2xl bg-brand-bg border border-brand-muted/70 space-y-2">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-brand-glow text-brand-primary font-bold text-[10px]">
                    {step.step}
                  </span>
                  <p className="text-xs sm:text-sm text-brand-dark font-medium leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-brand-muted/80 p-5 sm:p-10 space-y-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-brand-muted/70">
          <div>
            <h3 className="font-serif text-lg sm:text-2xl font-bold text-brand-dark">Customer Reviews</h3>
            {product.rating > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-bold text-brand-dark">{product.rating} / 5</span>
                <span className="text-[11px] text-brand-subtext">({reviews.length} reviews)</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="btn-outline !text-xs !py-2 sm:!py-2.5 !px-3 sm:!px-5"
          >
            Write a Review
          </button>
        </div>

        {/* Reviews List */}
        <div className="divide-y divide-brand-muted/60 space-y-4">
          {reviews.length === 0 ? (
            <p className="text-xs sm:text-sm text-brand-subtext text-center py-6">
              Be the first to review this formulation!
            </p>
          ) : (
            reviews.map((rev) => (
              <div key={rev._id} className="pt-4 first:pt-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-brand-dark">{rev.userName}</span>
                    {rev.verifiedPurchase && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[9px] font-bold">
                        ✓ Verified Buyer
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-brand-subtext">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center text-amber-500 gap-0.5">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-brand-dark">{rev.title}</h4>
                <p className="text-xs sm:text-sm text-brand-subtext leading-relaxed">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Product FAQs Section */}
      {faqs.length > 0 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-brand-muted/80 p-5 sm:p-10 space-y-5">
          <div className="text-left">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-primary">Answers & Advice</span>
            <h3 className="font-serif text-lg sm:text-2xl font-bold text-brand-dark mt-1">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-2.5 divide-y divide-brand-muted/50">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={faq._id} className="pt-2.5 first:pt-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full py-2.5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-brand-dark hover:text-brand-primary transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronRight className={`w-4 h-4 text-brand-subtext transition-transform duration-200 ${isOpen ? 'rotate-90 text-brand-primary' : ''}`} />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-brand-subtext leading-relaxed pb-3 animate-in fade-in duration-150">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-primary">Clean Synergies</span>
              <h3 className="font-serif text-lg sm:text-2xl font-bold text-brand-dark mt-0.5">Pairs Well With</h3>
            </div>
            <Link to="/collections" className="text-xs font-bold text-brand-primary hover:underline">
              View All Formulations →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {relatedProducts.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Review Submission Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 relative border border-brand-muted shadow-2xl">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-brand-subtext hover:text-brand-dark"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-brand-dark">Review {product.title}</h3>
              <p className="text-xs text-brand-subtext mt-0.5">Share your feedback with fellow wellness enthusiasts.</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Your Rating</label>
                <div className="flex gap-2 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewReviewRating(star)}
                      className="p-1 focus:outline-none"
                    >
                      <Star className={`w-5 h-5 sm:w-6 sm:h-6 ${star <= newReviewRating ? 'fill-current' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  placeholder="e.g. Ananya S."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Headline</label>
                <input
                  type="text"
                  required
                  value={newReviewTitle}
                  onChange={(e) => setNewReviewTitle(e.target.value)}
                  placeholder="e.g. Smooth texture and zero bloating!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Your Review</label>
                <textarea
                  required
                  rows={3}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="How was the taste and digestive comfort?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full btn-primary !py-3 text-xs sm:text-sm font-bold"
              >
                {isSubmittingReview ? 'Publishing Review...' : 'Submit Verified Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Success Toast (Non-intrusive) */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-50 max-w-sm p-3.5 rounded-2xl bg-brand-dark text-white text-xs font-medium shadow-floating backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <Link
            to="/cart"
            className="text-xs font-bold text-brand-gold hover:underline whitespace-nowrap"
          >
            View Bag →
          </Link>
        </div>
      )}

      {/* Mobile Sticky Bottom Conversion Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-brand-muted/80 shadow-2xl py-2 px-3 sm:hidden pb-safe">
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-brand-dark truncate">{product.title}</p>
            <p className="text-[11px] font-bold text-brand-primary">₹{selectedVariant.sellingPrice * quantity}</p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding || !selectedVariant.inStock}
              className="px-3.5 py-2 rounded-xl border border-brand-primary bg-white text-brand-primary text-xs font-bold active:scale-95 flex items-center gap-1 shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!selectedVariant.inStock}
              className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold active:scale-95 flex items-center gap-1 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-brand-gold fill-current" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
