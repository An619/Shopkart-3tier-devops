import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getDashboard();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="container"><ErrorMessage message={error} onRetry={load} /></div>;

  const cards = [
    { label: 'Total Products', value: stats?.totalProducts ?? 0, to: '/admin/products' },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, to: '/admin/orders' },
    { label: 'Total Users', value: stats?.totalUsers ?? 0, to: '/admin/users' },
    { label: 'Revenue (₹)', value: `₹${Number(stats?.totalRevenue || 0).toLocaleString()}`, to: '/admin/orders' },
  ];

  return (
    <div className="container">
      <h1 className="page-title">Admin Dashboard</h1>

      <div className="stats-grid">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="stat-card">
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="card mt-4">
        <h2>Recent orders</h2>
        {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
          <p className="text-muted">No recent orders.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>User</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{o.userName || o.user?.name || '—'}</td>
                  <td>₹{Number(o.total || 0).toLocaleString()}</td>
                  <td><span className="badge badge-info">{o.status}</span></td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .stat-card {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 2px rgba(0,0,0,.05);
          color: inherit;
          transition: all .15s;
        }
        .stat-card:hover { box-shadow: 0 6px 18px rgba(0,0,0,.1); transform: translateY(-2px); text-decoration: none; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; }
        .stat-value { font-size: 26px; font-weight: 800; margin-top: 8px; color: #1f2933; }
        .card h2 { font-size: 16px; margin: 0 0 16px; }
      `}</style>
    </div>
  );
}
