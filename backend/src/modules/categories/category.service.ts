import { Category } from '../../models/category.model.js';
import { Product } from '../../models/product.model.js';

export class CategoryService {
  static async listAll() {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    
    // Attach product counts
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ categoryId: cat._id, isActive: true });
        return {
          ...cat.toObject(),
          productCount: count,
        };
      })
    );

    return categoriesWithCount;
  }

  static async getBySlug(slug: string) {
    const category = await Category.findOne({ slug: slug.toLowerCase(), isActive: true });
    if (!category) {
      throw { statusCode: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found.' };
    }
    return category;
  }

  static async create(data: any) {
    return Category.create(data);
  }

  static async update(id: string, data: any) {
    const category = await Category.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!category) {
      throw { statusCode: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found.' };
    }
    return category;
  }

  static async delete(id: string) {
    return Category.findByIdAndDelete(id);
  }
}
