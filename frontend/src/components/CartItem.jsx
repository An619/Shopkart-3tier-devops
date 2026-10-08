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
          display
