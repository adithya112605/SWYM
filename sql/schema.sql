PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  style_code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  color_hex TEXT,
  image_url TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  UNIQUE (style_code, size, color)
);

CREATE TABLE IF NOT EXISTS wishlists (
  id TEXT PRIMARY KEY,
  owner_session_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  wishlist_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (wishlist_id, product_id),
  FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_products_filters
  ON products (category, size, color, is_active);
CREATE INDEX IF NOT EXISTS idx_products_style ON products (style_code);
CREATE INDEX IF NOT EXISTS idx_wishlists_owner
  ON wishlists (owner_session_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product
  ON wishlist_items (product_id);

PRAGMA user_version = 1;
