import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';

const CartContext = createContext();
const STORAGE_KEY = 'nebula_cart';

function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_CART':
      return Array.isArray(action.cart) ? action.cart : [];
    case 'ADD_ITEM': {
      const existing = state.find(item => item.id === action.product.id);
      if (existing) {
        return state.map(item =>
          item.id === action.product.id
            ? { ...item, quantity: item.quantity + (action.qty || 1) }
            : item
        );
      }
      return [...state, { ...action.product, quantity: action.qty || 1 }];
    }
    case 'REMOVE_ITEM':
      return state.filter(item => item.id !== action.id);
    case 'UPDATE_QUANTITY':
      return state.map(item =>
        item.id === action.id
          ? { ...item, quantity: Math.max(1, action.quantity) }
          : item
      );
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, [], loadCart);
  const token = useRef(typeof window !== 'undefined' ? localStorage.getItem('nebula_token') : null);
  const syncing = useRef(false);

  const saveToServer = useCallback(async (items) => {
    const t = localStorage.getItem('nebula_token');
    if (!t) return;
    try {
      await api.put('/api/cart', { items }, { timeout: 5000 });
    } catch {}
  }, []);

  const loadFromServer = useCallback(async () => {
    const t = localStorage.getItem('nebula_token');
    if (!t || syncing.current) return null;
    syncing.current = true;
    try {
      const res = await api.get('/api/cart', { timeout: 5000 });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return null;
    } finally {
      syncing.current = false;
    }
  }, []);

  const syncCartOnLogin = useCallback(async () => {
    const t = localStorage.getItem('nebula_token');
    if (!t) return;
    token.current = t;
    const localCart = loadCart();
    const serverCart = await loadFromServer();

    if (Array.isArray(serverCart) && serverCart.length > 0) {
      const merged = [...serverCart];
      for (const local of localCart) {
        const existing = merged.find(m => m.id === local.id);
        if (existing) {
          existing.quantity = Math.max(existing.quantity, local.quantity);
        } else {
          merged.push(local);
        }
      }
      dispatch({ type: 'SET_CART', cart: merged });
      saveToServer(merged);
    } else if (localCart.length > 0) {
      saveToServer(localCart);
    }
  }, [loadFromServer, saveToServer]);

  useEffect(() => {
    const t = localStorage.getItem('nebula_token');
    if (t && !token.current) {
      token.current = t;
      syncCartOnLogin();
    } else if (!t) {
      token.current = null;
    }
  }, [syncCartOnLogin]);

  useEffect(() => {
    const t = localStorage.getItem('nebula_token');
    if (t) {
      saveToServer(cart);
    }
  }, [cart, saveToServer]);

  const addItem = (product, qty = 1) => {
    if (qty <= 1) {
      dispatch({ type: 'ADD_ITEM', product });
    } else {
      dispatch({ type: 'ADD_ITEM', product, qty });
    }
  };
  const removeItem = id => dispatch({ type: 'REMOVE_ITEM', id });
  const updateQuantity = (id, quantity) => dispatch({ type: 'UPDATE_QUANTITY', id, quantity });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const totalItems = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
  const totalPrice = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0) : 0;

  const validatedRef = useRef(false);

  const validateCart = useCallback(async () => {
    if (validatedRef.current || !Array.isArray(cart) || cart.length === 0) return;
    try {
      const res = await api.get('/api/products', { timeout: 5000 });
      if (Array.isArray(res.data)) {
        const validIds = new Set(res.data.map(p => p.id));
        const stale = cart.filter(item => !validIds.has(item.id));
        if (stale.length > 0) {
          validatedRef.current = true;
          stale.forEach(item => dispatch({ type: 'REMOVE_ITEM', id: item.id }));
        } else {
          validatedRef.current = true;
        }
      }
    } catch {
      validatedRef.current = true;
    }
  }, [cart]);

  useEffect(() => {
    if (Array.isArray(cart) && cart.length > 0 && !validatedRef.current) validateCart();
  }, [validateCart, cart]);

  return (
    <CartContext.Provider value={{
      cart, addItem, removeItem, updateQuantity, clearCart,
      totalItems, totalPrice, syncCartOnLogin, validateCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
