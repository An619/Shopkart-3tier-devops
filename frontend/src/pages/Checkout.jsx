import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import orderService from '../services/orderService.js';

const emptyAddress = {
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  phone: '',
};

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState(emptyAddress);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 49;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="container">
        <h1 className="page-title">Checkout</h1>
        <div className="card text-center">
          <p className="text-muted">Your cart is empty.</p>
          <Link to="/products" className="btn btn-primary mt-3">Continue shopping</Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      // Simulated payment + order creation happen together on the backend.
      const res = await orderService.create({ shippingAddress: address, paymentMethod: 'MOCK' });
      await clear();
      const orderId = res.order?.id || res.id;
      navigate(`/orders/${orderId}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Checkout</h1>

      <div className="alert alert-info">
        <strong>Simulated payment:</strong> This demo does not charge real money.
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={onSubmit} className="checkout-grid">
        <div className="card">
          <h2>Shipping Address</h2>
          <div className="grid-2">
            <div className="form-group">
              <label>Full name</label>
              <input
                className="form-control"
                value={address.fullName}
                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                className="form-control"
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Address line 1</label>
            <input
              className="form-control"
              value={address.line1}
              onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Address line 2 (optional)</label>
            <input
              className="form-control"
              value={address.line2}
              onChange={(e) => setAddress({ ...address, line2: e.target.value })}
            />
          </div>
          <div className="grid-3">
            <div className="form-group">
              <label>City</label>
              <input
                className="form-control"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                className="form-control"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Postal code</label>
              <input
                className="form-control"
                value={address.postalCode}
                onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Country</label>
            <input
              className="form-control"
              value={address.country}
              onChange={(e) => setAddress({ ...address, country: e.target.value })}
              required
            />
          </div>
        </div>

        <aside className="card summary">
          <h2>Order Summary</h2>
          {items.map((it) => (
            <div key={it.id} className="row">
              <span>{it.product?.name || 'Item'} × {it.quantity}</span>
              <span>₹{((it.price || it.product?.price || 0) * it.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="row"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
          <div className="row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
          <div className="row total"><span>Total</span><span>₹{total.toLocaleString()}</span></div>

          <button type="submit" className="btn btn-accent btn-block mt-3" disabled={busy}>
            {busy ? 'Placing order…' : `Pay ₹${total.toLocaleString()} (Simulated)`}
          </button>
        </aside>
      </form>

      <style>{`
        .checkout-grid { display: grid; grid-template-columns: 1fr 340px; gap: 16px; align-items: start; }
        .card h2 { font-size: 16px; margin: 0 0 16px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .summary { position: sticky; top: 90px; }
        .summary .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .summary .row.total { border-top: 1px solid #e0e0e0; margin-top: 8px; padding-top: 12px; font-weight: 700; font-size: 16px; }
        @media (max-width: 900px) {
          .checkout-grid { grid-template-columns: 1fr; }
          .grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
