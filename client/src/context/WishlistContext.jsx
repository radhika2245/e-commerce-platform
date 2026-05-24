import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();
const STORAGE_KEY = 'nebula_wishlist';

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (Array.isArray(wishlist)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist]);

  const toggleWishlist = product => {
    if (!product) return;
    setWishlist(prev => {
      const current = Array.isArray(prev) ? prev : [];
      return current.some(p => p.id === product.id)
        ? current.filter(p => p.id !== product.id)
        : [...current, product];
    });
  };

  const isWishlisted = id => Array.isArray(wishlist) && wishlist.some(p => p.id === id);

  const removeFromWishlist = id => {
    setWishlist(prev => Array.isArray(prev) ? prev.filter(p => p.id !== id) : []);
  };

  return (
    <WishlistContext.Provider value={{ wishlist: Array.isArray(wishlist) ? wishlist : [], toggleWishlist, isWishlisted, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
};
