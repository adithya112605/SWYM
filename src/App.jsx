"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import {
  ArrowDownRight, Check, ChevronDown, Heart, Menu, Merge, Minus,
  Plus, ShoppingBag, Sparkles, Trash2, X,
} from "lucide-react";
import {
  addWishlistItem, createWishlist, getSnapshot, initStore, mergeWishlists,
  removeWishlistItem, setWishlistItemQuantity, subscribe,
} from "./database.js";

const ease = [0.22, 1, 0.36, 1];
const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

function formatPrice(cents, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function Navbar({ totalItems, onOpenWishlist }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 36));

  const links = [["New in", "#collection"], ["Essentials", "#collection"], ["Our story", "#story"]];
  return (
    <>
      <motion.header
        className={`site-header ${scrolled ? "scrolled" : ""}`}
        initial={{ y: -90 }} animate={{ y: 0 }} transition={{ duration: 0.75, ease }}
      >
        <a className="brand" href="#top" aria-label="Threadline home">
          <motion.span className="brand-mark" whileHover={{ rotate: 12, scale: 1.06 }}>TL</motion.span>
          <span>THREADLINE</span>
        </a>
        <nav aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <motion.a key={label} href={href} whileHover={{ y: -2 }}>{label}</motion.a>
          ))}
        </nav>
        <div className="nav-actions">
          <motion.button
            className="wishlist-trigger" type="button" onClick={onOpenWishlist}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            aria-label={`Open wishlists, ${totalItems} saved items`}
          >
            <Heart size={16} strokeWidth={1.8} />
            <span className="wishlist-label">Saved</span>
            <AnimatePresence mode="popLayout">
              <motion.span className="count-badge" key={totalItems}
                initial={{ scale: .5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .5, opacity: 0 }}>
                {totalItems}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
        </div>
      </motion.header>
      <AnimatePresence>
        {menuOpen && (
          <motion.div className="mobile-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button>
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: .08 } } }}>
              {links.map(([label, href]) => (
                <motion.a variants={reveal} key={label} href={href} onClick={() => setMenuOpen(false)}>{label}<ArrowDownRight /></motion.a>
              ))}
            </motion.div>
            <p>Quiet pieces. Strong point of view.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Hero() {
  const { scrollYProgress } = useScroll();
  const imageY = useTransform(scrollYProgress, [0, .5], [0, 90]);
  return (
    <section className="hero" aria-labelledby="hero-title">
      <motion.div className="hero-copy" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: .11, delayChildren: .2 } } }}>
        <motion.p className="eyebrow" variants={reveal}>SUMMER / 2026</motion.p>
        <motion.h1 id="hero-title" variants={reveal}>Quiet pieces.<br /><em>Strong point of view.</em></motion.h1>
        <motion.p className="hero-intro" variants={reveal}>Considered essentials in natural tones, designed to move easily through every part of your day.</motion.p>
        <motion.a className="primary-link" href="#collection" variants={reveal} whileHover="hover">
          Explore the collection <motion.span variants={{ hover: { x: 5, y: 5 } }}><ArrowDownRight /></motion.span>
        </motion.a>
        <motion.div className="hero-proof" variants={reveal}>
          <span><Sparkles size={14} /> Small-batch</span><span>Natural fibres</span><span>Designed to last</span>
        </motion.div>
      </motion.div>
      <motion.div className="hero-art" initial={{ clipPath: "inset(0 0 100% 0)" }} animate={{ clipPath: "inset(0 0 0% 0)" }} transition={{ duration: 1.15, delay: .15, ease }}>
        <motion.img style={{ y: imageY, scale: 1.12 }} src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85" alt="Curated neutral clothing collection on a rail" />
        <motion.span className="hero-note" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>Made for repeat wear</motion.span>
        <div className="hero-index">01 <span /> 06</div>
      </motion.div>
    </section>
  );
}

