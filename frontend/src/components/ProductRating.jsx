export default function ProductRating({ value = 0, count = 0, size = 'sm' }) {
  const rounded = Math.round(Number(value) || 0);
  const stars = [1, 2, 3, 4, 5];
  const cls = size === 'lg' ? 'rating rating-lg' : 'rating';

  return (
    <div className={cls} aria-label={`Rated ${value} out of 5`}>
      {stars.map((s) => (
        <span key={s} className={s <= rounded ? 'star filled' : 'star'}>
          ★
        </span>
      ))}
      {count > 0 && <span className="rating-count">({count})</span>}

      <style>{`
        .rating { display: inline-flex; align-items: center; gap: 2px; margin: 4px 0; }
        .rating .star { color: #d0d0d0; font-size: 14px; line-height: 1; }
        .rating .star.filled { color: #ffb400; }
        .rating-lg .star { font-size: 20px; }
        .rating-count { font-size: 12px; color: #6b7280; margin-left: 4px; }
      `}</style>
    </div>
  );
}
