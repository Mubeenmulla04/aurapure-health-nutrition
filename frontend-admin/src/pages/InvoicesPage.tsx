import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Search, CheckCircle2, Building, User, IndianRupee } from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { reportsApi, orderApi, InvoiceItemData } from '../services/adminApi';

export const InvoicesPage: React.FC = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItemData | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.listInvoices({ limit: 100, search: search || undefined });
      setInvoices(res.invoices);
    } catch (err: any) {
      toast.error('Failed to load tax invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleDownloadPdf = async (inv: InvoiceItemData) => {
    if (!inv.orderId?._id) {
      toast.error('Order reference missing for invoice');
      return;
    }
    try {
      setDownloadingId(inv._id);
      await orderApi.downloadInvoice(inv.orderId._id, inv.orderId.orderNumber || inv.invoiceNumber);
      toast.success(`Downloaded ${inv.invoiceNumber}.pdf`);
    } catch (err: any) {
      toast.error('Failed to download invoice PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const columns: Column<InvoiceItemData>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      sortable: true,
      render: (inv: InvoiceItemData) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono font-bold text-xs text-indigo-700">{inv.invoiceNumber}</div>
            <div className="text-[11px] text-slate-500">
              {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'orderNumber',
      header: 'Order Reference',
      render: (inv: InvoiceItemData) => (
        <div>
          <div className="font-semibold text-xs text-slate-900">{inv.orderId?.orderNumber || '—'}</div>
          <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {inv.orderId?.orderStatus || 'COMPLETED'}
          </span>
        </div>
      ),
    },
    {
      key: 'customerDetails',
      header: 'Billed To',
      render: (inv: InvoiceItemData) => (
        <div>
          <div className="font-medium text-xs text-slate-900">{inv.customerDetails?.name || 'Customer'}</div>
          <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{inv.customerDetails?.address}</div>
        </div>
      ),
    },
    {
      key: 'subtotal',
      header: 'Taxable Subtotal',
      sortable: true,
      render: (inv: InvoiceItemData) => (
        <span className="font-mono text-xs text-slate-700">₹{inv.subtotal.toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'totalTax',
      header: 'GST Amount',
      render: (inv: InvoiceItemData) => (
        <div>
          <span className="font-mono text-xs text-emerald-700 font-semibold">
            ₹{inv.taxBreakup?.totalTax?.toLocaleString('en-IN') || 0}
          </span>
          <div className="text-[10px] text-slate-400">
            C: ₹{inv.taxBreakup?.cgst || 0} | S: ₹{inv.taxBreakup?.sgst || 0}
          </div>
        </div>
      ),
    },
    {
      key: 'totalPayable',
      header: 'Invoice Total',
      sortable: true,
      render: (inv: InvoiceItemData) => (
        <span className="font-bold text-xs font-mono text-slate-900">
          ₹{inv.totalPayable.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (inv: InvoiceItemData) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedInvoice(inv)}
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDownloadPdf(inv)}
            disabled={downloadingId === inv._id}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition disabled:opacity-50"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tax Invoices & GST Bills</h1>
          <p className="text-sm text-slate-500">
            View, audit, and download GST statutory tax invoices for storefront transactions.
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={invoices}
          isLoading={loading}
          keyExtractor={(item) => item._id}
          searchPlaceholder="Search in list..."
        />
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInvoice(null)}
          title={`Tax Invoice: ${selectedInvoice.invoiceNumber}`}
          subtitle={`Issued on ${new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-IN')}`}
        >
          <div className="space-y-6 text-sm">
            {/* Business & Customer Split */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                  <Building className="w-4 h-4 text-indigo-600" /> Seller Entity
                </div>
                <div className="font-semibold text-slate-800">{selectedInvoice.businessDetails?.name}</div>
                <div className="text-xs text-slate-600">{selectedInvoice.businessDetails?.address}</div>
                <div className="text-xs text-slate-600 mt-1">
                  <span className="font-mono font-semibold">GSTIN:</span> {selectedInvoice.businessDetails?.gstin}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                  <User className="w-4 h-4 text-indigo-600" /> Buyer / Customer
                </div>
                <div className="font-semibold text-slate-800">{selectedInvoice.customerDetails?.name}</div>
                <div className="text-xs text-slate-600">{selectedInvoice.customerDetails?.address}</div>
                <div className="text-xs text-slate-600 mt-1">
                  <span className="font-semibold">Phone:</span> {selectedInvoice.customerDetails?.phone}
                </div>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-slate-900 mb-2">Statutory Tax & Price Breakdown</h4>
              <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-600">Taxable Goods Value (Subtotal)</span>
                <span className="font-mono font-semibold">₹{selectedInvoice.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-600">Promotional Discounts</span>
                <span className="font-mono font-semibold text-rose-600">
                  -₹{selectedInvoice.discount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-600">Shipping & Delivery Fees</span>
                <span className="font-mono font-semibold">₹{selectedInvoice.shippingFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-600">Central GST (CGST @ 9%)</span>
                <span className="font-mono text-slate-700">₹{selectedInvoice.taxBreakup?.cgst || 0}</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-600">State GST (SGST @ 9%)</span>
                <span className="font-mono text-slate-700">₹{selectedInvoice.taxBreakup?.sgst || 0}</span>
              </div>
              <div className="flex justify-between text-sm py-2 font-bold text-slate-900 bg-indigo-50/50 px-2 rounded">
                <span>Total Amount Paid (INR)</span>
                <span className="font-mono text-indigo-700">
                  ₹{selectedInvoice.totalPayable.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedInvoice)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