function ProductCard({ style, onAdd }) {
  const colors = [...new Map(style.variants.map((v) => [v.color, v.color_hex])).entries()];
  const sizes = [...new Set(style.variants.map((v) => v.size))];
  const [color, setColor] = useState(colors[0][0]);
  const [size, setSize] = useState(sizes[0]);
  const variant = style.variants.find((v) => v.color === color && v.size === size) || style.variants[0];

  return (
    <motion.article className="product-card" layout variants={reveal} whileHover={{ y: -5 }}>
      <div className="product-image">
        <motion.img src={style.image_url} alt={style.name} loading="lazy" whileHover={{ scale: 1.045 }} transition={{ duration: .55, ease }} />
        <span className="category-tag">{style.category}</span>
        <motion.button className="quick-heart" aria-label={`Save ${style.name}`} onClick={() => onAdd(variant)} whileTap={{ scale: .82 }}><Heart size={18} /></motion.button>
      </div>
      <div className="product-info">
        <div className="product-title-row"><h3>{style.name}</h3><p>{formatPrice(style.price_cents, style.currency)}</p></div>
        <p className="product-description">{style.description}</p>
        <div className="variant-row">
          <span className="variant-label">Color</span>
          <div className="swatches">
            {colors.map(([name, hex]) => <button key={name} className={`swatch ${color === name ? "active" : ""}`} style={{ "--swatch": hex }} title={name} aria-label={`${name}${color === name ? ", selected" : ""}`} onClick={() => setColor(name)} />)}
          </div><span className="selected-color">{color}</span>
        </div>
        <div className="variant-row">
          <span className="variant-label">Size</span>
          <div className="sizes">{sizes.map((option) => <button key={option} className={`size-chip ${size === option ? "active" : ""}`} onClick={() => setSize(option)}>{option}</button>)}</div>
        </div>
        <motion.button className="add-button" onClick={() => onAdd(variant)} whileTap={{ scale: .98 }}>
          <span>Add to wishlist</span><Plus size={16} />
        </motion.button>
      </div>
    </motion.article>
  );
}

