CREATE TABLE IF NOT EXISTS products (id BIGSERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, category VARCHAR(100) NOT NULL, price NUMERIC(12,2) NOT NULL CHECK(price >= 0), stock INTEGER NOT NULL CHECK(stock >= 0));
INSERT INTO products(name,category,price,stock) SELECT 'ShopKart Wireless Headphones','Electronics',1499.00,25 WHERE NOT EXISTS (SELECT 1 FROM products);
INSERT INTO products(name,category,price,stock) SELECT 'ShopKart Everyday Backpack','Fashion',899.00,40 WHERE (SELECT COUNT(*) FROM products)=1;
INSERT INTO products(name,category,price,stock) SELECT 'ShopKart USB-C Charger','Accessories',599.00,60 WHERE (SELECT COUNT(*) FROM products)=2;
