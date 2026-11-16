import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronUp,
  ChevronDown,
  Upload,
  Calendar,
  ExternalLink,
  Sparkles,
  Smartphone,
  Monitor,
  Search,
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import { StatCard } from '../components/common/StatCard';
import { slidesApi, uploadApi, SlideItemData } from '../services/adminApi';

export const SlideshowPage: React.FC = () => {
  const { toast } = useToast();
  const [slides, setSlides] = useState<SlideItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SlideItemData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSlide, setPreviewSlide] = useState<SlideItemData | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Delete
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<SlideItemData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<SlideItemData>>({
    title: '',
    heading: '',
    subtitle: '',
    badgeText: '',
    desktopImage: '',
    mobileImage: '',
    imageAltText: '',
    ctaText: 'Shop Now',
    ctaLink: '/collections/plant-protein-powder',
    displayOrder: 0,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const res = await slidesApi.list();
      setSlides(res.slides || []);
    } catch {
      toast.error('Failed to load homepage slides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleOpenAdd = () => {
    setEditingSlide(null);
    setFormData({
      title: '',
      heading: '',
      subtitle: '',
      badgeText: 'Clean Nutrition • 100% Certified',
      desktopImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1920&q=80',
      mobileImage: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80',
      imageAltText: 'AuraPure Botanical Wellness',
      ctaText: 'Shop Collection',
      ctaLink: '/collections/plant-protein-powder',
      displayOrder: slides.length,
      isActive: true,
      startDate: '',
      endDate: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slide: SlideItemData) => {
    setEditingSlide(slide);
    setFormData({
      ...slide,
      startDate: slide.startDate ? new Date(slide.startDate).toISOString().slice(0, 16) : '',
      endDate: slide.endDate ? new Date(slide.endDate).toISOString().slice(0, 16) : '',
    });
    setIsModalOpen(true);
  };

  const handleOpenPreview = (slide: SlideItemData) => {
    setPreviewSlide(slide);
    setPreviewDevice('desktop');
    setIsPreviewOpen(true);
  };

  // Image file upload via Cloudinary
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        if (type === 'desktop') setUploadingDesktop(true);
        else setUploadingMobile(true);

        const base64 = reader.result as string;
        const uploadedUrl = await uploadApi.uploadImage(base64, file.name);

        if (type === 'desktop') {
          setFormData((prev) => ({ ...prev, desktopImage: uploadedUrl }));
        } else {
          setFormData((prev) => ({ ...prev, mobileImage: uploadedUrl }));
        }
        toast.success(`${type === 'desktop' ? 'Desktop' : 'Mobile'} image uploaded to Cloudinary!`);
      } catch {
        toast.error('Image upload failed');
      } finally {
        if (type === 'desktop') setUploadingDesktop(false);
        else setUploadingMobile(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.heading?.trim()) {
      toast.warning('Title and Heading are required.');
      return;
    }
    if (!formData.desktopImage?.trim() || !formData.mobileImage?.trim()) {
      toast.warning('Both desktop and mobile images are required.');
      return;
    }

    try {
      setActionLoading(true);
      const payload: Partial<SlideItemData> = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };

      if (editingSlide) {
        const res = await slidesApi.update(editingSlide._id, payload);
        toast.success(res.message || 'Slide updated successfully');
      } else {
        const res = await slidesApi.create(payload);
        toast.success(res.message || 'Slide created successfully');
      }
      setIsModalOpen(false);
      fetchSlides();
    } catch {
      toast.error('Failed to save slide');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (slide: SlideItemData) => {
    try {
      const res = await slidesApi.toggleStatus(slide._id);
      toast.success(res.message);
      setSlides((prev) =>
        prev.map((s) => (s._id === slide._id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!slideToDelete) return;
    try {
      setActionLoading(true);
      const res = await slidesApi.delete(slideToDelete._id);
      toast.success(res.message || 'Slide deleted');
      setIsDeleteOpen(false);
      setSlideToDelete(null);
      fetchSlides();
    } catch {
      toast.error('Failed to delete slide');
    } finally {
      setActionLoading(false);
    }
  };

  // Up/Down Reorder
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    // Recalculate order indices
    const updatedItems = newSlides.map((s, idx) => ({
      id: s._id,
      displayOrder: idx,
    }));

    setSlides(newSlides.map((s, idx) => ({ ...s, displayOrder: idx })));

    try {
      await slidesApi.reorder(updatedItems);
      toast.success('Slide order updated');
    } catch {
      toast.error('Failed to save new slide order');
      fetchSlides();
    }
  };

  // KPIs
  const totalSlides = slides.length;
  const activeSlides = slides.filter((s) => s.isActive).length;
  const draftSlides = slides.filter((s) => !s.isActive).length;
  const now = new Date();
  const scheduledSlides = slides.filter(
    (s) => (s.startDate && new Date(s.startDate) > now) || (s.endDate && new Date(s.endDate) > now)
  ).length;

  // Filtered Slides
  const filteredSlides = slides.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subtitle?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return s.isActive;
    if (statusFilter === 'draft') return !s.isActive;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-teal-700" />
            <span>Homepage Hero Slideshow</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage, reorder, preview and schedule promotional carousel slides displayed directly beneath the main navbar.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="admin-btn-primary flex items-center justify-center gap-2 w-full sm:w-auto text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Slide</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Slides" value={totalSlides} icon={SlidersHorizontal} iconColor="text-teal-700 bg-teal-50 border-teal-200" />
        <StatCard
          title="Active Slides"
          value={activeSlides}
          icon={CheckCircle2}
          iconColor="text-emerald-700 bg-emerald-50 border-emerald-200"
          trend={{ value: 100, isPositive: true }}
        />
        <StatCard
          title="Campaign Scheduled"
          value={scheduledSlides}
          icon={Calendar}
          iconColor="text-amber-700 bg-amber-50 border-amber-200"
        />
        <StatCard
          title="Draft / Inactive"
          value={draftSlides}
          icon={XCircle}
          iconColor="text-slate-500 bg-slate-100 border-slate-200"
        />
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search slides by title, heading, copy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {(['all', 'active', 'draft'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === filter
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Slides Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading slides catalog...</div>
        ) : filteredSlides.length === 0 ? (
          <div className="p-12 text-center">
            <SlidersHorizontal className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-medium text-xs">No slides found</p>
            <p className="text-slate-400 text-xs mt-1">
              {searchQuery ? 'Try adjusting your search criteria' : 'Click "Add New Slide" to create your first carousel slide.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Order</th>
                  <th className="py-3 px-4 w-44">Preview</th>
                  <th className="py-3 px-4">Slide Content</th>
                  <th className="py-3 px-4">CTA & Destination</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSlides.map((slide, index) => {
                  const hasSchedule = slide.startDate || slide.endDate;
                  const isExpired = slide.endDate && new Date(slide.endDate) < now;
                  const isUpcoming = slide.startDate && new Date(slide.startDate) > now;

                  return (
                    <tr key={slide._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order Controls */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            disabled={index === 0}
                            onClick={() => handleMoveOrder(index, 'up')}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <span className="font-mono text-xs font-bold text-slate-600">
                            #{slide.displayOrder + 1}
                          </span>
                          <button
                            disabled={index === filteredSlides.length - 1}
                            onClick={() => handleMoveOrder(index, 'down')}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Visual Thumbnails */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div className="relative aspect-[16/9] w-36 rounded-md overflow-hidden bg-slate-100 border border-slate-200 group">
                            <img
                              src={slide.desktopImage}
                              alt={slide.imageAltText || slide.title}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] font-mono text-white px-1 py-0.5 rounded">
                              Desktop
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Smartphone className="w-3 h-3 text-slate-400" />
                            <span>Mobile Asset Linked</span>
                          </div>
                        </div>
                      </td>

                      {/* Content */}
                      <td className="py-4 px-4 max-w-sm">
                        <div className="space-y-1">
                          {slide.badgeText && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                              <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                              {slide.badgeText}
                            </span>
                          )}
                          <p className="font-semibold text-slate-900 text-xs line-clamp-1">{slide.heading}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2">{slide.subtitle || slide.title}</p>
                        </div>
                      </td>

                      {/* CTA */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700 rounded">
                            {slide.ctaText}
                          </span>
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px] font-mono">
                            {slide.ctaLink}
                          </p>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-4 px-4 text-xs">
                        {hasSchedule ? (
                          <div className="space-y-1">
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                                <Calendar className="w-3 h-3 text-rose-500" /> Expired
                              </span>
                            ) : isUpcoming ? (
                              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                                <Calendar className="w-3 h-3 text-amber-500" /> Upcoming
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                                <Calendar className="w-3 h-3 text-emerald-500" /> Active Campaign
                              </span>
                            )}
                            {slide.endDate && (
                              <p className="text-[10px] text-slate-400">
                                Until: {new Date(slide.endDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Always Running</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(slide)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                            slide.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {slide.isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              Draft
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenPreview(slide)}
                            className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                            title="Live Storefront Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(slide)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Edit Slide"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSlideToDelete(slide);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Slide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT SLIDE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlide ? 'Edit Promotional Slide' : 'Create New Promotional Slide'}
        subtitle="Manage hero slide visuals, headlines, CTA targets and campaign scheduling."
        maxWidth="3xl"
      >
        <form onSubmit={handleSave} className="space-y-5 text-sm">
          {/* Internal Title & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Slide Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Clean Plant Protein Launch"
                className="admin-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Promotional Badge Pill (Optional)
              </label>
              <input
                type="text"
                value={formData.badgeText || ''}
                onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                placeholder="e.g. Zero Bloat Guarantee • 25g Pure Protein"
                className="admin-input"
              />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hero Headline (H1) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.heading || ''}
              onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
              placeholder="e.g. Pure Plant Power. Zero Compromise."
              className="admin-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subtitle / Supporting Copy
            </label>
            <textarea
              rows={2}
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="e.g. Cold-pressed organic plant protein with digestive enzymes & Ayurvedic adaptogens..."
              className="admin-input resize-none"
            />
          </div>

          {/* CTA Button & Target Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Call to Action Text <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.ctaText || ''}
                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                placeholder="e.g. Shop Clean Proteins"
                className="admin-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target URL / Route <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.ctaLink || ''}
                onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                placeholder="e.g. /collections/plant-protein-powder"
                className="admin-input font-mono"
              />
            </div>
          </div>

          {/* Dual Imagery (Desktop & Mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            {/* Desktop Banner */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-blue-600" />
                  <span>Desktop Banner (16:9 / 1920x800)</span>
                </label>
                <label className="cursor-pointer text-[11px] font-semibold text-teal-700 hover:underline inline-flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>{uploadingDesktop ? 'Uploading...' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingDesktop}
                    onChange={(e) => handleFileUpload(e, 'desktop')}
                  />
                </label>
              </div>
              <input
                type="text"
                required
                value={formData.desktopImage || ''}
                onChange={(e) => setFormData({ ...formData, desktopImage: e.target.value })}
                placeholder="https://... or click Upload Image"
                className="admin-input font-mono text-xs"
              />
              {formData.desktopImage && (
                <div className="aspect-[16/9] w-full rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={formData.desktopImage}
                    alt="Desktop preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Mobile Banner */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mobile Banner (4:5 / 800x1000)</span>
                </label>
                <label className="cursor-pointer text-[11px] font-semibold text-teal-700 hover:underline inline-flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>{uploadingMobile ? 'Uploading...' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingMobile}
                    onChange={(e) => handleFileUpload(e, 'mobile')}
                  />
                </label>
              </div>
              <input
                type="text"
                required
                value={formData.mobileImage || ''}
                onChange={(e) => setFormData({ ...formData, mobileImage: e.target.value })}
                placeholder="https://... or click Upload Image"
                className="admin-input font-mono text-xs"
              />
              {formData.mobileImage && (
                <div className="aspect-[4/3] w-full rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={formData.mobileImage}
                    alt="Mobile preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Alt text & Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Image Alt Text (Accessibility & SEO)
              </label>
              <input
                type="text"
                value={formData.imageAltText || ''}
                onChange={(e) => setFormData({ ...formData, imageAltText: e.target.value })}
                placeholder="e.g. AuraPure Organic Belgian Chocolate Plant Protein"
                className="admin-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Order Index
              </label>
              <input
                type="number"
                min={0}
                value={formData.displayOrder ?? 0}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                className="admin-input"
              />
            </div>
          </div>

          {/* Scheduling Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campaign Start Date & Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="admin-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campaign End Date & Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="admin-input text-xs"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActiveSlide"
              checked={formData.isActive ?? true}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            <label htmlFor="isActiveSlide" className="text-xs font-medium text-slate-700 cursor-pointer">
              Publish slide immediately to the storefront carousel
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="admin-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="admin-btn-primary text-xs"
            >
              {actionLoading ? 'Saving...' : editingSlide ? 'Update Slide' : 'Create Slide'}
            </button>
          </div>
        </form>
      </Modal>

      {/* LIVE STOREFRONT SIMULATION PREVIEW MODAL */}
      {previewSlide && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Storefront Live Simulation Preview"
          subtitle={`Simulating exact responsive visual presentation for "${previewSlide.title}"`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            {/* Device Switcher */}
            <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-lg max-w-xs mx-auto border border-slate-200">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition ${
                  previewDevice === 'desktop'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop (16:9)</span>
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition ${
                  previewDevice === 'mobile'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile (4:5)</span>
              </button>
            </div>

            {/* Desktop Simulation Frame */}
            {previewDevice === 'desktop' && (
              <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl relative aspect-[21/9] sm:aspect-[16/7]">
                <img
                  src={previewSlide.desktopImage}
                  alt={previewSlide.imageAltText}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
                <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-center max-w-xl text-white space-y-4">
                  {previewSlide.badgeText && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold w-fit">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{previewSlide.badgeText}</span>
                    </div>
                  )}
                  <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white leading-tight">
                    {previewSlide.heading}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 line-clamp-2">
                    {previewSlide.subtitle}
                  </p>
                  <div>
                    <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-lg">
                      {previewSlide.ctaText}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Simulation Frame */}
            {previewDevice === 'mobile' && (
              <div className="max-w-xs mx-auto rounded-3xl overflow-hidden border-4 border-slate-700 bg-slate-950 shadow-2xl relative aspect-[4/5]">
                <img
                  src={previewSlide.mobileImage}
                  alt={previewSlide.imageAltText}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-0 p-5 flex flex-col justify-end text-white space-y-2.5">
                  {previewSlide.badgeText && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-semibold text-white w-fit">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{previewSlide.badgeText}</span>
                    </div>
                  )}
                  <h3 className="text-lg font-serif font-bold text-white leading-snug">
                    {previewSlide.heading}
                  </h3>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    {previewSlide.subtitle}
                  </p>
                  <span className="inline-flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow">
                    {previewSlide.ctaText}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Homepage Slide"
        message={`Are you sure you want to permanently remove "${slideToDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete Slide"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
};
