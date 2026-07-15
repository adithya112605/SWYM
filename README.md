# Threadline

A modern apparel storefront with browser-local SQL persistence and transactional wishlist merging. Built for the CX AI-Proficiency Build Round in `candidate-brief.md`.

## Tech stack

- **React 19** for the component UI and state orchestration
- **Framer Motion 12** for navbar transitions, scroll-linked parallax, staggered reveals, layout animations, drawers, and modals
- **Vite 7** for development and a GitHub Pages-compatible production bundle
- **SQLite via sql.js/WebAssembly** for products, wishlists, and wishlist items
- **IndexedDB** for durable storage of the exported SQLite database
- **CSS** for the responsive editorial design system
- **Lucide React** for accessible interface icons
- **Node's test runner** for SQL merge scenarios

## Run locally

```bash
npm install
npm run dev
```

Build and test:

```bash
npm test
npm run build
```

## Wishlist merge behavior

The merge is directional: every item in the source list is inserted into the destination. A conflict on `(wishlist_id, product_id)` adds quantities, so only the exact same clothing variant—same SKU, size, and color—is combined. The source list is deleted only after the transaction succeeds. Empty lists are valid, missing lists and cross-session access are rejected, and missing product references abort the operation.

Schema and reference queries live in [`sql/schema.sql`](sql/schema.sql) and [`sql/wishlist-queries.sql`](sql/wishlist-queries.sql).

## GitHub Pages

The included workflow builds `dist/` and deploys it through GitHub Pages. In the repository settings, set **Pages → Source** to **GitHub Actions**, then push the default branch.
