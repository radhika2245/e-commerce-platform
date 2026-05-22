import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiStar } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import formatINR from '../utils/formatINR';

const FALLBACK_IMG = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="%231a1a2e" width="200" height="200"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%237ec8e3" font-size="48">✦</text></svg>';

function RatingStars({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push(<FiStar key={i} fill="var(--warning)" color="var(--warning)" size={12} />);
    else if (i === full && half) stars.push(<FiStar key={i} fill="var(--warning)" color="var(--warning)" size={12} opacity={0.5} />);
    else stars.push(<FiStar key={i} color="var(--text-tertiary)" size={12} />);
  }
  return <span className="rating-stars">{stars}</span>;
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const toast = useToast();
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);

  const discountedPrice = product.discount ? product.price - Math.round(product.price * product.discount / 100) : product.price;
  const wishlisted = isWishlisted(product.id);

  const handleAdd = e => {
    e.preventDefault();
    if (adding) return;
    setAdding(true);
    addItem({ ...product, price: discountedPrice });
    toast(`${product.name} added to cart`, 'success');
    setTimeout(() => setAdding(false), 400);
  };

  const handleWishlist = e => {
    e.preventDefault();
    toggleWishlist(product);
    toast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-card-image">
        <img
          src={imgError ? FALLBACK_IMG : product.image}
          alt={product.name}
          loading="lazy"
          onError={() => setImgError(true)}
        />
        {product.discount > 0 && (
          <span className="product-badge discount-badge">-{product.discount}%</span>
        )}
        {product.featured && product.discount === 0 && (
          <span className="product-badge">Featured</span>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="product-badge stock-warning">Only {product.stock} left</span>
        )}
        <button
          className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <FiHeart size={16} fill={wishlisted ? 'var(--danger)' : 'none'} color={wishlisted ? 'var(--danger)' : 'var(--text-tertiary)'} />
        </button>
      </div>
      <div className="product-card-body">
        <div className="product-card-top">
          <span className="product-brand">{product.brand}</span>
          <span className="product-category">{product.category}</span>
        </div>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-rating">
          <RatingStars rating={product.rating} />
          <span className="rating-text">{product.rating}</span>
          <span className="rating-count">({product.reviewsCount?.toLocaleString('en-IN') || 0})</span>
        </div>
        <p className="product-description">{product.description}</p>
        <div className="product-card-footer">
          <div className="product-pricing">
            {product.discount > 0 ? (
              <>
                <span className="product-price">₹{formatINR(discountedPrice)}</span>
                <span className="product-original-price">₹{formatINR(product.price)}</span>
              </>
            ) : (
              <span className="product-price">₹{formatINR(product.price)}</span>
            )}
          </div>
          <button
            className="btn-add-cart"
            onClick={handleAdd}
            disabled={product.stock === 0 || adding}
            aria-label={product.stock === 0 ? 'Out of stock' : `Add ${product.name} to cart`}
          >
            <FiShoppingCart size={16} aria-hidden="true" />
            {product.stock === 0 ? 'Out of Stock' : adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  );
}
