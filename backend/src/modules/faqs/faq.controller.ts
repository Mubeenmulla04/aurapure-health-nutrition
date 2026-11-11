import { Request, Response, NextFunction } from 'express';
import { FAQ } from '../../models/faq.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class FAQController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const faqs = await FAQ.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
      ApiResponse.success({ res, data: { faqs } });
    } catch (error) {
      next(error);
    }
  }
}
