import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, ChevronRight, X, Check, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/product/ProductCard';

export const CollectionsPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  // Filters state
  const [selectedSort, setSelectedSort] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [selectedFlavor, setSelectedFlavor] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Mobile Bottom Sheet states
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

  // Load categories
  useEffect(() => {
    api.get('/categories').then((res) => {
      if (res.data?.data?.categories) {
        setCategories(res.data.data.categories);
        if (slug) {
          const current = res.data.data.categories.find((c: Category) => c.slug === slug);
          setActiveCategory(current || null);
        } else {
          setActiveCategory(null);
        }
      }
    });
  }, [slug]);

  // Load products based on slug and filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const params: any = {
          sort: selectedSort,
          maxPrice,
        };
        if (slug) {
          params.category = slug;
        }
        if (selectedFlavor !== 'ALL') {
          params.flavor = selectedFlavor;
        }

        const res = await api.get('/products', { params });
        if (res.data?.data?.products) {
          setProducts(res.data.data.products);
        }
      } catch (err) {
        console.error('Error fetching collection products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [slug, selectedSort, maxPrice, selectedFlavor]);

  const activeFilterCount = (selectedFlavor !== 'ALL' ? 1 : 0) + (maxPrice < 3000 ? 1 : 0);

  const resetFilters = () => {
    setSelectedFlavor('ALL');
    setMaxPrice(3000);
  };

  const sortOptions = [
    { value: 'featured', label: 'Featured & Best Sellers' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Customer Rating' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-brand-subtext">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/collections" className="hover:text-brand-primary">Collections</Link>
        {activeCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-brand-dark truncate max-w-[160px] sm:max-w-xs">{activeCategory.name}</span>
          </>
        )}
      </nav>

      {/* Collection Header Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-brand-secondary/60 border border-brand-muted/80 p-5 sm:p-12 relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-1.5 sm:space-y-2">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-primary">
            AuraPure Clean Nutrition
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-brand-dark">
            {activeCategory ? activeCategory.name : 'All Functional Plant Formulations'}
          </h1>
          <p className="text-xs sm:text-sm text-brand-subtext leading-relaxed">
            {activeCategory
              ? activeCategory.description
              : 'Explore our full spectrum of clean, cold-pressed plant protein and Ayurvedic superfood powders.'}
          </p>
        </div>
      </div>

      {/* Category Pills Navigation (Horizontal scrollable story bar) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <Link
          to="/collections"
          className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            !slug
              ? 'bg-brand-primary text-white shadow-subtle'
              : 'bg-white border border-brand-muted text-brand-dark hover:border-brand-primary'
          }`}
        >
          All Formulations
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat._id}
            to={`/collections/${cat.slug}`}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              slug === cat.slug
                ? 'bg-brand-primary text-white shadow-subtle'
                : 'bg-white border border-brand-muted text-brand-dark hover:border-brand-primary'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Mobile-Only Quick Filter & Sort Trigger Strip */}
      <div className="lg:hidden flex items-center justify-between gap-2 bg-white p-2.5 rounded-2xl border border-brand-muted/80 shadow-xs">
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-bg text-brand-dark text-xs font-semibold border border-brand-muted/70 active:scale-95"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-brand-primary" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsMobileSortOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-bg text-brand-dark text-xs font-semibold border border-brand-muted/70 active:scale-95"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-brand-primary" />
          <span className="truncate">
            {selectedSort === 'featured' ? 'Featured' : selectedSort === 'price-asc' ? 'Price ↑' : selectedSort === 'price-desc' ? 'Price ↓' : 'Rating'}
          </span>
        </button>
      </div>

      {/* Filter and Product Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-1">
        
        {/* Desktop Sidebar Filter Controls (Hidden on mobile) */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6 bg-white p-6 rounded-3xl border border-brand-muted/70 h-fit sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-brand-muted/70">
            <div className="flex items-center gap-2 font-bold text-sm text-brand-dark">
              <SlidersHorizontal className="w-4 h-4 text-brand-primary" />
              <span>Filter Catalog</span>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-brand-primary hover:underline font-semibold"
              >
                Reset
              </button>
            )}
          </div>

          {/* Price Range Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-brand-dark">
              <span>Max Price</span>
              <span className="text-brand-primary font-bold">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="700"
              max="3000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-brand-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-brand-subtext">
              <span>₹700</span>
              <span>₹3,000</span>
            </div>
          </div>

          {/* Flavor Filters */}
          <div className="space-y-2 pt-2 border-t border-brand-muted/50">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-dark">Flavor Profile</span>
            <div className="flex flex-col gap-1.5 pt-1">
              {[
                { label: 'All Flavors', value: 'ALL' },
                { label: 'Belgian Dark Chocolate', value: 'Chocolate' },
                { label: 'Madagascar Vanilla Bean', value: 'Vanilla' },
                { label: '100% Raw Unflavored', value: 'Unflavored' },
                { label: 'Ayurvedic Golden Spiced', value: 'Turmeric' },
              ].map((flv) => (
                <label
                  key={flv.value}
                  className="flex items-center gap-2.5 text-xs text-brand-dark cursor-pointer hover:text-brand-primary"
                >
                  <input
                    type="radio"
                    name="flavor-desktop"
                    checked={selectedFlavor === flv.value}
                    onChange={() => setSelectedFlavor(flv.value)}
                    className="accent-brand-primary"
                  />
                  <span>{flv.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Product Grid */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          
          {/* Desktop-only Sorting Bar */}
          <div className="hidden lg:flex bg-white p-4 rounded-2xl border border-brand-muted/70 items-center justify-between gap-3">
            <span className="text-xs font-medium text-brand-subtext">
              Showing <strong>{products.length}</strong> clean formulations
            </span>

            <div className="flex items-center gap-2 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-subtext" />
              <span className="text-brand-subtext">Sort By:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as any)}
                className="bg-brand-bg rounded-lg px-2.5 py-1.5 font-semibold text-brand-dark border border-brand-muted/70 focus:outline-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Two-Column Mobile Product Grid (and 3-column desktop) */}
          {products.length === 0 && !isLoading ? (
            <div className="p-8 sm:p-12 text-center bg-white rounded-2xl sm:rounded-3xl border border-brand-muted/70 space-y-3">
              <h3 className="font-serif text-lg font-bold text-brand-dark">No products match your filter</h3>
              <p className="text-xs text-brand-subtext max-w-sm mx-auto">
                Try widening your price range or selecting another flavor profile to view our organic options.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="btn-outline !text-xs !py-2.5"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom duration-250 pb-safe">
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-brand-muted rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-3 border-b border-brand-muted/70">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-primary" />
                <h3 className="font-serif text-base font-bold text-brand-dark">Filter Products</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-brand-subtext hover:text-brand-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-brand-dark">
                <span>Maximum Budget</span>
                <span className="text-brand-primary font-bold text-sm">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="700"
                max="3000"
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-primary cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-brand-subtext">
                <span>₹700</span>
                <span>₹3,000</span>
              </div>
            </div>

            {/* Flavor Radio Pills */}
            <div className="space-y-2 pt-2 border-t border-brand-muted/60">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-dark block">Flavor Preference</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'All Flavors', value: 'ALL' },
                  { label: 'Dark Chocolate', value: 'Chocolate' },
                  { label: 'Vanilla Bean', value: 'Vanilla' },
                  { label: 'Raw Unflavored', value: 'Unflavored' },
                  { label: 'Golden Turmeric', value: 'Turmeric' },
                ].map((flv) => (
                  <button
                    type="button"
                    key={flv.value}
                    onClick={() => setSelectedFlavor(flv.value)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      selectedFlavor === flv.value
                        ? 'border-brand-primary bg-brand-glow text-brand-primary ring-1 ring-brand-primary'
                        : 'border-brand-muted/80 bg-white text-brand-dark'
                    }`}
                  >
                    {flv.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-brand-muted/70 flex gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="btn-secondary !py-3 flex-1 text-xs font-semibold"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="btn-primary !py-3 flex-1 text-xs font-semibold"
              >
                Apply ({products.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sort Bottom Sheet Modal */}
      {isMobileSortOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileSortOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-250 pb-safe">
            <div className="w-12 h-1 bg-brand-muted rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-brand-muted/70">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-brand-primary" />
                <h3 className="font-serif text-base font-bold text-brand-dark">Sort By</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSortOpen(false)}
                className="p-1 text-brand-subtext hover:text-brand-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              {sortOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    setSelectedSort(opt.value as any);
                    setIsMobileSortOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                    selectedSort === opt.value
                      ? 'bg-brand-glow text-brand-primary font-bold'
                      : 'text-brand-dark hover:bg-brand-bg'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedSort === opt.value && <Check className="w-4 h-4 text-brand-primary" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
