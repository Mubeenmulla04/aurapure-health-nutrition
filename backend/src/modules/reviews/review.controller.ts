import { Request, Response, NextFunction } from 'express';
import { Review } from '../../models/review.model.js';
import { Product } from '../../models/product.model.js';
import { Order } from '../../models/order.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class ReviewController {
  static async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const reviews = await Review.find({ productId, isApproved: true }).sort({ createdAt: -1 });

      const total = reviews.length;
      const averageRating =
        total > 0
          ? Number((reviews.reduce((acc, curr) => acc + curr.rating, 0) / total).toFixed(1))
          : 5.0;

      const breakdown = {
        5: reviews.filter((r) => r.rating === 5).length,
        4: reviews.filter((r) => r.rating === 4).length,
        3: reviews.filter((r) => r.rating === 3).length,
        2: reviews.filter((r) => r.rating === 2).length,
        1: reviews.filter((r) => r.rating === 1).length,
      };

      ApiResponse.success({
        res,
        data: {
          reviews,
          total,
          averageRating,
          breakdown,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async submitReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, rating, title, comment, userName } = req.body;
      const userId = req.user?.userId;

      // Check if user has purchased this product
      let isVerified = false;
      if (userId) {
        const orderCount = await Order.countDocuments({
          userId,
          paymentStatus: 'PAID',
          'items.productId': productId,
        });
        isVerified = orderCount > 0;
      }

      const review = await Review.create({
        productId,
        userId,
        userName: userName || (req.user?.email ? req.user.email.split('@')[0] : 'AuraPure Member'),
        rating: Math.min(5, Math.max(1, Number(rating))),
        title,
        comment,
        verifiedPurchase: isVerified,
        isApproved: true,
      });

      // Recalculate product aggregate rating
      const allReviews = await Review.find({ productId, isApproved: true });
      const avg = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;
      await Product.findByIdAndUpdate(productId, {
        $set: { rating: Number(avg.toFixed(1)), reviewCount: allReviews.length },
      });

      ApiResponse.success({
        res,
        statusCode: 201,
        message: 'Thank you! Your review has been submitted.',
        data: { review },
      });
    } catch (error) {
      next(error);
    }
  }
}
