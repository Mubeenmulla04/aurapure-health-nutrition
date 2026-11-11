import React, { useEffect, useState } from 'react';
import { Plus, Search, Layers, X, Check, Star } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [flavor, setFlavor] = useState('Belgian Chocolate');
  const [packSize, setPackSize] = useState('1 kg Tub');
  const [sku, setSku] = useState('');
  const [mrp, setMrp] = useState(2999);
  const [sellingPrice, setSellingPrice] = useState(2499);
  const [initialStock, setInitialStock] = useState(100);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80');

  const fetchCatalog = async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes] = await Promise.all([
        adminApi.get('/products?limit=50'),
        adminApi.get('/categories'),
      ]);
      if (prodRes.data?.data?.products) {
        setProducts(prodRes.data.data.products);
      }
      if (catRes.data?.data?.categories) {
        setCategories(catRes.data.data.categories);
        if (catRes.data.data.categories.length > 0 && !categoryId) {
          setCategoryId(catRes.data.data.categories[0]._id);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    if (!sku && val.length > 3) {
      setSku(`AP-${val.substring(0, 4).toUpperCase()}-1KG`);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        product: {
          title,
          slug,
          subtitle,
          categoryId,
          description,
          benefits: [
            '25g complete organic plant protein',
            'Enhanced with KSM-66 Ashwagandha for stress relief',
            'Zero bloating with papain & bromelain enzymes',
          ],
          ingredients: ['Yellow Pea Protein Isolate', 'Sprouted Brown Rice Protein', 'Monk Fruit Extract'],
          howToUse: [
            { step: 'Step 1', description: 'Add 1 scoop (34g) to 250ml water or plant milk.' },
            { step: 'Step 2', description: 'Shake for 20 seconds and enjoy.' },
          ],
          rating: 5.0,
          reviewCount: 1,
          isActive: true,
          isFeatured: true,
        },
        variants: [
          {
            sku: sku || `SKU-${Date.now()}`,
            title: `${title} - ${packSize}`,
            flavor,
            packSize,
            weightGrams: 1000,
            mrp: Number(mrp),
            sellingPrice: Number(sellingPrice),
            discountPercent: Math.round(((mrp - sellingPrice) / mrp) * 100),
            images: [imageUrl],
            initialStock: Number(initialStock),
            isActive: true,
          },
        ],
      };

      await adminApi.post('/admin/products', payload);
      alert('Product created successfully with SKU and inventory stock master record.');
      setIsModalOpen(false);
      fetchCatalog();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Could not create product.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-admin-dark tracking-tight">Product Catalog Master</h1>
          <p className="text-xs text-admin-muted mt-1">Manage SKUs, variant pricing & formulation specifications</p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="admin-btn-primary gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Add New Formulation</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="admin-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th className="admin-table-th">Product Formulation</th>
                <th className="admin-table-th">Category</th>
                <th className="admin-table-th">Variants</th>
                <th className="admin-table-th">Price Range</th>
                <th className="admin-table-th">Rating</th>
                <th className="admin-table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {products.map((prod) => {
                const variants = prod.variants || [];
                const lowestPrice = variants.length > 0 ? Math.min(...variants.map((v: any) => v.sellingPrice)) : 0;
                const highestPrice = variants.length > 0 ? Math.max(...variants.map((v: any) => v.sellingPrice)) : 0;

                return (
                  <tr key={prod._id} className="hover:bg-slate-50 transition-colors">
                    <td className="admin-table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          <img
                            src={variants[0]?.images?.[0] || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=200&q=80'}
                            alt={prod.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <strong className="text-admin-dark text-sm block truncate max-w-sm">{prod.title}</strong>
                          <span className="text-[11px] text-admin-muted">/{prod.slug}</span>
                        </div>
                      </div>
                    </td>

                    <td className="admin-table-td font-medium text-admin-dark">
                      {prod.category?.name || 'Uncategorized'}
                    </td>

                    <td className="admin-table-td font-semibold text-admin-dark">
                      {variants.length} variant(s)
                    </td>

                    <td className="admin-table-td font-bold text-admin-dark">
                      {lowestPrice === highestPrice ? `₹${lowestPrice}` : `₹${lowestPrice} - ₹${highestPrice}`}
                    </td>

                    <td className="admin-table-td">
                      <div className="flex items-center gap-1 font-semibold text-admin-dark">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{prod.rating}</span>
                        <span className="text-admin-muted text-[10px]">({prod.reviewCount})</span>
                      </div>
                    </td>

                    <td className="admin-table-td">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 relative shadow-2xl border border-admin-border">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-admin-dark">Create New Product Formulation</h3>
              <p className="text-xs text-admin-muted">Configure product details, first variant and initial inventory</p>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-admin-dark block mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. AuraPure Mango Passion Plant Protein"
                    className="w-full px-3 py-2 rounded-lg border border-admin-border bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-admin-dark block mb-1">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-admin-border bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-admin-dark block mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-admin-border bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-admin-dark block mb-1">Subtitle / Key Claim</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. 25g Protein • Zero Sugar • Digestive Enzymes"
                    className="w-full px-3 py-2 rounded-lg border border-admin-border bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-admin-dark block mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed product story and benefits..."
                  className="w-full px-3 py-2 rounded-lg border border-admin-border bg-white"
                />
              </div>

              {/* Initial Variant Sub-form */}
              <div className="p-4 rounded-xl bg-slate-50 border border-admin-border space-y-3">
                <h4 className="font-bold text-admin-dark text-xs uppercase tracking-wider">Initial Variant & Pricing</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-admin-muted block mb-1">Flavor</label>
                    <input
                      type="text"
                      required
                      value={flavor}
                      onChange={(e) => setFlavor(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-admin-border bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-admin-muted block mb-1">Pack Size</label>
                    <input
                      type="text"
                      required
                      value={packSize}
                      onChange={(e) => setPackSize(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-admin-border bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-admin-muted block mb-1">MRP (₹)</label>
                    <input
                      type="number"
                      required
                      value={mrp}
                      onChange={(e) => setMrp(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-admin-border bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-admin-muted block mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-admin-border bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-admin-muted block mb-1">SKU *</label>
                    <input
                      type="text"
                      required
                      value={sku}
                      onChange={(e) => setSku(e.target.value.toUpperCase())}
                      placeholder="e.g. AP-MANGO-1KG"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-admin-border bg-white uppercase font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-admin-muted block mb-1">Initial Stock Units</label>
                    <input
                      type="number"
                      required
                      value={initialStock}
                      onChange={(e) => setInitialStock(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-admin-border bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  Save & Publish Formulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
