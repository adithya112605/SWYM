import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import initSqlJs from "sql.js";

const SQL = await initSqlJs();
const schema = await readFile(new URL("../sql/schema.sql", import.meta.url), "utf8");

function database() {
  const db = new SQL.Database();
  db.run(schema);
  const now = "2026-07-15T00:00:00.000Z";
  db.run(`INSERT INTO products
    (id, style_code, name, description, category, price_cents, currency, size, color, image_url, created_at)
    VALUES
    ('tee-black-m', 'tee', 'Tee', '', 'T-Shirts', 5000, 'USD', 'M', 'Black', 'tee.jpg', ?),
    ('tee-black-l', 'tee', 'Tee', '', 'T-Shirts', 5000, 'USD', 'L', 'Black', 'tee.jpg', ?),
    ('tee-blue-m', 'tee', 'Tee', '', 'T-Shirts', 5000, 'USD', 'M', 'Blue', 'tee.jpg', ?)`, [now, now, now]);
  return db;
}

function addList(db, id, name, isDefault = 0) {
  const now = "2026-07-15T00:00:00.000Z";
  db.run("INSERT INTO wishlists VALUES (?, 'session', ?, ?, ?, ?)", [id, name, isDefault, now, now]);
}

function addItem(db, list, product, quantity) {
  const now = "2026-07-15T00:00:00.000Z";
  db.run("INSERT INTO wishlist_items VALUES (?, ?, ?, ?, ?)", [list, product, quantity, now, now]);
}

function merge(db, source, target) {
  if (source === target) throw new Error("Choose two different wishlists.");
  const exists = (id) => db.exec("SELECT id FROM wishlists WHERE id = ? AND owner_session_id = 'session'", [id])[0];
  if (!exists(source) || !exists(target)) throw new Error("Wishlist no longer exists.");
  db.run("BEGIN IMMEDIATE");
  try {
    db.run(`INSERT INTO wishlist_items (wishlist_id, product_id, quantity, added_at, updated_at)
      SELECT ?, source.product_id, source.quantity, source.added_at, '2026-07-15T01:00:00.000Z'
      FROM wishlist_items source JOIN products p ON p.id = source.product_id
      WHERE source.wishlist_id = ?
      ON CONFLICT (wishlist_id, product_id) DO UPDATE SET
        quantity = wishlist_items.quantity + excluded.quantity,
        added_at = MIN(wishlist_items.added_at, excluded.added_at),
        updated_at = excluded.updated_at`, [target, source]);
    db.run("DELETE FROM wishlists WHERE id = ?", [source]);
    db.run("COMMIT");
  } catch (error) {
    db.run("ROLLBACK");
    throw error;
  }
}

function value(db, sql, params = []) {
  const statement = db.prepare(sql);
  statement.bind(params);
  statement.step();
  const result = statement.get()[0];
  statement.free();
  return result;
}

test("merge sums duplicate SKU quantities and preserves distinct variants", () => {
  const db = database();
  addList(db, "source", "Holiday"); addList(db, "target", "Favorites", 1);
  addItem(db, "source", "tee-black-m", 2);
  addItem(db, "source", "tee-black-l", 1);
  addItem(db, "target", "tee-black-m", 3);
  addItem(db, "target", "tee-blue-m", 1);

  merge(db, "source", "target");

  assert.equal(value(db, "SELECT quantity FROM wishlist_items WHERE wishlist_id = 'target' AND product_id = 'tee-black-m'"), 5);
  assert.equal(value(db, "SELECT COUNT(*) FROM wishlist_items WHERE wishlist_id = 'target'"), 3);
  assert.equal(value(db, "SELECT COUNT(*) FROM wishlists WHERE id = 'source'"), 0);
  db.close();
});

test("merging an empty source deletes it without changing the target", () => {
  const db = database();
  addList(db, "source", "Empty"); addList(db, "target", "Saved");
  addItem(db, "target", "tee-blue-m", 2);
  merge(db, "source", "target");
  assert.equal(value(db, "SELECT quantity FROM wishlist_items WHERE wishlist_id = 'target'"), 2);
  assert.equal(value(db, "SELECT COUNT(*) FROM wishlists"), 1);
  db.close();
});

test("merging into an empty target transfers every source row", () => {
  const db = database();
  addList(db, "source", "Source"); addList(db, "target", "Empty target");
  addItem(db, "source", "tee-black-m", 2); addItem(db, "source", "tee-black-l", 1);
  merge(db, "source", "target");
  assert.equal(value(db, "SELECT COUNT(*) FROM wishlist_items WHERE wishlist_id = 'target'"), 2);
  assert.equal(value(db, "SELECT SUM(quantity) FROM wishlist_items WHERE wishlist_id = 'target'"), 3);
  db.close();
});

test("invalid and same-list merges are rejected without mutation", () => {
  const db = database();
  addList(db, "only", "Only"); addItem(db, "only", "tee-black-m", 1);
  assert.throws(() => merge(db, "only", "only"), /different/);
  assert.throws(() => merge(db, "missing", "only"), /no longer exists/);
  assert.equal(value(db, "SELECT COUNT(*) FROM wishlists"), 1);
  assert.equal(value(db, "SELECT quantity FROM wishlist_items"), 1);
  db.close();
});
