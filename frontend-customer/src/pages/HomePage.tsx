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
    <div className="space-y-20 pb-20 overflow-hidden">
      
      {/* 1. Hero Banner */}
      <section className="relative pt-6 sm:pt-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-[2.5rem] bg-gradient-to-b from-[#F4EFEA] to-[#FAF9F5] border border-brand-muted/80 p-8 sm:p-14 lg:p-20 overflow-hidden shadow-subtle">
          
          {/* Subtle Organic Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-glow/60 blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
            <div className="lg:col-span-7 space-y-6">
              
              {/* Clean Label Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-brand-muted text-brand-primary text-xs font-semibold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                <span>Engineered for Peak Digestion & Clean Vitality</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-brand-dark leading-[1.12]">
                Pure Plant Power. <br />
                <span className="italic font-normal text-brand-primary">Zero Compromise.</span>
              </h1>

              {/* Sub-copy */}
              <p className="text-base sm:text-lg text-brand-subtext max-w-xl leading-relaxed">
                Clean-label, cold-pressed plant protein formulated with organic golden pea, brown rice isolate, and wild Indian botanical adaptogens (Ashwagandha & Shatavari). 100% gentle on the stomach.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/collections/plant-protein-powder" className="btn-primary !px-8 !py-4 gap-2 text-sm shadow-card">
                  <span>Explore Plant Proteins</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/pages/about" className="btn-secondary !px-8 !py-4 text-sm">
                  Our Clean Philosophy
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-brand-muted/70 text-xs text-brand-dark">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-sage flex-shrink-0" />
                  <span>25g Complete Protein</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-sage flex-shrink-0" />
                  <span>Zero Bloating Enzymes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-sage flex-shrink-0" />
                  <span>NABL Lab Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-sage flex-shrink-0" />
                  <span>0g Added Sugar</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Imagery */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto aspect-[4/5] max-w-sm rounded-3xl overflow-hidden shadow-floating border-4 border-white bg-white">
                <img
                  src="https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80"
                  alt="AuraPure Belgian Chocolate Plant Protein"
                  className="w-full h-full object-cover"
                />

                {/* Floating Rating Pill */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-brand-muted shadow-card flex items-center justify-between">
                  <div>
                    <div className="flex items-center text-amber-500 gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-brand-dark mt-1">4.9/5 Rating from 1,200+ Indian Shoppers</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-glow px-2.5 py-1 rounded-full">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scrubsy Inspiration 1: Hero Metric Social Proof Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl border border-brand-muted/80 shadow-subtle p-6 sm:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-brand-muted/70 text-center">
            <div className="pt-4 sm:pt-0">
              <p className="font-serif text-3xl sm:text-4xl font-bold text-brand-primary">50,000+</p>
              <p className="text-xs sm:text-sm font-semibold text-brand-dark mt-1">Conscious Orders</p>
              <p className="text-[11px] text-brand-subtext">Delivered safely across India</p>
            </div>
            <div className="pt-4 sm:pt-0 sm:pl-6">
              <p className="font-serif text-3xl sm:text-4xl font-bold text-brand-primary">18,500+</p>
              <p className="text-xs sm:text-sm font-semibold text-brand-dark mt-1">Pin Codes Served</p>
              <p className="text-[11px] text-brand-subtext">Express air delivery via BlueDart</p>
            </div>
            <div className="pt-4 sm:pt-0 sm:pl-6">
              <div className="flex items-center justify-center gap-1 text-amber-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-serif text-3xl sm:text-4xl font-bold text-brand-dark">4.9 / 5</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-brand-dark mt-1">Verified Ratings</p>
              <p className="text-[11px] text-brand-subtext">Based on 2,400+ genuine reviews</p>
            </div>
            <div className="pt-4 sm:pt-0 sm:pl-6">
              <p className="font-serif text-3xl sm:text-4xl font-bold text-brand-gold">100%</p>
              <p className="text-xs sm:text-sm font-semibold text-brand-dark mt-1">NABL Certified</p>
              <p className="text-[11px] text-brand-subtext">Tested for heavy metals & purity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Scrubsy Inspiration 2: Dynamic Moving Pain-Points Ticker Marquee */}
      <section className="bg-brand-primary text-white py-4 overflow-hidden shadow-sm relative">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-xs sm:text-sm font-bold tracking-wider uppercase">
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-brand-gold" /> Zero Bloating or Heavy Stomach</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><Leaf className="w-4 h-4 text-brand-glow" /> 100% Cold-Pressed Plant Protein</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-gold" /> Independently NABL Lab Tested</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-glow" /> 0g Added Sugar • Monk Fruit Sweetened</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-gold" /> Fortified with KSM-66 Ashwagandha</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-brand-glow" /> Free Express Shipping Over ₹999</span>
            <span className="text-brand-glow/40">•</span>
          </div>
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-brand-gold" /> Zero Bloating or Heavy Stomach</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><Leaf className="w-4 h-4 text-brand-glow" /> 100% Cold-Pressed Plant Protein</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-gold" /> Independently NABL Lab Tested</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-glow" /> 0g Added Sugar • Monk Fruit Sweetened</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-gold" /> Fortified with KSM-66 Ashwagandha</span>
            <span className="text-brand-glow/40">•</span>
            <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-brand-glow" /> Free Express Shipping Over ₹999</span>
            <span className="text-brand-glow/40">•</span>
          </div>
        </div>
      </section>

      {/* 2. Featured Collections Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Our Categorical Offerings</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-dark mt-1.5">
              Targeted Plant Nutrition
            </h2>
          </div>
          <Link
            to="/collections"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-brand-primary-hover mt-3 sm:mt-0"
          >
            <span>View All Collections</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/collections/${cat.slug}`}
              className="group relative rounded-3xl overflow-hidden bg-white border border-brand-muted/70 p-4 transition-all duration-300 hover:shadow-card hover:border-brand-primary/30 flex flex-col justify-between"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-brand-secondary/60 mb-4">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="space-y-1">
                {cat.badge && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                    {cat.badge}
                  </span>
                )}
                <h3 className="font-serif text-lg font-bold text-brand-dark group-hover:text-brand-primary transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-brand-subtext line-clamp-2">{cat.description}</p>
              </div>

              <div className="pt-4 mt-3 border-t border-brand-muted/50 flex items-center justify-between text-xs font-semibold text-brand-primary">
                <span>Explore Products</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Best Sellers Carousel / Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Crafted Without Compromise</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-dark mt-1.5">
            Customer Favorites
          </h2>
          <p className="text-sm text-brand-subtext mt-2">
            Every formula is cold-pressed, non-GMO, naturally sweetened with monk fruit, and independently lab-tested.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.slice(0, 3).map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* Scrubsy Inspiration 3: BOGO / Volume Bundle Special Offer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-8 sm:p-14 lg:p-16 relative overflow-hidden shadow-card">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold text-brand-dark text-xs font-bold uppercase tracking-wider shadow-sm">
                <Gift className="w-4 h-4" />
                <span>Special Festive Offer • Limited Bundle</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Daily Clean Fuel Duo <br />
                <span className="text-brand-glow font-normal italic">+ Free Stainless Steel Shaker</span>
              </h2>

              <p className="text-sm sm:text-base text-white/80 max-w-lg leading-relaxed">
                Order 2 Tubs of Organic Belgian Chocolate or Bourbon Vanilla Plant Protein and receive our insulated matte-black stainless steel shaker (worth ₹499) completely FREE.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">₹2,899</span>
                  <span className="text-base text-white/60 line-through">₹3,898</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                    Save ₹999 (26% OFF)
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/products/organic-plant-protein-powder-chocolate"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-brand-gold text-brand-dark font-bold text-sm tracking-wide transition-all hover:bg-amber-400 shadow-lg gap-2"
                >
                  <Gift className="w-4 h-4" />
                  <span>Claim Duo Bundle Offer</span>
                </Link>
                <span className="text-xs text-white/70 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                  Free Express Shipping Included
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto aspect-square max-w-sm rounded-3xl overflow-hidden bg-white/10 p-4 border border-white/20 backdrop-blur-sm">
                <img
                  src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80"
                  alt="AuraPure Starter Bundle"
                  className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute top-7 right-7 bg-brand-gold text-brand-dark px-3 py-1.5 rounded-full text-xs font-extrabold uppercase shadow-md flex items-center gap-1">
                  🎁 Free Gift Bow
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scrubsy Inspiration 4: Visual 1-2-3 Ritual Guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Effortless Nutrition</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-dark mt-1">
            The 30-Second Clean Fuel Ritual
          </h2>
          <p className="text-sm text-brand-subtext mt-2">
            No blender tantrums. No chalky clumps. Effortless gut-friendly nourishment in 3 simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-brand-muted/70 shadow-subtle space-y-4 hover:border-brand-primary/40 transition-colors">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-secondary text-brand-primary font-bold text-xs">
              STEP 01
            </span>
            <h3 className="font-serif text-2xl font-bold text-brand-dark">Scoop</h3>
            <p className="text-sm text-brand-subtext leading-relaxed">
              Add 1 level scoop (32g) of cold-pressed plant protein to your shaker. Provides 25g complete bioavailable protein and 4.8g BCAAs.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-brand-muted/70 shadow-subtle space-y-4 hover:border-brand-primary/40 transition-colors">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-secondary text-brand-primary font-bold text-xs">
              STEP 02
            </span>
            <h3 className="font-serif text-2xl font-bold text-brand-dark">Shake</h3>
            <p className="text-sm text-brand-subtext leading-relaxed">
              Pour 250ml–300ml of chilled water, unsweetened almond milk, or tender coconut water. Shake vigorously for 20 seconds for a silky, clump-free texture.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-brand-muted/70 shadow-subtle space-y-4 hover:border-brand-primary/40 transition-colors">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-secondary text-brand-primary font-bold text-xs">
              STEP 03
            </span>
            <h3 className="font-serif text-2xl font-bold text-brand-dark">Thrive</h3>
            <p className="text-sm text-brand-subtext leading-relaxed">
              Sip and enjoy immediately. Powered by Papain & Bromelain plant enzymes to guarantee zero gas, zero bloating, and seamless nutrient absorption.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Why AuraPure vs Commercial Whey Comparison */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-secondary/50 rounded-3xl border border-brand-muted/80 p-8 sm:p-12 lg:p-16">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">The AuraPure Difference</span>
            <h2 className="font-serif text-3xl font-bold text-brand-dark mt-1">
              Why Conscious Individuals Choose AuraPure
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-muted/80">
                  <th className="py-4 px-4 text-xs font-bold text-brand-subtext uppercase">Nutritional Quality</th>
                  <th className="py-4 px-4 text-sm font-bold text-brand-primary bg-brand-glow/40 rounded-t-xl">
                    🌿 AuraPure Plant Nutrition
                  </th>
                  <th className="py-4 px-4 text-xs font-bold text-brand-subtext uppercase">Standard Commercial Whey</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-muted/60 text-sm">
                <tr>
                  <td className="py-4 px-4 font-medium text-brand-dark">Digestive Comfort & Bloating</td>
                  <td className="py-4 px-4 bg-brand-glow/20 font-semibold text-brand-primary flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-sage" /> Zero gas or bloating (Papain & Bromelain enzymes)
                  </td>
                  <td className="py-4 px-4 text-brand-subtext flex items-center gap-2">
                    <CloseIcon className="w-4 h-4 text-brand-error" /> Frequent cramps, acne, and lactose heaviness
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-brand-dark">Heavy Metals & Lab Certification</td>
                  <td className="py-4 px-4 bg-brand-glow/20 font-semibold text-brand-primary">
                    100% NABL Batch Tested for Lead, Cadmium & Arsenic
                  </td>
                  <td className="py-4 px-4 text-brand-subtext">Often opaque with undisclosed batch reports</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-brand-dark">Sweeteners & Aftertaste</td>
                  <td className="py-4 px-4 bg-brand-glow/20 font-semibold text-brand-primary">
                    Pure Monk Fruit & Real Madagascar Vanilla / Cocoa
                  </td>
                  <td className="py-4 px-4 text-brand-subtext">Sucralose, Aspartame, or Bitter Stevia extracts</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-brand-dark">Ayurvedic Synergy</td>
                  <td className="py-4 px-4 bg-brand-glow/20 font-semibold text-brand-primary rounded-b-xl">
                    KSM-66 Ashwagandha & Shatavari Adaptogens
                  </td>
                  <td className="py-4 px-4 text-brand-subtext">None</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. FAQs Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Transparency Matters</span>
          <h2 className="font-serif text-3xl font-bold text-brand-dark mt-1">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq._id}
                className="rounded-2xl border border-brand-muted/70 bg-white overflow-hidden transition-all duration-200"
              >
                <button
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
