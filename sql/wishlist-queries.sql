-- Reference queries used by src/database.js. Application values are always
-- bound as prepared-statement parameters; they are never interpolated.

-- Add a SKU to a list, incrementing an existing row.
INSERT INTO wishlist_items (wishlist_id, product_id, quantity, added_at, updated_at)
VALUES (:wishlist_id, :product_id, 1, :now, :now)
ON CONFLICT (wishlist_id, product_id) DO UPDATE SET
  quantity = wishlist_items.quantity + 1,
  updated_at = excluded.updated_at;

-- Merge source into target. Run only after ownership/integrity validation and
-- inside BEGIN IMMEDIATE … COMMIT. The source list is deleted afterward.
INSERT INTO wishlist_items (wishlist_id, product_id, quantity, added_at, updated_at)
SELECT :target_id, source.product_id, source.quantity, source.added_at, :now
FROM wishlist_items AS source
JOIN products AS product ON product.id = source.product_id
WHERE source.wishlist_id = :source_id
ON CONFLICT (wishlist_id, product_id) DO UPDATE SET
  quantity = wishlist_items.quantity + excluded.quantity,
  added_at = MIN(wishlist_items.added_at, excluded.added_at),
  updated_at = excluded.updated_at;

DELETE FROM wishlists WHERE id = :source_id;
