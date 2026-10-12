CREATE TABLE IF NOT EXISTS inventory (product_id BIGINT PRIMARY KEY, quantity INTEGER NOT NULL CHECK(quantity >= 0));
INSERT INTO inventory(product_id,quantity) VALUES (1,25),(2,40),(3,60) ON CONFLICT (product_id) DO NOTHING;
