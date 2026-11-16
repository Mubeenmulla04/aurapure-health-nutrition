import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import { cmsApi, BannerData } from '../services/adminApi';

export const BannersPage: React.FC = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null);

  // Delete
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<BannerData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<BannerData>>({
    title: '',
    subtitle: '',
    tagline: '',
    imageDesktop: '',
    imageMobile: '',
    ctaText: 'Shop Collection',
    ctaLink: '/collections/plant-protein-powder',
    placement: 'HERO',
    isActive: true,
    sortOrder: 1,
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await cmsApi.listBanners();
      setBanners(data);
    } catch {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      tagline: '',
      imageDesktop: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1600&q=80',
      imageMobile: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
      ctaText: 'Shop Collection',
      ctaLink: '/collections/plant-protein-powder',
      placement: 'HERO',
      isActive: true,
      sortOrder: banners.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BannerData) => {
    setEditingBanner(b);
    setFormData(b);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.warning('Title is required.');
      return;
    }

    try {
      setActionLoading(true);
      if (editingBanner) {
        const res = await cmsApi.updateBanner(editingBanner._id, formData);
        toast.success(res.message);
      } else {
        const res = await cmsApi.createBanner(formData);
        toast.success(res.message);
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch {
      toast.error('Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!bannerToDelete) return;
    try {
      setActionLoading(true);
      const res = await cmsApi.deleteBanner(bannerToDelete._id);
      toast.success(res.message);
      setIsDeleteOpen(false);
      setBannerToDelete(null);
      fetchBanners();
    } catch {
      toast.error('Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<BannerData>[] = [
    {
      key: 'title',
      header: 'Banner Headline',
      sortable: true,
      render: (b: BannerData) => (
        <div className="flex items-center gap-3">
          <img
            src={b.imageDesktop || 'https://via.placeholder.com/120x60'}
            alt={b.title}
            className="w-16 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
          />
          <div>
            <div className="font-semibold text-xs text-slate-900">{b.title}</div>
            <div className="text-[11px] text-slate-500">{b.subtitle}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'placement',
      header: 'Placement Zone',
      sortable: true,
      render: (b: BannerData) => (
        <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-0.5 rounded text-slate-700">
          {b.placement}
        </span>
      ),
    },
    {
      key: 'ctaLink',
      header: 'Link Destination',
      render: (b: BannerData) => (
        <span className="text-xs font-mono text-indigo-600 truncate max-w-xs">{b.ctaLink || '/'}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (b: BannerData) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            b.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {b.isActive ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (b: BannerData) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(b)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setBannerToDelete(b);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hero & Promotional Banners</h1>
          <p className="text-sm text-slate-500 mt-1">
            Control homepage hero sliders, promotional marketing strips, and seasonal banner links.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={banners}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        emptyMessage="No promotional banners found."
      />

      {/* Add / Edit Banner Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBanner ? `Edit Banner: ${editingBanner.title}` : 'Add Promotional Banner'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Headline Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 100% Organic Plant-Based Protein"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Subtitle / Supporting Copy
            </label>
            <input
              type="text"
              placeholder="Clean nutrition formulated for Indian wellness"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="admin-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Desktop Image URL
              </label>
              <input
                type="url"
                value={formData.imageDesktop}
                onChange={(e) => setFormData({ ...formData, imageDesktop: e.target.value })}
                className="admin-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Placement Area
              </label>
              <select
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                className="admin-input text-xs"
              >
                <option value="HERO">Homepage Hero Slider</option>
                <option value="PROMO_BAR">Top Header Promo Bar</option>
                <option value="COLLECTION_FEATURE">Collection Feature Strip</option>
                <option value="FOOTER_CALLOUT">Footer Callout</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                CTA Button Text
              </label>
              <input
                type="text"
                value={formData.ctaText}
                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                className="admin-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                CTA Link Destination
              </label>
              <input
                type="text"
                value={formData.ctaLink}
                onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                className="admin-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="bannerActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="bannerActive" className="text-sm font-medium text-slate-700 cursor-pointer">
              Active in Storefront
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary text-xs" disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Banner'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Promotional Banner"
        message="Are you sure you want to permanently delete this banner?"
        confirmLabel="Delete Banner"
        isLoading={actionLoading}
      />
    </div>
  );
};
export default BannersPage;
