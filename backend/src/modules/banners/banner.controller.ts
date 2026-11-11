import { Request, Response, NextFunction } from 'express';
import { Banner } from '../../models/banner.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class BannerController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { placement } = req.query;
      const query: any = { isActive: true };
      if (placement) {
        query.placement = placement;
      }
      const banners = await Banner.find(query).sort({ sortOrder: 1 });
      ApiResponse.success({ res, data: { banners } });
    } catch (error) {
      next(error);
    }
  }
}
