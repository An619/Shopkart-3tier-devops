import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import CartItem from '../components/CartItem.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Cart() {
  const { items, loading, error, subtotal, update, remove, refresh } = useCart();
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner />;

  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 49;
  const total = subtotal + shipping;

  return (
    <div className="container">
      <h1 className="page-title">My Cart</h1>

      {error && <ErrorMessage message={error} onRetry={refresh} />}

      {items.length === 0 ? (
        <div className="card text-center">
          <p className="text-muted">Your cart is empty.</p>
          <Link to="/products" className="btn btn-primary mt-3">Continue shopping</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="card cart-list" style={{ padding: 0 }}>
            {items.map((it) => (
              <CartItem key={it.id} item={it} onUpdate={update} onRemove={remove} />
            ))}
          </div>

          <aside className="card cart-summary">
            <h2>Order Summary</h2>
            <div className="row"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
            <div className="row total"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
            <button
              type="button"
              className="btn btn-accent btn-block mt-3"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>
            <p className="text-muted text-center mt-2" style={{ fontSize: 12 }}>
              Simulated payment — no real money charged.
            </p>
          </aside>
        </div>
      )}

      <style>{`
        .cart-layout { display: grid; grid-template-columns: 1fr 320px; gap: 16px; align-items: start; }
        .cart-list { overflow: hidden; }
        .cart-summary { position: sticky; top: 90px; }
        .cart-summary h2 { font-size: 14px; text-transform: uppercase; color: #6b7280; margin: 0 0 16px; letter-spacing: .5px; }
        .cart-summary .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .cart-summary .row.total { border-top: 1px solid #e0e0e0; margin-top: 8px; padding-top: 12px; font-weight: 700; font-size: 16px; }
        @media (max-width: 900px) { .cart-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
