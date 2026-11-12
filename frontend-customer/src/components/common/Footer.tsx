import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Leaf, Award, CheckCircle2, ArrowRight, ChevronDown } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (sec: string) => {
    setOpenSection(openSection === sec ? null : sec);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-brand-secondary/70 border-t border-brand-muted/80 text-brand-dark pt-10 sm:pt-16 pb-8 sm:pb-12">
      {/* Brand Certifications Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-14 border-b border-brand-muted/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-glow text-brand-primary flex items-center justify-center flex-shrink-0">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-semibold text-brand-dark">100% Clean Plant</h5>
              <p className="text-[10px] sm:text-xs text-brand-subtext">Golden pea & brown rice</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-glow text-brand-primary flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-semibold text-brand-dark">NABL Lab Tested</h5>
              <p className="text-[10px] sm:text-xs text-brand-subtext">Zero heavy metals</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-glow text-brand-primary flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-semibold text-brand-dark">Zero Added Sugar</h5>
              <p className="text-[10px] sm:text-xs text-brand-subtext">Pure monk fruit sweetened</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-glow text-brand-primary flex items-center justify-center flex-shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-semibold text-brand-dark">Ayurvedic Synergy</h5>
              <p className="text-[10px] sm:text-xs text-brand-subtext">Ashwagandha & Shatavari</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Brand Intro & Newsletter */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-glow flex items-center justify-center">
                <Leaf className="w-4 h-4 text-brand-primary" />
              </div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-brand-dark">AuraPure</span>
            </div>
            <p className="text-xs sm:text-sm text-brand-subtext leading-relaxed max-w-sm">
              We engineer uncompromising, clean-label plant protein and functional botanical nutrition to power high-performing minds and bodies across India.
            </p>

            <div className="pt-1">
              <p className="text-[11px] sm:text-xs font-semibold text-brand-dark uppercase tracking-wider mb-2">
                Join the AuraPure Wellness Club (Get 10% Off)
              </p>
              {subscribed ? (
                <div className="p-3 rounded-xl bg-brand-glow text-brand-primary text-xs font-medium">
                  ✓ Thank you! Use discount code <strong>AURAPURE10</strong> at checkout.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-white border border-brand-muted text-xs sm:text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                  <button type="submit" className="btn-primary !px-4 sm:!px-5 !py-2 sm:!py-2.5 !text-xs gap-1">
                    <span>Join</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Collapsible Section 1: Collections */}
          <div className="border-t border-brand-muted/70 lg:border-t-0 pt-4 lg:pt-0">
            <button
              type="button"
              onClick={() => toggleSection('collections')}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-dark mb-2 lg:mb-4 lg:cursor-default"
            >
              <span>Shop Collections</span>
              <ChevronDown className={`w-4 h-4 lg:hidden transition-transform ${openSection === 'collections' ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-2 text-xs sm:text-sm text-brand-subtext ${openSection === 'collections' ? 'block' : 'hidden lg:block'}`}>
              <li>
                <Link to="/collections/plant-protein-powder" className="hover:text-brand-primary transition-colors block py-1">
                  Plant Protein Powders
                </Link>
              </li>
              <li>
                <Link to="/collections/daily-wellness" className="hover:text-brand-primary transition-colors block py-1">
                  Daily Adaptogens & Turmeric
                </Link>
              </li>
              <li>
                <Link to="/collections/superfoods-greens" className="hover:text-brand-primary transition-colors block py-1">
                  Daily Greens & Superfoods
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-brand-primary transition-colors block py-1">
                  All Formulations
                </Link>
              </li>
            </ul>
          </div>

          {/* Collapsible Section 2: Customer Care */}
          <div className="border-t border-brand-muted/70 lg:border-t-0 pt-4 lg:pt-0">
            <button
              type="button"
              onClick={() => toggleSection('care')}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-dark mb-2 lg:mb-4 lg:cursor-default"
            >
              <span>Customer Care</span>
              <ChevronDown className={`w-4 h-4 lg:hidden transition-transform ${openSection === 'care' ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-2 text-xs sm:text-sm text-brand-subtext ${openSection === 'care' ? 'block' : 'hidden lg:block'}`}>
              <li>
                <Link to="/track-order" className="hover:text-brand-primary transition-colors block py-1">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/pages/faqs" className="hover:text-brand-primary transition-colors block py-1">
                  Help Center & FAQs
                </Link>
              </li>
              <li>
                <Link to="/pages/shipping-policy" className="hover:text-brand-primary transition-colors block py-1">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link to="/pages/refund-policy" className="hover:text-brand-primary transition-colors block py-1">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link to="/pages/contact" className="hover:text-brand-primary transition-colors block py-1">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Collapsible Section 3: Company & Legal */}
          <div className="border-t border-brand-muted/70 lg:border-t-0 pt-4 lg:pt-0">
            <button
              type="button"
              onClick={() => toggleSection('company')}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-dark mb-2 lg:mb-4 lg:cursor-default"
            >
              <span>Company & Legal</span>
              <ChevronDown className={`w-4 h-4 lg:hidden transition-transform ${openSection === 'company' ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-2 text-xs sm:text-sm text-brand-subtext ${openSection === 'company' ? 'block' : 'hidden lg:block'}`}>
              <li>
                <Link to="/pages/about" className="hover:text-brand-primary transition-colors block py-1">
                  Our Philosophy
                </Link>
              </li>
              <li>
                <Link to="/pages/privacy-policy" className="hover:text-brand-primary transition-colors block py-1">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/pages/terms" className="hover:text-brand-primary transition-colors block py-1">
                  Terms of Service
                </Link>
              </li>
              <li className="pt-2 text-[11px] text-brand-subtext">
                <strong className="block text-brand-dark">Registered Office:</strong>
                Bengaluru, KA 560066
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 sm:pt-12 mt-8 sm:mt-12 border-t border-brand-muted/70 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs text-brand-subtext">
          <p>© {new Date().getFullYear()} AuraPure Nutrition Private Limited. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <span className="font-semibold text-brand-dark text-[11px]">100% Secure via Razorpay</span>
            <span className="inline-block px-2 py-0.5 rounded bg-white border border-brand-muted text-[10px] font-bold">
              UPI
            </span>
            <span className="inline-block px-2 py-0.5 rounded bg-white border border-brand-muted text-[10px] font-bold">
              Cards
            </span>
            <span className="inline-block px-2 py-0.5 rounded bg-white border border-brand-muted text-[10px] font-bold">
              NetBanking
            </span>
            <span className="inline-block px-2 py-0.5 rounded bg-white border border-brand-muted text-[10px] font-bold">
              COD
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
