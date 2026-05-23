import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiHeadphones } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import ThreeDScene from '../components/ThreeDScene';
import axios from 'axios';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadProducts = useCallback(() => {
    setLoading(true);
    setError(false);
    axios.get('/api/products?featured=true')
      .then(res => setFeatured(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  return (
    <div className="page home">
      <Helmet>
        <title>Nebula - Premium Store India</title>
        <meta name="description" content="Discover premium products curated for those who demand the best. Shop electronics, fashion, accessories and more." />
      </Helmet>

      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">New Collection 2026</span>
          <h1>Premium Products<br/>for Modern Living.</h1>
          <p>Discover handpicked products from top brands. From cutting-edge electronics to timeless accessories — elevate your everyday.</p>
          <Link to="/products" className="btn-primary" aria-label="Explore products">
            Shop Now <FiArrowRight />
          </Link>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>10,000+</strong>
              <span>Happy Customers</span>
            </div>
            <div className="hero-stat">
              <strong>500+</strong>
              <span>Products</span>
            </div>
            <div className="hero-stat">
              <strong>4.8★</strong>
              <span>Avg. Rating</span>
            </div>
          </div>
        </div>
        <ThreeDScene />
      </section>

      <section className="features" aria-label="Store features">
        <div className="feature-card">
          <FiTruck className="feature-icon" aria-hidden="true" />
          <h3>Free Shipping</h3>
          <p>On orders over ₹4,999</p>
        </div>
        <div className="feature-card">
          <FiShield className="feature-icon" aria-hidden="true" />
          <h3>2-Year Warranty</h3>
          <p>Peace of mind included</p>
        </div>
        <div className="feature-card">
          <FiRefreshCw className="feature-icon" aria-hidden="true" />
          <h3>Easy Returns</h3>
          <p>30-day return policy</p>
        </div>
        <div className="feature-card">
          <FiHeadphones className="feature-icon" aria-hidden="true" />
          <h3>24/7 Support</h3>
          <p>We're here to help</p>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Featured Products</h2>
          <Link to="/products" className="section-link">
            View All <FiArrowRight />
          </Link>
        </div>
        {loading ? (
          <div className="product-grid"><ProductSkeleton count={4} /></div>
        ) : error ? (
          <div className="section-error">
            <p>Couldn't load products right now.</p>
            <button className="btn-secondary" onClick={loadProducts}>Try Again</button>
          </div>
        ) : (
          <div className="product-grid">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
