const { query } = require('../database/pool');

const BASE_SELECT = `
  SELECT p.id, p.name, p.description, p.price, p.discount, p.stock,
         p.image_url AS "imageUrl", p.category_id AS "categoryId",
         c.name AS "categoryName",
         p.created_at, p.updated_at
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
`;

async function findById(id) {
  const res = await query(`${BASE_SELECT} WHERE p.id = $1`, [id]);
  return res.rows[0] || null;
}

async function list({ categoryId, search, minPrice, maxPrice, sort, limit = 20, offset = 0 } = {}) {
  const where = [];
  const params = [];

  if (categoryId) {
    params.push(categoryId);
    where.push(`p.category_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }
  if (minPrice != null) {
    params.push(minPrice);
    where.push(`p.price >= $${params.length}`);
  }
  if (maxPrice != null) {
    params.push(maxPrice);
    where.push(`p.price <= $${params.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sortMap = {
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    name: 'p.name ASC',
    newest: 'p.created_at DESC',
    rating: 'p.id DESC',
  };
  const orderBy = sortMap[sort] || 'p.created_at DESC';

  params.push(limit, offset);
  const sql = `${BASE_SELECT} ${whereSql} ORDER BY ${orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const rows = await query(sql, params);
  const totalRes = await query(
    `SELECT COUNT(*)::int AS total FROM products p ${whereSql}`,
    params.slice(0, params.length - 2)
  );
  return { products: rows.rows, total: totalRes.rows[0].total };
}

async function create(data) {
  const res = await query(
    `INSERT INTO products (name, description, price, discount, stock, image_url, category_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      data.name,
      data.description || '',
      data.price,
      data.discount || 0,
      data.stock || 0,
      data.imageUrl || null,
      data.categoryId || null,
    ]
  );
  return findById(res.rows[0].id);
}

async function update(id, data) {
  await query(
    `UPDATE products
        SET name = COALESCE($2, name),
            description = COALESCE($3, description),
            price = COALESCE($4, price),
            discount = COALESCE($5, discount),
            stock = COALESCE($6, stock),
            image_url = COALESCE($7, image_url),
            category_id = COALESCE($8, category_id),
            updated_at = NOW()
      WHERE id = $1`,
    [
      id,
      data.name ?? null,
      data.description ?? null,
      data.price ?? null,
      data.discount ?? null,
      data.stock ?? null,
      data.imageUrl ?? null,
      data.categoryId ?? null,
    ]
  );
  return findById(id);
}

async function remove(id) {
  await query('DELETE FROM products WHERE id = $1', [id]);
}

async function decrementStock(id, qty) {
  await query(
    `UPDATE products SET stock = GREATEST(stock - $2, 0), updated_at = NOW() WHERE id = $1`,
    [id, qty]
  );
}

async function count() {
  const res = await query('SELECT COUNT(*)::int AS total FROM products');
  return res.rows[0].total;
}

module.exports = { findById, list, create, update, remove, decrementStock, count };
