import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import { cmsApi, FaqData } from '../services/adminApi';

export const FaqsPage: React.FC = () => {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FaqData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqData | null>(null);

  // Delete
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FaqData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<FaqData>>({
    question: '',
    answer: '',
    category: 'NUTRITION',
    sortOrder: 1,
    isActive: true,
  });

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const data = await cmsApi.listFaqs();
      setFaqs(data);
    } catch {
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleOpenAdd = () => {
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      category: 'NUTRITION',
      sortOrder: faqs.length + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: FaqData) => {
    setEditingFaq(f);
    setFormData(f);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question || !formData.answer) {
      toast.warning('Question and answer are required.');
      return;
    }

    try {
      setActionLoading(true);
      if (editingFaq) {
        const res = await cmsApi.updateFaq(editingFaq._id, formData);
        toast.success(res.message);
      } else {
        const res = await cmsApi.createFaq(formData);
        toast.success(res.message);
      }
      setIsModalOpen(false);
      fetchFaqs();
    } catch {
      toast.error('Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!faqToDelete) return;
    try {
      setActionLoading(true);
      const res = await cmsApi.deleteFaq(faqToDelete._id);
      toast.success(res.message);
      setIsDeleteOpen(false);
      setFaqToDelete(null);
      fetchFaqs();
    } catch {
      toast.error('Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<FaqData>[] = [
    {
      key: 'question',
      header: 'Frequently Asked Question',
      sortable: true,
      render: (f: FaqData) => (
        <div>
          <div className="font-semibold text-xs text-slate-900">{f.question}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{f.answer}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (f: FaqData) => (
        <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-0.5 rounded text-slate-700">
          {f.category}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (f: FaqData) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
            f.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {f.isActive ? 'Active' : 'Hidden'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (f: FaqData) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(f)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setFaqToDelete(f);
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Frequently Asked Questions (FAQs)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Publish nutritional answers, shipping information, and dosage instructions for customer self-service.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="admin-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Add New FAQ</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={faqs}
        keyExtractor={(item) => item._id}
        isLoading={loading}
        emptyMessage="No FAQs registered."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="admin-input text-xs"
            >
              <option value="NUTRITION">Nutrition & Formulation</option>
              <option value="INGREDIENTS">Ingredients & Purity</option>
              <option value="ORDERS">Orders & Payments</option>
              <option value="SHIPPING">Shipping & Delivery</option>
              <option value="GENERAL">General Brand Inquiries</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Question *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Is AuraPure protein suitable for pregnant women?"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Answer *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Detailed clear response..."
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              className="admin-input resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="faqActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="faqActive" className="text-sm font-medium text-slate-700 cursor-pointer">
              Active in Storefront FAQ Section
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary text-xs" disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save FAQ'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete FAQ"
        message="Are you sure you want to delete this FAQ?"
        confirmLabel="Delete FAQ"
        isLoading={actionLoading}
      />
    </div>
  );
};
export default FaqsPage;
