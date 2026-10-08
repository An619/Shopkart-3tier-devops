import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../services/adminService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminService.listCategories();
        setCategories(res.categories || res || []);
      } catch (err) {
        setError(err.message || 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="container"><ErrorMessage message={error} /></div>;

  return (
    <div className="container">
      <h1 className="page-title">Browse Categories</h1>
      {categories.length === 0 ? (
        <p className="text-muted">No categories yet.</p>
      ) : (
        <div className="cat-grid">
          {categories.map((c) => (
            <Link key={c.id} to={`/products?categoryId=${c.id}`} className="cat-tile">
              <div className="cat-tile-icon">{(c.name || '?')[0]}</div>
              <div className="cat-tile-name">{c.name}</div>
              {c.description && <p className="cat-tile-desc">{c.description}</p>}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .cat-tile {
          background: #fff;
          border-radius: 8px;
          padding: 24px 20px;
          text-align: center;
          box-shadow: 0 1px 2px rgba(0,0,0,.05);
          color: #1f2933;
          transition: all .15s;
        }
        .cat-tile:hover { box-shadow: 0 6px 18px rgba(0,0,0,.12); transform: translateY(-2px); text-decoration: none; }
        .cat-tile-icon {
          width: 56px; height: 56px;
          margin: 0 auto 12px;
          background: #e3f2fd;
          color: #2874f0;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; font-weight: 800;
        }
        .cat-tile-name { font-size: 15px; font-weight: 600; }
        .cat-tile-desc { color: #6b7280; font-size: 12px; margin: 6px 0 0; }
      `}</style>
    </div>
  );
}
