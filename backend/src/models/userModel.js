const { query } = require('../database/pool');

async function findById(id) {
  const res = await query(
    `SELECT id, name, email, role, created_at, updated_at
       FROM users
      WHERE id = $1`,
    [id]
  );
  return res.rows[0] || null;
}

async function findByEmail(email) {
  const res = await query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0] || null;
}

async function create({ name, email, passwordHash, role = 'user' }) {
  const res = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, passwordHash, role]
  );
  return res.rows[0];
}

async function update(id, { name, email }) {
  const res = await query(
    `UPDATE users
        SET name = COALESCE($2, name),
            email = COALESCE($3, email),
            updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, email, role, created_at, updated_at`,
    [id, name, email]
  );
  return res.rows[0] || null;
}

async function updatePassword(id, passwordHash) {
  await query(
    `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
    [id, passwordHash]
  );
}

async function list({ limit = 50, offset = 0 } = {}) {
  const res = await query(
    `SELECT id, name, email, role, created_at, updated_at
       FROM users
      ORDER BY id DESC
      LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
}

async function count() {
  const res = await query('SELECT COUNT(*)::int AS total FROM users');
  return res.rows[0].total;
}

module.exports = {
  findById,
  findByEmail,
  create,
  update,
  updatePassword,
  list,
  count,
};
