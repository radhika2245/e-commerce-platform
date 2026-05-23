import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-icon" aria-hidden="true">✦</span>
          <span>Nebula</span>
        </div>
        <p className="footer-tagline">Premium products for modern living.</p>
        <div className="footer-links">
          <Link to="/products">Shop</Link>
          <Link to="/cart">Cart</Link>
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        </div>
        <p className="footer-copy">&copy; {new Date().getFullYear()} Nebula. All rights reserved.</p>
      </div>
    </footer>
  );
}
