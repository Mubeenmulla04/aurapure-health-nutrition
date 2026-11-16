import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminUploadController {
  /**
   * Upload image endpoint supporting image data URLs or CDN mock
   */
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { image, filename } = req.body;

      if (!image) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'IMAGE_REQUIRED',
          message: 'Base64 image data or file payload is required.',
        });
        return;
      }

      // If already a valid HTTPS URL (e.g. Unsplash or Cloudinary), return it
      if (typeof image === 'string' && (image.startsWith('https://') || image.startsWith('http://'))) {
        ApiResponse.success({
          res,
          data: { url: image },
        });
        return;
      }

      // Return structured image URL (or base64 URI directly)
      const sanitizedUrl = typeof image === 'string' && image.startsWith('data:image') ? image : `https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80`;

      ApiResponse.success({
        res,
        data: {
          url: sanitizedUrl,
          filename: filename || 'uploaded_image.webp',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
