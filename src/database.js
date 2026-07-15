import initSqlJs from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import schemaSql from "../sql/schema.sql?raw";

const DB_NAME = "threadline-sqlite";
const DB_STORE = "databases";
const DB_KEY = "main";
const SESSION_KEY = "threadline-session-id";

let SQL;
let db;
let initPromise;
let storageAvailable = true;
const listeners = new Set();

const styles = [
  {
    code: "linen-overshirt",
    name: "Linen Field Overshirt",
    description: "A relaxed layer cut from washed European linen.",
    category: "Shirts",
    price: 12800,
    image: "./images/threadline-editorial.png",
    colors: [["Oat", "#d7ccb4"], ["Olive", "#626a50"], ["Ink", "#292c2d"]],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    code: "soft-structure-tee",
    name: "Soft Structure Tee",
    description: "A substantial organic cotton tee with a clean drape.",
    category: "T-Shirts",
    price: 5800,
    image: "./images/threadline-editorial.png",
    colors: [["Chalk", "#ece9df"], ["Rust", "#a94f36"], ["Black", "#242424"]],
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    code: "pleated-trouser",
    name: "Easy Pleated Trouser",
    description: "Fluid tailoring with a softly tapered, full-length leg.",
    category: "Trousers",
    price: 11800,
    image: "./images/threadline-editorial.png",
    colors: [["Stone", "#b7ab96"], ["Espresso", "#4a392e"], ["Navy", "#343b4b"]],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    code: "knit-polo",
    name: "Fine Knit Polo",
    description: "A breathable cotton knit with a neat open collar.",
    category: "Knitwear",
    price: 9400,
    image: "./images/threadline-editorial.png",
    colors: [["Cream", "#e7dfce"], ["Moss", "#7c8268"], ["Terracotta", "#b66044"]],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    code: "studio-dress",
    name: "Studio Column Dress",
    description: "An effortless column silhouette in crisp cotton poplin.",
    category: "Dresses",
    price: 14200,
    image: "./images/threadline-editorial.png",
    colors: [["Paprika", "#a84430"], ["Midnight", "#252b38"], ["Sand", "#cbbda4"]],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    code: "utility-jacket",
    name: "Canvas Utility Jacket",
    description: "A boxy four-pocket jacket softened by garment washing.",
    category: "Outerwear",
    price: 16800,
    image: "./images/threadline-editorial.png",
    colors: [["Khaki", "#a39273"], ["Forest", "#3f5145"], ["Clay", "#9b604c"]],
    sizes: ["S", "M", "L", "XL"],
  },
];

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function openIndexedDb() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Browser storage timed out.")), 2500);
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_STORE)) {
        request.result.createObjectStore(DB_STORE);
      }
    };
    request.onsuccess = () => { clearTimeout(timeout); resolve(request.result); };
    request.onerror = () => { clearTimeout(timeout); reject(request.error); };
  });
}

async function readPersistedDb() {
  const connection = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = connection.transaction(DB_STORE, "readonly");
    const request = tx.objectStore(DB_STORE).get(DB_KEY);
    request.onsuccess = () => resolve(request.result ? new Uint8Array(request.result) : null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => connection.close();
  });
}

async function persistDb(bytes = db.export()) {
  if (!storageAvailable) return;
  const connection = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = connection.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(bytes, DB_KEY);
    tx.oncomplete = () => { connection.close(); resolve(); };
    tx.onerror = () => { connection.close(); reject(tx.error); };
  });
}

function rows(sql, params = []) {
  const statement = db.prepare(sql);
  try {
    statement.bind(params);
    const result = [];
    while (statement.step()) result.push(statement.getAsObject());
    return result;
  } finally {
    statement.free();
  }
}

function one(sql, params = []) {
  return rows(sql, params)[0] ?? null;
}

