import { Helmet } from 'react-helmet-async';
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import formatINR from '../utils/formatINR';

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addItem } = useCart();
  const toast = useToast();

  const moveToCart = product => {
    addItem(product);
    toast(`${product.name} moved to cart`, 'success');
  };

  const moveAllToCart = () => {
    if (Array.isArray(wishlist)) {
      wishlist.forEach(p => addItem(p));
      toast('All items moved to cart', 'success');
    }
  };

  return (
    <div className="page wishlist-page">
      <Helmet>
        <title>My Wishlist - Nebula</title>
        <meta name="description" content="View and manage your wishlist." />
      </Helmet>

      <div className="page-header wishlist-header">
        <div>
          <h1>My Wishlist</h1>
          <p>{Array.isArray(wishlist) ? wishlist.length : 0} items saved</p>
        </div>
        {Array.isArray(wishlist) && wishlist.length > 0 && (
          <button className="btn-primary" onClick={moveAllToCart}>
            <FiShoppingCart size={16} /> Move All to Cart
          </button>
        )}
      </div>

      {!Array.isArray(wishlist) || wishlist.length === 0 ? (
        <div className="empty-state">
          <FiHeart size={48} />
          <h3>Your wishlist is empty</h3>
          <p>Save items you love to your wishlist.</p>
          <Link to="/products" className="btn-primary" style={{ marginTop: 16 }}>Browse Products</Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map(product => (
            <div key={product.id} className="wishlist-item">
              <Link to={`/product/${product.id}`} className="wishlist-item-image">
                <img src={product.image} alt={product.name} />
              </Link>
              <div className="wishlist-item-info">
                <span className="wishlist-brand">{product.brand || product.category}</span>
                <Link to={`/product/${product.id}`} className="wishlist-name">{product.name}</Link>
                <span className="wishlist-price">₹{formatINR(product.price)}</span>
              </div>
              <div className="wishlist-item-actions">
                <button className="btn-add-cart" onClick={() => moveToCart(product)} aria-label={`Add ${product.name} to cart`}>
                  <FiShoppingCart size={16} /> Add to Cart
                </button>
                <button className="btn-icon wishlist-remove" onClick={() => removeFromWishlist(product.id)} aria-label={`Remove ${product.name} from wishlist`}>
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
