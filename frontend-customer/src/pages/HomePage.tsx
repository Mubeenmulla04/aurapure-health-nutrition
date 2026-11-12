import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Leaf,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Star,
  ChevronRight,
  TrendingUp,
  HeartHandshake,
  Check,
  X as CloseIcon,
  Zap,
  Gift,
  Truck,
  MapPin,
  PackageCheck,
  Award,
  ThumbsUp,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { Product, Category, FAQItem } from '../types';
import { ProductCard } from '../components/product/ProductCard';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes, faqRes] = await Promise.all([
          api.get('/products/featured'),
          api.get('/categories'),
          api.get('/faqs'),
        ]);

        if (prodRes.data?.data?.products) {
          setFeaturedProducts(prodRes.data.data.products);
        }
        if (catRes.data?.data?.categories) {
          setCategories(catRes.data.data.categories);
        }
        if (faqRes.data?.data?.faqs) {
          setFaqs(faqRes.data.data.faqs);
        }
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-10 sm:space-y-20 pb-12 sm:pb-20 overflow-hidden">
      
      {/* Mobile-First: Quick Category Story Circles (Instagram-style D2C navigation) */}
      <section className="pt-3 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-2 px-1">
          {[
            {
              name: 'All Products',
              slug: 'all',
              link: '/collections',
              img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80',
              badge: 'Explore',
            },
            {
              name: 'Plant Protein',
              slug: 'plant-protein-powder',
              link: '/collections/plant-protein-powder',
              img: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=200&q=80',
              badge: 'Popular',
            },
            {
              name: 'Daily Wellness',
              slug: 'daily-wellness',
              link: '/collections/daily-wellness',
              img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=200&q=80',
              badge: 'Ayurveda',
            },
            {
              name: 'Super Greens',
              slug: 'superfoods-greens',
              link: '/collections/superfoods-greens',
              img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80',
              badge: 'Detox',
            },
            {
              name: 'Duo Bundle',
              slug: 'bundle',
              link: '/products/plant-protein-belgian-dark-chocolate',
              img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=200&q=80',
              badge: '🎁 Free Gift',
            },
          ].map((cat, i) => (
            <Link
              key={i}
              to={cat.link}
              className="flex flex-col items-center flex-shrink-0 group focus:outline-none"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-gradient-to-tr from-brand-primary via-brand-gold to-brand-primary-hover shadow-xs group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-white">
                  <img src={cat.img} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                {cat.badge && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-brand-primary text-white text-[8px] font-bold uppercase tracking-tight shadow-xs whitespace-nowrap">
                    {cat.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-brand-dark mt-2 tracking-tight group-hover:text-brand-primary transition-colors text-center line-clamp-1 max-w-[70px]">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 1. Mobile-First Hero Banner */}
      <section className="relative px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-b from-[#F4EFEA] to-[#FAF9F5] border border-brand-muted/80 p-5 sm:p-14 lg:p-20 overflow-hidden shadow-subtle">
          
          {/* Subtle Organic Background Glow */}
          <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-brand-glow/60 blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              
              {/* Clean Label Badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-white border border-brand-muted text-brand-primary text-[11px] sm:text-xs font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />
                <span>Zero Bloating • 100% Clean Plant Isolate</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-brand-dark leading-[1.12]">
                Pure Plant Power. <br />
                <span className="italic font-normal text-brand-primary">Zero Compromise.</span>
              </h1>

              {/* Sub-copy */}
              <p className="text-xs sm:text-base lg:text-lg text-brand-subtext max-w-xl leading-relaxed">
                Cold-pressed organic plant protein with digestive enzymes (Papain & Bromelain) and Ayurvedic adaptogens (KSM-66 Ashwagandha). 100% gentle on Indian stomachs.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  to="/collections/plant-protein-powder"
                  className="btn-primary !w-full sm:!w-auto !py-3.5 !px-8 text-center text-sm font-bold shadow-card gap-2"
                >
                  <span>Shop Clean Proteins</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/pages/about"
                  className="btn-secondary !w-full sm:!w-auto !py-3.5 !px-8 text-center text-sm"
                >
                  Our Clean Philosophy
                </Link>
              </div>

              {/* Trust Indicators Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 pt-4 sm:pt-6 border-t border-brand-muted/70 text-[11px] sm:text-xs text-brand-dark">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-sage flex-shrink-0" />
                  <span>25g Protein/Scoop</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-sage flex-shrink-0" />
                  <span>Zero Bloat Enzymes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-sage flex-shrink-0" />
                  <span>NABL Certified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-sage flex-shrink-0" />
                  <span>0g Added Sugar</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Imagery */}
            <div className="lg:col-span-5 relative mt-2 sm:mt-0">
              <div className="relative mx-auto aspect-[4/4] sm:aspect-[4/5] max-w-xs sm:max-w-sm rounded-2xl sm:rounded-3xl overflow-hidden shadow-floating border-4 border-white bg-white">
                <img
                  src="https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80"
                  alt="AuraPure Belgian Chocolate Plant Protein"
                  className="w-full h-full object-cover"
                />

                {/* Floating Rating Pill */}
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-xl p-2.5 sm:p-3.5 border border-brand-muted shadow-card flex items-center justify-between">
                  <div>
                    <div className="flex items-center text-amber-500 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <p className="text-[11px] sm:text-xs font-bold text-brand-dark mt-0.5">4.9/5 from 2,400+ Verified Buyers</p>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary bg-brand-glow px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scrubsy Inspiration 1: Hero Metric Social Proof Strip */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-brand-muted/80 shadow-subtle p-4 sm:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 divide-x-0 divide-y sm:divide-y-0 sm:divide-x divide-brand-muted/70 text-center">
            <div className="py-2 sm:py-0">
              <p className="font-serif text-2xl sm:text-4xl font-bold text-brand-primary">50,000+</p>
              <p className="text-xs sm:text-sm font-semibold text-brand-dark mt-0.5">Conscious Orders</p>
              <p className="text-[10px] sm:text-[11px] text-brand-subtext">Delivered across India</p>
            </div>
            <div className="py-2 sm:py-0 sm:pl-6">
              <p className="font-serif text-2xl sm:text-4xl font-bold text-brand-primary">18,500+</p>
              <p className="text-xs sm:text-sm font-semibold text-brand-dark mt-0.5">Pin Codes Served</p>
              <p className="text-[10px] sm:text-[11px] text-brand-subtext">Express air delivery</p>
            </div>
            <div className="py-2 sm:py-0 sm:pl-6">
              <div className="flex items-center justify-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-serif text-2xl sm:text-4xl font-bold text-brand-dark">4.9 / 5</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-brand-dark mt-0.5">Verified Ratings</p>
              <p className="text-[10px] sm:text-[11px] text-brand-subtext">2,400+ genuine reviews</p>
            </div>
            <div className="py-2 sm:py-0 sm:pl-6">
              <p className="font-serif text-2xl sm:text-4xl font-bold text-brand-gold">100%</p>
              <p className="text-xs sm:text-sm font-semibold text-brand-dark mt-0.5">NABL Certified</p>
              <p className="text-[10px] sm:text-[11px] text-brand-subtext">Heavy metal & toxin free</p>
            </div>
          </div>
        </div>
      </section>

      {/* Scrubsy Inspiration 2: Dynamic Moving Pain-Points Ticker Marquee */}
      <section className="bg-brand-primary text-white py-3 sm:py-4 overflow-hidden shadow-sm relative w-full max-w-full">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-[11px] sm:text-sm font-bold tracking-wider uppercase">
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-brand-gold" /> Zero Bloating or Gas</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><Leaf className="w-3.5 h-3.5 text-brand-glow" /> 100% Clean Plant Protein</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-brand-gold" /> Independently Lab Tested</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-glow" /> 0g Added Sugar • Monk Fruit</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-brand-gold" /> Fortified with Ashwagandha</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-brand-glow" /> Free Express Shipping Over ₹999</span>
            <span className="text-brand-glow/40">•</span>
          </div>
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-brand-gold" /> Zero Bloating or Gas</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><Leaf className="w-3.5 h-3.5 text-brand-glow" /> 100% Clean Plant Protein</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-brand-gold" /> Independently Lab Tested</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-glow" /> 0g Added Sugar • Monk Fruit</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-brand-gold" /> Fortified with Ashwagandha</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-brand-glow" /> Free Express Shipping Over ₹999</span>
            <span className="text-brand-glow/40">•</span>
          </div>
        </div>
      </section>

      {/* 2. Featured Collections Grid */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6 sm:mb-10">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-primary">Our Categorical Offerings</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-brand-dark mt-1">
              Targeted Plant Nutrition
            </h2>
          </div>
          <Link
            to="/collections"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-brand-primary hover:text-brand-primary-hover flex-shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/collections/${cat.slug}`}
              className="group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-brand-muted/70 p-2.5 sm:p-4 transition-all duration-300 hover:shadow-card hover:border-brand-primary/30 flex flex-col justify-between"
            >
              <div className="aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-brand-secondary/60 mb-2.5 sm:mb-4">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                {cat.badge && (
                  <span className="inline-block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                    {cat.badge}
                  </span>
                )}
                <h3 className="font-serif text-sm sm:text-lg font-bold text-brand-dark group-hover:text-brand-primary transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-brand-subtext line-clamp-1 sm:line-clamp-2">{cat.description}</p>
              </div>

              <div className="pt-2 sm:pt-4 mt-2 sm:mt-3 border-t border-brand-muted/50 flex items-center justify-between text-[11px] sm:text-xs font-semibold text-brand-primary">
                <span>Explore</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Best Sellers Carousel / Grid */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-12">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-primary">Crafted Without Compromise</span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-brand-dark mt-1">
            Customer Favorites
          </h2>
          <p className="text-xs sm:text-sm text-brand-subtext mt-1.5">
            Every formula is cold-pressed, non-GMO, naturally sweetened with monk fruit, and independently lab-tested.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
          {featuredProducts.slice(0, 4).map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* Scrubsy Inspiration 3: BOGO / Volume Bundle Special Offer */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-5 sm:p-12 lg:p-16 relative overflow-hidden shadow-card">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold text-brand-dark text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm">
                <Gift className="w-3.5 h-3.5" />
                <span>Special Festive Offer • Limited Bundle</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Daily Clean Fuel Duo <br />
                <span className="text-brand-glow font-normal italic">+ Free Stainless Steel Shaker</span>
              </h2>

              <p className="text-xs sm:text-base text-white/80 max-w-lg leading-relaxed">
                Order 2 Tubs of Organic Belgian Chocolate or Bourbon Vanilla Plant Protein and receive our insulated matte-black stainless steel shaker (worth ₹499) completely FREE.
              </p>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-2xl sm:text-3xl font-bold text-white">₹2,899</span>
                <span className="text-sm sm:text-base text-white/60 line-through">₹3,898</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-bold border border-emerald-400/30">
                  Save ₹999 (26% OFF)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  to="/products/plant-protein-belgian-dark-chocolate"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 rounded-full bg-brand-gold text-brand-dark font-bold text-xs sm:text-sm tracking-wide transition-all hover:bg-amber-400 shadow-lg gap-2 text-center"
                >
                  <Gift className="w-4 h-4" />
                  <span>Claim Duo Bundle Offer</span>
                </Link>
                <span className="text-[11px] sm:text-xs text-white/70 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold" />
                  Free Express Shipping Included
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto aspect-square max-w-xs sm:max-w-sm rounded-2xl sm:rounded-3xl overflow-hidden bg-white/10 p-3 sm:p-4 border border-white/20 backdrop-blur-sm">
                <img
                  src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80"
                  alt="AuraPure Starter Bundle"
                  className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                />
                <div className="absolute top-5 right-5 sm:top-7 sm:right-7 bg-brand-gold text-brand-dark px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase shadow-md flex items-center gap-1">
                  🎁 Free Gift Bow
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scrubsy Inspiration 4: Visual 1-2-3 Ritual Guide */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-12">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-primary">Effortless Nutrition</span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-brand-dark mt-1">
            The 30-Second Clean Fuel Ritual
          </h2>
          <p className="text-xs sm:text-sm text-brand-subtext mt-1.5">
            No blender tantrums. No chalky clumps. Effortless gut-friendly nourishment in 3 simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-8">
          <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-brand-muted/70 shadow-subtle space-y-2.5 sm:space-y-4 hover:border-brand-primary/40 transition-colors">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-secondary text-brand-primary font-bold text-[10px] sm:text-xs">
              STEP 01
            </span>
            <h3 className="font-serif text-lg sm:text-2xl font-bold text-brand-dark">Scoop</h3>
            <p className="text-xs sm:text-sm text-brand-subtext leading-relaxed">
              Add 1 level scoop (32g) of cold-pressed plant protein to your shaker. Provides 25g complete bioavailable protein and 4.8g BCAAs.
            </p>
          </div>

          <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-brand-muted/70 shadow-subtle space-y-2.5 sm:space-y-4 hover:border-brand-primary/40 transition-colors">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-secondary text-brand-primary font-bold text-[10px] sm:text-xs">
              STEP 02
            </span>
            <h3 className="font-serif text-lg sm:text-2xl font-bold text-brand-dark">Shake</h3>
            <p className="text-xs sm:text-sm text-brand-subtext leading-relaxed">
              Pour 250ml–300ml of chilled water, unsweetened almond milk, or tender coconut water. Shake vigorously for 20 seconds for a silky, clump-free texture.
            </p>
          </div>

          <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-brand-muted/70 shadow-subtle space-y-2.5 sm:space-y-4 hover:border-brand-primary/40 transition-colors">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-secondary text-brand-primary font-bold text-[10px] sm:text-xs">
              STEP 03
            </span>
            <h3 className="font-serif text-lg sm:text-2xl font-bold text-brand-dark">Thrive</h3>
            <p className="text-xs sm:text-sm text-brand-subtext leading-relaxed">
              Sip and enjoy immediately. Powered by Papain & Bromelain plant enzymes to guarantee zero gas, zero bloating, and seamless nutrient absorption.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Why AuraPure vs Commercial Whey Comparison */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 overflow-hidden w-full">
        <div className="bg-brand-secondary/50 rounded-2xl sm:rounded-3xl border border-brand-muted/80 p-4 sm:p-12 lg:p-16 overflow-hidden w-full max-w-full">
          <div className="text-center max-w-xl mx-auto mb-5 sm:mb-10">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-primary">The AuraPure Difference</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-dark mt-1">
              Why Conscious Individuals Choose AuraPure
            </h2>
          </div>

          <div className="w-full max-w-full overflow-x-auto no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[500px] text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-muted/80">
                  <th className="py-3 px-3 text-[10px] sm:text-xs font-bold text-brand-subtext uppercase">Nutritional Quality</th>
                  <th className="py-3 px-3 text-xs sm:text-sm font-bold text-brand-primary bg-brand-glow/40 rounded-t-xl">
                    🌿 AuraPure Plant Nutrition
                  </th>
                  <th className="py-3 px-3 text-[10px] sm:text-xs font-bold text-brand-subtext uppercase">Standard Commercial Whey</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-muted/60 text-xs sm:text-sm">
                <tr>
                  <td className="py-3.5 px-3 font-medium text-brand-dark">Digestive Comfort & Bloating</td>
                  <td className="py-3.5 px-3 bg-brand-glow/20 font-semibold text-brand-primary flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-brand-sage flex-shrink-0" /> Zero gas or bloating (Papain & Bromelain enzymes)
                  </td>
                  <td className="py-3.5 px-3 text-brand-subtext flex items-center gap-1.5">
                    <CloseIcon className="w-3.5 h-3.5 text-brand-error flex-shrink-0" /> Frequent cramps, acne, and heaviness
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-medium text-brand-dark">Heavy Metals & Lab Certification</td>
                  <td className="py-3.5 px-3 bg-brand-glow/20 font-semibold text-brand-primary">
                    100% NABL Batch Tested for Lead & Arsenic
                  </td>
                  <td className="py-3.5 px-3 text-brand-subtext">Often opaque without public batch reports</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-medium text-brand-dark">Sweeteners & Aftertaste</td>
                  <td className="py-3.5 px-3 bg-brand-glow/20 font-semibold text-brand-primary">
                    Pure Monk Fruit & Real Cocoa / Vanilla
                  </td>
                  <td className="py-3.5 px-3 text-brand-subtext">Sucralose, Aspartame, or Bitter Stevia</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-medium text-brand-dark">Ayurvedic Synergy</td>
                  <td className="py-3.5 px-3 bg-brand-glow/20 font-semibold text-brand-primary rounded-b-xl">
                    KSM-66 Ashwagandha & Shatavari Adaptogens
                  </td>
                  <td className="py-3.5 px-3 text-brand-subtext">None</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Customer Testimonials & Social Proof */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-12">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-primary">
            Loved By Conscious Shoppers
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-brand-dark mt-1">
            Real Stories. Honest Reviews.
          </h2>
        </div>

        <div className="flex gap-3 sm:gap-6 overflow-x-auto no-scrollbar pb-3 sm:grid sm:grid-cols-3">
          {[
            {
              name: 'Dr. Siddharth Sen',
              city: 'Bengaluru, KA',
              role: 'Verified Buyer',
              rating: 5,
              title: 'Zero bloat, fantastic digestion',
              comment: 'As someone lactose intolerant, regular whey caused severe cystic acne and heavy bloating. AuraPure chocolate digests like water and tastes genuinely authentic.'
            },
            {
              name: 'Ananya Sharma',
              city: 'Mumbai, MH',
              role: 'Verified Buyer',
              rating: 5,
              title: 'Cleanest ingredient list in India',
              comment: 'No maltodextrin, no artificial sweeteners, zero fake vanilla essence. The monk fruit sweetness is subtle and doesn’t leave a bitter stevia aftertaste.'
            },
            {
              name: 'Rahul Nambiar',
              city: 'Kochi, KL',
              role: 'Verified Buyer',
              rating: 5,
              title: 'Best mixability in cold water',
              comment: 'Just 20 seconds in a shaker bottle with tender coconut water. Completely smooth without clumps. The 25g protein is an effortless daily boost.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="min-w-[280px] sm:min-w-0 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-brand-muted/70 shadow-subtle flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center text-amber-500 gap-0.5">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-brand-dark">{item.title}</h4>
                <p className="text-xs text-brand-subtext leading-relaxed">"{item.comment}"</p>
              </div>

              <div className="pt-3 mt-3 border-t border-brand-muted/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-brand-dark">{item.name}</p>
                  <p className="text-[10px] text-brand-subtext">{item.city}</p>
                </div>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ {item.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAQs Accordion */}
      <section className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-10">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-primary">Transparency Matters</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-dark mt-1">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq._id}
                className="rounded-2xl border border-brand-muted/70 bg-white overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-brand-dark text-sm sm:text-base hover:text-brand-primary"
                >
                  <span>{faq.question}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-brand-subtext transition-transform duration-200 ${
                      isOpen ? 'rotate-90 text-brand-primary' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-brand-subtext leading-relaxed border-t border-brand-muted/40 animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
