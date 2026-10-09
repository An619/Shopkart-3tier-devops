const { query } = require('../database/pool');

async function list() {
  const res = await query(
    `SELECT c.id, c.name, c.description,
            COUNT(p.id)::int AS "productCount"
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC`
  );
  return res.rows;
}

async function findById(id) {
  const res = await query('SELECT * FROM categories WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function create({ name, description }) {
  const res = await query(
    `INSERT INTO categories (name, description)
     VALUES ($1, $2)
     RETURNING *`,
    [name, description || '']
  );
  return res.rows[0];
}

async function update(id, { name, description }) {
  const res = await query(
    `UPDATE categories
        SET name = COALESCE($2, name),
            description = COALESCE($3, description)
      WHERE id = $1
      RETURNING *`,
    [id, name ?? null, description ?? null]
  );
  return res.rows[0] || null;
}

async function remove(id) {
  await query('DELETE FROM categories WHERE id = $1', [id]);
}

module.exports = { list, findById, create, update, remove };
