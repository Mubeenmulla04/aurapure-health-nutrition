import { Request, Response, NextFunction } from 'express';
import { Review } from '../../models/review.model.js';
import { Banner } from '../../models/banner.model.js';
import { FAQ } from '../../models/faq.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminCmsController {
  // ==================== REVIEWS ====================
  static async listReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const total = await Review.countDocuments();
      const reviews = await Review.find()
        .populate('productId', 'title slug images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      ApiResponse.success({
        res,
        data: {
          reviews,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleReviewStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isApproved } = req.body;

      const review = await Review.findById(id);
      if (!review) {
        ApiResponse.error({ res, statusCode: 404, code: 'REVIEW_NOT_FOUND', message: 'Review not found.' });
        return;
      }

      review.isApproved = typeof isApproved === 'boolean' ? isApproved : !review.isApproved;
      await review.save();

      ApiResponse.success({
        res,
        message: `Review ${review.isApproved ? 'approved' : 'hidden'}.`,
        data: { review },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await Review.findByIdAndDelete(id);
      ApiResponse.success({ res, message: 'Review deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }

  // ==================== BANNERS ====================
  static async listBanners(_req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 });
      ApiResponse.success({ res, data: { banners } });
    } catch (error) {
      next(error);
    }
  }

  static async createBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await Banner.create(req.body);
      ApiResponse.success({ res, statusCode: 201, message: 'Banner created.', data: { banner } });
    } catch (error) {
      next(error);
    }
  }

  static async updateBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
      ApiResponse.success({ res, message: 'Banner updated.', data: { banner } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteBanner(req: Request, res: Response, next: NextFunction) {
    try {
      await Banner.findByIdAndDelete(req.params.id);
      ApiResponse.success({ res, message: 'Banner deleted.' });
    } catch (error) {
      next(error);
    }
  }

  // ==================== FAQS ====================
  static async listFaqs(_req: Request, res: Response, next: NextFunction) {
    try {
      const faqs = await FAQ.find().sort({ sortOrder: 1 });
      ApiResponse.success({ res, data: { faqs } });
    } catch (error) {
      next(error);
    }
  }

  static async createFaq(req: Request, res: Response, next: NextFunction) {
    try {
      const faq = await FAQ.create(req.body);
      ApiResponse.success({ res, statusCode: 201, message: 'FAQ created.', data: { faq } });
    } catch (error) {
      next(error);
    }
  }

  static async updateFaq(req: Request, res: Response, next: NextFunction) {
    try {
      const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
      ApiResponse.success({ res, message: 'FAQ updated.', data: { faq } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteFaq(req: Request, res: Response, next: NextFunction) {
    try {
      await FAQ.findByIdAndDelete(req.params.id);
      ApiResponse.success({ res, message: 'FAQ deleted.' });
    } catch (error) {
      next(error);
    }
  }
}
