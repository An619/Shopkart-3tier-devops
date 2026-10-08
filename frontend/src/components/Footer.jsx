export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-col">
          <h4>ShopKart</h4>
          <p className="text-muted">Shop Smart. Shop Fast.</p>
          <p className="text-muted" style={{ fontSize: 12 }}>
            Demo project — no real payments.
          </p>
        </div>
        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><a href="/products">All Products</a></li>
            <li><a href="/categories">Categories</a></li>
            <li><a href="/wishlist">Wishlist</a></li>
            <li><a href="/cart">Cart</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <ul>
            <li><a href="/login">Login</a></li>
            <li><a href="/register">Register</a></li>
            <li><a href="/orders">Orders</a></li>
            <li><a href="/profile">Profile</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>About</h4>
          <p className="text-muted" style={{ fontSize: 13 }}>
            A 3-tier e-commerce reference app for DevOps practice.
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          © {new Date().getFullYear()} ShopKart — Fictional demo. MIT Licensed.
        </div>
      </div>

      <style>{`
        .footer {
          background: #172337;
          color: #cfd8dc;
          margin-top: 40px;
        }
        .footer-inner {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 2fr;
          gap: 24px;
          padding: 32px 16px;
        }
        .footer h4 {
          color: #fff;
          font-size: 14px;
          margin: 0 0 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .footer ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .footer ul li { margin-bottom: 6px; }
        .footer a { color: #cfd8dc; font-size: 13px; }
        .footer a:hover { color: #fff; }
        .footer-bottom {
          background: #0f1a2a;
          padding: 12px 0;
          font-size: 12px;
          color: #90a4ae;
          text-align: center;
        }
        @media (max-width: 768px) {
          .footer-inner { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </footer>
  );
}
