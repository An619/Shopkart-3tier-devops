CREATE TABLE IF NOT EXISTS products (id BIGSERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL UNIQUE, category VARCHAR(100) NOT NULL, price NUMERIC(12,2) NOT NULL CHECK(price >= 0), stock INTEGER NOT NULL CHECK(stock >= 0));
INSERT INTO products(name,category,price,stock) VALUES ('ShopKart Wireless Headphones','Electronics',1499.00,25) ON CONFLICT (name) DO NOTHING;
INSERT INTO products(name,category,price,stock) VALUES ('ShopKart Everyday Backpack','Fashion',899.00,40) ON CONFLICT (name) DO NOTHING;
INSERT INTO products(name,category,price,stock) VALUES ('ShopKart USB-C Charger','Accessories',599.00,60) ON CONFLICT (name) DO NOTHING;
