/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

function poolFromEnv(prefix, fallbackDatabase) {
  const value = (name, fallback) => process.env[prefix + name] || fallback;
  return new Pool({
    host: value('DB_HOST', process.env.DB_HOST || 'localhost'),
    port: Number(value('DB_PORT', process.env.DB_PORT || 5432)),
    database: value('DB_NAME', fallbackDatabase),
    user: value('DB_USER', process.env.DB_USER),
    password: value('DB_PASSWORD', process.env.DB_PASSWORD),
    connectionTimeoutMillis: 10000,
    statement_timeout: 30000,
    application_name: 'shopkart-catalog-backfill',
  });
}

const source = poolFromEnv('SOURCE_', process.env.SOURCE_DB_NAME || process.env.DB_NAME || 'shopkart');
const target = poolFromEnv('CATALOG_', process.env.CATALOG_DB_NAME || 'shopkart_catalog');
const schemaPath = path.resolve(__dirname, '../../../database/catalog/schema.sql');

async function insertRows(client, table, columns, rows, transform = (row) => row) {
  const placeholders = columns.map((_, index) => '$' + (index + 1)).join(', ');
  const updates = columns.filter((column) => column !== 'id')
    .map((column) => column + '=EXCLUDED.' + column).join(', ');
  const sql = 'INSERT INTO ' + table + ' (' + columns.join(', ') + ') VALUES (' + placeholders + ') ' +
    'ON CONFLICT (id) DO UPDATE SET ' + updates;
  for (const row of rows) {
    await client.query(sql, transform(row));
  }
}

async function main() {
  let client;
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await target.query(schema);
    const [categories, products, reviews] = await Promise.all([
      source.query('SELECT id,name,description,created_at,updated_at FROM categories ORDER BY id'),
      source.query('SELECT id,name,description,price,discount,stock,image_url,category_id,created_at,updated_at FROM products ORDER BY id'),
      source.query(`SELECT r.id,r.product_id,r.user_id,COALESCE(u.name,'ShopKart customer') AS author_name,
        r.rating,r.title,r.comment,r.created_at
        FROM reviews r LEFT JOIN users u ON u.id=r.user_id ORDER BY r.id`),
    ]);

    client = await target.connect();
    await client.query('BEGIN');
    await insertRows(client, 'categories',
      ['id','name','description','created_at','updated_at'],
      categories.rows, (r) => [r.id,r.name,r.description,r.created_at,r.updated_at]);
    await insertRows(client, 'products',
      ['id','name','description','price','discount','stock','image_url','category_id','created_at','updated_at'],
      products.rows, (r) => [r.id,r.name,r.description,r.price,r.discount,r.stock,r.image_url,r.category_id,r.created_at,r.updated_at]);
    await insertRows(client, 'reviews',
      ['id','product_id','user_id','author_name','rating','title','comment','created_at'],
      reviews.rows, (r) => [r.id,r.product_id,r.user_id,r.author_name,r.rating,r.title,r.comment,r.created_at]);

    for (const table of ['categories','products','reviews']) {
      await client.query(
        "SELECT setval(pg_get_serial_sequence($1,'id'), COALESCE((SELECT MAX(id) FROM " + table + "), 1), EXISTS(SELECT 1 FROM " + table + '))',
        [table]);
    }
    const targetCounts = {};
    for (const table of ['categories','products','reviews']) {
      const result = await client.query('SELECT COUNT(*)::int AS count FROM ' + table);
      targetCounts[table] = result.rows[0].count;
    }
    const sourceCounts = {
      categories: categories.rowCount,
      products: products.rowCount,
      reviews: reviews.rowCount,
    };
    for (const table of Object.keys(sourceCounts)) {
      if (sourceCounts[table] !== targetCounts[table]) {
        throw new Error(table + ' row-count mismatch: source=' + sourceCounts[table] + ', catalog=' + targetCounts[table]);
      }
    }

    // Row counts alone can hide stale or incorrectly copied records. Compare every
    // migrated field in deterministic ID order before committing the backfill.
    const targetRows = {
      categories: (await client.query(
        'SELECT id,name,description,created_at,updated_at FROM categories ORDER BY id'
      )).rows,
      products: (await client.query(
        'SELECT id,name,description,price,discount,stock,image_url,category_id,created_at,updated_at FROM products ORDER BY id'
      )).rows,
      reviews: (await client.query(
        'SELECT id,product_id,user_id,author_name,rating,title,comment,created_at FROM reviews ORDER BY id'
      )).rows,
    };
    const expectedRows = {
      categories: categories.rows,
      products: products.rows,
      reviews: reviews.rows,
    };
    const normalize = (rows) => rows.map((row) => Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        value instanceof Date ? value.toISOString() : value,
      ])
    ));
    for (const table of Object.keys(expectedRows)) {
      const expected = JSON.stringify(normalize(expectedRows[table]));
      const actual = JSON.stringify(normalize(targetRows[table]));
      if (expected !== actual) {
        throw new Error(table + ' field-level reconciliation failed; transaction will roll back');
      }
    }

    await client.query('COMMIT');
    console.log(JSON.stringify({ status: 'verified', verification: 'row-counts-and-all-fields', sourceCounts, targetCounts }, null, 2));
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Catalog backfill failed; source database was not modified.', error);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await Promise.all([source.end(), target.end()]);
  }
}

main();
