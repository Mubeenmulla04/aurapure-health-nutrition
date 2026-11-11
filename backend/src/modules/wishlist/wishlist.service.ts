import { Wishlist } from '../../models/wishlist.model.js';
import { Product } from '../../models/product.model.js';
import { ProductVariant } from '../../models/productVariant.model.js';

export class WishlistService {
  static async getWishlist(userId: string) {
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, items: [] });
    }

    const populatedItems = await Promise.all(
      wishlist.items.map(async (item) => {
        const product = await Product.findById(item.productId);
        const variant = item.variantId ? await ProductVariant.findById(item.variantId) : null;
        return {
          productId: item.productId,
          variantId: item.variantId,
          productTitle: product?.title || 'Unknown Product',
          productSlug: product?.slug || '',
          price: variant?.sellingPrice || 0,
          mrp: variant?.mrp || 0,
          image: variant?.images[0] || '',
          rating: product?.rating || 4.9,
          addedAt: item.addedAt,
        };
      })
    );

    return {
      id: wishlist._id,
      items: populatedItems,
    };
  }

  static async toggleItem(userId: string, productId: string, variantId?: string) {
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, items: [] });
    }

    const index = wishlist.items.findIndex((item) => item.productId.toString() === productId);
    let action: 'added' | 'removed' = 'added';

    if (index > -1) {
      wishlist.items.splice(index, 1);
      action = 'removed';
    } else {
      wishlist.items.push({
        productId: productId as any,
        variantId: variantId as any,
        addedAt: new Date(),
      });
      action = 'added';
    }

    await wishlist.save();
    return { action, wishlist: await this.getWishlist(userId) };
  }
}
