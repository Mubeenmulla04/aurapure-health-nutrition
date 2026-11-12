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
  Award,
  ChevronRight,
  Send,
  X,
  Gift,
  BadgePercent,
  Check,
  Banknote,
} from 'lucide-react';
import { api } from '../services/api';
import { Product, ProductVariant, Review } from '../types';
import { useCart } from '../../src/context/CartContext';
import { useWishlist } from '../../src/context/WishlistContext';
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
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'benefits' | 'ingredients' | 'howToUse'>('benefits');

  // Review Form Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewName, setNewReviewName] = useState('');

  const [bundleTier, setBundleTier] = useState<'single' | 'duo' | 'trio'>('single');
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 450) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

          // Fetch reviews
          const revRes = await api.get(`/reviews/product/${prod._id}`);
          if (revRes.data?.data) {
            setReviews(revRes.data.data.reviews || []);
            setReviewStats(revRes.data.data);
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
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
          The wellness formula you are looking for may have been archived or updated.
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

  const handleAddToCart = async () => {
    try {
      setIsAdding(true);
      await addItem(selectedVariant._id, quantity);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await addItem(selectedVariant._id, quantity);
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        productId: product._id,
        rating: newReviewRating,
        title: newReviewTitle,
        comment: newReviewComment,
        userName: newReviewName,
      });
      alert('Thank you! Your verified review has been published.');
      setIsReviewModalOpen(false);

      // Refresh reviews
      const revRes = await api.get(`/reviews/product/${product._id}`);
      if (revRes.data?.data) {
        setReviews(revRes.data.data.reviews || []);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Could not submit review.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8 space-y-6 sm:space-y-12 pb-24 sm:pb-16">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-brand-subtext">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/collections" className="hover:text-brand-primary">Collections</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-brand-dark truncate max-w-[160px] sm:max-w-xs">{product.title}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 items-start">
        
        {/* Left: Product Images Gallery with Mobile Touch-Friendly Swipe */}
        <div className="lg:col-span-6 space-y-3 sm:space-y-4">
          <div className="aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-brand-secondary/60 border border-brand-muted/80 shadow-subtle relative group">
            <img
              src={selectedVariant.images[selectedImageIndex] || selectedVariant.images[0]}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-300"
            />
            
            {selectedVariant.discountPercent > 0 && (
              <span className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 rounded-full bg-brand-gold text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm">
                Save {selectedVariant.discountPercent}%
              </span>
            )}

            {/* Quick Wishlist Toggle on Image */}
            <button
              type="button"
              onClick={() => toggleWishlist(product._id, selectedVariant._id)}
              className={`absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                isWishlisted
                  ? 'bg-red-50 text-brand-error'
                  : 'bg-white/80 text-brand-subtext hover:text-brand-primary hover:bg-white shadow-xs'
              }`}
              aria-label="Save to Wishlist"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>

            {/* Mobile Image Dot Indicators */}
            {selectedVariant.images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                {selectedVariant.images.map((_, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      selectedImageIndex === idx ? 'w-5 bg-brand-primary' : 'w-1.5 bg-black/30'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails Strip */}
          {selectedVariant.images.length > 1 && (
            <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1">
              {selectedVariant.images.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-brand-primary shadow-subtle'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Purchase Details */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-6">
          
          {/* Header Badges & Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <div className="flex items-center text-amber-500">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              </div>
              <span className="font-bold text-brand-dark">{product.rating}</span>
              <span className="text-brand-subtext text-[11px] sm:text-xs">({product.reviewCount} reviews)</span>
            </div>

            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-brand-primary bg-brand-glow px-2.5 py-0.5 rounded-full">
              Lab Certified
            </span>
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className="font-serif text-xl sm:text-3xl font-bold text-brand-dark leading-snug">
              {product.title}
            </h1>
            <p className="text-xs sm:text-sm text-brand-subtext mt-1 leading-relaxed">{product.subtitle}</p>
          </div>

          {/* Price Box */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-brand-secondary/40 border border-brand-muted/60 flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-bold text-brand-dark">₹{selectedVariant.sellingPrice}</span>
            {selectedVariant.mrp > selectedVariant.sellingPrice && (
              <span className="text-xs sm:text-base text-brand-subtext line-through">₹{selectedVariant.mrp}</span>
            )}
            <span className="text-[10px] sm:text-xs font-semibold text-brand-primary bg-brand-glow px-2 py-0.5 rounded-full ml-auto">
              Incl. 18% GST
            </span>
          </div>

          {/* Variant Selectors: Flavor */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center justify-between">
              <span>Flavor: <strong className="text-brand-primary">{selectedVariant.flavor}</strong></span>
              <span className="text-[10px] text-brand-subtext font-normal">Natural Botanicals</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {/* If product has sister protein flavors, provide quick switches */}
              {product.slug.includes('protein') ? (
                [
                  { name: 'Belgian Dark Chocolate', slug: 'plant-protein-belgian-dark-chocolate' },
                  { name: 'Madagascar Vanilla', slug: 'plant-protein-madagascar-vanilla' },
                  { name: 'Raw Unflavored', slug: 'raw-unflavored-plant-protein' },
                ].map((flv) => {
                  const isActive = product.slug === flv.slug;
                  return (
                    <Link
                      key={flv.slug}
                      to={`/products/${flv.slug}`}
                      className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'border-brand-primary bg-brand-primary text-white shadow-subtle'
                          : 'border-brand-muted bg-white text-brand-dark hover:border-brand-primary'
                      }`}
                    >
                      <span>{flv.name}</span>
                    </Link>
                  );
                })
              ) : (
                Array.from(new Set(product.variants.map((v) => v.flavor))).map((flvName) => {
                  const matchingVar = product.variants.find((v) => v.flavor === flvName);
                  const isCurrent = selectedVariant.flavor === flvName;
                  return (
                    <button
                      type="button"
                      key={flvName}
                      onClick={() => {
                        if (matchingVar) {
                          setSelectedVariant(matchingVar);
                          setSelectedImageIndex(0);
                        }
                      }}
                      className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        isCurrent
                          ? 'border-brand-primary bg-brand-primary text-white shadow-subtle'
                          : 'border-brand-muted bg-white text-brand-dark hover:border-brand-primary'
                      }`}
                    >
                      {flvName}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Variant Selectors: Pack Size */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center justify-between">
              <span>Pack Size: <strong className="text-brand-primary">{selectedVariant.packSize}</strong></span>
              {selectedVariant.weightGrams && (
                <span className="text-[10px] text-brand-subtext font-normal">{selectedVariant.weightGrams}g Net</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const isSelected = selectedVariant._id === v._id;
                return (
                  <button
                    type="button"
                    key={v._id}
                    onClick={() => {
                      setSelectedVariant(v);
                      setSelectedImageIndex(0);
                    }}
                    className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
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

          {/* Stock Availability */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {selectedVariant.inStock ? (
              <>
                <div className="w-2 h-2 rounded-full bg-brand-sage animate-pulse" />
                <span className="text-brand-sage text-xs">
                  In Stock ({selectedVariant.stockQuantity} units) • Same Day Air Dispatch
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-brand-error" />
                <span className="text-brand-error text-xs">Currently Out of Stock</span>
              </>
            )}
          </div>

          {/* Scrubsy Inspiration: Merchandising Bundle & Save Selector */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-brand-gold" />
                <span>Bundle & Save More</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Up to 20% OFF + Free Shaker
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Single */}
              <button
                type="button"
                onClick={() => {
                  setBundleTier('single');
                  setQuantity(1);
                }}
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all ${
                  bundleTier === 'single'
                    ? 'border-brand-primary bg-brand-glow/40 shadow-xs ring-1 ring-brand-primary'
                    : 'border-brand-muted/80 bg-white hover:border-brand-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-bold text-brand-dark">1 Tub</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-brand-primary mt-0.5">₹{selectedVariant.sellingPrice}</p>
                <p className="text-[9px] text-brand-subtext">Standard</p>
              </button>

              {/* Duo (Most Popular) */}
              <button
                type="button"
                onClick={() => {
                  setBundleTier('duo');
                  setQuantity(2);
                }}
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all relative ${
                  bundleTier === 'duo'
                    ? 'border-brand-gold bg-amber-50/60 shadow-xs ring-1 ring-brand-gold'
                    : 'border-brand-muted/80 bg-white hover:border-brand-gold/60'
                }`}
              >
                <span className="absolute -top-2 right-1.5 px-1.5 py-0.2 rounded-full bg-brand-gold text-brand-dark text-[8px] font-extrabold uppercase shadow-xs">
                  ★ Popular
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-bold text-brand-dark">2 Tubs</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-brand-dark mt-0.5">
                  ₹{Math.round(selectedVariant.sellingPrice * 2 * 0.85)}
                </p>
                <p className="text-[9px] font-bold text-amber-700 truncate mt-0.5">
                  🎁 Free Shaker
                </p>
              </button>

              {/* Trio (Best Value) */}
              <button
                type="button"
                onClick={() => {
                  setBundleTier('trio');
                  setQuantity(3);
                }}
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all relative ${
                  bundleTier === 'trio'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                    : 'border-brand-muted/80 bg-white hover:border-emerald-600/60'
                }`}
              >
                <span className="absolute -top-2 right-1.5 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[8px] font-extrabold uppercase shadow-xs">
                  Best Value
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-bold text-brand-dark">3 Tubs</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-brand-dark mt-0.5">
                  ₹{Math.round(selectedVariant.sellingPrice * 3 * 0.80)}
                </p>
                <p className="text-[9px] font-bold text-emerald-700 truncate mt-0.5">
                  🎁 Free Gifts
                </p>
              </button>
            </div>
          </div>

          {/* Quantity and Primary Action CTAs */}
          <div className="space-y-2.5 pt-1">
            <div className="flex gap-2.5 sm:gap-4">
              {/* Stepper with accessible 44px height */}
              <div className="flex items-center border border-brand-muted rounded-full bg-white px-1 sm:px-2 min-h-[44px]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-brand-subtext hover:text-brand-dark active:scale-95"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 sm:px-3 text-xs sm:text-sm font-bold text-brand-dark">{quantity}</span>
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
                <ShoppingBag className="w-4 h-4" />
                <span>{isAdding ? 'Adding...' : 'Add to Bag'}</span>
              </button>
            </div>

            {/* Buy Now Direct Checkout */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!selectedVariant.inStock}
              className="w-full btn-secondary min-h-[44px] !py-3 text-xs sm:text-sm font-semibold border-brand-primary text-brand-primary hover:bg-brand-glow/40 active:scale-98"
            >
              Buy Now (Express Checkout)
            </button>
          </div>

          {/* Indian D2C Confidence & Logistics Strip */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-brand-muted/80 shadow-xs">
            <div className="grid grid-cols-3 gap-2 text-center sm:text-left text-[11px] text-brand-dark">
              <div className="flex flex-col sm:flex-row items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">COD</p>
                  <p className="text-[9px] text-brand-subtext hidden sm:block">Pay at doorstep</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1.5 border-x border-brand-muted/70 px-1 sm:px-2">
                <Truck className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <div>
                  <p className="font-bold">2-4 Days</p>
                  <p className="text-[9px] text-brand-subtext hidden sm:block">BlueDart Air</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-gold flex-shrink-0" />
                <div>
                  <p className="font-bold">14-Day Guarantee</p>
                  <p className="text-[9px] text-brand-subtext hidden sm:block">Zero-bloat refund</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nutritional Highlights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-brand-secondary/40 border border-brand-muted/80">
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-brand-muted/60 text-center space-y-0.5 sm:space-y-1">
          <span className="text-[10px] sm:text-xs text-brand-subtext uppercase font-semibold">Protein / Scoop</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-brand-primary">
            {product.nutritionalHighlights?.proteinPerServing || '25g'}
          </p>
          <span className="text-[10px] text-brand-subtext">Pure Plant Isolate</span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-brand-muted/60 text-center space-y-0.5 sm:space-y-1">
          <span className="text-[10px] sm:text-xs text-brand-subtext uppercase font-semibold">BCAAs</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-brand-primary">
            {product.nutritionalHighlights?.bcaa || '4.8g'}
          </p>
          <span className="text-[10px] text-brand-subtext">Naturally Occurring</span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-brand-muted/60 text-center space-y-0.5 sm:space-y-1">
          <span className="text-[10px] sm:text-xs text-brand-subtext uppercase font-semibold">Added Sugar</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-brand-primary">
            {product.nutritionalHighlights?.addedSugar || '0g'}
          </p>
          <span className="text-[10px] text-brand-subtext">Monk Fruit Sweetened</span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-brand-muted/60 text-center space-y-0.5 sm:space-y-1">
          <span className="text-[10px] sm:text-xs text-brand-subtext uppercase font-semibold">Digestive Comfort</span>
          <p className="font-serif text-lg sm:text-xl font-bold text-brand-primary pt-1">
            DigeZyme Active
          </p>
          <span className="text-[10px] text-brand-subtext">Zero Bloat Guarantee</span>
        </div>
      </div>

      {/* Expandable Tabs: Benefits, Ingredients, Usage */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-brand-muted/80 p-4 sm:p-10 space-y-5 sm:space-y-8">
        <div className="flex border-b border-brand-muted/80 gap-3 sm:gap-6 overflow-x-auto no-scrollbar">
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
                activeTab === tab.id ? 'text-brand-primary' : 'text-brand-subtext hover:text-brand-dark'
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
          {activeTab === 'benefits' && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {product.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-brand-dark">
                  <CheckCircle2 className="w-4 h-4 text-brand-sage flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-brand-subtext leading-relaxed">
                Full formulation transparency. Never disguised behind proprietary blends.
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {product.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-brand-secondary text-[11px] sm:text-xs font-medium text-brand-dark border border-brand-muted/60"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'howToUse' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6">
              {product.howToUse.map((step, i) => (
                <div key={i} className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-brand-bg border border-brand-muted/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">{step.step}</span>
                  <p className="text-xs sm:text-sm text-brand-dark font-medium">{step.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-brand-muted/80 p-4 sm:p-10 space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-brand-muted/70">
          <div>
            <h3 className="font-serif text-lg sm:text-2xl font-bold text-brand-dark">Customer Reviews</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="text-xs font-bold text-brand-dark">{product.rating} / 5</span>
              <span className="text-[11px] text-brand-subtext">({reviews.length})</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="btn-outline !text-xs !py-2 sm:!py-2.5 !px-3 sm:!px-5"
          >
            Write Review
          </button>
        </div>

        {/* Reviews List */}
        <div className="divide-y divide-brand-muted/60 space-y-4">
          {reviews.length === 0 ? (
            <p className="text-xs sm:text-sm text-brand-subtext text-center py-6">
              Be the first to review this clean formulation!
            </p>
          ) : (
            reviews.map((rev) => (
              <div key={rev._id} className="pt-4 first:pt-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-brand-dark">{rev.userName}</span>
                    {rev.verifiedPurchase && (
                      <span className="px-1.5 py-0.2 rounded-full bg-brand-glow text-brand-primary text-[9px] font-bold">
                        ✓ Verified
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

      {/* Review Submission Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 space-y-4 sm:space-y-6 relative border border-brand-muted shadow-2xl">
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
                  placeholder="How was the taste and digestion?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <button type="submit" className="w-full btn-primary !py-3 text-xs sm:text-sm font-bold">
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Related Products: Two-column grid on mobile */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 sm:space-y-6">
          <h3 className="font-serif text-lg sm:text-2xl font-bold text-brand-dark">Pairs Well With</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {relatedProducts.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Bottom ATC Bar (Seamless mobile & desktop conversion bar) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-brand-muted/80 shadow-2xl py-2.5 sm:py-3.5 px-3 sm:px-8 pb-safe">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src={selectedVariant.images[0]}
              alt={product.title}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl object-cover border border-brand-muted/80 flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-brand-dark truncate max-w-[120px] sm:max-w-xs">{product.title}</p>
              <p className="text-[10px] sm:text-[11px] text-brand-subtext truncate">
                {selectedVariant.flavor} • ₹{bundleTier === 'duo'
                  ? Math.round(selectedVariant.sellingPrice * 2 * 0.85)
                  : bundleTier === 'trio'
                  ? Math.round(selectedVariant.sellingPrice * 3 * 0.80)
                  : selectedVariant.sellingPrice * quantity}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding || !selectedVariant.inStock}
              className="btn-primary !py-2.5 !px-4 sm:!px-6 text-xs sm:text-sm gap-1.5 shadow-sm active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{isAdding ? 'Adding...' : 'Add to Bag'}</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!selectedVariant.inStock}
              className="btn-secondary !py-2.5 !px-4 sm:!px-6 text-xs sm:text-sm font-bold border-brand-primary text-brand-primary active:scale-95"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
