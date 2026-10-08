import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService from '../services/productService.js';
import adminService from '../services/adminService.js';
import ProductGrid from '../components/ProductGrid.jsx';
import CategoryMenu from '../components/CategoryMenu.jsx';
import Pagination from '../components/Pagination.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const PAGE_SIZE = 12;

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categoryId = params.get('categoryId') || '';
  const sort = params.get('sort') || 'newest';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const page = Number(params.get('page') || 1);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminService.listCategories();
        setCategories(res.categories || res || []);
      } catch {
        setCategories([]);
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await productService.list({
          categoryId: categoryId || undefined,
          sort,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          page,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        setProducts(res.products || res.items || []);
        setTotal(res.total || res.count || 0);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [categoryId, sort, minPrice, maxPrice, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value == null) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container">
      <h1 className="page-title">All Products</h1>

      <div className="products-layout">
        <CategoryMenu categories={categories} activeId={categoryId} />

        <div className="products-main">
          <div className="filters card">
            <div className="filter-group">
              <label>Sort by</label>
              <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="rating">Top Rated</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Min ₹</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => updateParam('minPrice', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="filter-group">
              <label>Max ₹</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => updateParam('maxPrice', e.target.value)}
                placeholder="100000"
                min="0"
              />
            </div>
            {(categoryId || minPrice || maxPrice || sort !== 'newest') && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setParams({})}
              >
                Clear filters
              </button>
            )}
          </div>

          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {!loading && !error && (
            <>
              <div className="text-muted mb-2" style={{ fontSize: 13 }}>
                {total} product{total === 1 ? '' : 's'} found
              </div>
              <ProductGrid products={products} />
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(p) => updateParam('page', p)}
              />
            </>
          )}
        </div>
      </div>

      <style>{`
        .products-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 24px;
        }
        .filters {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: flex-end;
          margin-bottom: 16px;
          padding: 16px;
        }
        .filter-group { display: flex; flex-direction: column; gap: 4px; }
        .filter-group label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
        }
        .filter-group select,
        .filter-group input {
          padding: 8px 10px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 13px;
          min-width: 130px;
        }
        @media (max-width: 900px) {
          .products-layout { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
