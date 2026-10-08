import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../services/orderService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const statusClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'delivered': return 'badge-success';
    case 'shipped': return 'badge-info';
    case 'cancelled': return 'badge-danger';
    case 'processing': return 'badge-warn';
    default: return 'badge-info';
  }
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.list();
      setOrders(res.orders || res || []);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="container"><ErrorMessage message={error} onRetry={load} /></div>;

  return (
    <div className="container">
      <h1 className="page-title">My Orders</h1>

      {orders.length === 0 ? (
        <div className="card text-center">
          <p className="text-muted">You haven&apos;t placed any orders yet.</p>
          <Link to="/products" className="btn btn-primary mt-3">Start shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((o) => (
            <div key={o.id} className="card order-row">
              <div className="flex-between">
                <div>
                  <strong>Order #{o.id}</strong>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className={`badge ${statusClass(o.status)}`}>{o.status}</span>
              </div>
              <div className="flex-between mt-2">
                <span className="text-muted" style={{ fontSize: 13 }}>
                  {o.itemCount || o.items?.length || 0} item(s)
                </span>
                <strong>₹{Number(o.total || 0).toLocaleString()}</strong>
              </div>
              <Link to={`/orders/${o.id}`} className="btn btn-outline btn-sm mt-3">
                View details →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

