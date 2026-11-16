import mongoose from 'mongoose';
import { Product, IProduct } from '../../models/product.model.js';
import { ProductVariant } from '../../models/productVariant.model.js';
import { Category } from '../../models/category.model.js';
import { Inventory } from '../../models/inventory.model.js';

export interface ProductQueryFilters {
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  flavor?: string;
  sort?: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

export class ProductService {
  static async listProducts(filters: ProductQueryFilters) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 12));
    const skip = (page - 1) * limit;

    const query: any = { isActive: true };

    if (filters.categorySlug) {
      const category = await Category.findOne({ slug: filters.categorySlug.toLowerCase(), isActive: true });
      if (category) {
        query.categoryId = category._id;
      } else {
        return { products: [], total: 0, page, totalPages: 0 };
      }
    }

    let sortOption: any = { isFeatured: -1, sortOrder: 1, createdAt: -1 };
    if (filters.sort === 'price-asc' || filters.sort === 'price-desc') {
      // Sorting by price will be handled after retrieving variants
    } else if (filters.sort === 'rating') {
      sortOption = { rating: -1, reviewCount: -1 };
    } else if (filters.sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('categoryId', 'name slug badge')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    // Populate variants with inventory for each product
    const enrichedProducts = await Promise.all(
      products.map(async (prod) => {
        let variantQuery: any = { productId: prod._id, isActive: true };
        if (filters.flavor) {
          variantQuery.flavor = new RegExp(filters.flavor, 'i');
        }

        const variants = await ProductVariant.find(variantQuery);

        const variantsWithStock = await Promise.all(
          variants.map(async (v) => {
            const inv = await Inventory.findOne({ variantId: v._id });
            const available = inv ? inv.availableStock : 0;
            return {
              ...v.toObject(),
              stockQuantity: available,
              inStock: available > 0,
            };
          })
        );

        return {
          ...prod.toObject(),
          category: prod.categoryId,
          variants: variantsWithStock,
        };
      })
    );

    // Apply price filtering on lowest selling price if requested
    let filteredList = enrichedProducts;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filteredList = enrichedProducts.filter((p) => {
        const prices = p.variants.map((v) => v.sellingPrice);
        if (prices.length === 0) return false;
        const lowest = Math.min(...prices);
        if (filters.minPrice !== undefined && lowest < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && lowest > filters.maxPrice) return false;
        return true;
      });
    }

    if (filters.sort === 'price-asc') {
      filteredList.sort((a, b) => {
        const minA = a.variants.length ? Math.min(...a.variants.map((v) => v.sellingPrice)) : 0;
        const minB = b.variants.length ? Math.min(...b.variants.map((v) => v.sellingPrice)) : 0;
        return minA - minB;
      });
    } else if (filters.sort === 'price-desc') {
      filteredList.sort((a, b) => {
        const minA = a.variants.length ? Math.min(...a.variants.map((v) => v.sellingPrice)) : 0;
        const minB = b.variants.length ? Math.min(...b.variants.map((v) => v.sellingPrice)) : 0;
        return minB - minA;
      });
    }

    return {
      products: filteredList,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getFeaturedProducts() {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('categoryId', 'name slug badge')
      .limit(8);

    return Promise.all(
      products.map(async (prod) => {
        const variants = await ProductVariant.find({ productId: prod._id, isActive: true });
        const variantsWithStock = await Promise.all(
          variants.map(async (v) => {
            const inv = await Inventory.findOne({ variantId: v._id });
            const available = inv ? inv.availableStock : 0;
            return {
              ...v.toObject(),
              stockQuantity: available,
              inStock: available > 0,
            };
          })
        );
        return {
          ...prod.toObject(),
          category: prod.categoryId,
          variants: variantsWithStock,
        };
      })
    );
  }

  static async getProductBySlug(slug: string) {
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId
      ? { $or: [{ slug: slug.toLowerCase() }, { _id: slug }], isActive: true }
      : { slug: slug.toLowerCase(), isActive: true };

    const product = await Product.findOne(query).populate(
      'categoryId',
      'name slug badge'
    );

    if (!product) {
      throw { statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' };
    }

    const variants = await ProductVariant.find({ productId: product._id, isActive: true });
    const variantsWithStock = await Promise.all(
      variants.map(async (v) => {
        const inv = await Inventory.findOne({ variantId: v._id });
        const available = inv ? inv.availableStock : 0;
        return {
          ...v.toObject(),
          stockQuantity: available,
          inStock: available > 0,
        };
      })
    );

    // Related products in same category
    const related = await Product.find({
      categoryId: product.categoryId,
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(4)
      .populate('categoryId', 'name slug');

    const relatedWithVariants = await Promise.all(
      related.map(async (r) => {
        const vars = await ProductVariant.find({ productId: r._id, isActive: true });
        return {
          ...r.toObject(),
          variants: vars,
        };
      })
    );

    return {
      product: {
        ...product.toObject(),
        category: product.categoryId,
        variants: variantsWithStock,
      },
      relatedProducts: relatedWithVariants,
    };
  }
}
