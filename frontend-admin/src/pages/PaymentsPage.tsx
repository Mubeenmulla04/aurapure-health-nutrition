import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, XCircle, RefreshCw, IndianRupee } from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { useToast } from '../components/common/Toast';
import { financeApi, PaymentData } from '../services/adminApi';

export const PaymentsPage: React.FC = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await financeApi.listPayments({ limit: 100 });
      setPayments(res.payments);
    } catch (err: any) {
      toast.error('Failed to load payment transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleReconcile = async (p: PaymentData) => {
    try {
      setReconcilingId(p._id);
      const res = await financeApi.reconcilePayment(p._id);
      toast.success(res.message);
      fetchPayments();
    } catch (err: any) {
      toast.error('Reconciliation failed');
    } finally {
      setReconcilingId(null);
    }
  };

  const columns: Column<PaymentData>[] = [
    {
      key: 'razorpayOrderId',
      header: 'Gateway Order / ID',
      sortable: true,
      render: (p: PaymentData) => (
        <div>
          <div className="font-mono font-bold text-xs text-indigo-700">
            {p.shiprocketOrderId || p.gatewayOrderId || p.razorpayOrderId || '—'}
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            {p.shiprocketPaymentId || p.gatewayPaymentId || p.razorpayPaymentId || 'Payment Pending'}
          </div>
          <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 uppercase">
            {p.gateway || 'SHIPROCKET'}
          </span>
        </div>
      ),
    },
    {
      key: 'orderNumber',
      header: 'Order Reference',
      render: (p: PaymentData) => (
        <div>
          <div className="font-bold text-xs text-slate-900">{p.orderId?.orderNumber || '—'}</div>
          <div className="text-[11px] text-slate-500">{p.orderId?.shippingAddress?.fullName}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Captured',
      sortable: true,
      render: (p: PaymentData) => (
        <span className="font-bold text-xs font-mono text-slate-900">
          ₹{(p.amount / 100).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (p: PaymentData) => (
        <span className="text-xs uppercase font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">
          {p.method || (p.gateway === 'SHIPROCKET' ? 'SHIPROCKET UPI/CARD' : 'RAZORPAY')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Gateway Status',
      render: (p: PaymentData) => {
        const isSuccess = p.status === 'SUCCESS' || p.status === 'PAID';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            {p.status}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (p: PaymentData) => (
        <span className="text-xs text-slate-500">
          {new Date(p.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Reconcile',
      render: (p: PaymentData) => (
        <button
          onClick={() => handleReconcile(p)}
          disabled={reconcilingId === p._id}
          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
          title="Verify with Shiprocket Payment Gateway"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reconcilingId === p._id ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shiprocket Payments & Gateway Transactions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review 256-bit encrypted Shiprocket charges, webhook settlements, and gateway receipts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Captured Transactions</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{payments.length}</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Settled Successfully</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {payments.filter((p) => p.status === 'SUCCESS' || p.status === 'PAID').length}
          </div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gateway Integration</div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">Shiprocket Payments</div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        searchPlaceholder="Search by Shiprocket Order ID or Payment ID..."
        emptyMessage="No payment transactions recorded."
      />
    </div>
  );
};
export default PaymentsPage;
