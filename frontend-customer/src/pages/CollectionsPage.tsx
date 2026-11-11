import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, ChevronRight, X } from 'lucide-react';
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-brand-subtext">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/collections" className="hover:text-brand-primary">Collections</Link>
        {activeCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-brand-dark">{activeCategory.name}</span>
          </>
        )}
      </nav>

      {/* Collection Header Banner */}
      <div className="rounded-3xl bg-brand-secondary/60 border border-brand-muted/80 p-8 sm:p-12 relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">
            AuraPure Clean Nutrition
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-dark">
            {activeCategory ? activeCategory.name : 'All Functional Plant Formulations'}
          </h1>
          <p className="text-sm text-brand-subtext leading-relaxed">
            {activeCategory
              ? activeCategory.description
              : 'Explore our full spectrum of clean, cold-pressed plant protein and Ayurvedic superfood powders.'}
          </p>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Link
          to="/collections"
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            !slug
              ? 'bg-brand-primary text-white shadow-subtle'
              : 'bg-white border border-brand-muted text-brand-dark hover:border-brand-primary'
          }`}
        >
          All Collections
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat._id}
            to={`/collections/${cat.slug}`}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              slug === cat.slug
                ? 'bg-brand-primary text-white shadow-subtle'
                : 'bg-white border border-brand-muted text-brand-dark hover:border-brand-primary'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Filter and Product Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
        
        {/* Left Sidebar Filter Controls */}
        <aside className="lg:col-span-1 space-y-6 bg-white p-6 rounded-3xl border border-brand-muted/70 h-fit">
          <div className="flex items-center justify-between pb-4 border-b border-brand-muted/70">
            <div className="flex items-center gap-2 font-bold text-sm text-brand-dark">
              <SlidersHorizontal className="w-4 h-4 text-brand-primary" />
              <span>Filter Catalog</span>
            </div>
            {(selectedFlavor !== 'ALL' || maxPrice < 3000) && (
              <button
                onClick={() => {
                  setSelectedFlavor('ALL');
                  setMaxPrice(3000);
                }}
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
                    name="flavor"
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
        <div className="lg:col-span-3 space-y-6">
          
          {/* Sorting Bar */}
          <div className="bg-white p-4 rounded-2xl border border-brand-muted/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                <option value="featured">Featured & Best Sellers</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Customer Rating</option>
              </select>
            </div>
          </div>

          {/* Grid Cards */}
          {products.length === 0 && !isLoading ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-brand-muted/70 space-y-3">
              <h3 className="font-serif text-lg font-bold text-brand-dark">No products match your filter</h3>
              <p className="text-xs text-brand-subtext max-w-sm mx-auto">
                Try widening your price range or selecting another flavor profile to view our organic options.
              </p>
              <button
                onClick={() => {
                  setSelectedFlavor('ALL');
                  setMaxPrice(3000);
                }}
                className="btn-outline !text-xs !py-2.5"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
