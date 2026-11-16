import React, { useState } from 'react';
import { FileCode, Globe, CheckCircle2, Save, ExternalLink, ShieldCheck } from 'lucide-react';
import { useToast } from '../components/common/Toast';

interface PageItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  lastUpdated: string;
  content: string;
}

const initialPages: PageItem[] = [
  {
    id: '1',
    slug: 'about-us',
    title: 'About AuraPure & Our Mission',
    category: 'Brand Story',
    lastUpdated: '2026-11-10',
    content: `## Pure Plant Nutrition, Backed by Science\n\nAt AuraPure, our journey began with a simple conviction: clean nutrition should never compromise on purity or efficacy.\n\n### Certified Organic Sourcing\nEvery pea isolate, chia seed protein, and organic cocoa bean is sourced directly from sustainable certified farms across India and the Americas. Zero artificial sweeteners, zero heavy metals, zero maltodextrin.\n\n### Clinical Purity Guarantee\nEach batch undergoes 3-tier independent laboratory testing in NABL-accredited labs for microbiological safety and heavy metal limits under FSSAI guidance.`,
  },
  {
    id: '2',
    slug: 'privacy-policy',
    title: 'Privacy & Personal Data Protection',
    category: 'Compliance & Legal',
    lastUpdated: '2026-11-12',
    content: `## Privacy Policy\n\nAuraPure Bio-Wellness Private Limited ("AuraPure", "we", "us") is dedicated to safeguarding your personal information under the Digital Personal Data Protection Act, 2023 (DPDP).\n\n### 1. Information Collected\n- Contact Data: Full name, delivery address, phone number, email address.\n- Transaction Information: Tokenized Razorpay payment identifiers (we never store card CVV or PIN numbers).\n\n### 2. Purpose of Processing\nOrder fulfillment, courier dispatch via Shiprocket, automated order tracking via WhatsApp Cloud, and statutory GST invoicing.`,
  },
  {
    id: '3',
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions of Service',
    category: 'Compliance & Legal',
    lastUpdated: '2026-11-08',
    content: `## Store Terms of Service\n\nBy accessing and placing orders on AuraPure (aurapure.in), you acknowledge and agree to comply with our commercial terms and conditions.\n\n### Pricing & Taxes\nAll prices quoted on the storefront are in Indian Rupees (INR) and are inclusive of Goods & Services Tax (GST) unless explicitly indicated otherwise.\n\n### Order Acceptance\nAuraPure reserves the right to decline or cancel orders where fraudulent payment patterns, duplicate voucher abuse, or incorrect stock pricing has been detected.`,
  },
  {
    id: '4',
    slug: 'shipping-policy',
    title: 'Shipping & Delivery Guidelines',
    category: 'Logistics',
    lastUpdated: '2026-11-11',
    content: `## Domestic Shipping Timeline\n\n- Metro Cities (Delhi NCR, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata): 24 to 48 hours.\n- Rest of India: 3 to 5 business days.\n\n### Free Shipping\nAll prepaid orders above ₹499 enjoy complimentary express shipping across all 28 states and 8 union territories in India. Orders below ₹499 incur a standard flat rate shipping fee of ₹49.`,
  },
  {
    id: '5',
    slug: 'refund-policy',
    title: 'Returns, Cancellations & Refund Policy',
    category: 'Customer Support',
    lastUpdated: '2026-11-09',
    content: `## 7-Day Hassle-Free Purity Guarantee\n\nIf you receive a damaged, broken seal, or incorrect variant, you are eligible for an immediate replacement or full refund within 7 days of verified courier delivery.\n\n### Instant UPI/Card Reversal\nApproved refunds are credited directly to your original payment source via Razorpay Gateway within 24 to 48 banking hours.`,
  },
];

export const ContentPagesPage: React.FC = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState<PageItem[]>(initialPages);
  const [selectedPage, setSelectedPage] = useState<PageItem>(initialPages[0]);
  const [editingContent, setEditingContent] = useState<string>(initialPages[0].content);
  const [saving, setSaving] = useState(false);

  const handleSelect = (page: PageItem) => {
    setSelectedPage(page);
    setEditingContent(page.content);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setPages((prev) =>
        prev.map((p) => (p.id === selectedPage.id ? { ...p, content: editingContent, lastUpdated: new Date().toISOString().split('T')[0] } : p))
      );
      setSaving(false);
      toast.success(`Published updates to "${selectedPage.title}"`);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Policy Pages & CMS Content</h1>
          <p className="text-sm text-slate-500">
            Author and publish statutory legal policies, shipping terms, and brand story pages for the customer storefront.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`http://localhost:3000/${selectedPage.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" /> Live Storefront View
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {/* Editor & Selector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Selector */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs font-bold uppercase text-slate-400 px-1 mb-2">Static Store Pages</div>
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className={`w-full text-left p-3 rounded-xl border transition ${
                selectedPage.id === p.id
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-0.5">
                {p.category}
              </div>
              <div className="font-semibold text-xs leading-snug">{p.title}</div>
              <div className="text-[11px] text-slate-400 mt-1">/{p.slug}</div>
            </button>
          ))}
        </div>

        {/* Content Editor & Preview */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{selectedPage.title}</h2>
              <div className="text-xs text-slate-500">
                Route: <span className="font-mono text-indigo-600">/{selectedPage.slug}</span> • Last Updated:{' '}
                {selectedPage.lastUpdated}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Published Live
            </span>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-700">Page Content (Markdown / HTML)</label>
            <textarea
              rows={16}
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className="w-full font-mono text-xs p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed text-slate-800"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              Changes saved here update the customer storefront static page routing immediately with search engine indexable content.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
