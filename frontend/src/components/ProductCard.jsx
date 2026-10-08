import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import ProductRating from './ProductRating.jsx';

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { add: addToCart } = useCart();
  const { add: addToWishlist, has: inWishlist } = useWishlist();
  const navigate = useNavigate();

  const price = Number(product.price || 0);
  const discountPct = Number(product.discount || 0);
  const mrp = discountPct > 0 ? Math.round(price / (1 - discountPct / 100)) : price;
  const inStock = product.stock == null || product.stock > 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return navigate('/login');
    if (!inStock) return;
    await addToCart(product.id, 1);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return navigate('/login');
    await addToWishlist(product.id);
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`} className="pc-link">
        <div className="pc-image">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} loading="lazy" />
          ) : (
            <div className="pc-placeholder">{product.name?.[0] || '?'}</div>
          )}
          {discountPct > 0 && <span className="pc-discount">-{discountPct}%</span>}
        </div>
        <div className="pc-body">
          <div className="pc-name" title={product.name}>{product.name}</div>
          {product.categoryName && <div className="pc-cat">{product.categoryName}</div>}
          <ProductRating value={product.avgRating || 0} count={product.reviewCount || 0} />
          <div className="pc-price">
            <span className="pc-price-now">₹{price.toLocaleString()}</span>
            {discountPct > 0 && <span className="pc-price-mrp">₹{mrp.toLocaleString()}</span>}
          </div>
          {!inStock && <div className="pc-out">Out of stock</div>}
        </div>
      </Link>

      <div className="pc-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm btn-block"
          onClick={handleAddToCart}
          disabled={!inStock}
        >
          Add to Cart
        </button>
        <button
          type="button"
          className={`pc-wish ${inWishlist(product.id) ? 'active' : ''}`}
          onClick={handleWishlist}
          aria-label="Add to wishlist"
        >
          ♥
        </button>
      </div>

      <style>{`
        .product-card {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0,0,0,.05);
          display: flex;
          flex-direction: column;
          position: relative;
          transition: box-shadow .15s, transform .15s;
        }
        .product-card:hover {
          box-shadow: 0 6px 18px rgba(0,0,0,.12);
          transform: translateY(-2px);
        }
        .pc-link { color: inherit; text-decoration: none; }
        .pc-link:hover { text-decoration: none; }
        .pc-image {
          aspect-ratio: 1/1;
          background: #f5f6fa;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .pc-image img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .pc-placeholder {
          font-size: 48px;
          font-weight: 800;
          color: #b0bec5;
        }
        .pc-discount {
          position: absolute;
          top: 8px; left: 8px;
          background: #388e3c;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .pc-body { padding: 12px; }
        .pc-name {
          font-size: 14px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          min-height: 38px;
        }
        .pc-cat { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .pc-price { margin-top: 8px; display: flex; align-items: baseline; gap: 6px; }
        .pc-price-now { font-size: 17px; font-weight: 700; color: #1f2933; }
        .pc-price-mrp { font-size: 12px; color: #9e9e9e; text-decoration: line-through; }
        .pc-out { font-size: 12px; color: #d32f2f; font-weight: 600; margin-top: 4px; }
        .pc-actions {
          padding: 0 12px 12px;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .pc-actions .btn { flex: 1; }
        .pc-wish {
          background: #fff;
          border: 1px solid #e0e0e0;
          width: 36px; height: 36px;
          border-radius: 6px;
          cursor: pointer;
          color: #b0bec5;
          font-size: 15px;
        }
        .pc-wish.active { color: #e91e63; border-color: #e91e63; }
      `}</style>
    </div>
  );
}
