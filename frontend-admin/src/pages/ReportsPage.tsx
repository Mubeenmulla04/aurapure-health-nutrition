import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Receipt,
  Boxes,
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useToast } from '../components/common/Toast';
import { reportsApi } from '../services/adminApi';

interface ReportCardConfig {
  id: string;
  title: string;
  category: string;
  description: string;
  format: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  badge: string;
  action: () => Promise<void>;
}

export const ReportsPage: React.FC = () => {
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (id: string, action: () => Promise<void>, name: string) => {
    try {
      setDownloadingId(id);
      await action();
      toast.success(`${name} exported successfully!`);
    } catch (err: any) {
      toast.error(`Failed to export ${name}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const reports: ReportCardConfig[] = [
    {
      id: 'gst_tax',
      title: 'GST Statutory Tax Compliance Report',
      category: 'Accounting & Taxation',
      description:
        'Detailed transaction-level GSTR-1 breakdown including Taxable Goods Value, CGST (9%), SGST (9%), IGST splits, Pincode/State destination and Invoice totals for all settled orders.',
      format: 'CSV (Spreadsheet)',
      icon: Receipt,
      iconBg: 'bg-emerald-50 border-emerald-100',
      iconColor: 'text-emerald-600',
      badge: 'GSTR-1 Ready',
      action: reportsApi.downloadTaxReport,
    },
    {
      id: 'inventory_valuation',
      title: 'Warehouse Inventory Valuation Ledger',
      category: 'Supply Chain & Operations',
      description:
        'Complete SKU audit showing stock-on-hand, customer-reserved units, available sellable quantity, unit selling prices, stock health alerts, and total monetary inventory capitalization.',
      format: 'CSV (Spreadsheet)',
      icon: Boxes,
      iconBg: 'bg-amber-50 border-amber-100',
      iconColor: 'text-amber-600',
      badge: 'Live Stock Valuation',
      action: reportsApi.downloadInventoryValuation,
    },
    {
      id: 'sales_ledger',
      title: 'Executive Sales & Revenue Ledger',
      category: 'Financial Performance',
      description:
        'Comprehensive timeline export of all customer orders, gateway transaction IDs, payment methods, gross sales, shipping fees collected, coupon discounts, and net realized revenue.',
      format: 'CSV (Spreadsheet)',
      icon: TrendingUp,
      iconBg: 'bg-indigo-50 border-indigo-100',
      iconColor: 'text-indigo-600',
      badge: 'P&L Analysis',
      action: reportsApi.downloadSalesLedger,
    },
    {
      id: 'customer_ltv',
      title: 'Customer Directory & Lifetime Value (LTV)',
      category: 'Marketing & Retention',
      description:
        'Complete profile register of all store customers, verified phone numbers, order count frequency, aggregate lifetime spending, primary delivery locations, and account health.',
      format: 'CSV (Spreadsheet)',
      icon: Users,
      iconBg: 'bg-purple-50 border-purple-100',
      iconColor: 'text-purple-600',
      badge: 'RFM & Retention',
      action: reportsApi.downloadCustomerDirectory,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports Center & Data Exports</h1>
        <p className="text-sm text-slate-500">
          Generate and download audit-ready compliance reports, statutory tax summaries, and executive business spreadsheets.
        </p>
      </div>

      {/* Compliance Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Statutory Tax & Audit Ready</span>
          </div>
          <h2 className="text-lg font-bold">Standard Indian E-Commerce Compliance Format</h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            All CSV exports conform to Indian GST regulations, HSN code standards, and standard accounting software imports (Tally, Zoho Books, Busy, ClearTax).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> MongoDB Real-Time Sync
          </span>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          const isDownloading = downloadingId === report.id;

          return (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${report.iconBg}`}>
                    <Icon className={`w-6 h-6 ${report.iconColor}`} />
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                    {report.badge}
                  </span>
                </div>

                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {report.category}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{report.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{report.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  {report.format}
                </div>
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => handleDownload(report.id, report.action, report.title)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isDownloading ? 'Generating...' : 'Export CSV'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
