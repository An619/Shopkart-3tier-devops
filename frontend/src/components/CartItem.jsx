import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function CartItem({ item, onUpdate, onRemove }) {
  const [busy, setBusy] = useState(false);
  const product = item.product || {};
  const price = Number(item.price || product.price || 0);
  const qty = item.quantity || 1;
  const subtotal = price * qty;

  const changeQty = async (next) => {
    if (next < 1) return;
    setBusy(true);
    try {
      await onUpdate(item.id, next);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await onRemove(item.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cart-item">
      <Link to={`/products/${item.productId || product.id}`} className="ci-img">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="ci-ph">{(product.name || '?')[0]}</div>
        )}
      </Link>

      <div className="ci-body">
        <Link to={`/products/${item.productId || product.id}`} className="ci-name">
          {product.name || 'Product'}
        </Link>
        {product.categoryName && <div className="ci-cat">{product.categoryName}</div>}
        <div className="ci-price">₹{price.toLocaleString()}</div>
      </div>

      <div className="ci-qty">
        <button
          type="button"
          disabled={busy || qty <= 1}
          onClick={() => changeQty(qty - 1)}
        >
          −
        </button>
        <span>{qty}</span>
        <button type="button" disabled={busy} onClick={() => changeQty(qty + 1)}>
          +
        </button>
      </div>

      <div className="ci-sub">₹{subtotal.toLocaleString()}</div>

      <button
        type="button"
        className="ci-remove"
        onClick={handleRemove}
        disabled={busy}
        aria-label="Remove"
      >
        ✕
      </button>

      <style>{`
        .cart-item {
          display: grid;
          grid-template-columns: 88px 1fr auto auto auto;
          gap: 16px;
          align-items: center;
          padding: 16px;
          background: #fff;
          border-bottom: 1px solid #e0e0e0;
        }
        .cart-item:last-child { border-bottom: none; }
        .ci-img { width: 88px; height: 88px; border-radius: 6px; overflow: hidden; background: #f5f6fa; }
        .ci-img img { width: 100%; height: 100%; object-fit: cover; }
        .ci-ph {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; color: #b0bec5; font-weight: 800;
        }
        .ci-name {
          display: block;
          font-weight: 600;
          color: #1f2933;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .ci-cat { font-size: 12px; color: #6b7280; }
        .ci-price { font-size: 13px; margin-top: 6px; color: #1f2933; font-weight: 600; }
        .ci-qty {
          display: flex;
          align-items: center;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
        }
        .ci-qty button {
          width: 32px; height: 32px;
          background: #fff;
          border: 0;
          cursor: pointer;
          font-size: 16px;
        }
        .ci-qty button:disabled { opacity: .4; cursor: not-allowed; }
        .ci-qty span { padding: 0 12px; font-weight: 600; }
        .ci-sub { font-size: 16px; font-weight: 700; min-width: 90px; text-align: right; }
        .ci-remove {
          background: transparent;
          border: 0;
          color: #9e9e9e;
          cursor: pointer;
          font-size: 16px;
          padding: 6px;
        }
        .ci-remove:hover { color: #d32f2f; }
        @media (max-width: 640px) {
          .cart-item { grid-template-columns: 60px 1fr auto; }
          .ci-sub { grid-column: 2; text-align: left; }
          .ci-qty { grid-column: 2; }
          .ci-remove { grid-column: 3; grid-row: 1; }
        }
      `}</style>
    </div>
  );
}
