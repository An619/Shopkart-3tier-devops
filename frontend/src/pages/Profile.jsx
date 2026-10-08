import { useEffect, useState } from 'react';
import authService from '../services/authService.js';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', email: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.getProfile();
      const u = data.user || data;
      setProfile(u);
      setForm({ name: u.name || '', email: u.email || '' });
      setAddresses(data.addresses || u.addresses || []);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await authService.updateProfile(form);
      await refreshProfile();
      setMsg('Profile updated');
    } catch (err) {
      setError(err.message || 'Update failed');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await authService.changePassword(pwForm);
      setPwForm({ currentPassword: '', newPassword: '' });
      setMsg('Password changed');
    } catch (err) {
      setError(err.message || 'Password change failed');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="container"><ErrorMessage message={error} onRetry={load} /></div>;

  return (
    <div className="container">
      <h1 className="page-title">My Profile</h1>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="profile-grid">
        <div className="card">
          <h2>Account details</h2>
          <form onSubmit={saveProfile}>
            <div className="form-group">
              <label>Name</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                className="form-control"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input className="form-control" value={profile?.role || user?.role || 'user'} disabled />
            </div>
            <button type="submit" className="btn btn-primary">Save changes</button>
          </form>
        </div>

        <div className="card">
          <h2>Change password</h2>
          <form onSubmit={changePassword}>
            <div className="form-group">
              <label>Current password</label>
              <input
                type="password"
                className="form-control"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>New password</label>
              <input
                type="password"
                className="form-control"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Update password</button>
          </form>
        </div>
      </div>

      <div className="card mt-3">
        <h2>Saved addresses</h2>
        {addresses.length === 0 ? (
          <p className="text-muted">No saved addresses yet.</p>
        ) : (
          <ul className="addr-list">
            {addresses.map((a) => (
              <li key={a.id}>
                <strong>{a.fullName}</strong>
                <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                <div>{a.city}, {a.state} — {a.postalCode}</div>
                <div>{a.country}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .card h2 { font-size: 16px; margin: 0 0 16px; }
        .addr-list { list-style: none; padding: 0; }
        .addr-list li {
          padding: 12px 0; border-bottom: 1px solid #e0e0e0;
          font-size: 14px;
        }
        .addr-list li:last-child { border-bottom: none; }
        @media (max-width: 768px) { .profile-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

