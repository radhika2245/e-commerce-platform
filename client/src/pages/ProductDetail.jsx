import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiShoppingCart, FiHeart, FiStar, FiTruck, FiShield, FiRefreshCw, FiMinus, FiPlus, FiArrowLeft } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import formatINR from '../utils/formatINR';
import axios from 'axios';

function RatingStars({ rating }) {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < Math.floor(rating)) stars.push(<FiStar key={i} fill="var(--warning)" color="var(--warning)" size={16} />);
    else stars.push(<FiStar key={i} color="var(--text-tertiary)" size={16} />);
  }
  return <span className="rating-stars">{stars}</span>;
}

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/products/${id}`)
      .then(res => {
        setProduct(res.data);
        try {
          const raw = localStorage.getItem('nebula_recently_viewed');
          const viewed = raw ? JSON.parse(raw) : [];
          const filtered = viewed.filter(p => p.id !== res.data.id);
          filtered.unshift({ id: res.data.id, name: res.data.name, price: res.data.price, image: res.data.image, rating: res.data.rating, brand: res.data.brand, category: res.data.category, description: res.data.description, stock: res.data.stock, discount: res.data.discount, reviewsCount: res.data.reviewsCount });
          localStorage.setItem('nebula_recently_viewed', JSON.stringify(filtered.slice(0, 10)));
        } catch {}
        return axios.get(`/api/products?category=${encodeURIComponent(res.data.category)}`);
      })
      .then(res => setRelated(res.data.filter(p => p.id !== id).slice(0, 4)))
      .catch(() => toast('Failed to load product', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <div className="product-detail-skeleton">
          <div className="skeleton-image" />
          <div className="skeleton-info">
            <div className="skeleton-line w-40" />
            <div className="skeleton-line w-70" />
            <div className="skeleton-line w-50" />
            <div className="skeleton-line w-90" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>Product not found</h2>
          <p>This product may have been removed.</p>
          <Link to="/products" className="btn-primary" style={{ marginTop: 16 }}>Browse Products</Link>
        </div>
      </div>
    );
  }

  const discountedPrice = product.discount ? product.price - Math.round(product.price * product.discount / 100) : product.price;
  const wishlisted = isWishlisted(product.id);

  const handleAdd = () => {
    addItem({ ...product, price: discountedPrice }, qty);
    toast(`${qty} × ${product.name} added to cart`, 'success');
  };

  return (
    <div className="page product-detail-page">
      <Helmet>
        <title>{`${String(product.name || 'Product')} - Nebula`}</title>
        <meta name="description" content={String(product.description || '')} />
      </Helmet>

      <Link to="/products" className="back-link">
        <FiArrowLeft /> Back to Products
      </Link>

      <div className="product-detail">
        <div className="product-detail-image">
          <img
            src={imgError ? 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect fill="%231a1a2e" width="600" height="600"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%237ec8e3" font-size="72">✦</text></svg>' : product.image}
            alt={product.name}
            onError={() => setImgError(true)}
          />
          {product.discount > 0 && (
            <span className="product-badge discount-badge detail-badge">-{product.discount}%</span>
          )}
        </div>

        <div className="product-detail-info">
          <span className="product-brand">{product.brand}</span>
          <span className="product-category-label">{product.category}</span>
          <h1>{product.name}</h1>

          <div className="product-rating large">
            <RatingStars rating={product.rating} />
            <span className="rating-text">{product.rating}</span>
            <span className="rating-count">({product.reviewsCount?.toLocaleString('en-IN') || 0} reviews)</span>
          </div>

          <div className="product-pricing large">
            {product.discount > 0 ? (
              <>
                <span className="product-price">₹{formatINR(discountedPrice)}</span>
                <span className="product-original-price">₹{formatINR(product.price)}</span>
                <span className="savings">Save ₹{formatINR(product.price - discountedPrice)}</span>
              </>
            ) : (
              <span className="product-price">₹{formatINR(product.price)}</span>
            )}
          </div>

          <p className="product-detail-desc">{product.description}</p>

          <div className="product-detail-meta">
            <div className="meta-item">
              <span className="meta-label">Availability</span>
              <span className={`meta-value ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Brand</span>
              <span className="meta-value">{product.brand}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Category</span>
              <span className="meta-value">{product.category}</span>
            </div>
          </div>

          <div className="product-detail-actions">
            {product.stock > 0 && (
              <div className="qty-control">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity" disabled={qty <= 1}>
                  <FiMinus size={14} />
                </button>
                <span>{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Increase quantity" disabled={qty >= product.stock}>
                  <FiPlus size={14} />
                </button>
              </div>
            )}
            <button
              className="btn-primary add-cart-btn"
              onClick={handleAdd}
              disabled={product.stock === 0}
            >
              <FiShoppingCart size={18} />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              className={`btn-secondary wishlist-btn ${wishlisted ? 'active' : ''}`}
              onClick={() => { toggleWishlist(product); toast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success'); }}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <FiHeart size={18} fill={wishlisted ? 'var(--danger)' : 'none'} color={wishlisted ? 'var(--danger)' : undefined} />
              {wishlisted ? 'Wishlisted' : 'Wishlist'}
            </button>
          </div>

          <div className="product-detail-features">
            <div className="dt-feature">
              <FiTruck size={20} />
              <div>
                <strong>Free Shipping</strong>
                <span>On orders over ₹4,999</span>
              </div>
            </div>
            <div className="dt-feature">
              <FiShield size={20} />
              <div>
                <strong>2 Year Warranty</strong>
                <span>Full coverage included</span>
              </div>
            </div>
            <div className="dt-feature">
              <FiRefreshCw size={20} />
              <div>
                <strong>Easy Returns</strong>
                <span>30-day return policy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section related-section">
          <div className="section-header">
            <h2>Related Products</h2>
          </div>
          <div className="product-grid">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
