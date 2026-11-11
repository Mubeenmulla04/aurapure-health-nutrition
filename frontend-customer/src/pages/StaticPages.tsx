import React from 'react';
import { ShieldCheck, Truck, RotateCcw, HelpCircle, Mail, Phone, MapPin, Award } from 'lucide-react';

export const AboutPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
    <div className="text-center space-y-3">
      <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Our Genesis</span>
      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-brand-dark">Born in Bengaluru. Formulated with Integrity.</h1>
      <p className="text-base text-brand-subtext max-w-2xl mx-auto leading-relaxed">
        AuraPure was founded on a singular conviction: nutrition shouldn't force you to choose between clean ethics and peak bio-efficacy.
      </p>
    </div>

    <div className="aspect-[16/9] rounded-3xl overflow-hidden bg-brand-secondary border border-brand-muted/80 shadow-subtle">
      <img
        src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1400&q=80"
        alt="AuraPure Clean Sourcing"
        className="w-full h-full object-cover"
      />
    </div>

    <div className="prose prose-stone max-w-none space-y-6 text-sm text-brand-subtext leading-relaxed">
      <p>
        Most commercial proteins sold in India rely on mass-produced dairy by-products that trigger lactose indigestion, acne, and heavy bloating. The alternative plant powders were often chalky, laden with bitter artificial aftertastes, or contaminated with heavy metal toxins.
      </p>
      <p>
        At AuraPure, we isolate plant proteins exclusively from non-GMO yellow peas and sprouted brown rice using clean cold-water enzymatic extraction — with zero chemical solvents or hexane. We then synergize each batch with authentic Indian Ayurvedic botanicals: high-curcumin Lakadong Turmeric from Meghalaya, KSM-66 Ashwagandha from the Himalayan foothills, and wild-harvested Shatavari.
      </p>
    </div>
  </div>
);

export const ContactPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 space-y-10">
    <div className="text-center space-y-2">
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-dark">We're Here to Help</h1>
      <p className="text-sm text-brand-subtext">Have a question about formulation, allergens, or tracking an order?</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="p-6 rounded-3xl bg-white border border-brand-muted/80 text-center space-y-2">
        <Mail className="w-6 h-6 text-brand-primary mx-auto" />
        <h4 className="text-sm font-bold text-brand-dark">Email Support</h4>
        <p className="text-xs text-brand-subtext">support@aurapure.in</p>
        <p className="text-[11px] text-brand-subtext">Replies within 4 business hours</p>
      </div>

      <div className="p-6 rounded-3xl bg-white border border-brand-muted/80 text-center space-y-2">
        <Phone className="w-6 h-6 text-brand-primary mx-auto" />
        <h4 className="text-sm font-bold text-brand-dark">Customer Hotline</h4>
        <p className="text-xs text-brand-subtext">+91 80 4920 1800</p>
        <p className="text-[11px] text-brand-subtext">Mon–Sat, 9:30 AM to 6:30 PM IST</p>
      </div>

      <div className="p-6 rounded-3xl bg-white border border-brand-muted/80 text-center space-y-2">
        <MapPin className="w-6 h-6 text-brand-primary mx-auto" />
        <h4 className="text-sm font-bold text-brand-dark">Corporate HQ</h4>
        <p className="text-xs text-brand-subtext">108 Bio-Valley Tech Park, Whitefield</p>
        <p className="text-[11px] text-brand-subtext">Bengaluru, Karnataka 560066</p>
      </div>
    </div>
  </div>
);

export const ShippingPolicyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 py-16 space-y-6 text-sm text-brand-subtext leading-relaxed">
    <h1 className="font-serif text-3xl font-bold text-brand-dark">Shipping & Fulfillment Policy</h1>
    <p>
      We fulfill all online orders in partnership with <strong>Shiprocket</strong> using air courier partners including BlueDart Express, Delhivery Air, and DTDC.
    </p>
    <h3 className="font-serif text-lg font-bold text-brand-dark pt-2">Fulfillment SLAs</h3>
    <ul className="list-disc pl-5 space-y-2">
      <li><strong>Dispatch Timelines:</strong> Orders placed before 2:00 PM IST on working days are packed and dispatched on the same business day.</li>
      <li><strong>Transit Durations:</strong> Metro deliveries (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata) arrive within 2–3 business days. Non-metro regions arrive within 3–5 business days.</li>
      <li><strong>Free Shipping:</strong> All orders above ₹999 qualify for Free Express Shipping. Orders below ₹999 incur a flat ₹99 nominal courier charge.</li>
    </ul>
  </div>
);

export const RefundPolicyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 py-16 space-y-6 text-sm text-brand-subtext leading-relaxed">
    <h1 className="font-serif text-3xl font-bold text-brand-dark">Returns & Refund Policy</h1>
    <p>
      Due to food safety and hygiene regulations, opened consumable products are generally non-returnable. However, if your order arrives damaged, defective, or incorrect, we provide a 100% no-questions-asked replacement or full refund.
    </p>
    <h3 className="font-serif text-lg font-bold text-brand-dark pt-2">Initiating a Claim</h3>
    <p>
      Please email our support desk at <a href="mailto:support@aurapure.in" className="text-brand-primary font-semibold underline">support@aurapure.in</a> within 7 days of package delivery, including your Order Number (e.g. AP-2026-1001) and a photo of the damaged seal or outer parcel. Approved refunds are credited directly back to the original Razorpay payment source within 3–5 business days.
    </p>
  </div>
);

export const PrivacyPolicyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 py-16 space-y-6 text-sm text-brand-subtext leading-relaxed">
    <h1 className="font-serif text-3xl font-bold text-brand-dark">Privacy & Data Protection</h1>
    <p>
      AuraPure Nutrition Private Limited respects your personal privacy. We never sell, rent, or trade customer contact details or purchase histories to third-party ad networks.
    </p>
    <p>
      Your payment card and UPI credentials are encrypted directly through Razorpay's PCI-DSS Level 1 compliant gateway. We do not store credit card or CVV details on our servers.
    </p>
  </div>
);
