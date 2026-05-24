import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiPackage, FiHome, FiUser, FiLogOut, FiMenu, FiX, FiHeart } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" aria-label="Radhika Home">
          <span className="brand-icon" aria-hidden="true">✦</span>
          <span className="brand-text">Radhika</span>
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`} onClick={closeMenu}>
            <FiHome aria-hidden="true" /> <span>Home</span>
          </Link>
          <Link to="/products" className={`nav-link ${pathname === '/products' ? 'active' : ''}`} onClick={closeMenu}>
            <FiPackage aria-hidden="true" /> <span>Products</span>
          </Link>
          <Link to="/wishlist" className={`nav-link ${pathname === '/wishlist' ? 'active' : ''}`} onClick={closeMenu}>
            <FiHeart aria-hidden="true" />
            {wishlist.length > 0 && <span className="cart-badge" aria-label={`${wishlist.length} wishlist items`}>{wishlist.length}</span>}
            <span>Wishlist</span>
          </Link>
          <Link to="/cart" className={`nav-link cart-link ${pathname === '/cart' ? 'active' : ''}`} onClick={closeMenu}>
            <FiShoppingCart aria-hidden="true" />
            {totalItems > 0 && <span className="cart-badge" aria-label={`${totalItems} items in cart`}>{totalItems}</span>}
            <span>Cart</span>
          </Link>
          {user && (
            <Link to="/orders" className={`nav-link ${pathname === '/orders' ? 'active' : ''}`} onClick={closeMenu}>
              <FiPackage aria-hidden="true" /> <span>Orders</span>
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className={`nav-link ${pathname === '/admin' ? 'active' : ''}`} onClick={closeMenu}>
              Admin
            </Link>
          )}
          {user ? (
            <>
              <Link to="/profile" className={`nav-link ${pathname === '/profile' ? 'active' : ''}`} onClick={closeMenu}>
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="nav-avatar" />
                ) : (
                  <FiUser aria-hidden="true" />
                )}
                <span>{user.name.split(' ')[0]}</span>
              </Link>
              <button
                className="nav-link logout-btn"
                onClick={() => { logout(); closeMenu(); }}
                aria-label="Sign out"
              >
                <FiLogOut aria-hidden="true" />
              </button>
            </>
          ) : (
            <Link to="/login" className={`nav-link ${pathname === '/login' ? 'active' : ''}`} onClick={closeMenu}>
              <FiUser aria-hidden="true" /> <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
