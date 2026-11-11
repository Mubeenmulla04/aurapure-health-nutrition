import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const selectedVariant = product.variants?.[selectedVariantIndex] || product.variants?.[0];
  const isWishlisted = isInWishlist(product._id);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant) return;

    try {
      setIsAdding(true);
      await addItem(selectedVariant._id, 1);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id, selectedVariant?._id);
  };

  return (
    <div className="group relative bg-white rounded-3xl border border-brand-muted/70 p-4 transition-all duration-300 hover:shadow-card hover:border-brand-primary/20 flex flex-col justify-between">
      <div>
        {/* Image Container with Badges */}
        <Link to={`/products/${product.slug}`} className="block relative aspect-[4/4] rounded-2xl overflow-hidden bg-brand-secondary/60 mb-4">
          <img
            src={selectedVariant?.images?.[0] || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80'}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Floating Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
            {product.isBestSeller && (
              <span className="px-2.5 py-1 rounded-full bg-brand-primary text-white text-[10px] font-bold tracking-wider uppercase shadow-sm">
                Best Seller
              </span>
            )}
            {selectedVariant?.discountPercent > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-brand-gold text-white text-[10px] font-bold tracking-wider uppercase shadow-sm">
                {selectedVariant.discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
              isWishlisted
                ? 'bg-red-50 text-brand-error'
                : 'bg-white/80 text-brand-subtext hover:text-brand-primary hover:bg-white'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </Link>

        {/* Rating & Review Count */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="flex items-center text-amber-500">
            <Star className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="text-xs font-bold text-brand-dark">{product.rating}</span>
          <span className="text-[11px] text-brand-subtext">({product.reviewCount})</span>
        </div>

        {/* Product Title */}
        <Link to={`/products/${product.slug}`} className="block group-hover:text-brand-primary transition-colors">
          <h3 className="font-serif text-base font-bold text-brand-dark leading-snug line-clamp-1">
            {product.title}
          </h3>
          <p className="text-xs text-brand-subtext mt-1 line-clamp-1">{product.subtitle}</p>
        </Link>

        {/* Variant Flavor Selector Pills */}
        {product.variants && product.variants.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {product.variants.map((v, idx) => (
              <button
                key={v._id}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedVariantIndex(idx);
                }}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                  selectedVariantIndex === idx
                    ? 'border-brand-primary bg-brand-glow text-brand-primary font-semibold'
                    : 'border-brand-muted/80 bg-white text-brand-subtext hover:border-brand-subtext'
                }`}
              >
                {v.flavor}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pricing & Add to Cart Action */}
      <div className="mt-4 pt-3 border-t border-brand-muted/50 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-brand-dark">₹{selectedVariant?.sellingPrice}</span>
            {selectedVariant?.mrp > selectedVariant?.sellingPrice && (
              <span className="text-xs text-brand-subtext line-through">₹{selectedVariant.mrp}</span>
            )}
          </div>
          <span className="text-[10px] text-brand-subtext block">
            {selectedVariant?.packSize || 'Standard pack'}
          </span>
        </div>

        <button
          onClick={handleQuickAdd}
          disabled={isAdding || !selectedVariant?.inStock}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            addedSuccess
              ? 'bg-brand-sage text-white'
              : !selectedVariant?.inStock
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-brand-primary text-white hover:bg-brand-primary-hover active:scale-95 shadow-subtle'
          }`}
        >
          {addedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added</span>
            </>
          ) : !selectedVariant?.inStock ? (
            <span>Sold Out</span>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
