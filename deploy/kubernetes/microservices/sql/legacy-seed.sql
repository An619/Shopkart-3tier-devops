INSERT INTO categories (name, description) VALUES
  ('Mobiles',          'Smartphones and feature phones'),
  ('Laptops',          'Notebooks and ultrabooks'),
  ('Electronics',      'TVs, audio, cameras, gadgets'),
  ('Fashion',          'Clothing, footwear, accessories'),
  ('Home Appliances',  'Kitchen and home essentials'),
  ('Books',            'Fiction, non-fiction, textbooks'),
  ('Accessories',      'Cables, cases, chargers, wearables')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (name, email, password_hash, role) VALUES
  ('ShopKart Admin', 'admin@shopkart.dev',
   '$2a$12$K8pQv6WVYb3qN7v4o9QzUeE5f8nZ9mYc3rH2gT1sP0oIuYrXwVzA6', 'admin'),
  ('Demo User', 'user@shopkart.dev',
   '$2a$12$LqRjY6XWZc4rO8w5p0RaVfF6g9oA1nZ4sI3hU2tQ1pJvZwSyTxB7', 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (name, description, price, discount, stock, image_url, category_id)
SELECT * FROM (VALUES
  ('Aurora X5 Smartphone',     '6.5-inch OLED, 128GB, triple camera',       18999.00, 10, 50, NULL, (SELECT id FROM categories WHERE name='Mobiles')),
  ('Aurora X5 Pro',            '6.7-inch AMOLED, 256GB, 108MP camera',      27999.00, 15, 30, NULL, (SELECT id FROM categories WHERE name='Mobiles')),
  ('Nimbus Note 14',           '14-inch laptop, 16GB RAM, 512GB SSD',       54999.00,  5, 20, NULL, (SELECT id FROM categories WHERE name='Laptops')),
  ('Nimbus Note Air',          '13-inch ultrabook, 8GB RAM, 256GB SSD',     42999.00, 10, 25, NULL, (SELECT id FROM categories WHERE name='Laptops')),
  ('PulseBeat Wireless Buds',  'Bluetooth 5.3, 30h battery, ANC',            2499.00, 20, 100, NULL, (SELECT id FROM categories WHERE name='Electronics')),
  ('ViewMax 43-inch 4K TV',    'HDR10, Android TV, smart remote',           24999.00, 25, 15, NULL, (SELECT id FROM categories WHERE name='Electronics')),
  ('Everyday Cotton T-Shirt',  'Unisex, crew neck, pack of 2',               799.00, 30, 200, NULL, (SELECT id FROM categories WHERE name='Fashion')),
  ('TrailRun Sneakers',        'Lightweight running shoes, size 6-11',      2199.00, 15, 60, NULL, (SELECT id FROM categories WHERE name='Fashion')),
  ('BrewMaster Coffee Maker',  'Drip coffee maker, 1.5L, anti-drip',         3499.00, 10, 40, NULL, (SELECT id FROM categories WHERE name='Home Appliances')),
  ('ChillMax Refrigerator',    'Double-door, 260L, 3-star rating',          21499.00, 20, 10, NULL, (SELECT id FROM categories WHERE name='Home Appliances')),
  ('The Silent Orchard',       'Award-winning fiction novel',                 399.00,  5, 150, NULL, (SELECT id FROM categories WHERE name='Books')),
  ('DevOps Handbook Vol. 2',   'Practical guide to modern delivery',         1299.00, 10, 80, NULL, (SELECT id FROM categories WHERE name='Books')),
  ('USB-C Fast Charger 30W',   'Universal, compact, cable included',          899.00, 10, 300, NULL, (SELECT id FROM categories WHERE name='Accessories')),
  ('SportFit Smartwatch',      'Heart rate, SpO2, 7-day battery',            4499.00, 25, 75, NULL, (SELECT id FROM categories WHERE name='Accessories')),
  ('Everyday Backpack 25L',    'Water-resistant, laptop sleeve',             1699.00, 15, 90, NULL, (SELECT id FROM categories WHERE name='Accessories'))
) AS v(name, description, price, discount, stock, image_url, category_id)
WHERE NOT EXISTS (SELECT 1 FROM products);
