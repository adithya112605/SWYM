# Threadline v1 Spec

This is the initial implementation specification derived from `candidate-brief.md`. Later changes should be recorded separately rather than silently rewriting this v1 framing.

## Product and persistence model

Threadline is an anonymous, browser-local apparel storefront hosted on GitHub Pages. A product row is a purchasable SKU: one style, size, and color combination. Rows sharing `style_code` render as one product card with color and size selectors.

SQLite runs in-browser through `sql.js` WebAssembly. On first load the app creates the schema and seed catalog; after each committed mutation it exports the database bytes to IndexedDB. A UUID in local storage is the wishlist owner. Prepared parameters are used for application values and foreign keys are enabled for every connection.

The authoritative schema is in [`sql/schema.sql`](sql/schema.sql):

- `products`: variant ID, style code, name, description, category, integer price, currency, size, color, image, active flag, timestamps.
- `wishlists`: ID, owner session ID, name, default flag, timestamps.
- `wishlist_items`: wishlist ID, product/variant ID, positive quantity, timestamps, and a composite primary key on `(wishlist_id, product_id)`.

Deleting a wishlist cascades to its items. Deleting a referenced product is restricted; products should be deactivated instead.

## Wishlist behavior

One session may create multiple named wishlists. Adding the exact SKU again increments quantity. Different sizes or colors remain distinct because each is a different product ID.

A merge is directional: **source → destination**.

1. Reject identical IDs, missing lists, or lists outside the current session.
2. Preflight the source for missing product references and abort on corruption.
3. Start `BEGIN IMMEDIATE`.
4. Insert source items into the destination. On a composite-key conflict, sum quantities and preserve the earliest `added_at` timestamp.
5. Transfer the default flag when the source was the default list.
6. Update the destination timestamp and delete the source list.
7. Commit and persist the exported database. On any SQL or storage error, restore the pre-mutation database snapshot.

Empty sources, empty destinations, and two empty lists are valid merges. In every success case only the destination list remains.

## v1 acceptance criteria

- Filter the grouped catalog by category, size, and color.
- Select an exact apparel variant and save it to a chosen wishlist.
- Create multiple lists and change item quantities.
- Merge disjoint and duplicate-containing lists with correct quantities.
- Persist catalog and wishlist state across refreshes.
- Reject same-list, missing-list, cross-session, and malformed-data merges without partial mutation.
- Render responsively and respect reduced-motion preferences.

## Explicit constraints

- No account system, backend, checkout, inventory service, or cross-device sync.
- One active browser tab is the supported concurrency model for v1.
- Currency defaults to USD; prices are stored in cents.
- The source list is deleted only after its items have been consolidated successfully.
