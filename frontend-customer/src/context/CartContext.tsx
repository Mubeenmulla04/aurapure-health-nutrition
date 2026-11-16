import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface CartItemData {
  variantId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  flavor: string;
  packSize: string;
  sku: string;
  image: string;
  unitPrice: number;
  mrp: number;
  quantity: number;
  total: number;
  availableStock?: number;
  inStock?: boolean;
}

export interface CartData {
  cartId?: string;
  items: CartItemData[];
  totalItemsCount: number;
  subtotal: number;
  couponDiscount: number;
  coupon?: {
    code: string;
    discountAmount: number;
    description: string;
  } | null;
  shippingFee: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  freeShippingShortfall: number;
  freeShippingProgress: number;
  taxGst: number;
  finalTotal: number;
}

interface CartContextType {
  cart: CartData;
  isLoading: boolean;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addItem: (variantId: string, quantity?: number, openDrawer?: boolean) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const defaultCart: CartData = {
  items: [],
  totalItemsCount: 0,
  subtotal: 0,
  couponDiscount: 0,
  coupon: null,
  shippingFee: 0,
  isFreeShipping: true,
  freeShippingThreshold: 999,
  freeShippingShortfall: 0,
  freeShippingProgress: 100,
  taxGst: 0,
  finalTotal: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartData>(defaultCart);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const refreshCart = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/cart');
      if (res.data?.data?.cart) {
        setCart(res.data.data.cart);
      }
    } catch {
      // Fallback: keep previous or default
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync cart whenever authentication status changes (OTP login or logout)
  useEffect(() => {
    refreshCart();
  }, [user, refreshCart]);

  const addItem = async (variantId: string, quantity: number = 1, _openDrawer: boolean = false) => {
    try {
      setIsLoading(true);
      const res = await api.post('/cart/items', { variantId, quantity });
      if (res.data?.data?.cart) {
        setCart(res.data.data.cart);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to add item to bag.';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (variantId: string, quantity: number) => {
    try {
      setIsLoading(true);
      const res = await api.put(`/cart/items/${variantId}`, { quantity });
      if (res.data?.data?.cart) {
        setCart(res.data.data.cart);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update quantity.';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (variantId: string) => {
    try {
      setIsLoading(true);
      const res = await api.delete(`/cart/items/${variantId}`);
      if (res.data?.data?.cart) {
        setCart(res.data.data.cart);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to remove item.';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const applyCoupon = async (code: string) => {
    try {
      setIsLoading(true);
      const res = await api.post('/cart/apply-coupon', { code });
      if (res.data?.data?.cart) {
        setCart(res.data.data.cart);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Invalid coupon code';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const removeCoupon = async () => {
    try {
      setIsLoading(true);
      const res = await api.delete('/cart/remove-coupon');
      if (res.data?.data?.cart) {
        setCart(res.data.data.cart);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to remove coupon.';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isCartDrawerOpen: false,
        openCartDrawer: () => {},
        closeCartDrawer: () => {},
        addItem,
        updateQuantity,
        removeItem,
        applyCoupon,
        removeCoupon,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
