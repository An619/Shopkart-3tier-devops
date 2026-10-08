import { Link } from 'react-router-dom';

export default function CategoryMenu({ categories = [], activeId }) {
  if (!categories.length) return null;

  return (
    <aside className="cat-menu">
      <h3 className="cat-menu-title">Categories</h3>
      <ul>
        {categories.map((c) => (
          <li key={c.id} className={String(c.id) === String(activeId) ? 'active' : ''}>
            <Link to={`/products?categoryId=${c.id}`}>
              {c.name}
              {typeof c.productCount === 'number' && (
                <span className="cat-count">({c.productCount})</span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <style>{`
        .cat-menu {
          background: #fff;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 2px rgba(0,0,0,.05);
        }
        .cat-menu-title {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #6b7280;
          margin: 0 0 12px;
        }
        .cat-menu ul { list-style: none; padding: 0; margin: 0; }
        .cat-menu li { margin-bottom: 4px; }
        .cat-menu a {
          display: flex;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 14px;
          color: #1f2933;
        }
        .cat-menu a:hover { background: #f5f6fa; text-decoration: none; }
        .cat-menu .active a { background: #e3f2fd; color: #2874f0; font-weight: 600; }
        .cat-count { color: #6b7280; font-size: 12px; }
      `}</style>
    </aside>
  );
}
