// chrome.jsx — responsive shell: sidebar (desktop), mobile bar, bottom nav,
// FAB, toolbar controls, summary, states.

import { useState, useEffect, useRef } from "react";
import { Icon, CatGlyph } from "./icons";

const NAV = [
  { id: 'list', label: 'Pantry', icon: 'box' },
  { id: 'oos', label: 'Out of stock', icon: 'alert' },
  { id: 'shopping', label: 'Shopping list', icon: 'cart' },
  { id: 'archived', label: 'Archived', icon: 'archive' },
  { id: 'log', label: 'Activity', icon: 'clock' }
];

const NAV_SHORT = { list: 'Pantry', oos: 'Out', shopping: 'Shopping', archived: 'Archive', log: 'Activity' };

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8l9-4 9 4v8l-9 4-9-4V8z" /><path d="M3 8l9 4 9-4M12 12v8" />
        </svg>
      </div>
      <div>
        <div className="brand-name">Pantry</div>
        <div className="brand-sub">Ryan &amp; Keke</div>
      </div>
    </div>
  );
}

// ── Desktop sidebar ──
export function Sidebar({ view, setView, oosCount, shopCount, onAdd }) {
  const badge = { oos: oosCount, shopping: shopCount };
  return (
    <aside className="sidebar">
      <Brand />
      <button className="btn btn--primary btn--block" onClick={onAdd} style={{ margin: '2px 2px 8px' }}>
        <Icon name="plus" size={17} />Add item
      </button>
      {NAV.map((n) => (
        <button key={n.id} className="nav-item" data-on={view === n.id} onClick={() => setView(n.id)}>
          <Icon name={n.icon} size={19} />{n.label}
          {badge[n.id] > 0 && <span className="countpill">{badge[n.id]}</span>}
        </button>
      ))}
    </aside>
  );
}