function seedProducts() {
  const insert = db.prepare(`
    INSERT INTO products
      (id, style_code, name, description, category, price_cents, currency,
       size, color, color_hex, image_url, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'USD', ?, ?, ?, ?, 1, ?)
  `);
  const now = new Date().toISOString();
  try {
    for (const style of styles) {
      for (const [color, hex] of style.colors) {
        for (const size of style.sizes) {
          const slug = `${style.code}-${color}-${size}`.toLowerCase().replaceAll(" ", "-");
          insert.run([slug, style.code, style.name, style.description, style.category,
            style.price, size, color, hex, style.image, now]);
        }
      }
    }
  } finally {
    insert.free();
  }
}

async function initialize() {
  SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
  let saved = null;
  try {
    saved = await readPersistedDb();
  } catch {
    // Privacy modes and automated renderers can disable IndexedDB. The app
    // remains fully usable with an in-memory SQLite database for that visit.
    storageAvailable = false;
  }
  db = saved ? new SQL.Database(saved) : new SQL.Database();
  db.run("PRAGMA foreign_keys = ON");
  if (!saved) {
    db.run(schemaSql);
    seedProducts();
    await persistDb();
  }
  return getSnapshot();
}

export function initStore() {
  if (!initPromise) initPromise = initialize();
  return initPromise;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  const snapshot = getSnapshot();
  listeners.forEach((listener) => listener(snapshot));
  return snapshot;
}

async function mutate(work) {
  const previous = db.export();
  try {
    db.run("BEGIN IMMEDIATE");
    const result = work();
    db.run("COMMIT");
    await persistDb();
    notify();
    return result;
  } catch (error) {
    try { db.run("ROLLBACK"); } catch { /* transaction may already be closed */ }
    db.close();
    db = new SQL.Database(previous);
    db.run("PRAGMA foreign_keys = ON");
    throw error;
  }
}

function createWishlistInsideTransaction(name, isDefault = false) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO wishlists (id, owner_session_id, name, is_default, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, getSessionId(), name.trim(), isDefault ? 1 : 0, now, now],
  );
  return id;
}

export async function createWishlist(name) {
  const clean = name.trim();
  if (!clean) throw new Error("Give your wishlist a name.");
  return mutate(() => {
    const existing = one("SELECT COUNT(*) AS count FROM wishlists WHERE owner_session_id = ?", [getSessionId()]);
    return createWishlistInsideTransaction(clean, Number(existing.count) === 0);
  });
}

