import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Leaf, Award, CheckCircle2, ArrowRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-brand-secondary/70 border-t border-brand-muted/80 text-brand-dark pt-16 pb-12">
      {/* Brand Certifications Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 border-b border-brand-muted/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-brand-glow text-brand-primary flex items-center justify-center flex-shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-brand-dark">100% Clean Plant</h5>
              <p className="text-xs text-brand-subtext">Golden pea & brown rice isolates</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-brand-glow text-brand-primary flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-brand-dark">NABL Lab Tested</h5>
              <p className="text-xs text-brand-subtext">Zero heavy metals or toxins</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-brand-glow text-brand-primary flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-brand-dark">Zero Added Sugar</h5>
              <p className="text-xs text-brand-subtext">Naturally monk fruit sweetened</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-brand-glow text-brand-primary flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-brand-dark">Ayurvedic Synergy</h5>
              <p className="text-xs text-brand-subtext">Ashwagandha & herbal actives</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Intro & Newsletter */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-glow flex items-center justify-center">
                <Leaf className="w-4 h-4 text-brand-primary" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-brand-dark">AuraPure</span>
            </div>
            <p className="text-sm text-brand-subtext leading-relaxed max-w-sm">
              We engineer uncompromising, clean-label plant protein and functional botanical nutrition to power high-performing minds and bodies across India.
            </p>

            <div className="pt-2">
              <p className="text-xs font-semibold text-brand-dark uppercase tracking-wider mb-2">
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
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-2.5 rounded-full bg-white border border-brand-muted text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                  <button type="submit" className="btn-primary !px-5 !py-2.5 !text-xs gap-1.5">
                    <span>Join</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark mb-4">Shop Collections</h4>
            <ul className="space-y-2.5 text-sm text-brand-subtext">
              <li>
                <Link to="/collections/plant-protein-powder" className="hover:text-brand-primary transition-colors">
                  Plant Protein Powders
                </Link>
              </li>
              <li>
                <Link to="/collections/daily-wellness" className="hover:text-brand-primary transition-colors">
                  Daily Adaptogens & Turmeric
                </Link>
              </li>
              <li>
                <Link to="/collections/superfoods-greens" className="hover:text-brand-primary transition-colors">
                  Daily Greens & Superfoods
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-brand-primary transition-colors">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-sm text-brand-subtext">
              <li>
                <Link to="/track-order" className="hover:text-brand-primary transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/pages/faqs" className="hover:text-brand-primary transition-colors">
                  Help Center & FAQs
                </Link>
              </li>
              <li>
                <Link to="/pages/shipping-policy" className="hover:text-brand-primary transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link to="/pages/refund-policy" className="hover:text-brand-primary transition-colors">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link to="/pages/contact" className="hover:text-brand-primary transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark mb-4">Company & Legal</h4>
            <ul className="space-y-2.5 text-sm text-brand-subtext">
              <li>
                <Link to="/pages/about" className="hover:text-brand-primary transition-colors">
                  Our Philosophy
                </Link>
              </li>
              <li>
                <Link to="/pages/privacy-policy" className="hover:text-brand-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/pages/terms" className="hover:text-brand-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li className="pt-2 text-xs">
                <strong className="block text-brand-dark">Registered Office:</strong>
                Bengaluru, KA 560066
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-12 mt-12 border-t border-brand-muted/70 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-brand-subtext">
          <p>© {new Date().getFullYear()} AuraPure Nutrition Private Limited. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-brand-dark">100% Secure Payments Powered By Razorpay</span>
            <span className="inline-block px-2 py-0.5 rounded bg-white border border-brand-muted text-[10px] font-bold">
              UPI
            </span>
            <span className="inline-block px-2 py-0.5 rounded bg-white border border-brand-muted text-[10px] font-bold">
              Cards
            </span>
            <span className="inline-block px-2 py-0.5 rounded bg-white border border-brand-muted text-[10px] font-bold">
              NetBanking
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
