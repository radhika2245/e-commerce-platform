import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiPackage, FiHome, FiUser, FiLogOut, FiMenu, FiX, FiHeart, FiList } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

function MobileNavItem({ to, icon: Icon, label, badge, isActive }) {
  return (
    <Link
      to={to}
      className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1.5 px-1 rounded-xl transition-all duration-200 ${
        isActive
          ? 'text-[#7ec8e3]'
          : 'text-white/35 hover:text-white/60'
      }`}
    >
      <div className="relative flex items-center justify-center">
        <Icon
          size={20}
          className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
        />
        {badge > 0 && (
          <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#ff6b6b] rounded-full shadow-lg shadow-red-500/20 animate-[scaleIn_0.3s_ease]">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium leading-tight whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const mobileNavItems = [
    { to: '/', icon: FiHome, label: 'Home', badge: 0 },
    { to: '/products', icon: FiPackage, label: 'Products', badge: 0 },
    { to: '/wishlist', icon: FiHeart, label: 'Wishlist', badge: wishlist.length },
    { to: '/cart', icon: FiShoppingCart, label: 'Cart', badge: totalItems },
    { to: '/orders', icon: FiList, label: 'Orders', badge: 0 },
  ];

  return (
    <>
      {/* ===== DESKTOP NAVBAR ===== */}
      <nav className="navbar hidden md:flex" role="navigation" aria-label="Main navigation">
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
                <FiList aria-hidden="true" /> <span>Orders</span>
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

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="md:hidden">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a12]/80 backdrop-blur-2xl border-b border-white/[0.06]">
          <div className="flex items-center justify-between h-14 px-4">
            <Link to="/" className="flex items-center gap-2" aria-label="Radhika Home">
              <span className="text-xl text-[#7ec8e3] animate-[pulse_3s_ease-in-out_infinite]" aria-hidden="true">✦</span>
              <span className="text-lg font-bold tracking-tight">Radhika</span>
            </Link>
            <button
              className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1] transition-all duration-200"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>

          {/* Mobile slide-down drawer */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              menuOpen ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="border-t border-white/[0.06] px-4 py-3 space-y-0.5 bg-[#0a0a12] overflow-y-auto">
              <Link to="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === '/' ? 'text-[#7ec8e3] bg-[#7ec8e3]/10' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`} onClick={closeMenu}>
                <FiHome size={16} /> Home
              </Link>
              <Link to="/products" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === '/products' ? 'text-[#7ec8e3] bg-[#7ec8e3]/10' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`} onClick={closeMenu}>
                <FiPackage size={16} /> Products
              </Link>
              <Link to="/wishlist" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === '/wishlist' ? 'text-[#7ec8e3] bg-[#7ec8e3]/10' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`} onClick={closeMenu}>
                <span className="relative">
                  <FiHeart size={16} />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 text-[8px] font-bold text-white bg-[#ff6b6b] rounded-full">
                      {wishlist.length > 99 ? '99+' : wishlist.length}
                    </span>
                  )}
                </span>
                Wishlist
              </Link>
              <Link to="/cart" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === '/cart' ? 'text-[#7ec8e3] bg-[#7ec8e3]/10' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`} onClick={closeMenu}>
                <span className="relative">
                  <FiShoppingCart size={16} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 text-[8px] font-bold text-white bg-[#ff6b6b] rounded-full">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </span>
                Cart
              </Link>
              <Link to="/orders" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === '/orders' ? 'text-[#7ec8e3] bg-[#7ec8e3]/10' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`} onClick={closeMenu}>
                <FiList size={16} /> Orders
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  pathname === '/admin' ? 'text-[#7ec8e3] bg-[#7ec8e3]/10' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`} onClick={closeMenu}>
                  Admin
                </Link>
              )}
              <div className="h-px bg-white/[0.06] my-2" />
              {user ? (
                <>
                  <Link to="/profile" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    pathname === '/profile' ? 'text-[#7ec8e3] bg-[#7ec8e3]/10' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`} onClick={closeMenu}>
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <FiUser size={16} />
                    )}
                    <span>{user.name.split(' ')[0]}</span>
                  </Link>
                  <button
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
                    onClick={() => { logout(); closeMenu(); }}
                  >
                    <FiLogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  pathname === '/login' ? 'text-[#7ec8e3] bg-[#7ec8e3]/10' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`} onClick={closeMenu}>
                  <FiUser size={16} /> Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0a12]/95 backdrop-blur-2xl border-t border-white/[0.06] pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
          {mobileNavItems.map((item) => (
            <MobileNavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              isActive={pathname === item.to}
            />
          ))}
        </div>
      </div>
    </>
  );
}
