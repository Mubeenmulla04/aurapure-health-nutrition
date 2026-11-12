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

export const TermsPage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 py-16 space-y-6 text-sm text-brand-subtext leading-relaxed">
    <h1 className="font-serif text-3xl font-bold text-brand-dark">Terms & Conditions of Service</h1>
    <p>
      Welcome to AuraPure Nutrition. By accessing our website, placing an order, or utilizing our services, you agree to be bound by these Terms of Service and all applicable Indian commercial laws.
    </p>
    <h3 className="font-serif text-lg font-bold text-brand-dark pt-2">Pricing & Taxation</h3>
    <p>
      All retail prices listed on our platform are quoted in Indian Rupees (INR) and are inclusive of statutory 18% Goods & Services Tax (GST). We reserve the right to revise catalog pricing and promotional discounts at any time without prior notice.
    </p>
    <h3 className="font-serif text-lg font-bold text-brand-dark pt-2">Orders & Cancellations</h3>
    <p>
      Orders may be cancelled before shipment dispatch directly via the Customer Account portal or by emailing support@aurapure.in. Once an air courier AWB tracking number has been generated, orders cannot be cancelled in transit.
    </p>
  </div>
);

export const FaqsPage: React.FC = () => {
  const [openIdx, setOpenIdx] = React.useState<number | null>(0);
  const faqList = [
    {
      q: 'What makes AuraPure plant protein superior to whey protein?',
      a: 'Unlike whey, which often triggers lactose intolerance, acne, and heavy bloating, AuraPure is 100% plant-based, made from cold-pressed golden pea and brown rice isolates. We add papain and bromelain digestive enzymes to ensure gentle, effortless digestion and 98% bioavailability without feeling heavy.'
    },
    {
      q: 'Are your products tested for heavy metals and toxins?',
      a: 'Yes, every single batch is independently tested in NABL-accredited third-party laboratories for Lead, Cadmium, Arsenic, and Mercury, exceeding stringent FSSAI safety norms. Batch COA (Certificate of Analysis) reports are publicly accessible.'
    },
    {
      q: 'How long does shipping take across India?',
      a: 'Orders placed before 2 PM IST are dispatched on the same business day via Shiprocket premium air couriers (BlueDart, Delhivery, DTDC). Metro deliveries arrive in 2–3 business days; other regions within 4–5 business days.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We partner with Razorpay to provide secure 256-bit encrypted checkout. We accept UPI (Google Pay, PhonePe, Paytm, Cred), all Major Credit & Debit Cards (Visa, Mastercard, RuPay, Amex), and Cash on Delivery (COD) across 18,000+ PIN codes.'
    },
    {
      q: 'What is your refund policy if the taste does not suit me?',
      a: 'We offer a 14-Day Bloat-Free Taste Guarantee. If you experience any bloating or dissatisfaction with your first tub, contact our customer desk within 14 days of delivery for a hassle-free resolution.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-10">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Support & Answers</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-dark">Frequently Asked Questions</h1>
        <p className="text-sm text-brand-subtext">Everything you need to know about our formulations, sourcing, and delivery.</p>
      </div>

      <div className="space-y-3">
        {faqList.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-brand-muted/70 bg-white overflow-hidden transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-brand-dark text-sm sm:text-base hover:text-brand-primary"
              >
                <span>{item.q}</span>
                <span className="text-brand-primary font-bold text-lg">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm text-brand-subtext leading-relaxed border-t border-brand-muted/40">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => (
  <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
    <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Page Not Found</span>
    <h1 className="font-serif text-4xl sm:text-5xl font-bold text-brand-dark">404 — Page Unavailable</h1>
    <p className="text-sm sm:text-base text-brand-subtext max-w-md mx-auto">
      The page or collection you are looking for may have been moved, renamed, or is temporarily unavailable.
    </p>
    <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
      <a
        href="/"
        className="inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-brand-primary text-white font-medium text-sm hover:bg-brand-primary-hover shadow-subtle"
      >
        Back to Homepage
      </a>
      <a
        href="/collections"
        className="inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-brand-secondary text-brand-dark font-medium text-sm hover:bg-brand-muted border border-brand-muted/70"
      >
        Browse Collections
      </a>
    </div>
  </div>
);
