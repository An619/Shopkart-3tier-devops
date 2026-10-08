export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="error-box" role="alert">
      <span className="err-icon">⚠</span>
      <div className="err-text">
        <strong>Something went wrong</strong>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}

      <style>{`
        .error-box {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 16px;
          background: #ffebee;
          border: 1px solid #ffcdd2;
          border-radius: 8px;
          color: #b71c1c;
          margin: 16px 0;
        }
        .err-icon { font-size: 22px; }
        .err-text { flex: 1; }
        .err-text strong { display: block; font-size: 14px; }
        .err-text p { margin: 4px 0 0; font-size: 13px; }
      `}</style>
    </div>
  );
}
