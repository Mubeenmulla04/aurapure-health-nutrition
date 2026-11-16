import { Request, Response, NextFunction } from 'express';
import { Slide } from '../../models/slide.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class SlideController {
  /**
   * Public: GET /api/v1/slides/active
   * Returns currently active and scheduled promotional slides for storefront
   */
  static async getActiveSlides(_req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const query: any = {
        isActive: true,
        $and: [
          { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
          { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] },
        ],
      };

      const slides = await Slide.find(query).sort({ displayOrder: 1, createdAt: -1 }).lean();

      ApiResponse.success({
        res,
        data: { slides },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: GET /api/v1/admin/slides
   * Lists all slides for management
   */
  static async listAdminSlides(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const { search } = req.query;
      const query: any = {};
      if (search) {
        const regex = new RegExp(String(search).trim(), 'i');
        query.$or = [{ title: regex }, { heading: regex }, { subtitle: regex }];
      }

      const total = await Slide.countDocuments(query);
      const slides = await Slide.find(query)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      ApiResponse.success({
        res,
        data: {
          slides,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: GET /api/v1/admin/slides/:id
   */
  static async getSlideById(req: Request, res: Response, next: NextFunction) {
    try {
      const slide = await Slide.findById(req.params.id);
      if (!slide) {
        ApiResponse.error({ res, statusCode: 404, code: 'SLIDE_NOT_FOUND', message: 'Slide not found' });
        return;
      }
      ApiResponse.success({ res, data: { slide } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: POST /api/v1/admin/slides
   */
  static async createSlide(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        title,
        heading,
        subtitle,
        desktopImage,
        mobileImage,
        imageAltText,
        ctaText,
        ctaLink,
        badgeText,
        displayOrder,
        isActive = true,
        startDate,
        endDate,
      } = req.body;

      if (!title || !heading || !desktopImage || !mobileImage) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Title, Heading, Desktop Image, and Mobile Image are required.',
        });
        return;
      }

      // Calculate next display order if not specified
      let order = Number(displayOrder);
      if (isNaN(order)) {
        const highest = await Slide.findOne().sort({ displayOrder: -1 }).select('displayOrder');
        order = highest ? highest.displayOrder + 1 : 0;
      }

      const slide = await Slide.create({
        title: title.trim(),
        heading: heading.trim(),
        subtitle: subtitle?.trim() || '',
        desktopImage: desktopImage.trim(),
        mobileImage: mobileImage.trim(),
        imageAltText: imageAltText?.trim() || heading.trim(),
        ctaText: ctaText?.trim() || 'Shop Now',
        ctaLink: ctaLink?.trim() || '/collections',
        badgeText: badgeText?.trim(),
        displayOrder: order,
        isActive: Boolean(isActive),
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      await AuditLog.create({
        userId: req.user?.userId as any,
        userName: req.user?.mobileNumber || req.user?.email || 'Admin',
        action: 'SLIDE_CREATE',
        entity: 'SLIDESHOW',
        entityId: slide._id.toString(),
        diff: { after: slide },
      });

      ApiResponse.success({
        res,
        statusCode: 201,
        message: 'Promotional slide created successfully.',
        data: { slide },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: PUT /api/v1/admin/slides/:id
   */
  static async updateSlide(req: Request, res: Response, next: NextFunction) {
    try {
      const slide = await Slide.findById(req.params.id);
      if (!slide) {
        ApiResponse.error({ res, statusCode: 404, code: 'SLIDE_NOT_FOUND', message: 'Slide not found' });
        return;
      }

      const before = slide.toObject();
      const updates = req.body;

      if (updates.title) slide.title = updates.title.trim();
      if (updates.heading) slide.heading = updates.heading.trim();
      if (updates.subtitle !== undefined) slide.subtitle = updates.subtitle.trim();
      if (updates.desktopImage) slide.desktopImage = updates.desktopImage.trim();
      if (updates.mobileImage) slide.mobileImage = updates.mobileImage.trim();
      if (updates.imageAltText !== undefined) slide.imageAltText = updates.imageAltText.trim();
      if (updates.ctaText !== undefined) slide.ctaText = updates.ctaText.trim();
      if (updates.ctaLink !== undefined) slide.ctaLink = updates.ctaLink.trim();
      if (updates.badgeText !== undefined) slide.badgeText = updates.badgeText.trim();
      if (updates.displayOrder !== undefined) slide.displayOrder = Number(updates.displayOrder);
      if (updates.isActive !== undefined) slide.isActive = Boolean(updates.isActive);
      if (updates.startDate !== undefined) slide.startDate = updates.startDate ? new Date(updates.startDate) : undefined;
      if (updates.endDate !== undefined) slide.endDate = updates.endDate ? new Date(updates.endDate) : undefined;

      await slide.save();

      await AuditLog.create({
        userId: req.user?.userId as any,
        userName: req.user?.mobileNumber || req.user?.email || 'Admin',
        action: 'SLIDE_UPDATE',
        entity: 'SLIDESHOW',
        entityId: slide._id.toString(),
        diff: { before, after: slide },
      });

      ApiResponse.success({
        res,
        message: 'Slide updated successfully.',
        data: { slide },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: DELETE /api/v1/admin/slides/:id
   */
  static async deleteSlide(req: Request, res: Response, next: NextFunction) {
    try {
      const slide = await Slide.findByIdAndDelete(req.params.id);
      if (!slide) {
        ApiResponse.error({ res, statusCode: 404, code: 'SLIDE_NOT_FOUND', message: 'Slide not found' });
        return;
      }

      await AuditLog.create({
        userId: req.user?.userId as any,
        userName: req.user?.mobileNumber || req.user?.email || 'Admin',
        action: 'SLIDE_DELETE',
        entity: 'SLIDESHOW',
        entityId: slide._id.toString(),
        diff: { before: slide },
      });

      ApiResponse.success({
        res,
        message: 'Slide deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: PATCH /api/v1/admin/slides/:id/status
   */
  static async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const slide = await Slide.findById(req.params.id);
      if (!slide) {
        ApiResponse.error({ res, statusCode: 404, code: 'SLIDE_NOT_FOUND', message: 'Slide not found' });
        return;
      }

      slide.isActive = !slide.isActive;
      await slide.save();

      ApiResponse.success({
        res,
        message: `Slide is now ${slide.isActive ? 'Active' : 'Draft/Hidden'}.`,
        data: { slide },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: PATCH /api/v1/admin/slides/reorder
   * Accepts: { items: [ { id: string, displayOrder: number } ] }
   */
  static async reorderSlides(req: Request, res: Response, next: NextFunction) {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Expected array of items: [{ id, displayOrder }]',
        });
        return;
      }

      const bulkOps = items.map((item) => ({
        updateOne: {
          filter: { _id: item.id },
          update: { $set: { displayOrder: Number(item.displayOrder) } },
        },
      }));

      await Slide.bulkWrite(bulkOps);

      ApiResponse.success({
        res,
        message: 'Slides reordered successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
