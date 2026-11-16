import { Request, Response, NextFunction } from 'express';
import { Product } from '../../models/product.model.js';
import { ProductVariant } from '../../models/productVariant.model.js';
import { Inventory } from '../../models/inventory.model.js';
import { Order } from '../../models/order.model.js';
import { AuditLog } from '../../models/auditLog.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminProductController {
  /**
   * Paginated list of products with search, category filtering, variants, and stock summaries
   */
  static async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
      const skip = (page - 1) * limit;

      const { search, categoryId, status, sort } = req.query;
      const query: any = {};

      if (categoryId && categoryId !== 'ALL') {
        query.categoryId = categoryId;
      }

      if (status === 'ACTIVE') query.isActive = true;
      if (status === 'INACTIVE') query.isActive = false;
      if (status === 'FEATURED') query.isFeatured = true;
      if (status === 'BEST_SELLER') query.isBestSeller = true;

      if (search) {
        const regex = new RegExp(String(search).trim(), 'i');
        query.$or = [{ title: regex }, { slug: regex }, { subtitle: regex }];
      }

      const total = await Product.countDocuments(query);
      const products = await Product.find(query)
        .populate('categoryId', 'name slug')
        .sort(sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Enrich products with their variants and aggregated available stock
      const enrichedProducts = await Promise.all(
        products.map(async (prod) => {
          const variants = await ProductVariant.find({ productId: prod._id }).lean();
          const variantIds = variants.map((v) => v._id);
          const inventoryDocs = await Inventory.find({ variantId: { $in: variantIds } });

          const totalStock = inventoryDocs.reduce((acc, curr) => acc + (curr.availableStock || 0), 0);
          const minPrice = variants.length > 0 ? Math.min(...variants.map((v) => v.sellingPrice)) : 0;
          const maxPrice = variants.length > 0 ? Math.max(...variants.map((v) => v.sellingPrice)) : 0;
          const primaryImage = variants[0]?.images?.[0] || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=600&q=80';

          return {
            ...prod,
            variantsCount: variants.length,
            variants,
            totalStock,
            priceRange: { min: minPrice, max: maxPrice },
            primaryImage,
          };
        })
      );

      ApiResponse.success({
        res,
        data: {
          products: enrichedProducts,
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
   * Get single product with full variants and inventory details
   */
  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id).populate('categoryId').lean();
      if (!product) {
        ApiResponse.error({ res, statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
        return;
      }

      const variants = await ProductVariant.find({ productId: id }).lean();
      const variantsWithStock = await Promise.all(
        variants.map(async (variant) => {
          const inventory = await Inventory.findOne({ variantId: variant._id }).lean();
          return {
            ...variant,
            inventory: inventory || { stockOnHand: 0, reservedStock: 0, availableStock: 0 },
          };
        })
      );

      ApiResponse.success({
        res,
        data: {
          product: {
            ...product,
            variants: variantsWithStock,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new product with variants and initial inventory
   */
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { product: prodData, variants } = req.body;

      if (!prodData?.title || !prodData?.categoryId || !prodData?.description) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Title, category, and description are required.',
        });
        return;
      }

      const generatedSlug = (prodData.slug || prodData.title)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const existing = await Product.findOne({ slug: generatedSlug });
      if (existing) {
        ApiResponse.error({
          res,
          statusCode: 409,
          code: 'SLUG_EXISTS',
          message: `Product slug '${generatedSlug}' already exists. Please choose a unique title or slug.`,
        });
        return;
      }

      const product = await Product.create({
        ...prodData,
        slug: generatedSlug,
      });

      // Create variants
      if (variants && Array.isArray(variants) && variants.length > 0) {
        for (const v of variants) {
          const discount = v.mrp > v.sellingPrice ? Math.round(((v.mrp - v.sellingPrice) / v.mrp) * 100) : 0;
          const variant = await ProductVariant.create({
            productId: product._id,
            sku: v.sku.toUpperCase().trim(),
            title: v.title || `${product.title} - ${v.flavor || 'Original'} (${v.packSize || '1kg'})`,
            flavor: v.flavor || 'Natural',
            packSize: v.packSize || '1kg',
            weightGrams: Number(v.weightGrams) || 1000,
            mrp: Number(v.mrp) || Number(v.sellingPrice),
            sellingPrice: Number(v.sellingPrice),
            discountPercent: discount,
            images: v.images || [],
            isActive: v.isActive !== undefined ? v.isActive : true,
          });

          const initialStock = Math.max(0, Number(v.initialStock) || 50);
          await Inventory.create({
            variantId: variant._id,
            sku: variant.sku,
            stockOnHand: initialStock,
            reservedStock: 0,
            availableStock: initialStock,
            lowStockThreshold: Number(v.lowStockThreshold) || 10,
          });
        }
      }

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'PRODUCT_CREATE',
        entity: 'PRODUCT',
        entityId: product._id.toString(),
        diff: { after: { title: product.title, slug: product.slug } },
      });

      ApiResponse.success({
        res,
        statusCode: 201,
        message: `Product '${product.title}' created successfully.`,
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update product and its variants
   */
  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { product: prodData, variants } = req.body;

      const product = await Product.findById(id);
      if (!product) {
        ApiResponse.error({ res, statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
        return;
      }

      const before = { title: product.title, slug: product.slug, isActive: product.isActive };
      Object.assign(product, prodData);
      await product.save();

      // Update or create variants
      if (variants && Array.isArray(variants)) {
        for (const v of variants) {
          const discount = v.mrp > v.sellingPrice ? Math.round(((v.mrp - v.sellingPrice) / v.mrp) * 100) : 0;

          if (v._id) {
            // Update existing variant
            await ProductVariant.findByIdAndUpdate(v._id, {
              sku: v.sku.toUpperCase().trim(),
              title: v.title,
              flavor: v.flavor,
              packSize: v.packSize,
              weightGrams: Number(v.weightGrams),
              mrp: Number(v.mrp),
              sellingPrice: Number(v.sellingPrice),
              discountPercent: discount,
              images: v.images || [],
              isActive: v.isActive !== undefined ? v.isActive : true,
            });
          } else {
            // Create new variant
            const newVar = await ProductVariant.create({
              productId: product._id,
              sku: v.sku.toUpperCase().trim(),
              title: v.title || `${product.title} - ${v.flavor || 'Original'}`,
              flavor: v.flavor || 'Natural',
              packSize: v.packSize || '1kg',
              weightGrams: Number(v.weightGrams) || 1000,
              mrp: Number(v.mrp) || Number(v.sellingPrice),
              sellingPrice: Number(v.sellingPrice),
              discountPercent: discount,
              images: v.images || [],
              isActive: true,
            });

            const initialStock = Math.max(0, Number(v.initialStock) || 50);
            await Inventory.create({
              variantId: newVar._id,
              sku: newVar.sku,
              stockOnHand: initialStock,
              reservedStock: 0,
              availableStock: initialStock,
              lowStockThreshold: 10,
            });
          }
        }
      }

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'PRODUCT_UPDATE',
        entity: 'PRODUCT',
        entityId: product._id.toString(),
        diff: { before, after: prodData },
      });

      ApiResponse.success({
        res,
        message: 'Product updated successfully.',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete or archive product
   */
  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      if (!product) {
        ApiResponse.error({ res, statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
        return;
      }

      // Check if product is in any active orders
      const orderCount = await Order.countDocuments({ 'items.productId': id });
      if (orderCount > 0) {
        // Soft delete / archive to maintain historical financial integrity
        product.isActive = false;
        await product.save();

        await AuditLog.create({
          userId: req.user!.userId as any,
          userName: req.user!.email,
          action: 'PRODUCT_ARCHIVE',
          entity: 'PRODUCT',
          entityId: id,
          diff: { reason: `Archived because it exists in ${orderCount} order histories.` },
        });

        ApiResponse.success({
          res,
          message: `Product '${product.title}' has historical orders, so it was deactivated/archived rather than hard-deleted.`,
        });
        return;
      }

      // Hard delete product, its variants and inventory
      const variants = await ProductVariant.find({ productId: id });
      const variantIds = variants.map((v) => v._id);
      await Inventory.deleteMany({ variantId: { $in: variantIds } });
      await ProductVariant.deleteMany({ productId: id });
      await Product.findByIdAndDelete(id);

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'PRODUCT_DELETE',
        entity: 'PRODUCT',
        entityId: id,
        diff: { before: { title: product.title, slug: product.slug } },
      });

      ApiResponse.success({
        res,
        message: `Product '${product.title}' permanently deleted.`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle product statuses (active, featured, best seller, new arrival)
   */
  static async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive, isFeatured, isBestSeller, isNewArrival } = req.body;

      const product = await Product.findById(id);
      if (!product) {
        ApiResponse.error({ res, statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
        return;
      }

      if (typeof isActive === 'boolean') product.isActive = isActive;
      if (typeof isFeatured === 'boolean') product.isFeatured = isFeatured;
      if (typeof isBestSeller === 'boolean') product.isBestSeller = isBestSeller;
      if (typeof isNewArrival === 'boolean') product.isNewArrival = isNewArrival;

      await product.save();

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'PRODUCT_STATUS_TOGGLE',
        entity: 'PRODUCT',
        entityId: id,
        diff: { after: { isActive, isFeatured, isBestSeller, isNewArrival } },
      });

      ApiResponse.success({
        res,
        message: 'Product status updated.',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate product as a draft
   */
  static async duplicateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const original = await Product.findById(id).lean();
      if (!original) {
        ApiResponse.error({ res, statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' });
        return;
      }

      const timestamp = Date.now().toString().slice(-4);
      const newTitle = `${original.title} (Copy)`;
      const newSlug = `${original.slug}-copy-${timestamp}`;

      const { _id, createdAt, updatedAt, ...rest } = original as any;
      const clonedProduct = await Product.create({
        ...rest,
        title: newTitle,
        slug: newSlug,
        isActive: false, // Start as draft
      });

      // Clone variants
      const variants = await ProductVariant.find({ productId: id }).lean();
      for (const v of variants) {
        const { _id: vId, createdAt: c, updatedAt: u, ...vRest } = v as any;
        const clonedVariant = await ProductVariant.create({
          ...vRest,
          productId: clonedProduct._id,
          sku: `${v.sku}-COPY-${timestamp}`,
          title: `${v.title} (Copy)`,
        });

        await Inventory.create({
          variantId: clonedVariant._id,
          sku: clonedVariant.sku,
          stockOnHand: 25,
          reservedStock: 0,
          availableStock: 25,
          lowStockThreshold: 10,
        });
      }

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: 'PRODUCT_DUPLICATE',
        entity: 'PRODUCT',
        entityId: clonedProduct._id.toString(),
        diff: { sourceId: id, newId: clonedProduct._id.toString() },
      });

      ApiResponse.success({
        res,
        statusCode: 201,
        message: `Product duplicated as draft '${clonedProduct.title}'.`,
        data: { product: clonedProduct },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk action on multiple products
   */
  static async bulkAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, productIds } = req.body;

      if (!action || !Array.isArray(productIds) || productIds.length === 0) {
        ApiResponse.error({
          res,
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Action and productIds array are required.',
        });
        return;
      }

      if (action === 'activate') {
        await Product.updateMany({ _id: { $in: productIds } }, { isActive: true });
      } else if (action === 'deactivate') {
        await Product.updateMany({ _id: { $in: productIds } }, { isActive: false });
      } else if (action === 'delete') {
        // Only delete products that have no orders
        for (const pid of productIds) {
          const hasOrders = await Order.countDocuments({ 'items.productId': pid });
          if (hasOrders > 0) {
            await Product.findByIdAndUpdate(pid, { isActive: false });
          } else {
            const variants = await ProductVariant.find({ productId: pid });
            const vIds = variants.map((v) => v._id);
            await Inventory.deleteMany({ variantId: { $in: vIds } });
            await ProductVariant.deleteMany({ productId: pid });
            await Product.findByIdAndDelete(pid);
          }
        }
      }

      await AuditLog.create({
        userId: req.user!.userId as any,
        userName: req.user!.email,
        action: `PRODUCT_BULK_${action.toUpperCase()}`,
        entity: 'PRODUCT',
        entityId: 'BULK',
        diff: { action, count: productIds.length, productIds },
      });

      ApiResponse.success({
        res,
        message: `Bulk ${action} executed on ${productIds.length} products.`,
      });
    } catch (error) {
      next(error);
    }
  }
}
