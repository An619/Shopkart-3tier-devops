import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import wishlistService from '../services/wishlistService.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await wishlistService.get();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (productId) => {
    const data = await wishlistService.add(productId);
    setItems(data.items || []);
    return data;
  }, []);

  const remove = useCallback(async (itemId) => {
    const data = await wishlistService.remove(itemId);
    setItems(data.items || []);
    return data;
  }, []);

  const has = useCallback(
    (productId) => items.some((it) => it.productId === productId || it.product?.id === productId),
    [items]
  );

  const value = { items, loading, count: items.length, add, remove, has, refresh };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
}

export default WishlistContext;
