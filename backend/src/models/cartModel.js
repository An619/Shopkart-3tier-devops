const { query } = require('../database/pool');

async function getOrCreateCart(userId) {
  const existing = await query('SELECT * FROM carts WHERE user_id = $1', [userId]);
  if (existing.rows[0]) return existing.rows[0];

  const created = await query(
    'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
    [userId]
  );
  return created.rows[0];
}

async function getItems(userId) {
  const res = await query(
    `SELECT ci.id, ci.quantity, ci.price, ci.product_id AS "productId",
            p.name, p.image_url AS "imageUrl", p.stock,
            c.name AS "categoryName"
       FROM cart_items ci
       JOIN carts ct ON ct.id = ci.cart_id
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN categories c ON c.id = p.category_id
      WHERE ct.user_id = $1
      ORDER BY ci.id DESC`,
    [userId]
  );
  return res.rows.map((r) => ({
    id: r.id,
    quantity: r.quantity,
    price: r.price,
    productId: r.productId,
    product: {
      id: r.productId,
      name: r.name,
      imageUrl: r.imageUrl,
      stock: r.stock,
      categoryName: r.categoryName,
      price: r.price,
    },
  }));
}

async function addItem(userId, { productId, quantity }) {
  const cart = await getOrCreateCart(userId);
  const prod = await query('SELECT price FROM products WHERE id = $1', [productId]);
  if (!prod.rows[0]) return null;

  const existing = await query(
    'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
    [cart.id, productId]
  );

  if (existing.rows[0]) {
    await query(
      'UPDATE cart_items SET quantity = quantity + $2 WHERE id = $1',
      [existing.rows[0].id, quantity]
    );
  } else {
    await query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4)`,
      [cart.id, productId, quantity, prod.rows[0].price]
    );
  }
  return getItems(userId);
}

async function updateItem(userId, itemId, quantity) {
  await query(
    `UPDATE cart_items ci
        SET quantity = $3
       FROM carts c
      WHERE ci.id = $2 AND ci.cart_id = c.id AND c.user_id = $1`,
    [userId, itemId, quantity]
  );
  return getItems(userId);
}

async function removeItem(userId, itemId) {
  await query(
    `DELETE FROM cart_items ci
     USING carts c
     WHERE ci.id = $2 AND ci.cart_id = c.id AND c.user_id = $1`,
    [userId, itemId]
  );
  return getItems(userId);
}

async function clear(userId) {
  await query(
    `DELETE FROM cart_items ci
     USING carts c
     WHERE ci.cart_id = c.id AND c.user_id = $1`,
    [userId]
  );
}

module.exports = { getOrCreateCart, getItems, addItem, updateItem, removeItem, clear };
