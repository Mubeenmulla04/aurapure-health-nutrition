import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, XCircle, Trash2, Eye } from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import { cmsApi, ReviewData } from '../services/adminApi';

export const ReviewsPage: React.FC = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Delete
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<ReviewData | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await cmsApi.listReviews({ limit: 100 });
      setReviews(res.reviews);
    } catch (err: any) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleStatus = async (r: ReviewData) => {
    try {
      setActionLoading(true);
      const nextVal = !r.isApproved;
      const res = await cmsApi.toggleReview(r._id, nextVal);
      toast.success(res.message);
      setReviews((prev) =>
        prev.map((item) => (item._id === r._id ? { ...item, isApproved: nextVal } : item))
      );
    } catch {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;
    try {
      setActionLoading(true);
      const res = await cmsApi.deleteReview(reviewToDelete._id);
      toast.success(res.message);
      setIsDeleteOpen(false);
      setReviewToDelete(null);
      fetchReviews();
    } catch {
      toast.error('Failed to delete review');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<ReviewData>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (r: ReviewData) => (
        <div>
          <div className="font-semibold text-xs text-slate-900">{r.productId?.title || 'Supplement Product'}</div>
          <div className="text-[11px] text-slate-500 font-mono">/{r.productId?.slug}</div>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating & Feedback',
      render: (r: ReviewData) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                }`}
              />
            ))}
            <span className="text-xs font-bold text-slate-800 ml-1">{r.rating}.0</span>
          </div>
          <div className="font-bold text-xs text-slate-800">{r.title}</div>
          <div className="text-xs text-slate-600 line-clamp-2 max-w-sm">{r.comment}</div>
        </div>
      ),
    },
    {
      key: 'userName',
      header: 'Reviewer',
      render: (r: ReviewData) => (
        <div>
          <div className="font-semibold text-xs text-slate-900">{r.userName}</div>
          {r.verifiedPurchase && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              Verified Buyer
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'isApproved',
      header: 'Moderation Status',
      render: (r: ReviewData) => (
        <button
          onClick={() => handleToggleStatus(r)}
          disabled={actionLoading}
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            r.isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}
          title="Click to toggle approval"
        >
          {r.isApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {r.isApproved ? 'Approved (Visible)' : 'Hidden (Pending)'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r: ReviewData) => (
        <button
          onClick={() => {
            setReviewToDelete(r);
            setIsDeleteOpen(true);
          }}
          className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Delete Fraudulent Review"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Reviews & Ratings Moderation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Moderate authentic customer testimonials, verify purchases, and protect brand integrity.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={reviews}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        emptyMessage="No customer reviews found."
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer Review"
        message="Are you sure you want to permanently delete this customer review?"
        confirmLabel="Delete Review"
        isLoading={actionLoading}
      />
    </div>
  );
};
export default ReviewsPage;
