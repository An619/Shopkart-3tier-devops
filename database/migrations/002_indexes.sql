CREATE INDEX IF NOT EXISTS idx_products_name_lower
  ON products (LOWER(name));

CREATE INDEX IF NOT EXISTS idx_products_created_desc
  ON products (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_product_created
  ON reviews (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_carts_user
  ON carts (user_id);

INSERT INTO _migrations (name) VALUES ('002_indexes')
ON CONFLICT (name) DO NOTHING;
