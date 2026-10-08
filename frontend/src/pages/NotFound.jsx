import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container text-center" style={{ padding: '60px 16px' }}>
      <h1 style={{ fontSize: 72, margin: 0, color: '#2874f0' }}>404</h1>
      <p className="text-muted">We couldn&apos;t find that page.</p>
      <Link to="/" className="btn btn-primary mt-3">Back to home</Link>
    </div>
  );
}
