import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import SearchBar from './SearchBar.jsx';

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand">
          <span className="brand-mark">S</span>
          <span className="brand-text">
            Shop<span>Kart</span>
          </span>
        </Link>

        <div className="navbar-search">
          <SearchBar />
        </div>

        <nav className="navbar-links">
          <NavLink to="/products" className="navbar-link">
            Products
          </NavLink>
          <NavLink to="/categories" className="navbar-link">
            Categories
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink to="/wishlist" className="navbar-link navbar-icon">
                ♥ <span className="navbar-badge">{wishlistCount}</span>
              </NavLink>
              <NavLink to="/cart" className="navbar-link navbar-icon">
                🛒 <span className="navbar-badge">{cartCount}</span>
              </NavLink>

              <div className="navbar-user">
                <button
                  type="button"
                  className="navbar-user-btn"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  {user?.name || 'Account'} ▾
                </button>
                {menuOpen && (
                  <div className="navbar-menu" onMouseLeave={() => setMenuOpen(false)}>
                    <Link to="/profile">Profile</Link>
                    <Link to="/orders">My Orders</Link>
                    {isAdmin && <Link to="/admin">Admin Dashboard</Link>}
                    <button type="button" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" className="navbar-link">
                Login
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>

      <style>{`
        .navbar {
          background: #2874f0;
          color: #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,.15);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 12px 16px;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-size: 20px;
          font-weight: 700;
          text-decoration: none;
          flex-shrink: 0;
        }
        .navbar-brand:hover { text-decoration: none; }
        .brand-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px; height: 32px;
          background: #fff;
          color: #2874f0;
          border-radius: 6px;
          font-size: 18px;
          font-weight: 800;
        }
        .brand-text { font-style: italic; }
        .brand-text span { color: #ffe500; }
        .navbar-search { flex: 1; max-width: 560px; }
        .navbar-links {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }
        .navbar-link {
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          padding: 6px 4px;
        }
        .navbar-link:hover { text-decoration: none; color: #ffe500; }
        .navbar-icon { position: relative; }
        .navbar-badge {
          display: inline-block;
          background: #fb641b;
          color: #fff;
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 999px;
          margin-left: 2px;
          vertical-align: top;
        }
        .navbar-user { position: relative; }
        .navbar-user-btn {
          background: transparent;
          border: 0;
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }
        .navbar-menu {
          position: absolute;
          right: 0;
          top: 32px;
          background: #fff;
          color: #1f2933;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,.18);
          min-width: 180px;
          overflow: hidden;
        }
        .navbar-menu a,
        .navbar-menu button {
          display: block;
          width: 100%;
          padding: 10px 14px;
          text-align: left;
          background: transparent;
          border: 0;
          font-size: 14px;
          color: #1f2933;
          text-decoration: none;
          cursor: pointer;
        }
        .navbar-menu a:hover,
        .navbar-menu button:hover { background: #f5f6fa; }
        @media (max-width: 768px) {
          .navbar-inner { flex-wrap: wrap; }
          .navbar-search { order: 3; width: 100%; max-width: none; }
        }
      `}</style>
    </header>
  );
}
