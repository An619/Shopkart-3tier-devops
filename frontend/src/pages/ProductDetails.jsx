import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService from '../services/productService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import ProductRating from '../components/ProductRating.jsx';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { add: addToCart } = useCart();
  const { add: addToWishlist, has: inWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prod, rev] = await Promise.all([
        productService.getById(id),
        productService.getReviews(id).catch(() => ({ reviews: [] })),
      ]);
      setProduct(prod.product || prod);
      setReviews(rev.reviews || []);
    } catch (err) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onAddToCart = async () => {
    if (!isAuthenticated) return navigate('/login');
    await addToCart(product.id, qty);
    navigate('/cart');
  };

  const onAddToWishlist = async () => {
    if (!isAuthenticated) return navigate('/login');
    await addToWishlist(product.id);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return navigate('/login');
    setSubmitting(true);
    try {
      await productService.createReview(product.id, reviewForm);
      setReviewForm({ rating: 5, title: '', comment: '' });
      await load();
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="container"><ErrorMessage message={error} onRetry={load} /></div>;
  if (!product) return null;

  const price = Number(product.price || 0);
  const discountPct = Number(product.discount || 0);
  const mrp = discountPct > 0 ? Math.round(price / (1 - discountPct / 100)) : price;
  const inStock = product.stock == null || product.stock > 0;

  return (
    <div className="container">
      <div className="pd-grid">
        <div className="pd-image">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="pd-ph">{product.name?.[0] || '?'}</div>
          )}
        </div>

        <div className="pd-info">
          <h1 className="pd-title">{product.name}</h1>
          {product.categoryName && <div className="pd-cat">{product.categoryName}</div>}
          <ProductRating value={product.avgRating || 0} count={product.reviewCount || 0} size="lg" />

          <div className="pd-price">
            <span className="pd-now">₹{price.toLocaleString()}</span>
            {discountPct > 0 && (
              <>
                <span className="pd-mrp">₹{mrp.toLocaleString()}</span>
                <span className="pd-off">{discountPct}% off</span>
              </>
            )}
          </div>

          <div className={`pd-stock ${inStock ? 'ok' : 'out'}`}>
            {inStock ? `In stock (${product.stock ?? 'available'})` : 'Out of stock'}
          </div>

          <p className="pd-desc">{product.description || 'No description available.'}</p>

          {inStock && (
            <div className="pd-actions">
              <div className="pd-qty">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
              <button type="button" className="btn btn-accent" onClick={onAddToCart}>
                Add to Cart
              </button>
              <button
                type="button"
                className={`btn btn-outline ${inWishlist(product.id) ? 'active' : ''}`}
                onClick={onAddToWishlist}
              >
                ♥ Wishlist
              </button>
            </div>
          )}

          <div className="badge badge-info mt-3">Demo — payments are simulated</div>
        </div>
      </div>

      <section className="mt-4">
        <h2 className="section-title">Reviews ({reviews.length})</h2>

        {isAuthenticated && (
          <form className="card review-form" onSubmit={submitReview}>
            <h3>Write a review</h3>
            <div className="form-group">
              <label>Rating</label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input
                className="form-control"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Comment</label>
              <textarea
                className="form-control"
                rows="3"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="text-muted">No reviews yet. Be the first!</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="card review-item">
              <div className="flex-between">
                <strong>{r.userName || r.user?.name || 'Anonymous'}</strong>
                <ProductRating value={r.rating} />
              </div>
              {r.title && <h4>{r.title}</h4>}
              <p>{r.comment}</p>
              <span className="text-muted" style={{ fontSize: 12 }}>
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </section>

      <style>{`
        .pd-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          background: #fff;
          padding: 32px;
          border-radius: 8px;
          margin-top: 8px;
        }
        .pd-image {
          aspect-ratio: 1/1;
          background: #f5f6fa;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pd-image img { width: 100%; height: 100%; object-fit: contain; }
        .pd-ph { font-size: 96px; color: #b0bec5; font-weight: 800; }
        .pd-title { font-size: 24px; margin: 0 0 8px; }
        .pd-cat { color: #6b7280; font-size: 13px; margin-bottom: 8px; }
        .pd-price { display: flex; align-items: baseline; gap: 10px; margin: 16px 0; }
        .pd-now { font-size: 28px; font-weight: 700; }
        .pd-mrp { color: #9e9e9e; text-decoration: line-through; }
        .pd-off { color: #388e3c; font-weight: 700; }
        .pd-stock { font-weight: 600; margin: 8px 0; }
        .pd-stock.ok { color: #388e3c; }
        .pd-stock.out { color: #d32f2f; }
        .pd-desc { color: #455a64; line-height: 1.6; margin: 16px 0; }
        .pd-actions { display: flex; gap: 12px; align-items: center; margin-top: 24px; flex-wrap: wrap; }
        .pd-qty {
          display: flex; align-items: center;
          border: 1px solid #e0e0e0; border-radius: 6px;
          overflow: hidden;
        }
        .pd-qty button { width: 36px; height: 40px; background: #fff; border: 0; cursor: pointer; font-size: 18px; }
        .pd-qty span { padding: 0 16px; font-weight: 600; }
        .section-title { font-size: 20px; margin: 32px 0 16px; }
        .review-form h3 { margin-top: 0; }
        .review-item { margin-bottom: 12px; }
        .review-item h4 { margin: 8px 0 4px; font-size: 15px; }
        .review-item p { color: #455a64; margin: 4px 0; }
        .btn-outline.active { color: #e91e63; border-color: #e91e63; }
        @media (max-width: 768px) {
          .pd-grid { grid-template-columns: 1fr; gap: 20px; padding: 20px; }
        }
      `}</style>
    </div>
  );
}
