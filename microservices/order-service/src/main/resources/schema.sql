CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_id VARCHAR(200) NOT NULL,
  product_ids TEXT NOT NULL,
  status VARCHAR(30) NOT NULL,
  idempotency_key VARCHAR(100),
  reservation_ids TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reservation_ids TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_idempotency_key
  ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_orders_reconciliation
  ON orders(id) WHERE status='RECONCILIATION_REQUIRED';
