INSERT INTO categories (name, description) VALUES
  ('Mobiles',         'Smartphones and feature phones'),
  ('Laptops',         'Notebooks and ultrabooks'),
  ('Electronics',     'TVs, audio, cameras, gadgets'),
  ('Fashion',         'Clothing, footwear, accessories'),
  ('Home Appliances', 'Kitchen and home essentials'),
  ('Books',           'Fiction, non-fiction, textbooks'),
  ('Accessories',     'Cables, cases, chargers, wearables')
ON CONFLICT (name) DO NOTHING;

INSERT INTO _migrations (name) VALUES ('003_seed_reference')
ON CONFLICT (name) DO NOTHING;
