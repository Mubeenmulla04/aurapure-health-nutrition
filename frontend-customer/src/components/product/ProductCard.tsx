import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingBag, Check, Zap, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  const selectedVariant = product.variants?.[selectedVariantIndex] || product.variants?.[0];
  const isWishlisted = isInWishlist(product._id);

  // Add to Cart handler: does not open cart drawer, shows toast, updates count
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant || !selectedVariant.inStock || isAdding || isBuyingNow) return;

    try {
      setIsAdding(true);
      await addItem(selectedVariant._id, 1, false);
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2200);
    } catch {
      // Error handled by CartContext
    } finally {
      setIsAdding(false);
    }
  };

  // Buy Now handler: adds to cart and redirects immediately to checkout
  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant || !selectedVariant.inStock || isAdding || isBuyingNow) return;

    try {
      setIsBuyingNow(true);
      await addItem(selectedVariant._id, 1, false);
      navigate('/checkout');
    } catch {
      setIsBuyingNow(false);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id, selectedVariant?._id);
  };

  const hasVariants = product.variants && product.variants.length > 1;
  const hasDiscount = selectedVariant && selectedVariant.mrp > selectedVariant.sellingPrice;
  const discountPercent = hasDiscount
    ? selectedVariant.discountPercent ||
      Math.round(((selectedVariant.mrp - selectedVariant.sellingPrice) / selectedVariant.mrp) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-xl sm:rounded-2xl border border-brand-muted/70 p-2 sm:p-2.5 transition-all duration-300 hover:shadow-card hover:border-brand-primary/25 flex flex-col justify-between overflow-hidden">
      <div>
        {/* Compact Product Image (4:3 Aspect Ratio for Reduced Card Height) */}
        <Link
          to={`/products/${product.slug}`}
          className="block relative aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden bg-brand-secondary/60 mb-1.5 sm:mb-2"
        >
          <img
            src={
              selectedVariant?.images?.[0] ||
              'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80'
            }
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Floating Badges */}
          <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 flex flex-col gap-0.5 items-start pointer-events-none">
            {product.isBestSeller && (
              <span className="px-1.5 py-0.5 rounded-full bg-brand-primary text-white text-[8px] sm:text-[9px] font-bold tracking-wider uppercase shadow-xs">
                Best Seller
              </span>
            )}
            {discountPercent > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-brand-gold text-brand-dark text-[8px] sm:text-[9px] font-extrabold tracking-wider uppercase shadow-xs">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlistToggle}
            className={`absolute top-1 right-1 sm:top-1.5 sm:right-1.5 p-1 sm:p-1.5 rounded-full backdrop-blur-md transition-all active:scale-90 ${
              isWishlisted
                ? 'bg-rose-50 text-rose-600'
                : 'bg-white/80 text-brand-subtext hover:text-brand-primary hover:bg-white shadow-xs'
            }`}
            aria-label="Save to Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </Link>

        {/* Compact Rating & Pack Size Line */}
        <div className="flex items-center justify-between text-[10px] text-brand-subtext mb-1 px-0.5">
          {product.rating > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-current" />
              <span className="font-bold text-brand-dark">{product.rating}</span>
              {product.reviewCount > 0 && <span className="text-[9px]">({product.reviewCount})</span>}
            </div>
          ) : (
            <span className="text-[9px] text-brand-subtext/80">100% Plant Fuel</span>
          )}
          <span className="truncate font-medium">{selectedVariant?.packSize || ''}</span>
        </div>

        {/* Product Title (Constrained to 2 lines max with clean line height) */}
        <Link to={`/products/${product.slug}`} className="block group-hover:text-brand-primary transition-colors px-0.5">
          <h3 className="font-serif text-xs sm:text-[13px] font-bold text-brand-dark leading-snug line-clamp-2">
            {product.title}
          </h3>
        </Link>

        {/* Compact Variant Selector Pills (Only if > 1 variant exists) */}
        {hasVariants && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 mt-1 px-0.5">
            {product.variants.map((v, idx) => (
              <button
                key={v._id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedVariantIndex(idx);
                }}
                className={`text-[8px] sm:text-[9px] font-medium px-1.5 py-0.5 rounded-md border whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedVariantIndex === idx
                    ? 'border-brand-primary bg-brand-glow text-brand-primary font-bold'
                    : 'border-brand-muted bg-white text-brand-subtext hover:border-brand-dark'
                }`}
              >
                {v.flavor || v.packSize}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Area: Pricing & Tight Action Buttons */}
      <div className="mt-1.5 pt-1.5 border-t border-brand-muted/60 space-y-1.5">
        {/* Price Line */}
        <div className="flex items-baseline gap-1.5 px-0.5">
          <span className="text-xs sm:text-sm font-bold text-brand-dark">₹{selectedVariant?.sellingPrice}</span>
          {hasDiscount && (
            <span className="text-[10px] text-brand-subtext line-through">₹{selectedVariant.mrp}</span>
          )}
        </div>

        {/* Dual Actions: Add to Cart & Buy Now */}
        <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
          {/* Add to Cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding || isBuyingNow || !selectedVariant?.inStock}
            className={`w-full py-1 sm:py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 border ${
              addedToast
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : !selectedVariant?.inStock
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white hover:bg-brand-bg text-brand-primary border-brand-primary shadow-2xs'
            }`}
            aria-label={`Add ${product.title} to Cart`}
          >
            {addedToast ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Added</span>
              </>
            ) : isAdding ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : !selectedVariant?.inStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingBag className="w-3 h-3" />
                <span>Add</span>
              </>
            )}
          </button>

          {/* Buy Now */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isAdding || isBuyingNow || !selectedVariant?.inStock}
            className={`w-full py-1 sm:py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 shadow-2xs ${
              !selectedVariant?.inStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-brand-primary hover:bg-brand-primary-hover text-white'
            }`}
            aria-label={`Buy ${product.title} Now`}
          >
            {isBuyingNow ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Zap className="w-3 h-3 text-brand-gold fill-current" />
                <span>Buy Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline Floating Toast */}
      {addedToast && (
        <div className="absolute inset-x-2 bottom-12 z-30 p-1.5 rounded-lg bg-brand-dark/95 text-white text-[10px] font-medium shadow-floating backdrop-blur-md flex items-center justify-between gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-1 truncate">
            <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="truncate">Added to bag!</span>
          </div>
          <Link
            to="/cart"
            className="text-[9px] font-bold text-brand-gold hover:underline whitespace-nowrap pl-0.5"
          >
            View Bag →
          </Link>
        </div>
      )}
    </div>
  );
};