export async function addWishlistItem(productId, preferredListId) {
  return mutate(() => {
    const session = getSessionId();
    let listId = preferredListId;
    let list = listId
      ? one("SELECT id FROM wishlists WHERE id = ? AND owner_session_id = ?", [listId, session])
      : one("SELECT id FROM wishlists WHERE owner_session_id = ? ORDER BY is_default DESC, created_at LIMIT 1", [session]);
    if (!list) {
      listId = createWishlistInsideTransaction("My wishlist", true);
    } else {
      listId = list.id;
    }
    const product = one("SELECT id FROM products WHERE id = ? AND is_active = 1", [productId]);
    if (!product) throw new Error("That variant is no longer available.");
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO wishlist_items (wishlist_id, product_id, quantity, added_at, updated_at)
       VALUES (?, ?, 1, ?, ?)
       ON CONFLICT (wishlist_id, product_id) DO UPDATE SET
         quantity = wishlist_items.quantity + 1,
         updated_at = excluded.updated_at`,
      [listId, productId, now, now],
    );
    db.run("UPDATE wishlists SET updated_at = ? WHERE id = ?", [now, listId]);
    return listId;
  });
}

export async function setWishlistItemQuantity(listId, productId, quantity) {
  if (quantity <= 0) return removeWishlistItem(listId, productId);
  return mutate(() => {
    const list = one("SELECT id FROM wishlists WHERE id = ? AND owner_session_id = ?", [listId, getSessionId()]);
    if (!list) throw new Error("Wishlist no longer exists.");
    const now = new Date().toISOString();
    db.run("UPDATE wishlist_items SET quantity = ?, updated_at = ? WHERE wishlist_id = ? AND product_id = ?", [quantity, now, listId, productId]);
    db.run("UPDATE wishlists SET updated_at = ? WHERE id = ?", [now, listId]);
  });
}

export async function removeWishlistItem(listId, productId) {
  return mutate(() => {
    const list = one("SELECT id FROM wishlists WHERE id = ? AND owner_session_id = ?", [listId, getSessionId()]);
    if (!list) throw new Error("Wishlist no longer exists.");
    const now = new Date().toISOString();
    db.run("DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?", [listId, productId]);
    db.run("UPDATE wishlists SET updated_at = ? WHERE id = ?", [now, listId]);
  });
}

export async function mergeWishlists(sourceId, targetId) {
  if (sourceId === targetId) throw new Error("Choose two different wishlists.");
  return mutate(() => {
    const owner = getSessionId();
    const source = one("SELECT * FROM wishlists WHERE id = ? AND owner_session_id = ?", [sourceId, owner]);
    const target = one("SELECT * FROM wishlists WHERE id = ? AND owner_session_id = ?", [targetId, owner]);
    if (!source || !target) throw new Error("One of those wishlists no longer exists.");

    const orphan = one(
      `SELECT wi.product_id FROM wishlist_items wi
       LEFT JOIN products p ON p.id = wi.product_id
       WHERE wi.wishlist_id = ? AND p.id IS NULL LIMIT 1`,
      [sourceId],
    );
    if (orphan) throw new Error("The source contains missing product data. Nothing was changed.");

    const stats = one(
      `SELECT COUNT(*) AS item_rows,
        SUM(CASE WHEN target.product_id IS NOT NULL THEN 1 ELSE 0 END) AS duplicates
       FROM wishlist_items source
       LEFT JOIN wishlist_items target
         ON target.wishlist_id = ? AND target.product_id = source.product_id
       WHERE source.wishlist_id = ?`,
      [targetId, sourceId],
    );
    const now = new Date().toISOString();
    if (Number(source.is_default) === 1) {
      db.run("UPDATE wishlists SET is_default = 1, updated_at = ? WHERE id = ?", [now, targetId]);
    }
    db.run(
      `INSERT INTO wishlist_items (wishlist_id, product_id, quantity, added_at, updated_at)
       SELECT ?, source.product_id, source.quantity, source.added_at, ?
       FROM wishlist_items source
       JOIN products p ON p.id = source.product_id
       WHERE source.wishlist_id = ?
       ON CONFLICT (wishlist_id, product_id) DO UPDATE SET
         quantity = wishlist_items.quantity + excluded.quantity,
         added_at = MIN(wishlist_items.added_at, excluded.added_at),
         updated_at = excluded.updated_at`,
      [targetId, now, sourceId],
    );
    db.run("UPDATE wishlists SET updated_at = ? WHERE id = ?", [now, targetId]);
    db.run("DELETE FROM wishlists WHERE id = ?", [sourceId]);
    return { moved: Number(stats.item_rows || 0), duplicates: Number(stats.duplicates || 0), targetName: target.name };
  });
}

export function getSnapshot() {
  if (!db) return { products: [], wishlists: [], totalItems: 0 };
  const owner = getSessionId();
  const products = rows("SELECT * FROM products WHERE is_active = 1 ORDER BY category, style_code, color, size")
    .map((product) => ({ ...product, image_url: "./images/threadline-editorial.png" }));
  const lists = rows(
    `SELECT w.*,
      COUNT(wi.product_id) AS sku_count,
      COALESCE(SUM(wi.quantity), 0) AS item_count
     FROM wishlists w LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
     WHERE w.owner_session_id = ?
     GROUP BY w.id ORDER BY w.is_default DESC, w.updated_at DESC`,
    [owner],
  );
  const wishlists = lists.map((list) => ({
    ...list,
    items: rows(
      `SELECT wi.quantity, wi.added_at, p.*
       FROM wishlist_items wi JOIN products p ON p.id = wi.product_id
       WHERE wi.wishlist_id = ? ORDER BY wi.updated_at DESC`,
      [list.id],
    ).map((item) => ({ ...item, image_url: "./images/threadline-editorial.png" })),
  }));
  return {
    products,
    wishlists,
    totalItems: wishlists.reduce((sum, list) => sum + Number(list.item_count), 0),
  };
}
