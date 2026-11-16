import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { financeApi, RefundData } from '../services/adminApi';

export const RefundsPage: React.FC = () => {
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<RefundData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject modal
  const [rejectingRefund, setRejectingRefund] = useState<RefundData | null>(null);
  const [rejectReason, setRejectReason] = useState('Product seal was opened / not compliant with 14-day guarantee policy');

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const res = await financeApi.listRefunds({ limit: 100 });
      setRefunds(res.refunds);
    } catch (err: any) {
      toast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleApprove = async (r: RefundData) => {
    try {
      setActionLoading(true);
      const res = await financeApi.approveRefund(r._id);
      toast.success(res.message);
      fetchRefunds();
    } catch (err: any) {
      toast.error('Refund approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRefund) return;

    try {
      setActionLoading(true);
      const res = await financeApi.rejectRefund(rejectingRefund._id, rejectReason);
      toast.success(res.message);
      setRejectingRefund(null);
      fetchRefunds();
    } catch (err: any) {
      toast.error('Failed to reject refund');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<RefundData>[] = [
    {
      key: 'orderNumber',
      header: 'Order Reference',
      sortable: true,
      render: (r: RefundData) => (
        <div>
          <div className="font-mono font-bold text-xs text-indigo-700">{r.orderId?.orderNumber || '—'}</div>
          <div className="text-[11px] text-slate-500">{r.orderId?.shippingAddress?.fullName}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Refund Amount',
      sortable: true,
      render: (r: RefundData) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          ₹{(r.amount / 100).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Customer / Return Reason',
      render: (r: RefundData) => (
        <span className="text-xs text-slate-700 line-clamp-1 max-w-xs">{r.reason || 'Customer request'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Refund Status',
      sortable: true,
      render: (r: RefundData) => {
        switch (r.status) {
          case 'PROCESSED':
            return (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Processed (Razorpay)
              </span>
            );
          case 'PENDING':
            return (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                <Clock className="w-3.5 h-3.5" /> Awaiting Review
              </span>
            );
          case 'FAILED':
            return (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                <XCircle className="w-3.5 h-3.5" /> Rejected
              </span>
            );
          default:
            return null;
        }
      },
    },
    {
      key: 'createdAt',
      header: 'Requested Date',
      render: (r: RefundData) => (
        <span className="text-xs text-slate-500">
          {new Date(r.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r: RefundData) => {
        if (r.status !== 'PENDING') return <span className="text-xs text-slate-400">Finalized</span>;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApprove(r)}
              disabled={actionLoading}
              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Approve & Refund
            </button>
            <button
              onClick={() => setRejectingRefund(r)}
              disabled={actionLoading}
              className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              Reject
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Refund Requests & Disputes</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review return claims, enforce policy compliance, and trigger instant Razorpay gateway disbursements.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Refund Requests</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{refunds.length}</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Awaiting Decision</div>
          <div className="text-2xl font-bold text-amber-600 mt-2">
            {refunds.filter((r) => r.status === 'PENDING').length}
          </div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Disbursed via Gateway</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {refunds.filter((r) => r.status === 'PROCESSED').length}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={refunds}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        emptyMessage="No refund requests found."
      />

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectingRefund}
        onClose={() => setRejectingRefund(null)}
        title="Reject Refund Request"
        subtitle={`Order: ${rejectingRefund?.orderId?.orderNumber}`}
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Rejection *
            </label>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="admin-input resize-none text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRejectingRefund(null)}
              className="admin-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn-danger text-xs" disabled={actionLoading}>
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default RefundsPage;
