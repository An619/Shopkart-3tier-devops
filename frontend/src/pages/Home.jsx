import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import productService from '../services/productService.js';
import adminService from '../services/adminService.js';
import ProductGrid from '../components/ProductGrid.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.list({ limit: 8, sort: 'rating' }),
        adminService.listCategories().catch(() => ({ categories: [] })),
      ]);
      setFeatured(prodRes.products || prodRes.items || []);
      setCategories(catRes.categories || catRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load home data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-content">
          <h1>Shop Smart. Shop Fast.</h1>
          <p>Millions of products across Mobiles, Laptops, Fashion, Books &amp; more.</p>
          <Link to="/products" className="btn btn-accent">Start Shopping →</Link>
        </div>
        <div className="hero-badge">
          <span className="badge badge-warn">Demo</span>
          <p>Simulated payments only</p>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="section-title">Shop by Category</h2>
        {categories.length === 0 ? (
          <p className="text-muted">Categories will appear once the backend is running.</p>
        ) : (
          <div className="cat-strip">
            {categories.slice(0, 8).map((c) => (
              <Link key={c.id} to={`/products?categoryId=${c.id}`} className="cat-chip">
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-4">
        <h2 className="section-title">Top Rated</h2>
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onRetry={load} />}
        {!loading && !error && <ProductGrid products={featured} />}
      </section>

      <style>{`
        .hero {
          background: linear-gradient(135deg, #2874f0, #1a5dc8);
          color: #fff;
          border-radius: 12px;
          padding: 40px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }
        .hero h1 { font-size: 32px; margin: 0 0 8px; }
        .hero p { margin: 0 0 20px; opacity: .9; }
        .hero-badge {
          background: rgba(255,255,255,.15);
          padding: 12px 20px;
          border-radius: 8px;
          text-align: right;
        }
        .hero-badge p { margin: 8px 0 0; font-size: 12px; }
        .section-title {
          font-size: 20px;
          font-weight: 700;
          margin: 32px 0 16px;
        }
        .cat-strip {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .cat-chip {
          background: #fff;
          border: 1px solid #e0e0e0;
          padding: 10px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          color: #1f2933;
        }
        .cat-chip:hover { border-color: #2874f0; color: #2874f0; text-decoration: none; }
        @media (max-width: 640px) {
          .hero { flex-direction: column; align-items: flex-start; gap: 16px; padding: 24px 20px; }
          .hero h1 { font-size: 24px; }
        }
      `}</style>
    </div>
  );
}
