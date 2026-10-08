import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import productService from '../services/productService.js';
import ProductGrid from '../components/ProductGrid.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get('search') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await productService.search(query, { limit: 50 });
        setProducts(res.products || res.items || []);
      } catch (err) {
        setError(err.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);

  return (
    <div className="container">
      <h1 className="page-title">
        Search results {query && <>for &ldquo;{query}&rdquo;</>}
      </h1>

      {!query ? (
        <p className="text-muted">Type something in the search bar to get started.</p>
      ) : loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : products.length === 0 ? (
        <div className="text-center mt-4">
          <p className="text-muted">No products match &ldquo;{query}&rdquo;.</p>
          <Link to="/products" className="btn btn-primary mt-3">Browse all products</Link>
        </div>
      ) : (
        <>
          <div className="text-muted mb-3" style={{ fontSize: 13 }}>
            {products.length} result{products.length === 1 ? '' : 's'}
          </div>
          <ProductGrid products={products} />
        </>
      )}
    </div>
  );
}
