import { useEffect, useState } from 'react';
import adminService from '../../services/adminService.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.listOrders({ limit: 100 });
      setOrders(res.orders || res || []);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (order, status) => {
    try {
      await adminService.updateOrderStatus(order.id, status);
      await load();
    } catch (err) {
      setError(err.message || 'Update failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <h1 className="page-title">Manage Orders</h1>
      {error && <ErrorMessage message={error} onRetry={load} />}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th><th>User</th><th>Total</th><th>Status</th><th>Date</th><th>Change status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id}</td>
              <td>{o.userName || o.user?.name || '—'}</td>
              <td>₹{Number(o.total || 0).toLocaleString()}</td>
              <td><span className="badge badge-info">{o.status}</span></td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td>
                <select
                  value={o.status}
                  onChange={(e) => changeStatus(o, e.target.value)}
                  className="form-control"
                  style={{ padding: '4px 8px', fontSize: 13 }}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
