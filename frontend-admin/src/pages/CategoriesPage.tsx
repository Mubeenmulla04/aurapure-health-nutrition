import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Package } from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import { categoryApi, CategoryData } from '../services/adminApi';

export const CategoriesPage: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);

  // Delete
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    badge: '',
    isActive: true,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.list();
      setCategories(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.warning('Category name is required.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await categoryApi.create(formData);
      toast.success(res.message);
      setIsAddModalOpen(false);
      setFormData({ name: '', slug: '', description: '', image: '', badge: '', isActive: true });
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (cat: CategoryData) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
      badge: cat.badge || '',
      isActive: cat.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      setActionLoading(true);
      const res = await categoryApi.update(editingCategory._id, formData);
      toast.success(res.message);
      setIsEditModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setActionLoading(true);
      const res = await categoryApi.delete(categoryToDelete._id);
      toast.success(res.message);
      setIsDeleteOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete category');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<CategoryData>[] = [
    {
      key: 'name',
      header: 'Category',
      sortable: true,
      render: (cat: CategoryData) => (
        <div className="flex items-center gap-3">
          <img
            src={cat.image || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=120&q=80'}
            alt={cat.name}
            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
          />
          <div>
            <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              {cat.name}
              {cat.badge && (
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                  {cat.badge}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 font-mono">/{cat.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (cat: CategoryData) => (
        <span className="text-xs text-slate-600 line-clamp-1 max-w-sm">{cat.description || '—'}</span>
      ),
    },
    {
      key: 'productCount',
      header: 'Linked Products',
      sortable: true,
      render: (cat: CategoryData) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
          <Package className="w-3.5 h-3.5 text-slate-500" />
          {cat.productCount || 0} Products
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (cat: CategoryData) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            cat.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {cat.isActive ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (cat: CategoryData) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(cat)}
            className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Category"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCategoryToDelete(cat);
              setIsDeleteOpen(true);
            }}
            className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Category"
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Categories & Taxonomy</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize catalog products into consumer-facing health and nutrition departments.
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="admin-btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Categories</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{categories.length}</div>
          <div className="text-xs text-slate-500 mt-1">Active nutrition taxonomies</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active in Storefront</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {categories.filter((c) => c.isActive).length} / {categories.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Displayed in navigation mega menu</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Linked Catalog SKUs</div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">
            {categories.reduce((acc, curr) => acc + (curr.productCount || 0), 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Live assigned items</div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={categories}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        searchPlaceholder="Search categories by name or slug..."
        emptyMessage="No categories found."
      />

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Category"
        subtitle="Create a new catalog taxonomy collection."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Daily Wellness Supplements"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              URL Slug (Optional — Auto-generated)
            </label>
            <input
              type="text"
              placeholder="e.g. daily-wellness-supplements"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="admin-input font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Short description for collection page header..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="admin-input resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Image CDN URL
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Promotion Badge (e.g. NEW, BESTSELLER)
              </label>
              <input
                type="text"
                placeholder="TRENDING"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value.toUpperCase() })}
                className="admin-input font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="catActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="catActive" className="text-sm font-medium text-slate-700 cursor-pointer">
              Active in Storefront (Show in customer catalog)
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
              {actionLoading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Category: ${editingCategory?.name}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              URL Slug *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="admin-input font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="admin-input resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Image CDN URL
              </label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Promotion Badge
              </label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value.toUpperCase() })}
                className="admin-input font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="editCatActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="editCatActive" className="text-sm font-medium text-slate-700 cursor-pointer">
              Active in Storefront
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete category '${categoryToDelete?.name}'? Deletion will be rejected if any catalog products are currently assigned to this category.`}
        confirmLabel="Delete Category"
        isLoading={actionLoading}
      />
    </div>
  );
};
export default CategoriesPage;
