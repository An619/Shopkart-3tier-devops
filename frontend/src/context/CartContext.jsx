import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import cartService from '../services/cartService.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await cartService.get();
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (productId, quantity = 1) => {
      const data = await cartService.add({ productId, quantity });
      setItems(data.items || []);
      return data;
    },
    []
  );

  const update = useCallback(async (itemId, quantity) => {
    const data = await cartService.update(itemId, { quantity });
    setItems(data.items || []);
    return data;
  }, []);

  const remove = useCallback(async (itemId) => {
    const data = await cartService.remove(itemId);
    setItems(data.items || []);
    return data;
  }, []);

  const clear = useCallback(async () => {
    await cartService.clear();
    setItems([]);
  }, []);

  const count = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.price || it.product?.price || 0) * (it.quantity || 0),
    0
  );

  const value = {
    items,
    loading,
    error,
    count,
    subtotal,
    add,
    update,
    remove,
    clear,
    refresh,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

export default CartContext;
