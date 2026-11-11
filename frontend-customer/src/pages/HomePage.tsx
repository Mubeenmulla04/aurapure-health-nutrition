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
