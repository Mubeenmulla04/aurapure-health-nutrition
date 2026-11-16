import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, CheckCircle2, XCircle, Percent, IndianRupee } from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import { couponApi, CouponData } from '../services/adminApi';

export const CouponsPage: React.FC = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponData | null>(null);

  // Delete Confirm
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<CouponData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENT' as 'PERCENT' | 'FLAT',
    discountValue: 15,
    minOrderValue: 999,
    maxDiscountCap: 500,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimitTotal: 500,
    usageLimitPerUser: 1,
    isActive: true,
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await couponApi.list();
      setCoupons(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.description || !formData.discountValue || !formData.endDate) {
      toast.warning('Please fill in all mandatory promotional fields.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await couponApi.create(formData);
      toast.success(res.message);
      setIsAddModalOpen(false);
      setFormData({
        code: '',
        description: '',
        discountType: 'PERCENT',
        discountValue: 15,
        minOrderValue: 999,
        maxDiscountCap: 500,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageLimitTotal: 500,
        usageLimitPerUser: 1,
        isActive: true,
      });
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create coupon');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (c: CouponData) => {
    setEditingCoupon(c);
    setFormData({
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderValue: c.minOrderValue,
      maxDiscountCap: c.maxDiscountCap || 0,
      startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
      usageLimitTotal: c.usageLimitTotal || 100,
      usageLimitPerUser: c.usageLimitPerUser,
      isActive: c.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    try {
      setActionLoading(true);
      const res = await couponApi.update(editingCoupon._id, formData);
      toast.success(res.message);
      setIsEditModalOpen(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update coupon');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!couponToDelete) return;
    try {
      setActionLoading(true);
      const res = await couponApi.delete(couponToDelete._id);
      toast.success(res.message);
      setIsDeleteOpen(false);
      setCouponToDelete(null);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete coupon');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<CouponData>[] = [
    {
      key: 'code',
      header: 'Coupon Code',
      sortable: true,
      render: (c: CouponData) => (
        <div>
          <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-200">
            {c.code}
          </span>
          <div className="text-[11px] text-slate-500 mt-1 max-w-xs truncate">{c.description}</div>
        </div>
      ),
    },
    {
      key: 'discountValue',
      header: 'Discount Benefit',
      sortable: true,
      render: (c: CouponData) => (
        <div>
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            {c.discountType === 'PERCENT' ? (
              <>
                <Percent className="w-3.5 h-3.5" /> {c.discountValue}% OFF
              </>
            ) : (
              <>
                <IndianRupee className="w-3.5 h-3.5" /> ₹{c.discountValue} FLAT
              </>
            )}
          </span>
          {c.maxDiscountCap ? (
            <span className="text-[10px] text-slate-500">Max Cap: ₹{c.maxDiscountCap}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'minOrderValue',
      header: 'Min Cart Total',
      render: (c: CouponData) => (
        <span className="text-xs font-mono text-slate-700">₹{c.minOrderValue}</span>
      ),
    },
    {
      key: 'timesUsed',
      header: 'Redemptions',
      sortable: true,
      render: (c: CouponData) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900">{c.timesUsed}</span>
          {c.usageLimitTotal ? (
            <span className="text-slate-500 text-[11px]"> / {c.usageLimitTotal}</span>
          ) : (
            <span className="text-slate-400 text-[10px]"> (Unlimited)</span>
          )}
        </div>
      ),
    },
    {
      key: 'endDate',
      header: 'Validity Expiration',
      sortable: true,
      render: (c: CouponData) => {
        const isExpired = new Date(c.endDate).getTime() < Date.now();
        return (
          <span className={`text-xs ${isExpired ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>
            {new Date(c.endDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
            {isExpired && ' (Expired)'}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (c: CouponData) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            c.isActive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {c.isActive ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c: CouponData) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(c)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Coupon"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCouponToDelete(c);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Coupon"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Coupons & Promotional Discounts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure automated cart discount codes, minimum order rules, and seasonal wellness campaigns.
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Promotional Codes</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {coupons.filter((c) => c.isActive).length} / {coupons.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Live for storefront checkout</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Customer Redemptions</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {coupons.reduce((acc, curr) => acc + (curr.timesUsed || 0), 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Checkouts with discount applied</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Percentage Off Offers</div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">
            {coupons.filter((c) => c.discountType === 'PERCENT').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Relative cart savings</div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={coupons}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        searchPlaceholder="Search coupons by code or description..."
        emptyMessage="No promotional coupons created."
      />

      {/* Add Coupon Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Promotional Coupon Code"
        subtitle="Configure discount benefit, order requirements, and usage caps."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Promo Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AURAPURE20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="admin-input font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Type *
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                className="admin-input"
              >
                <option value="PERCENT">Percentage Discount (%)</option>
                <option value="FLAT">Flat Rupee Amount (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Promotion Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Flat 15% OFF on all plant protein powders"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="admin-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {formData.discountType === 'PERCENT' ? 'Discount (%) *' : 'Discount Amount (₹) *'}
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="admin-input font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Min Order (₹)
              </label>
              <input
                type="number"
                min={0}
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Cap (₹)
              </label>
              <input
                type="number"
                min={0}
                placeholder="Optional"
                value={formData.maxDiscountCap || ''}
                onChange={(e) => setFormData({ ...formData, maxDiscountCap: Number(e.target.value) })}
                className="admin-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="admin-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Expiration Date *
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="admin-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Redemptions Limit
              </label>
              <input
                type="number"
                min={1}
                value={formData.usageLimitTotal}
                onChange={(e) => setFormData({ ...formData, usageLimitTotal: Number(e.target.value) })}
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Limit Per Customer
              </label>
              <input
                type="number"
                min={1}
                value={formData.usageLimitPerUser}
                onChange={(e) => setFormData({ ...formData, usageLimitPerUser: Number(e.target.value) })}
                className="admin-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="couponActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="couponActive" className="text-sm font-medium text-slate-700 cursor-pointer">
              Active for Checkout (Allow customers to apply this coupon code)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="admin-btn-secondary"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Creating...' : 'Create Promotional Code'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Coupon Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Coupon: ${editingCoupon?.code}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Promo Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="admin-input font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Type *
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                className="admin-input"
              >
                <option value="PERCENT">Percentage Discount (%)</option>
                <option value="FLAT">Flat Rupee Amount (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Promotion Description *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="admin-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Value *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="admin-input font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Min Order (₹)
              </label>
              <input
                type="number"
                min={0}
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Cap (₹)
              </label>
              <input
                type="number"
                min={0}
                value={formData.maxDiscountCap || ''}
                onChange={(e) => setFormData({ ...formData, maxDiscountCap: Number(e.target.value) })}
                className="admin-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Expiration Date *
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="admin-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Limit
              </label>
              <input
                type="number"
                min={1}
                value={formData.usageLimitTotal}
                onChange={(e) => setFormData({ ...formData, usageLimitTotal: Number(e.target.value) })}
                className="admin-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="editCouponActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="editCouponActive" className="text-sm font-medium text-slate-700 cursor-pointer">
              Active for Checkout
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="admin-btn-secondary"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Promotional Coupon"
        message={`Are you sure you want to permanently delete coupon '${couponToDelete?.code}'? Customers will immediately no longer be able to claim this discount at checkout.`}
        confirmLabel="Delete Coupon"
        isLoading={actionLoading}
      />
    </div>
  );
};
export default CouponsPage;