// ── Popover ──
function Popover({ trigger, align = 'left', width = 220, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [open]);
  return (
    <div className="menu-wrap" ref={ref}>
      {trigger(open, () => setOpen((o) => !o))}
      {open && (
        <div className={`pop-menu${align === 'right' ? ' align-right' : ''}`} style={{ width }} role="menu">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

// ── Category filter dropdown ──
function CategoryMenu({ cats, cat, setCat }) {
  const total = cats.reduce((a, c) => a + c.n, 0);
  return (
    <Popover width={232} trigger={(open, toggle) => (
      <button className="btn btn--secondary" data-on={cat !== 'All'} onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
        <Icon name="grid" size={16} />{cat === 'All' ? 'Category' : cat}
        <Icon name="chevD" size={14} style={{ marginLeft: 2, opacity: .6 }} />
      </button>
    )}>
      {(close) => (
        <>
          <button className="pop-item" data-on={cat === 'All'} onClick={() => { setCat('All'); close(); }} role="menuitem">
            <Icon name="grid" size={17} />All categories<span className="c-count">{total}</span>
          </button>
          {cats.map((c) => (
            <button key={c.name} className="pop-item" data-on={cat === c.name} onClick={() => { setCat(c.name); close(); }} role="menuitem">
              <CatGlyph cat={c.name} mode="line" size={17} />{c.name}<span className="c-count">{c.n}</span>
            </button>
          ))}
          {cats.length === 0 && <div className="pop-empty">No items yet</div>}
        </>
      )}
    </Popover>
  );
}

const SORT_OPTS = [
  ['expiry', 'Expiry date'],
  ['category', 'Category'],
  ['added', 'Last added'],
  ['modified', 'Last modified'],
  ['name', 'Name (A–Z)']
];

// ── Sort-by dropdown ──
function SortMenu({ sortBy, setSortBy }) {
  const label = (SORT_OPTS.find((o) => o[0] === sortBy) || SORT_OPTS[0])[1];
  return (
    <Popover width={196} align="right" trigger={(open, toggle) => (
      <button className="btn btn--secondary" onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
        <Icon name="sort" size={16} />Sort: {label}
        <Icon name="chevD" size={14} style={{ marginLeft: 2, opacity: .6 }} />
      </button>
    )}>
      {(close) => (
        <>
          <div className="pop-head">Sort by</div>
          {SORT_OPTS.map(([v, l]) => (
            <button key={v} className="pop-item" data-on={sortBy === v} onClick={() => { setSortBy(v); close(); }} role="menuitem">
              {l}{sortBy === v && <span className="pop-check"><Icon name="check" size={16} /></span>}
            </button>
          ))}
        </>
      )}
    </Popover>
  );
}

// ── Mobile top bar ──
export function MobileBar({ syncing, onRefresh }) {
  return (
    <div className="mobile-bar">
      <Brand />
      <div style={{ flex: 1 }} />
      {syncing && <span className="spin" />}
      <button className="btn btn--secondary btn--icon btn--sm" onClick={onRefresh} aria-label="Refresh"><Icon name="refresh" size={16} /></button>
    </div>
  );
}

// ── Mobile bottom nav ──
export function BottomNav({ view, setView, oosCount, shopCount }) {
  const badge = { oos: oosCount, shopping: shopCount };
  return (
    <nav className="bottomnav">
      {NAV.map((n) => (
        <button key={n.id} className="bn-item" data-on={view === n.id} onClick={() => setView(n.id)}>
          <div style={{ position: 'relative' }}>
            <Icon name={n.icon} size={22} />
            {badge[n.id] > 0 && <span className="countpill" style={{ position: 'absolute', top: -5, left: '100%', marginLeft: -8, background: 'var(--accent)' }}>{badge[n.id]}</span>}
          </div>
          <span>{NAV_SHORT[n.id]}</span>
        </button>
      ))}
    </nav>
  );
}

export function Fab({ onClick }) {
  return <button className="fab" onClick={onClick} aria-label="Add item"><Icon name="plus" size={26} /></button>;
}

// ── Toolbar controls ──
export function Toolbar({ search, setSearch, displayMode, setDisplayMode, sortBy, setSortBy, expiryOnly, setExpiryOnly,
  cats, cat, setCat, showSort, showDisplay, showCategory, showExpiryFilter }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <div className="search" style={{ minWidth: 170 }}>
        <span className="search-ico"><Icon name="search" size={16} /></span>
        <input className="input" placeholder="Search names or notes…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
      </div>
      {showCategory && <CategoryMenu cats={cats} cat={cat} setCat={setCat} />}
      {showSort && <SortMenu sortBy={sortBy} setSortBy={setSortBy} />}
      {showExpiryFilter && (
        <button className="chip" data-on={expiryOnly} onClick={() => setExpiryOnly((v) => !v)}>
          <Icon name="filter" size={14} />Expiring ≤7d
        </button>
      )}
      {showDisplay && (
        <button className="btn btn--secondary btn--icon" onClick={() => setDisplayMode((m) => m === 'list' ? 'grid' : 'list')}
          aria-label={displayMode === 'list' ? 'Grid view' : 'List view'} style={{ marginLeft: 'auto' }}>
          <Icon name={displayMode === 'list' ? 'grid' : 'list'} size={17} />
        </button>
      )}
    </div>
  );
}

// ── Compact summary strip ──
export function SummaryBar({ soon, oos, total, onSoon, onOos, onAll }) {
  return (
    <div className="sumbar">
      <button className="sumstat sumstat--ok" onClick={onAll}><span className="n">{total}</span><span className="l">In stock</span></button>
      <button className="sumstat sumstat--soon" onClick={onSoon}><span className="n">{soon}</span><span className="l">Expiring ≤7d</span></button>
      <button className="sumstat sumstat--oos" onClick={onOos}><span className="n">{oos}</span><span className="l">Out of stock</span></button>
    </div>
  );
}

export function ViewHead({ title, count, children }) {
  return (
    <div className="view-head">
      <h1>{title}</h1>
      {count != null && <span className="count">{count}</span>}
      <div className="spacer" />
      {children}
    </div>
  );
}

// ── States ──
export function EmptyState({ icon = 'box', title, sub, action }) {
  return (
    <div className="empty">
      <div className="empty-ico"><Icon name={icon} size={30} /></div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
      {action}
    </div>
  );
}

export function LoadingState({ grid }) {
  const rows = Array.from({ length: grid ? 9 : 8 });
  if (grid) return (
    <div className="thumb-grid">{rows.map((_, i) => (
      <div key={i} className="thumb"><div className="sk" style={{ aspectRatio: '4/3', borderRadius: 0 }} /><div style={{ padding: 9 }}><div className="sk" style={{ height: 12, width: '80%' }} /><div className="sk" style={{ height: 9, width: '45%', marginTop: 6 }} /></div></div>
    ))}</div>
  );
  return (
    <div className="list-grid">{rows.map((_, i) => (
      <div key={i} className="row compact"><div className="sk media" /><div style={{ flex: 1 }}><div className="sk" style={{ height: 12, width: '60%' }} /><div className="sk" style={{ height: 9, width: '35%', marginTop: 7 }} /></div></div>
    ))}</div>
  );
}

export function ErrorBanner({ msg, onRetry }) {
  return (
    <div className="banner" style={{ marginBottom: 12 }}>
      <Icon name="alert" size={17} />
      <span style={{ flex: 1 }}>{msg}</span>
      <button className="btn btn--danger btn--sm" onClick={onRetry}>Retry</button>
    </div>
  );
}
