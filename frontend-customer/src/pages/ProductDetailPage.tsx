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

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${slug}`);
        if (res.data?.data) {
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
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
      }
    };

    fetchProduct();
  }, [slug]);

  if (!product || !selectedVariant) {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-brand-subtext">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/collections" className="hover:text-brand-primary">Collections</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-brand-dark truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left: Product Images Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-brand-secondary/60 border border-brand-muted/80 shadow-subtle relative">
            <img
              src={selectedVariant.images[selectedImageIndex] || selectedVariant.images[0]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {selectedVariant.discountPercent > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-brand-gold text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                Save {selectedVariant.discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails Strip */}
          {selectedVariant.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {selectedVariant.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-brand-primary shadow-subtle'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Purchase Details */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Header Badges & Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="font-bold text-brand-dark">{product.rating}</span>
              <span className="text-brand-subtext">({product.reviewCount} customer reviews)</span>
            </div>

            <button
              onClick={() => toggleWishlist(product._id, selectedVariant._id)}
              className={`p-2 rounded-full border transition-all ${
                isWishlisted
                  ? 'bg-red-50 border-red-200 text-brand-error'
                  : 'bg-white border-brand-muted text-brand-subtext hover:text-brand-primary'
              }`}
              aria-label="Save to Wishlist"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-dark leading-tight">
              {product.title}
            </h1>
            <p className="text-sm text-brand-subtext mt-1.5 leading-relaxed">{product.subtitle}</p>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-brand-secondary/40 border border-brand-muted/60 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-brand-dark">₹{selectedVariant.sellingPrice}</span>
            {selectedVariant.mrp > selectedVariant.sellingPrice && (
              <span className="text-base text-brand-subtext line-through">₹{selectedVariant.mrp}</span>
            )}
            <span className="text-xs font-semibold text-brand-primary bg-brand-glow px-2.5 py-1 rounded-full ml-auto">
              Inclusive of 18% GST
            </span>
          </div>

          {/* Variant Selectors: Flavor */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark">
              Selected Flavor: <span className="text-brand-primary font-normal">{selectedVariant.flavor}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v._id}
                  onClick={() => {
                    setSelectedVariant(v);
                    setSelectedImageIndex(0);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    selectedVariant._id === v._id
                      ? 'border-brand-primary bg-brand-primary text-white shadow-subtle'
                      : 'border-brand-muted bg-white text-brand-dark hover:border-brand-primary'
                  }`}
                >
                  {v.flavor}
                </button>
              ))}
            </div>
          </div>

          {/* Variant Selectors: Pack Size */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark">
              Pack Size: <span className="text-brand-primary font-normal">{selectedVariant.packSize}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-2 rounded-xl text-xs font-semibold border border-brand-primary bg-brand-glow text-brand-primary">
                {selectedVariant.packSize}
              </span>
            </div>
          </div>

          {/* Stock Availability */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {selectedVariant.inStock ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-brand-sage animate-pulse" />
                <span className="text-brand-sage">
                  In Stock ({selectedVariant.stockQuantity} units remaining) • Ships Today
                </span>
              </>
            ) : (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-brand-error" />
                <span className="text-brand-error">Currently Out of Stock</span>
              </>
            )}
          </div>

          {/* Quantity and Primary Action CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-4">
              {/* Stepper */}
              <div className="flex items-center border border-brand-muted rounded-full bg-white px-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-brand-subtext hover:text-brand-dark"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-sm font-bold text-brand-dark">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-brand-subtext hover:text-brand-dark"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isAdding || !selectedVariant.inStock}
                className="flex-1 btn-primary gap-2 !py-4 shadow-card"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isAdding ? 'Adding...' : 'Add to Bag'}</span>
              </button>
            </div>

            {/* Buy Now Direct Checkout */}
            <button
              onClick={handleBuyNow}
              disabled={!selectedVariant.inStock}
              className="w-full btn-secondary !py-4 text-sm font-semibold border-brand-primary text-brand-primary hover:bg-brand-glow/40"
            >
              Buy Now (Express Checkout)
            </button>
          </div>

          {/* Shipping & Guarantee Perks */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-brand-muted/70 text-xs text-brand-subtext">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-primary" />
              <span>Free Delivery above ₹999</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              <span>Tested for Heavy Metals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nutritional Highlights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl bg-brand-secondary/40 border border-brand-muted/80">
        <div className="p-4 rounded-2xl bg-white border border-brand-muted/60 text-center space-y-1">
          <span className="text-xs text-brand-subtext uppercase font-semibold">Protein / Scoop</span>
          <p className="font-serif text-3xl font-bold text-brand-primary">
            {product.nutritionalHighlights?.proteinPerServing || '25g'}
          </p>
          <span className="text-[11px] text-brand-subtext">Complete Plant Isolate</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-brand-muted/60 text-center space-y-1">
          <span className="text-xs text-brand-subtext uppercase font-semibold">BCAAs</span>
          <p className="font-serif text-3xl font-bold text-brand-primary">
            {product.nutritionalHighlights?.bcaa || '4.8g'}
          </p>
          <span className="text-[11px] text-brand-subtext">Naturally Occurring</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-brand-muted/60 text-center space-y-1">
          <span className="text-xs text-brand-subtext uppercase font-semibold">Added Sugar</span>
          <p className="font-serif text-3xl font-bold text-brand-primary">
            {product.nutritionalHighlights?.addedSugar || '0g'}
          </p>
          <span className="text-[11px] text-brand-subtext">Monk Fruit Sweetened</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-brand-muted/60 text-center space-y-1">
          <span className="text-xs text-brand-subtext uppercase font-semibold">Digestive Comfort</span>
          <p className="font-serif text-xl font-bold text-brand-primary pt-2">
            Papain & Bromelain
          </p>
          <span className="text-[11px] text-brand-subtext">Zero Bloating Guarantee</span>
        </div>
      </div>

      {/* Expandable Tabs: Benefits, Ingredients, Usage */}
      <div className="bg-white rounded-3xl border border-brand-muted/80 p-6 sm:p-10 space-y-8">
        <div className="flex border-b border-brand-muted/80 gap-6">
          {[
            { id: 'benefits', label: 'Key Health Benefits' },
            { id: 'ingredients', label: 'Ingredients & Sourcing' },
            { id: 'howToUse', label: 'How to Enjoy' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-semibold transition-all relative ${
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
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-brand-dark">
                  <CheckCircle2 className="w-4 h-4 text-brand-sage flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-4">
              <p className="text-sm text-brand-subtext leading-relaxed">
                We believe in full formulation transparency. We never disguise ingredients behind proprietary blends.
              </p>
              <div className="flex flex-wrap gap-2">
                {product.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="px-3.5 py-1.5 rounded-full bg-brand-secondary text-xs font-medium text-brand-dark border border-brand-muted/60"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'howToUse' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {product.howToUse.map((step, i) => (
                <div key={i} className="p-5 rounded-2xl bg-brand-bg border border-brand-muted/60 space-y-2">
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">{step.step}</span>
                  <p className="text-sm text-brand-dark font-medium">{step.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-3xl border border-brand-muted/80 p-6 sm:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-muted/70">
          <div>
            <h3 className="font-serif text-2xl font-bold text-brand-dark">Verified Shopper Reviews</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm font-bold text-brand-dark">{product.rating} out of 5</span>
              <span className="text-xs text-brand-subtext">({reviews.length} reviews)</span>
            </div>
          </div>

          <button onClick={() => setIsReviewModalOpen(true)} className="btn-outline !text-xs !py-3">
            Write a Review
          </button>
        </div>

        {/* Reviews List */}
        <div className="divide-y divide-brand-muted/60 space-y-6">
          {reviews.length === 0 ? (
            <p className="text-sm text-brand-subtext text-center py-8">
              Be the first to review this clean formulation!
            </p>
          ) : (
            reviews.map((rev) => (
              <div key={rev._id} className="pt-6 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-brand-dark">{rev.userName}</span>
                    {rev.verifiedPurchase && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-glow text-brand-primary text-[10px] font-bold">
                        ✓ Verified Buyer
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-brand-subtext">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center text-amber-500 gap-0.5">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>

                <h4 className="text-sm font-bold text-brand-dark">{rev.title}</h4>
                <p className="text-sm text-brand-subtext leading-relaxed">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Submission Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative border border-brand-muted shadow-2xl">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-brand-subtext hover:text-brand-dark"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-serif text-xl font-bold text-brand-dark">Review {product.title}</h3>
              <p className="text-xs text-brand-subtext mt-1">Share your honest feedback with our wellness community.</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
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
                      <Star className={`w-6 h-6 ${star <= newReviewRating ? 'fill-current' : 'text-gray-300'}`} />
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
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Review Headline</label>
                <input
                  type="text"
                  required
                  value={newReviewTitle}
                  onChange={(e) => setNewReviewTitle(e.target.value)}
                  placeholder="e.g. Smooth texture and zero bloating!"
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-dark block mb-1">Detailed Review</label>
                <textarea
                  required
                  rows={4}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="How was the digestion, taste, and solubility?"
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <button type="submit" className="w-full btn-primary !py-3 text-sm">
                Submit Verified Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h3 className="font-serif text-2xl font-bold text-brand-dark">Pairs Well With</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.slice(0, 3).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
