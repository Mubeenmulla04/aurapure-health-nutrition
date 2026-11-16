import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Layers,
  Star,
  CheckCircle2,
  XCircle,
  Package,
  TrendingUp,
  Image as ImageIcon,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import { productApi, categoryApi, ProductData, CategoryData, ProductVariantData } from '../services/adminApi';

export const ProductsPage: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);

  // Delete Confirm
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Active Tab in Product Form
  const [formTab, setFormTab] = useState<'basic' | 'variants' | 'status'>('basic');

  // Form State
  const [formProduct, setFormProduct] = useState<Partial<ProductData>>({
    title: '',
    slug: '',
    subtitle: '',
    categoryId: '',
    description: '',
    benefits: ['25g Complete Plant Protein', 'Zero Bloating with Digestive Enzymes', 'Ashwagandha for Stress Recovery'],
    ingredients: ['Yellow Pea Protein', 'Sprouted Brown Rice', 'Monk Fruit Extract'],
    isActive: true,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
  });

  const [variantsList, setVariantsList] = useState<ProductVariantData[]>([
    {
      sku: 'AP-PROT-CHOC-1KG',
      title: 'Plant Protein - Belgian Chocolate (1kg)',
      flavor: 'Belgian Chocolate',
      packSize: '1kg Tub',
      weightGrams: 1000,
      mrp: 2999,
      sellingPrice: 2499,
      discountPercent: 17,
      images: ['https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80'],
      initialStock: 100,
      isActive: true,
    },
  ]);

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      const [prodRes, catList] = await Promise.all([
        productApi.list({
          limit: 100,
          categoryId: selectedCategory === 'ALL' ? undefined : selectedCategory,
          status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        }),
        categoryApi.list(),
      ]);
      setProducts(prodRes.products);
      setCategories(catList);
      if (catList.length > 0 && !formProduct.categoryId) {
        setFormProduct((prev) => ({ ...prev, categoryId: catList[0]._id }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, [selectedCategory, selectedStatus]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentProductId(null);
    setFormTab('basic');
    setFormProduct({
      title: '',
      slug: '',
      subtitle: '',
      categoryId: categories[0]?._id || '',
      description: '',
      benefits: ['25g Complete Plant Protein', 'Zero Bloating with Digestive Enzymes'],
      ingredients: ['Yellow Pea Protein', 'Brown Rice Protein'],
      isActive: true,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
    });
    setVariantsList([
      {
        sku: `AP-${Date.now().toString().slice(-6)}`,
        title: 'Original Flavor (1kg)',
        flavor: 'Original',
        packSize: '1kg Tub',
        weightGrams: 1000,
        mrp: 2999,
        sellingPrice: 2499,
        discountPercent: 17,
        images: ['https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80'],
        initialStock: 50,
        isActive: true,
      },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (prod: ProductData) => {
    try {
      setActionLoading(true);
      const detailed = await productApi.getById(prod._id);
      setIsEditing(true);
      setCurrentProductId(prod._id);
      setFormTab('basic');
      setFormProduct({
        title: detailed.title,
        slug: detailed.slug,
        subtitle: detailed.subtitle || '',
        categoryId: typeof detailed.categoryId === 'object' ? detailed.categoryId._id : detailed.categoryId,
        description: detailed.description,
        benefits: detailed.benefits || [],
        ingredients: detailed.ingredients || [],
        isActive: detailed.isActive,
        isFeatured: detailed.isFeatured,
        isBestSeller: detailed.isBestSeller,
        isNewArrival: detailed.isNewArrival,
      });
      if (detailed.variants && detailed.variants.length > 0) {
        setVariantsList(detailed.variants);
      }
      setIsModalOpen(true);
    } catch (err: any) {
      toast.error('Failed to load product details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct.title || !formProduct.categoryId || !formProduct.description) {
      toast.warning('Please complete all required product information.');
      return;
    }
    if (variantsList.length === 0) {
      toast.warning('At least one product variant must be configured.');
      return;
    }

    try {
      setActionLoading(true);
      if (isEditing && currentProductId) {
        const res = await productApi.update(currentProductId, {
          product: formProduct,
          variants: variantsList,
        });
        toast.success(res.message);
      } else {
        const res = await productApi.create({
          product: formProduct,
          variants: variantsList,
        });
        toast.success(res.message);
      }
      setIsModalOpen(false);
      fetchCatalogData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async (prod: ProductData) => {
    try {
      setActionLoading(true);
      const res = await productApi.duplicate(prod._id);
      toast.success(res.message);
      fetchCatalogData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Duplicate failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      setActionLoading(true);
      const res = await productApi.delete(productToDelete._id);
      toast.success(res.message);
      setIsDeleteOpen(false);
      setProductToDelete(null);
      fetchCatalogData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (prod: ProductData, field: 'isActive' | 'isFeatured' | 'isBestSeller') => {
    try {
      const nextVal = !prod[field];
      await productApi.toggleStatus(prod._id, { [field]: nextVal });
      toast.success(`Updated ${field} for ${prod.title}`);
      setProducts((prev) =>
        prev.map((p) => (p._id === prod._id ? { ...p, [field]: nextVal } : p))
      );
    } catch (err: any) {
      toast.error('Failed to toggle status');
    }
  };

  const handleAddVariant = () => {
    const newIdx = variantsList.length + 1;
    setVariantsList([
      ...variantsList,
      {
        sku: `AP-${Date.now().toString().slice(-6)}-${newIdx}`,
        title: `${formProduct.title || 'Product'} - Variant ${newIdx}`,
        flavor: 'Vanilla Bean',
        packSize: '500g Pouch',
        weightGrams: 500,
        mrp: 1899,
        sellingPrice: 1499,
        discountPercent: 21,
        images: ['https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80'],
        initialStock: 50,
        isActive: true,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variantsList.length <= 1) {
      toast.warning('A product must maintain at least one active variant.');
      return;
    }
    setVariantsList(variantsList.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof ProductVariantData, val: any) => {
    const updated = [...variantsList];
    updated[index] = { ...updated[index], [field]: val };
    if (field === 'mrp' || field === 'sellingPrice') {
      const mrpVal = Number(field === 'mrp' ? val : updated[index].mrp);
      const sellVal = Number(field === 'sellingPrice' ? val : updated[index].sellingPrice);
      if (mrpVal > sellVal) {
        updated[index].discountPercent = Math.round(((mrpVal - sellVal) / mrpVal) * 100);
      }
    }
    setVariantsList(updated);
  };

  const columns: Column<ProductData>[] = [
    {
      key: 'title',
      header: 'Product Details',
      sortable: true,
      render: (prod: ProductData) => (
        <div className="flex items-center gap-3">
          <img
            src={prod.primaryImage || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=120&q=80'}
            alt={prod.title}
            className="w-11 h-11 rounded-lg object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <span className="truncate max-w-[200px]">{prod.title}</span>
              {prod.isFeatured && (
                <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Featured
                </span>
              )}
              {prod.isBestSeller && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                  Bestseller
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 font-mono truncate max-w-[200px]">/{prod.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (prod: ProductData) => (
        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
          {typeof prod.categoryId === 'object' ? prod.categoryId?.name : 'Category'}
        </span>
      ),
    },
    {
      key: 'variants',
      header: 'Variants',
      render: (prod: ProductData) => (
        <div>
          <span className="text-xs font-semibold text-slate-900">{prod.variantsCount || 1} Option(s)</span>
          <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
            {prod.variants?.map((v) => v.flavor).filter(Boolean).join(', ') || 'Original'}
          </p>
        </div>
      ),
    },
    {
      key: 'priceRange',
      header: 'Pricing Range',
      render: (prod: ProductData) => (
        <div className="text-xs font-bold text-slate-900">
          ₹{prod.priceRange?.min?.toLocaleString('en-IN') || 0}
          {prod.priceRange?.max && prod.priceRange.max !== prod.priceRange.min ? (
            <span className="text-slate-500 font-normal"> – ₹{prod.priceRange.max.toLocaleString('en-IN')}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'totalStock',
      header: 'Available Stock',
      sortable: true,
      render: (prod: ProductData) => {
        const stock = prod.totalStock ?? 50;
        const isLow = stock <= 15;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
              isLow ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {stock} Units
          </span>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (prod: ProductData) => (
        <button
          onClick={() => handleToggleStatus(prod, 'isActive')}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
            prod.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          title="Click to toggle publish status"
        >
          {prod.isActive ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> Published
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5" /> Draft
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (prod: ProductData) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(prod)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Product"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDuplicate(prod)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Duplicate as Draft"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setProductToDelete(prod);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete / Archive Product"
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Product Catalog Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create, edit, duplicate, and manage multi-variant health supplements with synchronized inventory.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="admin-btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Catalog SKUs</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{products.length}</div>
          <div className="text-xs text-slate-500 mt-1">Active parent products</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Storefront Published</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {products.filter((p) => p.isActive).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Visible to retail customers</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Featured Items</div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">
            {products.filter((p) => p.isFeatured).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Highlighted on homepage</div>
        </div>
        <div className="admin-card p-5">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Categories Active</div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{categories.length}</div>
          <div className="text-xs text-slate-500 mt-1">Product lines configured</div>
        </div>
      </div>

      {/* Table Filter Controls Slot */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="admin-input text-xs py-1.5 w-auto"
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="admin-input text-xs py-1.5 w-auto"
        >
          <option value="ALL">All Publication States</option>
          <option value="ACTIVE">Published (Live)</option>
          <option value="INACTIVE">Draft (Hidden)</option>
          <option value="FEATURED">Featured Flagged</option>
          <option value="BEST_SELLER">Best Sellers</option>
        </select>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={products}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        searchPlaceholder="Search products by title, slug, or flavor..."
        emptyMessage="No products match your search."
        bulkActions={[
          {
            label: 'Publish Selected',
            onClick: async (items) => {
              await productApi.bulkAction('activate', items.map((i) => i._id));
              toast.success(`Published ${items.length} products.`);
              fetchCatalogData();
            },
            variant: 'primary',
          },
          {
            label: 'Unpublish Selected',
            onClick: async (items) => {
              await productApi.bulkAction('deactivate', items.map((i) => i._id));
              toast.success(`Unpublished ${items.length} products.`);
              fetchCatalogData();
            },
            variant: 'secondary',
          },
          {
            label: 'Delete / Archive Selected',
            onClick: async (items) => {
              await productApi.bulkAction('delete', items.map((i) => i._id));
              toast.success(`Processed ${items.length} products.`);
              fetchCatalogData();
            },
            variant: 'danger',
          },
        ]}
      />

      {/* Add / Edit Product Rich Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? `Edit Product: ${formProduct.title}` : 'Add New Health & Nutrition Product'}
        subtitle="Manage product specifications, nutritional claims, and multi-flavor variant matrices."
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-6">
          {/* Modal Tabs */}
          <div className="flex border-b border-slate-200 gap-2 pb-px text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFormTab('basic')}
              className={`px-3 py-2 border-b-2 transition-colors ${
                formTab === 'basic'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              1. Basic Information
            </button>
            <button
              type="button"
              onClick={() => setFormTab('variants')}
              className={`px-3 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                formTab === 'variants'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>2. Variants & Inventory</span>
              <span className="bg-indigo-100 text-indigo-800 rounded-full px-1.5 py-0.2 text-[10px]">
                {variantsList.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFormTab('status')}
              className={`px-3 py-2 border-b-2 transition-colors ${
                formTab === 'status'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              3. Marketing & Visibility
            </button>
          </div>

          {/* Tab 1: Basic Information */}
          {formTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Plant Protein Powder"
                    value={formProduct.title}
                    onChange={(e) => {
                      const t = e.target.value;
                      setFormProduct({
                        ...formProduct,
                        title: t,
                        slug: t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                      });
                    }}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    required
                    value={formProduct.categoryId}
                    onChange={(e) => setFormProduct({ ...formProduct, categoryId: e.target.value })}
                    className="admin-input"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="organic-plant-protein-powder"
                    value={formProduct.slug}
                    onChange={(e) => setFormProduct({ ...formProduct, slug: e.target.value })}
                    className="admin-input font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Product Subtitle / One-Liner
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 25g Plant Protein with Ashwagandha & Digestive Enzymes"
                    value={formProduct.subtitle}
                    onChange={(e) => setFormProduct({ ...formProduct, subtitle: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Product Description *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Comprehensive scientific benefits, source of plant ingredients, and nutritional profile..."
                  value={formProduct.description}
                  onChange={(e) => setFormProduct({ ...formProduct, description: e.target.value })}
                  className="admin-input resize-none"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Variants & Inventory Matrix */}
          {formTab === 'variants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Flavor & Pack Size Options</h3>
                  <p className="text-xs text-slate-500">Each variant creates a synchronized inventory SKU record.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="admin-btn-secondary text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Flavor / Size</span>
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {variantsList.map((v, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        Variant #{idx + 1}
                      </span>
                      {variantsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">SKU *</label>
                        <input
                          type="text"
                          required
                          value={v.sku}
                          onChange={(e) => handleVariantChange(idx, 'sku', e.target.value.toUpperCase())}
                          className="admin-input font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                          Flavor / Type *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Belgian Chocolate"
                          value={v.flavor}
                          onChange={(e) => handleVariantChange(idx, 'flavor', e.target.value)}
                          className="admin-input text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                          Pack Size *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="1kg Tub"
                          value={v.packSize}
                          onChange={(e) => handleVariantChange(idx, 'packSize', e.target.value)}
                          className="admin-input text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                          Selling Price (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={v.sellingPrice}
                          onChange={(e) => handleVariantChange(idx, 'sellingPrice', Number(e.target.value))}
                          className="admin-input text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                          MRP Sticker (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={v.mrp}
                          onChange={(e) => handleVariantChange(idx, 'mrp', Number(e.target.value))}
                          className="admin-input text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                          Weight (Grams)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={v.weightGrams}
                          onChange={(e) => handleVariantChange(idx, 'weightGrams', Number(e.target.value))}
                          className="admin-input text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                          Initial Stock
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={v.initialStock ?? 50}
                          onChange={(e) => handleVariantChange(idx, 'initialStock', Number(e.target.value))}
                          className="admin-input text-xs font-bold text-emerald-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        High-Resolution Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={v.images?.[0] || ''}
                        onChange={(e) => handleVariantChange(idx, 'images', [e.target.value])}
                        className="admin-input text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Marketing & Visibility */}
          {formTab === 'status' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formProduct.isActive}
                    onChange={(e) => setFormProduct({ ...formProduct, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Publish in Storefront</div>
                    <div className="text-[11px] text-slate-500">Live and available for customer checkout</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formProduct.isFeatured}
                    onChange={(e) => setFormProduct({ ...formProduct, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Featured Showcase</div>
                    <div className="text-[11px] text-slate-500">Pin to homepage premium showcase</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formProduct.isBestSeller}
                    onChange={(e) => setFormProduct({ ...formProduct, isBestSeller: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Best Seller Badge</div>
                    <div className="text-[11px] text-slate-500">Display top seller ribbon tag</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formProduct.isNewArrival}
                    onChange={(e) => setFormProduct({ ...formProduct, isNewArrival: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">New Arrival Badge</div>
                    <div className="text-[11px] text-slate-500">Highlight in new formulations collection</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="admin-btn-secondary"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary" disabled={actionLoading}>
              {actionLoading ? 'Saving...' : isEditing ? 'Save Product Changes' : 'Create & Publish Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete or Archive Product"
        message={`Are you sure you want to delete '${productToDelete?.title}'? If this product has historical orders, it will be safely deactivated/archived to protect accounting and invoicing integrity.`}
        confirmLabel="Confirm Action"
        isLoading={actionLoading}
      />
    </div>
  );
};
export default ProductsPage;
