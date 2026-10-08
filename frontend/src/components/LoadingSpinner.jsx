export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <div className="spinner" />
      <span className="spinner-label">{label}</span>

      <style>{`
        .spinner-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #6b7280;
        }
        .spinner {
          width: 36px; height: 36px;
          border: 3px solid #e0e0e0;
          border-top-color: #2874f0;
          border-radius: 50%;
          animation: sk-spin .8s linear infinite;
        }
        .spinner-label { margin-top: 10px; font-size: 13px; }
        @keyframes sk-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
