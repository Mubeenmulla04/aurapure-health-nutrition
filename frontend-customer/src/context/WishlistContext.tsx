import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistItems: any[];
  toggleWishlist: (productId: string, variantId?: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const refreshWishlist = async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      setWishlistIds([]);
      return;
    }
    try {
      const res = await api.get('/wishlist');
      const items = res.data.data.wishlist.items || [];
      setWishlistItems(items);
      setWishlistIds(items.map((i: any) => i.productId.toString()));
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, [isAuthenticated]);

  const toggleWishlist = async (productId: string, variantId?: string) => {
    if (!isAuthenticated) {
      alert('Please log in to save items to your wishlist.');
      return;
    }

    try {
      const res = await api.post('/wishlist/toggle', { productId, variantId });
      const items = res.data.data.wishlist.items || [];
      setWishlistItems(items);
      setWishlistIds(items.map((i: any) => i.productId.toString()));
    } catch (err: any) {
      alert('Could not update wishlist.');
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistIds.includes(productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistItems,
        toggleWishlist,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
