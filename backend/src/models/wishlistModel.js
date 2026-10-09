const { query } = require('../database/pool');

async function getItems(userId) {
  const res = await query(
    `SELECT w.id, w.product_id AS "productId",
            p.name, p.price, p.image_url AS "imageUrl"
       FROM wishlists w
       JOIN products p ON p.id = w.product_id
      WHERE w.user_id = $1
      ORDER BY w.id DESC`,
    [userId]
  );
  return res.rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    product: {
      id: r.productId,
      name: r.name,
      price: r.price,
      imageUrl: r.imageUrl,
    },
  }));
}

async function add(userId, productId) {
  await query(
    `INSERT INTO wishlists (user_id, product_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, product_id) DO NOTHING`,
    [userId, productId]
  );
  return getItems(userId);
}

async function remove(userId, itemId) {
  await query('DELETE FROM wishlists WHERE id = $1 AND user_id = $2', [itemId, userId]);
  return getItems(userId);
}

module.exports = { getItems, add, remove };
