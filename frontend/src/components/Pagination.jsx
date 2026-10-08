export default function Pagination({ page = 1, totalPages = 1, onChange }) {
  if (totalPages <= 1) return null;

  const go = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    onChange?.(p);
  };

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="pg-btn" onClick={() => go(page - 1)} disabled={page <= 1}>
        ‹ Prev
      </button>
      {start > 1 && (
        <>
          <button type="button" className="pg-btn" onClick={() => go(1)}>1</button>
          {start > 2 && <span className="pg-dots">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`pg-btn ${p === page ? 'active' : ''}`}
          onClick={() => go(p)}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="pg-dots">…</span>}
          <button type="button" className="pg-btn" onClick={() => go(totalPages)}>
            {totalPages}
          </button>
        </>
      )}
      <button
        type="button"
        className="pg-btn"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
      >
        Next ›
      </button>

      <style>{`
        .pagination {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin: 24px 0;
          flex-wrap: wrap;
        }
        .pg-btn {
          min-width: 36px;
          padding: 8px 12px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }
        .pg-btn:hover:not(:disabled) { border-color: #2874f0; color: #2874f0; }
        .pg-btn.active {
          background: #2874f0;
          border-color: #2874f0;
          color: #fff;
          font-weight: 600;
        }
        .pg-btn:disabled { opacity: .4; cursor: not-allowed; }
        .pg-dots { align-self: center; color: #6b7280; }
      `}</style>
    </nav>
  );
}

