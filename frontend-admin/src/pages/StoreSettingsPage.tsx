import React, { useState, useEffect } from 'react';
import {
  Building2,
  Receipt,
  Truck,
  FileText,
  Radio,
  Save,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { settingsApi, StoreSettingsData } from '../services/adminApi';

export const StoreSettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'tax' | 'shipping' | 'invoice' | 'integrations'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<StoreSettingsData>({
    storeName: '',
    legalEntityName: '',
    gstin: '',
    supportEmail: '',
    supportPhone: '',
    supportWhatsApp: '',
    registeredAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    currency: {
      code: 'INR',
      symbol: '₹',
    },
    taxation: {
      defaultGstPercent: 18,
      pricesInclusiveOfGst: true,
    },
    shipping: {
      freeShippingThreshold: 999,
      standardShippingFee: 99,
      estimatedMetroDays: 2,
      estimatedRestDays: 5,
    },
    invoice: {
      prefix: 'AP-INV-',
      nextNumber: 1001,
      termsAndConditions: '',
    },
    integrations: {
      razorpayConfigured: true,
      shiprocketConfigured: true,
      whatsappConfigured: true,
      smtpConfigured: true,
    },
    seoDefaults: {
      metaTitle: '',
      metaDescription: '',
      metaKeywords: [],
    },
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getStoreSettings();
      if (data) setSettings(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await settingsApi.updateStoreSettings(settings);
      toast.success(res.message || 'Store settings updated successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Clock className="w-5 h-5 animate-spin text-indigo-600" />
          Loading store configurations...
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Business Profile', icon: Building2 },
    { id: 'tax', label: 'Taxation & GST', icon: Receipt },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'invoice', label: 'Invoices & Numbering', icon: FileText },
    { id: 'integrations', label: 'Cloud Integrations', icon: Radio },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Store Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your legal entity profile, Indian GSTIN, domestic shipping thresholds, and tax invoice prefixes.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="admin-btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex overflow-x-auto border-b border-slate-200 gap-2 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Business Profile */}
        {activeTab === 'profile' && (
          <div className="admin-card p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-900">Brand & Registered Entity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Legal Corporate Entity *
                </label>
                <input
                  type="text"
                  required
                  value={settings.legalEntityName}
                  onChange={(e) => setSettings({ ...settings, legalEntityName: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Customer Support Email *
                </label>
                <input
                  type="email"
                  required
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Customer Support Toll-Free / Desk
                </label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  WhatsApp Helpline Number
                </label>
                <input
                  type="text"
                  value={settings.supportWhatsApp}
                  onChange={(e) => setSettings({ ...settings, supportWhatsApp: e.target.value })}
                  className="admin-input"
                />
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 pt-4 border-t border-slate-100">
              Registered Office Address (Appears on Tax Invoices)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  value={settings.registeredAddress.line1}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registeredAddress: { ...settings.registeredAddress, line1: e.target.value },
                    })
                  }
                  className="admin-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={settings.registeredAddress.line2 || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registeredAddress: { ...settings.registeredAddress, line2: e.target.value },
                    })
                  }
                  className="admin-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={settings.registeredAddress.city}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registeredAddress: { ...settings.registeredAddress, city: e.target.value },
                    })
                  }
                  className="admin-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={settings.registeredAddress.state}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registeredAddress: { ...settings.registeredAddress, state: e.target.value },
                    })
                  }
                  className="admin-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pincode *
                </label>
                <input
                  type="text"
                  required
                  value={settings.registeredAddress.pincode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      registeredAddress: { ...settings.registeredAddress, pincode: e.target.value },
                    })
                  }
                  className="admin-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Taxation & GST */}
        {activeTab === 'tax' && (
          <div className="admin-card p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-900">Goods and Services Tax (GST) Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  GSTIN (15-Digit Indian GST Number) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={settings.gstin}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                  className="admin-input font-mono uppercase"
                />
                <p className="text-xs text-slate-500 mt-1">Printed on all generated customer Tax Invoices</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Health & Nutrition GST Rate (%) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={28}
                  value={settings.taxation.defaultGstPercent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taxation: { ...settings.taxation, defaultGstPercent: Number(e.target.value) },
                    })
                  }
                  className="admin-input"
                />
                <p className="text-xs text-slate-500 mt-1">Indian statutory rate for dietary supplements is typically 18%</p>
              </div>

              <div className="md:col-span-2 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.taxation.pricesInclusiveOfGst}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        taxation: { ...settings.taxation, pricesInclusiveOfGst: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">All Catalog Prices are GST-Inclusive</div>
                    <div className="text-xs text-slate-500">
                      Standard Indian D2C practice: customer pays the exact displayed price, with GST broken down on the tax invoice.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Shipping & Delivery */}
        {activeTab === 'shipping' && (
          <div className="admin-card p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-900">Domestic Shipping Rules & Fees</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Free Shipping Minimum Cart Value (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={settings.shipping.freeShippingThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping: { ...settings.shipping, freeShippingThreshold: Number(e.target.value) },
                    })
                  }
                  className="admin-input"
                />
                <p className="text-xs text-slate-500 mt-1">Orders at or above this cart value qualify for ₹0 free shipping</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Standard Flat Shipping Fee (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={settings.shipping.standardShippingFee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping: { ...settings.shipping, standardShippingFee: Number(e.target.value) },
                    })
                  }
                  className="admin-input"
                />
                <p className="text-xs text-slate-500 mt-1">Applied automatically when order total is below the threshold</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Metro Transit Time (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={settings.shipping.estimatedMetroDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping: { ...settings.shipping, estimatedMetroDays: Number(e.target.value) },
                    })
                  }
                  className="admin-input"
                />
                <p className="text-xs text-slate-500 mt-1">Displayed on product & checkout pages for Tier-1 cities</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rest of India Transit Time (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={settings.shipping.estimatedRestDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping: { ...settings.shipping, estimatedRestDays: Number(e.target.value) },
                    })
                  }
                  className="admin-input"
                />
                <p className="text-xs text-slate-500 mt-1">Standard dispatch turnaround for Tier-2/Tier-3 zones</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Invoice Rules */}
        {activeTab === 'invoice' && (
          <div className="admin-card p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-900">Tax Invoice Numbering & Layout</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Invoice Number Prefix *
                </label>
                <input
                  type="text"
                  required
                  value={settings.invoice.prefix}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      invoice: { ...settings.invoice, prefix: e.target.value.toUpperCase() },
                    })
                  }
                  className="admin-input font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">e.g. AP-INV-2026- will generate AP-INV-2026-1001</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Next Sequence Number *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={settings.invoice.nextNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      invoice: { ...settings.invoice, nextNumber: Number(e.target.value) },
                    })
                  }
                  className="admin-input font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">Auto-increments with each finalized order</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Terms, Guarantee & Customer Care Note (Invoice Footer)
                </label>
                <textarea
                  rows={4}
                  value={settings.invoice.termsAndConditions}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      invoice: { ...settings.invoice, termsAndConditions: e.target.value },
                    })
                  }
                  className="admin-input resize-none"
                  placeholder="Official warranty, plant purity guarantee, or customer care disclaimer..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Cloud Integrations */}
        {activeTab === 'integrations' && (
          <div className="admin-card p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-900">Enterprise Cloud Services Status</h2>
            <p className="text-sm text-slate-500">
              The platform connects to live external APIs for payments, logistics, and automated omnichannel messaging.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    Razorpay Payment Gateway
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Accepts UPI (GPay, PhonePe, Cred), Cards, and Net Banking with instant automated refunds.
                  </div>
                </div>
              </div>

              <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-xl flex items-start gap-3">
                <Truck className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    Shiprocket Domestic Logistics
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Automated AWB assignment, Delhivery / BlueDart courier dispatch, and live checkpoint tracking.
                  </div>
                </div>
              </div>

              <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    Meta WhatsApp Business Cloud API
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Real-time order confirmations, dispatch alerts, and delivery feedback automation directly to Indian phone numbers.
                  </div>
                </div>
              </div>

              <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    NodeMailer SMTP Mail Gateway
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Dispatches official PDF Tax Invoices and transactional account notifications.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button type="submit" disabled={saving} className="admin-btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
export default StoreSettingsPage;
