import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../services/orderService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getById(id);
      setOrder(res.order || res);
    } catch (err) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await orderService.cancel(id);
      setMsg('Order cancelled');
      await load();
    } catch (err) {
      setError(err.message || 'Failed to cancel');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="container"><ErrorMessage message={error} onRetry={load} /></div>;
  if (!order) return null;

  const items = order.items || [];
  const canCancel = !['cancelled', 'delivered', 'shipped'].includes((order.status || '').toLowerCase());

  return (
    <div className="container">
      <div className="flex-between mb-3">
        <h1 className="page-title" style={{ margin: 0 }}>Order #{order.id}</h1>
        <Link to="/orders" className="btn btn-outline btn-sm">← All orders</Link>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card">
        <div className="flex-between">
          <div>
            <div className="text-muted" style={{ fontSize: 12 }}>Placed on</div>
            <strong>{new Date(order.createdAt).toLocaleString()}</strong>
          </div>
          <span className="badge badge-info">{order.status}</span>
        </div>
      </div>

      <div className="card mt-3">
        <h2>Items</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.productName || it.product?.name || `Product #${it.productId}`}</td>
                <td>₹{Number(it.price || 0).toLocaleString()}</td>
                <td>{it.quantity}</td>
                <td>₹{(Number(it.price || 0) * it.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="order-cols mt-3">
        <div className="card">
          <h2>Shipping address</h2>
          {order.shippingAddress ? (
            <address className="addr">
              <strong>{order.shippingAddress.fullName}</strong>
              <div>{order.shippingAddress.line1}</div>
              {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
              <div>
                {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.postalCode}
              </div>
              <div>{order.shippingAddress.country}</div>
              {order.shippingAddress.phone && <div>📞 {order.shippingAddress.phone}</div>}
            </address>
          ) : (
            <p className="text-muted">No address on file.</p>
          )}
        </div>

        <div className="card">
          <h2>Payment</h2>
          <p className="text-muted" style={{ fontSize: 13 }}>
            Method: <strong>{order.paymentMethod || 'MOCK'}</strong>
          </p>
          <p className="badge badge-info">Simulated — no real payment</p>

          <div className="totals mt-3">
            <div className="row"><span>Subtotal</span><span>₹{Number(order.subtotal || 0).toLocaleString()}</span></div>
            <div className="row"><span>Shipping</span><span>₹{Number(order.shipping || 0).toLocaleString()}</span></div>
            <div className="row total"><span>Total</span><span>₹{Number(order.total || 0).toLocaleString()}</span></div>
          </div>

          {canCancel && (
            <button type="button" className="btn btn-danger btn-block mt-3" onClick={cancel}>
              Cancel order
            </button>
          )}
        </div>
      </div>

      <style>{`
        .card h2 { font-size: 14px; text-transform: uppercase; color: #6b7280; letter-spacing: .5px; margin: 0 0 12px; }
        .order-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .addr { font-style: normal; font-size: 14px; line-height: 1.7; }
        .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
        .totals .row.total { border-top: 1px solid #e0e0e0; margin-top: 6px; padding-top: 10px; font-weight: 700; }
        @media (max-width: 768px) { .order-cols { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
