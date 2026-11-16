import { Request, Response, NextFunction } from 'express';
import { Category } from '../../models/category.model.js';
import { Product } from '../../models/product.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminCategoryController {
  /**
   * List all categories with product counts and hierarchical subcategories
   */
  static async listCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();

      // Compute product counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (cat) => {
          const productCount = await Product.countDocuments({ categoryId: cat._id });
          return {
            ...cat,
            productCount,
          };
        })
      );

      ApiResponse.success({
        res,
        data: { categories: categoriesWithCounts },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new category
   */
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, slug, description, image, bannerImage, badge, parentId, isActive, sortOrder } = req.body;

      if (!name) {
        ApiResponse.error({ res, statusCode: 400, code: 'VALIDATION_ERROR', message: 'Category name is required.' });
        return;
      }

      const generatedSlug = (slug || name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const existing = await Category.findOne({ slug: generatedSlug });
      if (existing) {
        ApiResponse.error({
          res,
          statusCode: 409,
          code: 'SLUG_EXISTS',
          message: `A category with slug '${generatedSlug}' already exists.`,
        });
        return;
      }

      const category = await Category.create({
        name: name.trim(),
        slug: generatedSlug,
        description: description?.trim() || '',
        image: image?.trim(),
        bannerImage: bannerImage?.trim(),
        badge: badge?.trim(),
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      });

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'CATEGORY_CREATE',
        entity: 'CATEGORY',
        entityId: category._id.toString(),
        diff: { after: { name: category.name, slug: category.slug } },
      });

      ApiResponse.success({
        res,
        statusCode: 201,
        message: `Category '${category.name}' created successfully.`,
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update existing category
   */
  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const category = await Category.findById(id);
      if (!category) {
        ApiResponse.error({ res, statusCode: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found.' });
        return;
      }

      const before = { name: category.name, slug: category.slug, isActive: category.isActive };

      if (updates.name) category.name = updates.name.trim();
      if (updates.slug) {
        category.slug = updates.slug
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }
      if (updates.description !== undefined) category.description = updates.description.trim();
      if (updates.image !== undefined) category.image = updates.image?.trim();
      if (updates.bannerImage !== undefined) category.bannerImage = updates.bannerImage?.trim();
      if (updates.badge !== undefined) category.badge = updates.badge?.trim();
      if (updates.parentId !== undefined) category.parentId = updates.parentId || null;
      if (typeof updates.isActive === 'boolean') category.isActive = updates.isActive;
      if (updates.sortOrder !== undefined) category.sortOrder = Number(updates.sortOrder);

      await category.save();

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'CATEGORY_UPDATE',
        entity: 'CATEGORY',
        entityId: category._id.toString(),
        diff: { before, after: updates },
      });

      ApiResponse.success({
        res,
        message: 'Category updated successfully.',
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Safe delete category (prevent delete if products belong to it)
   */
  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const category = await Category.findById(id);
      if (!category) {
        ApiResponse.error({ res, statusCode: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found.' });
        return;
      }

      const linkedProducts = await Product.countDocuments({ categoryId: id });
      if (linkedProducts > 0) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'CATEGORY_HAS_PRODUCTS',
          message: `Cannot delete category '${category.name}' because ${linkedProducts} product(s) are linked to it. Please reassign or delete those products first.`,
        });
        return;
      }

      await Category.findByIdAndDelete(id);

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'CATEGORY_DELETE',
        entity: 'CATEGORY',
        entityId: id,
        diff: { before: { name: category.name, slug: category.slug } },
      });

      ApiResponse.success({
        res,
        message: `Category '${category.name}' deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }
}
