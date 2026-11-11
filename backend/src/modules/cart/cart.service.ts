import { Cart, ICart } from '../../models/cart.model.js';
import { ProductVariant } from '../../models/productVariant.model.js';
import { Product } from '../../models/product.model.js';
import { CouponService } from '../coupons/coupon.service.js';
import { CurrencyUtils } from '../../utils/currency.js';

const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 99;

export class CartService {
  static async getOrCreateCart(userId?: string, guestSessionId?: string) {
    let cart: ICart | null = null;

    if (userId) {
      cart = await Cart.findOne({ userId });
      // If user had a guest cart before logging in, merge it
      if (guestSessionId) {
        const guestCart = await Cart.findOne({ guestSessionId });
        if (guestCart && guestCart.items.length > 0) {
          if (!cart) {
            guestCart.userId = userId as any;
            guestCart.guestSessionId = undefined;
            await guestCart.save();
            cart = guestCart;
          } else {
            // Merge items
            for (const item of guestCart.items) {
              const existing = cart.items.find((i) => i.variantId.toString() === item.variantId.toString());
              if (existing) {
                existing.quantity += item.quantity;
              } else {
                cart.items.push(item);
              }
            }
            await cart.save();
            await Cart.findByIdAndDelete(guestCart._id);
          }
        }
      }
    } else if (guestSessionId) {
      cart = await Cart.findOne({ guestSessionId });
    }

    if (!cart) {
      cart = await Cart.create({
        userId: userId || undefined,
        guestSessionId: !userId ? guestSessionId : undefined,
        items: [],
      });
    }

    return this.calculateCartTotals(cart, userId);
  }

  static async addItem(
    params: { userId?: string; guestSessionId?: string },
    variantId: string,
    quantity: number
  ) {
    const variant = await ProductVariant.findById(variantId);
    if (!variant || !variant.isActive) {
      throw { statusCode: 404, code: 'VARIANT_NOT_FOUND', message: 'Product variant not found or unavailable.' };
    }

    let cart = await Cart.findOne(
      params.userId ? { userId: params.userId } : { guestSessionId: params.guestSessionId }
    );

    if (!cart) {
      cart = await Cart.create({
        userId: params.userId,
        guestSessionId: params.guestSessionId,
        items: [],
      });
    }

    const existingIndex = cart.items.findIndex((item) => item.variantId.toString() === variantId);
    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Math.max(1, quantity);
    } else {
      cart.items.push({
        variantId: variant._id as any,
        quantity: Math.max(1, quantity),
        addedAt: new Date(),
      });
    }

    await cart.save();
    return this.calculateCartTotals(cart, params.userId);
  }

  static async updateQuantity(
    params: { userId?: string; guestSessionId?: string },
    variantId: string,
    quantity: number
  ) {
    const cart = await Cart.findOne(
      params.userId ? { userId: params.userId } : { guestSessionId: params.guestSessionId }
    );

    if (!cart) {
      throw { statusCode: 404, code: 'CART_NOT_FOUND', message: 'Cart not found.' };
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter((item) => item.variantId.toString() !== variantId) as any;
    } else {
      const item = cart.items.find((i) => i.variantId.toString() === variantId);
      if (item) {
        item.quantity = quantity;
      }
    }

    await cart.save();
    return this.calculateCartTotals(cart, params.userId);
  }

  static async removeItem(params: { userId?: string; guestSessionId?: string }, variantId: string) {
    return this.updateQuantity(params, variantId, 0);
  }

  static async applyCoupon(params: { userId?: string; guestSessionId?: string }, code: string) {
    const cart = await Cart.findOne(
      params.userId ? { userId: params.userId } : { guestSessionId: params.guestSessionId }
    );

    if (!cart || cart.items.length === 0) {
      throw { statusCode: 400, code: 'EMPTY_CART', message: 'Your cart is empty.' };
    }

    // Pre-calculate subtotal
    const calculated = await this.calculateCartTotals(cart, params.userId);
    await CouponService.validateCoupon(code, calculated.subtotal, params.userId);

    cart.couponCode = code.toUpperCase().trim();
    await cart.save();

    return this.calculateCartTotals(cart, params.userId);
  }

  static async removeCoupon(params: { userId?: string; guestSessionId?: string }) {
    const cart = await Cart.findOne(
      params.userId ? { userId: params.userId } : { guestSessionId: params.guestSessionId }
    );

    if (!cart) {
      throw { statusCode: 404, code: 'CART_NOT_FOUND', message: 'Cart not found.' };
    }

    cart.couponCode = undefined;
    await cart.save();

    return this.calculateCartTotals(cart, params.userId);
  }

  /**
   * Recalculates all line items with live DB prices and computes authoritative financial totals
   */
  static async calculateCartTotals(cart: ICart, userId?: string) {
    let subtotal = 0;
    const enrichedItems = [];

    for (const item of cart.items) {
      const variant = await ProductVariant.findById(item.variantId);
      if (variant && variant.isActive) {
        const product = await Product.findById(variant.productId);
        if (product && product.isActive) {
          const lineTotal = variant.sellingPrice * item.quantity;
          subtotal += lineTotal;

          enrichedItems.push({
            variantId: variant._id.toString(),
            productId: product._id.toString(),
            productTitle: product.title,
            productSlug: product.slug,
            flavor: variant.flavor,
            packSize: variant.packSize,
            sku: variant.sku,
            image: variant.images[0] || '',
            unitPrice: variant.sellingPrice,
            mrp: variant.mrp,
            quantity: item.quantity,
            total: lineTotal,
          });
        }
      }
    }

    // Coupon calculation
    let couponDiscount = 0;
    let couponDetails = null;

    if (cart.couponCode && subtotal > 0) {
      try {
        const couponResult = await CouponService.validateCoupon(cart.couponCode, subtotal, userId);
        couponDiscount = couponResult.discountAmount;
        couponDetails = {
          code: couponResult.code,
          discountAmount: couponDiscount,
          description: couponResult.description,
        };
      } catch (err) {
        // Invalidate expired/unmet coupon
        cart.couponCode = undefined;
        await cart.save();
      }
    }

    // Shipping calculation
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
    const shippingFee = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
    const freeShippingShortfall = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

    // Tax (GST 18% inclusive in final price)
    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
    const taxGst = Math.round((discountedSubtotal * 18) / 118); // Inclusive GST formula: Price * 18 / 118
    const finalTotal = discountedSubtotal + shippingFee;

    return {
      cartId: cart._id,
      items: enrichedItems,
      totalItemsCount: enrichedItems.reduce((acc, curr) => acc + curr.quantity, 0),
      subtotal,
      couponDiscount,
      coupon: couponDetails,
      shippingFee,
      isFreeShipping,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      freeShippingShortfall,
      freeShippingProgress,
      taxGst,
      finalTotal,
    };
  }
}
