import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SearchBar() {
  const [params] = useSearchParams();
  const [term, setTerm] = useState(params.get('search') || '');
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    navigate(`/search?search=${encodeURIComponent(q)}`);
  };

  return (
    <form className="search-bar" onSubmit={onSubmit} role="search">
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search for products, brands and more..."
        className="search-input"
        aria-label="Search products"
      />
      <button type="submit" className="search-btn" aria-label="Search">
        🔍
      </button>

      <style>{`
        .search-bar {
          display: flex;
          background: #fff;
          border-radius: 6px;
          overflow: hidden;
        }
        .search-input {
          flex: 1;
          border: 0;
          padding: 10px 14px;
          font-size: 14px;
          outline: none;
        }
        .search-btn {
          background: #fff;
          border: 0;
          padding: 0 14px;
          cursor: pointer;
          font-size: 16px;
          color: #2874f0;
        }
      `}</style>
    </form>
  );
}