function Collection({ products, onAdd }) {
  const [filters, setFilters] = useState({ category: "all", size: "all", color: "all" });
  const grouped = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      if (!map.has(product.style_code)) map.set(product.style_code, { ...product, variants: [] });
      map.get(product.style_code).variants.push(product);
    });
    return [...map.values()];
  }, [products]);
  const options = useMemo(() => ({
    category: [...new Set(products.map((p) => p.category))].sort(),
    size: [...new Set(products.map((p) => p.size))].sort((a, b) => ["XS", "S", "M", "L", "XL"].indexOf(a) - ["XS", "S", "M", "L", "XL"].indexOf(b)),
    color: [...new Set(products.map((p) => p.color))].sort(),
  }), [products]);
  const visible = grouped.filter((style) => style.variants.some((variant) =>
    (filters.category === "all" || variant.category === filters.category) &&
    (filters.size === "all" || variant.size === filters.size) &&
    (filters.color === "all" || variant.color === filters.color)));
  const clear = () => setFilters({ category: "all", size: "all", color: "all" });

  return (
    <section className="collection" id="collection" aria-labelledby="collection-title">
      <motion.div className="section-heading" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .4 }} variants={reveal}>
        <div><p className="eyebrow">THE EDIT</p><h2 id="collection-title">Everyday, considered</h2></div>
        <p className="result-count">{visible.length} of {grouped.length} styles</p>
      </motion.div>
      <motion.div className="filter-bar" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        {Object.entries(options).map(([key, values]) => (
          <label key={key}><span>{key}</span><select value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}>
            <option value="all">All {key === "category" ? "categories" : `${key}s`}</option>
            {values.map((value) => <option key={value}>{value}</option>)}
          </select></label>
        ))}
        <button className="text-button" onClick={clear}>Clear filters</button>
      </motion.div>
      <AnimatePresence mode="popLayout">
        {visible.length ? (
          <motion.div className="product-grid" layout initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: .07 } } }}>
            {visible.map((style) => <ProductCard key={style.style_code} style={style} onAdd={onAdd} />)}
          </motion.div>
        ) : (
          <motion.div className="empty-state" key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p>No pieces match that combination.</p><button onClick={clear}>Reset filters</button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function WishlistDrawer({ open, onClose, wishlists, activeId, setActiveId, onCreate, onMerge, onQuantity, onRemove }) {
  const [expanded, setExpanded] = useState(null);
  useEffect(() => { if (wishlists.length && !expanded) setExpanded(activeId || wishlists[0].id); }, [wishlists, expanded, activeId]);
  return (
    <AnimatePresence>
      {open && <>
        <motion.div className="scrim open" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
        <motion.aside className="wishlist-drawer open" aria-label="Wishlist manager" initial={{ x: "105%" }} animate={{ x: 0 }} exit={{ x: "105%" }} transition={{ duration: .42, ease }}>
          <div className="drawer-header"><div><p className="eyebrow">YOUR SAVED EDIT</p><h2>Wishlists</h2></div><button className="icon-button" onClick={onClose} aria-label="Close wishlists"><X /></button></div>
          <div className="drawer-actions"><button className="secondary-button" onClick={onCreate}><Plus size={15} /> New list</button><button className="secondary-button" onClick={onMerge} disabled={wishlists.length < 2}><Merge size={15} /> Merge lists</button></div>
          {wishlists.length > 0 && <label className="save-destination"><span>New items save to</span><select value={activeId || wishlists[0].id} onChange={(e) => setActiveId(e.target.value)}>{wishlists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>}
          <div className="wishlist-content">
            {!wishlists.length ? <div className="no-lists"><Heart size={28} /><strong>Your edit starts here</strong><span>Create a list or save a piece from the collection.</span></div> : wishlists.map((list) => (
              <div className={`list-panel ${expanded === list.id ? "expanded" : ""}`} key={list.id}>
                <button className="list-heading" onClick={() => setExpanded(expanded === list.id ? null : list.id)}>
                  <span><strong>{list.name}{Number(list.is_default) === 1 && <span className="default-pill">DEFAULT</span>}</strong><small>{list.item_count} {Number(list.item_count) === 1 ? "item" : "items"}</small></span><ChevronDown className="chevron" size={18} />
                </button>
                <AnimatePresence initial={false}>
                  {expanded === list.id && <motion.div className="list-items" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    {!list.items.length ? <p className="list-empty">Nothing saved here yet.</p> : list.items.map((item) => (
                      <motion.div className="wish-item" key={item.id} layout>
                        <img src={item.image_url} alt="" /><div><h4>{item.name}</h4><p>{item.color} · {item.size}</p><p>{formatPrice(item.price_cents, item.currency)}</p>
                          <div className="quantity-control"><button onClick={() => onQuantity(list.id, item, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={11} /></button><span>{item.quantity}</span><button onClick={() => onQuantity(list.id, item, item.quantity + 1)} aria-label="Increase quantity"><Plus size={11} /></button></div>
                        </div><button className="remove-item" onClick={() => onRemove(list.id, item)} aria-label={`Remove ${item.name}`}><Trash2 size={14} /></button>
                      </motion.div>
                    ))}
                  </motion.div>}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.aside>
      </>}
    </AnimatePresence>
  );
}

function Modal({ children, onClose }) {
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <motion.div className="modal" role="dialog" aria-modal="true" initial={{ opacity: 0, scale: .94, y: 22 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 12 }} transition={{ duration: .3, ease }}>
      <button className="dialog-close" onClick={onClose} aria-label="Close"><X /></button>{children}
    </motion.div>
  </motion.div>;
}

function CreateModal({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  return <Modal onClose={onClose}><p className="eyebrow">A NEW EDIT</p><h2>Create a wishlist</h2><form onSubmit={(e) => { e.preventDefault(); onSubmit(name); }}><label className="field-label" htmlFor="list-name">Name</label><input autoFocus id="list-name" maxLength="40" placeholder="e.g. Weekend away" value={name} onChange={(e) => setName(e.target.value)} required /><div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Create later</button><button className="primary-button" type="submit">Create list</button></div></form></Modal>;
}

function MergeModal({ wishlists, onClose, onSubmit }) {
  const [source, setSource] = useState(wishlists[0]?.id || "");
  const [target, setTarget] = useState(wishlists[1]?.id || "");
  const targets = wishlists.filter((list) => list.id !== source);
  useEffect(() => { if (source === target) setTarget(targets[0]?.id || ""); }, [source, target, targets]);
  return <Modal onClose={onClose}><p className="eyebrow">COMBINE YOUR EDITS</p><h2>Merge wishlists</h2><p className="dialog-copy">Matching size and color variants are combined automatically, with their quantities added together.</p><form onSubmit={(e) => { e.preventDefault(); onSubmit(source, target); }}><label className="field-label">Move everything from</label><select value={source} onChange={(e) => setSource(e.target.value)}>{wishlists.map((list) => <option key={list.id} value={list.id}>{list.name} · {list.item_count} items</option>)}</select><div className="merge-arrow">↓</div><label className="field-label">Into</label><select value={target} onChange={(e) => setTarget(e.target.value)}>{targets.map((list) => <option key={list.id} value={list.id}>{list.name} · {list.item_count} items</option>)}</select><p className="warning-note">The source list will be deleted only after the merge succeeds.</p><div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit"><Merge size={15} /> Merge lists</button></div></form></Modal>;
}

function Story() {
  return <section className="story" id="story"><motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: .25 }} variants={{ visible: { transition: { staggerChildren: .12 } } }}><motion.p className="eyebrow" variants={reveal}>OUR APPROACH</motion.p><motion.blockquote variants={reveal}>“Fewer, better pieces. Clothes that feel like you from the first wear.”</motion.blockquote><motion.div className="story-points" variants={reveal}><span>01 / Thoughtful materials</span><span>02 / Enduring silhouettes</span><span>03 / Small-batch production</span></motion.div></motion.div></section>;
}

export default function App() {
  const [snapshot, setSnapshot] = useState({ products: [], wishlists: [], totalItems: 0 });
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [activeListId, setActiveListId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const toast = (message, type = "success") => {
    const id = crypto.randomUUID(); setToasts((items) => [...items, { id, message, type }]);
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3400);
  };
  const perform = async (operation, success) => {
    try { const result = await operation(); if (success) toast(typeof success === "function" ? success(result) : success); return result; }
    catch (error) { toast(error.message || "Something went wrong.", "error"); return null; }
  };

  useEffect(() => {
    let mounted = true;
    initStore().then((data) => { if (mounted) { setSnapshot(data); setActiveListId(data.wishlists[0]?.id || null); setReady(true); } }).catch((error) => { toast(`Database could not start: ${error.message}`, "error"); setReady(true); });
    const unsubscribe = subscribe((data) => setSnapshot(data));
    return () => { mounted = false; unsubscribe(); };
  }, []);
  useEffect(() => {
    if (activeListId && !snapshot.wishlists.some((list) => list.id === activeListId)) setActiveListId(snapshot.wishlists[0]?.id || null);
  }, [snapshot.wishlists, activeListId]);

  const handleAdd = async (variant) => {
    const listId = await perform(() => addWishlistItem(variant.id, activeListId), `${variant.name} · ${variant.color} · ${variant.size} saved`);
    if (listId && !activeListId) setActiveListId(listId);
  };
  const handleCreate = async (name) => {
    const id = await perform(() => createWishlist(name), `“${name.trim()}” created`);
    if (id) { setActiveListId(id); setModal(null); setDrawerOpen(true); }
  };
  const handleMerge = async (source, target) => {
    const result = await perform(() => mergeWishlists(source, target), (stats) => `${stats.moved} variants merged into “${stats.targetName}”${stats.duplicates ? ` · ${stats.duplicates} duplicates combined` : ""}`);
    if (result) { setActiveListId(target); setModal(null); }
  };

  return <>
    <span className="sr-only" role="status" aria-live="polite">{ready ? "Collection ready" : "Preparing the collection"}</span>
    <Navbar totalItems={snapshot.totalItems} onOpenWishlist={() => setDrawerOpen(true)} />
    <main id="top"><Hero /><Collection products={snapshot.products} onAdd={handleAdd} /><Story /></main>
    <footer><a className="brand footer-brand" href="#top"><span className="brand-mark">TL</span><span>THREADLINE</span></a><p>A small wardrobe, full of possibility.</p><span>© 2026 Threadline</span></footer>
    <WishlistDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} wishlists={snapshot.wishlists} activeId={activeListId} setActiveId={setActiveListId} onCreate={() => setModal("create")} onMerge={() => setModal("merge")} onQuantity={(listId, item, qty) => perform(() => setWishlistItemQuantity(listId, item.id, qty), qty > 0 ? "Quantity updated" : "Item removed")} onRemove={(listId, item) => perform(() => removeWishlistItem(listId, item.id), `${item.name} removed`)} />
    <AnimatePresence>{modal === "create" && <CreateModal onClose={() => setModal(null)} onSubmit={handleCreate} />}{modal === "merge" && <MergeModal wishlists={snapshot.wishlists} onClose={() => setModal(null)} onSubmit={handleMerge} />}</AnimatePresence>
    <div className="toast-region" aria-live="polite"><AnimatePresence>{toasts.map((item) => <motion.div className={`toast ${item.type}`} key={item.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}><Check size={15} />{item.message}</motion.div>)}</AnimatePresence></div>
  </>;
}
