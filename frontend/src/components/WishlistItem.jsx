import { Link } from 'react-router-dom';

export default function WishlistItem({ item, onRemove, onAddToCart }) {
  const product = item.product || {};
  const price = Number(product.price || 0);

  return (
    <div className="wish-item">
      <Link to={`/products/${item.productId || product.id}`} className="wi-img">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="wi-ph">{(product.name || '?')[0]}</div>
        )}
      </Link>
      <div className="wi-body">
        <Link to={`/products/${item.productId || product.id}`} className="wi-name">
          {product.name || 'Product'}
        </Link>
        <div className="wi-price">₹{price.toLocaleString()}</div>
      </div>
      <div className="wi-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onAddToCart(item.productId || product.id)}
        >
          Add to Cart
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onRemove(item.id)}
        >
          Remove
        </button>
      </div>

      <style>{`
        .wish-item {
          display: grid;
          grid-template-columns: 80px 1fr auto;
          gap: 16px;
          align-items: center;
          padding: 14px;
          background: #fff;
          border-bottom: 1px solid #e0e0e0;
        }
        .wish-item:last-child { border-bottom: none; }
        .wi-img { width: 80px; height: 80px; border-radius: 6px; overflow: hidden; background: #f5f6fa; }
        .wi-img img { width: 100%; height: 100%; object-fit: cover; }
        .wi-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 26px; color: #b0bec5; font-weight: 800; }
        .wi-name { display: block; font-weight: 600; color: #1f2933; font-size: 14px; }
        .wi-price { font-size: 14px; font-weight: 700; margin-top: 4px; }
        .wi-actions { display: flex; gap: 8px; }
        @media (max-width: 640px) {
          .wi-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
