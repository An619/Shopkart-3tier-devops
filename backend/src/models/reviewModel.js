const { query } = require('../database/pool');

async function listForProduct(productId) {
  const res = await query(
    `SELECT r.id, r.rating, r.title, r.comment,
            r.created_at AS "createdAt",
            u.name AS "userName"
       FROM reviews r
       JOIN users u ON u.id = r.user_id
      WHERE r.product_id = $1
      ORDER BY r.id DESC`,
    [productId]
  );
  return res.rows;
}

async function create({ productId, userId, rating, title, comment }) {
  const res = await query(
    `INSERT INTO reviews (product_id, user_id, rating, title, comment)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id, user_id)
     DO UPDATE SET rating = EXCLUDED.rating,
                   title = EXCLUDED.title,
                   comment = EXCLUDED.comment,
                   created_at = NOW()
     RETURNING *`,
    [productId, userId, rating, title || '', comment || '']
  );
  return res.rows[0];
}

async function remove(reviewId, userId) {
  await query('DELETE FROM reviews WHERE id = $1 AND user_id = $2', [reviewId, userId]);
}

async function statsForProduct(productId) {
  const res = await query(
    `SELECT COALESCE(AVG(rating), 0)::numeric(3,2) AS "avgRating",
            COUNT(*)::int AS "reviewCount"
       FROM reviews WHERE product_id = $1`,
    [productId]
  );
  return res.rows[0];
}

module.exports = { listForProduct, create, remove, statsForProduct };
