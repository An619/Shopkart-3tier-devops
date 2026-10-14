CREATE TABLE IF NOT EXISTS inventory (product_id BIGINT PRIMARY KEY, quantity INTEGER NOT NULL CHECK(quantity >= 0));
INSERT INTO inventory(product_id,quantity) VALUES (1,25),(2,40),(3,60) ON CONFLICT (product_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS inventory_reservations (
  reservation_id VARCHAR(100) PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES inventory(product_id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('RESERVED', 'CONFIRMED', 'RELEASED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product
  ON inventory_reservations(product_id);
