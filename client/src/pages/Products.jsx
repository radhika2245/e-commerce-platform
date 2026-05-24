import { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiSearch, FiSliders, FiX, FiChevronDown, FiClock } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

const CATEGORIES = ['all', 'electronics', 'clothing', 'accessories', 'sports', 'home'];
const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name', label: 'Name A-Z' },
];
const PRICE_RANGES = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under ₹5,000', min: '', max: '4999' },
  { label: '₹5,000 - ₹10,000', min: '5000', max: '10000' },
  { label: '₹10,000 - ₹25,000', min: '10000', max: '25000' },
  { label: 'Above ₹25,000', min: '25001', max: '' },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [brand, setBrand] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    api.get('/api/products')
      .then(res => {
        if (Array.isArray(res.data)) {
          const names = [...new Set(res.data.map(p => p.name))].sort().slice(0, 8);
          setSuggestions(names);
        }
      })
      .catch(() => {});
  }, []);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (category !== 'all') filters.push(`Category: ${category}`);
    if (brand) filters.push(`Brand: ${brand}`);
    if (priceRange.min || priceRange.max) {
      const range = PRICE_RANGES.find(r => r.min === priceRange.min && r.max === priceRange.max);
      filters.push(range ? range.label : `₹${priceRange.min || '0'} - ₹${priceRange.max || '∞'}`);
    }
    if (search) filters.push(`Search: "${search}"`);
    return filters;
  }, [category, brand, priceRange, search]);

  const clearFilters = () => {
    setCategory('all');
    setBrand('');
    setPriceRange({ min: '', max: '' });
    setSearch('');
    setSort('');
  };

  useEffect(() => {
    api.get('/api/products/brands')
      .then(res => {
        setBrands(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      const params = {};
      if (category !== 'all') params.category = category;
      if (search.trim()) params.search = search.trim();
      if (sort) params.sort = sort;
      if (brand) params.brand = brand;
      if (priceRange.min) params.minPrice = priceRange.min;
      if (priceRange.max) params.maxPrice = priceRange.max;

      api.get('/api/products', { params })
        .then(res => {
          setProducts(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => toast('Failed to load products', 'error'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [category, search, sort, brand, priceRange]);

  return (
    <div className="page products-page">
      <Helmet>
        <title>Products - Radhika</title>
        <meta name="description" content="Browse our curated collection of premium products with advanced filtering." />
      </Helmet>

      <div className="page-header">
        <h1>Products</h1>
        <p>{Array.isArray(products) ? products.length : 0} products found</p>
      </div>

      <div className="products-toolbar">
        <div className="search-bar search-with-suggest">
          <FiSearch />
          <input
            type="text"
            placeholder="Search products, brands..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            aria-label="Search products"
          />
          {showSuggestions && Array.isArray(suggestions) && suggestions.length > 0 && !search && (
            <div className="search-suggestions">
              {suggestions.map((s, i) => (
                <button key={i} className="suggestion-item" onMouseDown={() => { setSearch(s); setShowSuggestions(false); }}>
                  <FiSearch size={12} /> {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="btn-secondary filter-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle filters">
          <FiSliders size={16} />
          Filters
          {activeFilters.length > 0 && <span className="filter-count">{activeFilters.length}</span>}
        </button>
        <div className="sort-select">
          <FiChevronDown size={14} className="sort-chevron" />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="active-filters">
          {activeFilters.map((f, i) => <span key={i} className="filter-tag">{f}</span>)}
          <button className="clear-filters" onClick={clearFilters}>Clear All</button>
        </div>
      )}

      <div className="products-layout">
        <div className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />
        <aside className={`products-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {sidebarOpen && (
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close filters">
              <FiX size={20} />
            </button>
          )}

          <div className="filter-group">
            <h4>Category</h4>
            <div className="filter-options">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`filter-btn ${category === c ? 'active' : ''}`}
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h4>Price Range</h4>
            <div className="filter-options">
              {PRICE_RANGES.map((r, i) => (
                <button
                  key={i}
                  className={`filter-btn ${priceRange.min === r.min && priceRange.max === r.max ? 'active' : ''}`}
                  onClick={() => setPriceRange({ min: r.min, max: r.max })}
                  aria-pressed={priceRange.min === r.min && priceRange.max === r.max}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {Array.isArray(brands) && brands.length > 0 && (
            <div className="filter-group">
              <h4>Brand</h4>
              <div className="filter-options">
                <button
                  className={`filter-btn ${!brand ? 'active' : ''}`}
                  onClick={() => setBrand('')}
                  aria-pressed={!brand}
                >
                  All Brands
                </button>
                {brands.map(b => (
                  <button
                    key={b}
                    className={`filter-btn ${brand === b ? 'active' : ''}`}
                    onClick={() => setBrand(brand === b ? '' : b)}
                    aria-pressed={brand === b}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <div className="products-main">
          {loading ? (
            <div className="product-grid">
              <ProductSkeleton count={6} />
            </div>
          ) : !Array.isArray(products) || products.length === 0 ? (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Try changing your search or filters.</p>
              <button className="btn-secondary" onClick={clearFilters} style={{ marginTop: 12 }}>Clear Filters</button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      <RecentlyViewed />
    </div>
  );
}

function RecentlyViewed() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('nebula_recently_viewed');
      setItems(raw ? JSON.parse(raw) : []);
    } catch { setItems([]); }
  }, []);
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <section className="section recently-section" style={{ marginTop: 40 }}>
      <div className="section-header">
        <h2><FiClock size={18} /> Recently Viewed</h2>
      </div>
      <div className="product-grid">
        {items.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
