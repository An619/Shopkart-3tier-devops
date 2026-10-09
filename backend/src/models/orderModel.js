const { query } = require('../database/pool');

async function createWithItems(userId, { items, shippingAddress, paymentMethod = 'MOCK', totals }) {
  const client = await require('../database/pool').pool.connect();
  try {
    await client.query('BEGIN');

    const orderRes = await client.query(
      `INSERT INTO orders
         (user_id, status, subtotal, shipping, total, payment_method, shipping_address)
       VALUES ($1, 'pending', $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        userId,
        totals.subtotal,
        totals.shipping,
        totals.total,
        paymentMethod,
        JSON.stringify(shippingAddress),
      ]
    );

    const orderId = orderRes.rows[0].id;

    for (const it of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, product_name)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, it.productId, it.quantity, it.price, it.productName || null]
      );
      await client.query(
        'UPDATE products SET stock = GREATEST(stock - $2, 0), updated_at = NOW() WHERE id = $1',
        [it.productId, it.quantity]
      );
    }

    await client.query(
      `INSERT INTO payments (order_id, provider, status, amount, transaction_ref)
       VALUES ($1, 'MOCK', 'succeeded', $2, $3)`,
      [orderId, totals.total, `MOCK-${Date.now()}`]
    );

    await client.query('COMMIT');
    return orderId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listForUser(userId, { limit = 50, offset = 0 } = {}) {
  const res = await query(
    `SELECT o.id, o.status, o.subtotal, o.shipping, o.total,
            o.created_at AS "createdAt",
            (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS "itemCount"
       FROM orders o
      WHERE o.user_id = $1
      ORDER BY o.id DESC
      LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return res.rows;
}

async function findByIdForUser(userId, orderId) {
  const orderRes = await query(
    `SELECT o.*, o.created_at AS "createdAt"
       FROM orders o
      WHERE o.id = $1 AND o.user_id = $2`,
    [orderId, userId]
  );
  const order = orderRes.rows[0];
  if (!order) return null;

  const itemsRes = await query(
    `SELECT oi.id, oi.product_id AS "productId", oi.quantity, oi.price,
            oi.product_name AS "productName",
            p.name, p.image_url AS "imageUrl"
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1`,
    [orderId]
  );

  return {
    ...order,
    items: itemsRes.rows.map((r) => ({
      ...r,
      product: { id: r.productId, name: r.name, imageUrl: r.imageUrl },
    })),
    shippingAddress: order.shipping_address,
    paymentMethod: order.payment_method,
  };
}

async function cancel(userId, orderId) {
  await query(
    `UPDATE orders
        SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND status NOT IN ('shipped', 'delivered')`,
    [orderId, userId]
  );
}

async function listAll({ limit = 100, offset = 0 } = {}) {
  const res = await query(
    `SELECT o.id, o.status, o.total, o.created_at AS "createdAt",
            u.name AS "userName", u.email AS "userEmail"
       FROM orders o
       JOIN users u ON u.id = o.user_id
      ORDER BY o.id DESC
      LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
}

async function updateStatus(orderId, status) {
  const res = await query(
    `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [orderId, status]
  );
  return res.rows[0] || null;
}

async function dashboardStats() {
  const [prod, ord, usr, rev, recent] = await Promise.all([
    query('SELECT COUNT(*)::int AS n FROM products'),
    query('SELECT COUNT(*)::int AS n FROM orders'),
    query('SELECT COUNT(*)::int AS n FROM users'),
    query(`SELECT COALESCE(SUM(total), 0)::numeric AS n FROM orders WHERE status <> 'cancelled'`),
    query(
      `SELECT o.id, o.status, o.total, o.created_at AS "createdAt", u.name AS "userName"
         FROM orders o JOIN users u ON u.id = o.user_id
        ORDER BY o.id DESC LIMIT 5`
    ),
  ]);

  return {
    totalProducts: prod.rows[0].n,
    totalOrders: ord.rows[0].n,
    totalUsers: usr.rows[0].n,
    totalRevenue: Number(rev.rows[0].n),
    recentOrders: recent.rows,
  };
}

module.exports = {
  createWithItems,
  listForUser,
  findByIdForUser,
  cancel,
  listAll,
  updateStatus,
  dashboardStats,
};
