// icons.jsx — UI glyphs + category icons (line set) + emoji map
// 24x24, currentColor, 1.7 stroke, round caps/joins.

const _s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };

// ── Generic UI icons ──────────────────────────────────────────
export function Icon({ name, size = 18, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', style };
  switch (name) {
    case 'search':return <svg {...p}><circle cx="11" cy="11" r="7" {..._s} /><path d="M20 20l-3.5-3.5" {..._s} /></svg>;
    case 'plus':return <svg {...p}><path d="M12 5v14M5 12h14" {..._s} /></svg>;
    case 'edit':return <svg {...p}><path d="M14 4l6 6M4 20l1-4L16 5l3 3L8 19l-4 1z" {..._s} /></svg>;
    case 'trash':return <svg {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" {..._s} /></svg>;
    case 'close':return <svg {...p}><path d="M6 6l12 12M18 6L6 18" {..._s} /></svg>;
    case 'check':return <svg {...p}><path d="M4 12.5l5 5L20 6" {..._s} /></svg>;
    case 'chevR':return <svg {...p}><path d="M9 5l7 7-7 7" {..._s} /></svg>;
    case 'chevD':return <svg {...p}><path d="M5 9l7 7 7-7" {..._s} /></svg>;
    case 'sort':return <svg {...p}><path d="M7 5v14M7 19l-3-3M7 5l3 3M17 19V5M17 5l-3 3M17 5l3 3" {..._s} /></svg>;
    case 'filter':return <svg {...p}><path d="M4 6h16M7 12h10M10 18h4" {..._s} /></svg>;
    case 'grid':return <svg {...p}><rect x="4" y="4" width="7" height="7" rx="1.6" {..._s} /><rect x="13" y="4" width="7" height="7" rx="1.6" {..._s} /><rect x="4" y="13" width="7" height="7" rx="1.6" {..._s} /><rect x="13" y="13" width="7" height="7" rx="1.6" {..._s} /></svg>;
    case 'list':return <svg {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" {..._s} /></svg>;
    case 'refresh':return <svg {...p}><path d="M20 11a8 8 0 10-1.5 5M20 5v6h-6" {..._s} /></svg>;
    case 'camera':return <svg {...p}><path d="M3 8a2 2 0 012-2h2l1.5-2h7L17 6h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" {..._s} /><circle cx="12" cy="12.5" r="3.2" {..._s} /></svg>;
    case 'alert':return <svg {...p}><path d="M12 4l9 16H3L12 4z" {..._s} /><path d="M12 10v5M12 18h.01" {..._s} /></svg>;
    case 'cart':return <svg {...p}><path d="M3 4h2l2.2 11h10l2-8H6.5" {..._s} /><circle cx="9" cy="19" r="1.4" {..._s} /><circle cx="17" cy="19" r="1.4" {..._s} /></svg>;
    case 'clock':return <svg {...p}><circle cx="12" cy="12" r="8" {..._s} /><path d="M12 8v4.5l3 2" {..._s} /></svg>;
    case 'box':return <svg {...p}><path d="M3 8l9-4 9 4v8l-9 4-9-4V8z" {..._s} /><path d="M3 8l9 4 9-4M12 12v8" {..._s} /></svg>;
    case 'leaf':return <svg {...p}><path d="M5 19C4 12 9 5 19 5c0 10-7 15-14 14zM5 19c2-5 5-8 9-10" {..._s} /></svg>;
    case 'sun':return <svg {...p}><circle cx="12" cy="12" r="4" {..._s} /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17 17l1.5 1.5M18.5 5.5L17 7M7 17l-1.5 1.5" {..._s} /></svg>;
    case 'switch':return <svg {...p}><path d="M4 8h13l-3-3M20 16H7l3 3" {..._s} /></svg>;
    case 'bell':return <svg {...p}><path d="M6 9a6 6 0 1112 0c0 5 2 7 2 7H4s2-2 2-7zM9.5 20a2.5 2.5 0 005 0" {..._s} /></svg>;
    case 'note':return <svg {...p}><path d="M5 4h11l3 3v13H5V4z" {..._s} /><path d="M16 4v3h3M8 12h8M8 16h6" {..._s} /></svg>;
    case 'archive':return <svg {...p}><rect x="3" y="4" width="18" height="4" rx="1" {..._s} /><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8" {..._s} /><path d="M10 12h4" {..._s} /></svg>;
    case 'restore':return <svg {...p}><path d="M4 8a8 8 0 11-1 4" {..._s} /><path d="M4 4v4h4" {..._s} /><path d="M12 8v4l3 2" {..._s} /></svg>;
    case 'undo':return <svg {...p}><path d="M9 7L4 12l5 5" {..._s} /><path d="M4 12h11a5 5 0 010 10h-1" {..._s} /></svg>;
    case 'logout':return <svg {...p}><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l-5-5 5-5M5 12h11" {..._s} /></svg>;
    case 'mail':return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" {..._s} /><path d="M3 7l9 6 9-6" {..._s} /></svg>;
    default:return null;
  }
}

// ── Category emoji map ────────────────────────────────────────
export const CAT_EMOJI = {
  'Fresh Produce': '🥦', 'Meat & Seafood': '🥩', 'Dairy & Eggs': '🥛',
  'Bakery': '🍞', 'Pantry': '🥫', 'Snacks & Drinks': '🍿',
  'Frozen': '❄️', 'Household': '🧽', 'Health & Beauty': '🧴', 'Other': '📦'
};

// ── Category line icons ───────────────────────────────────────
export function CatLine({ cat, size = 24 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24' };
  switch (cat) {
    case 'Fresh Produce':return <svg {...p}><path d="M12 8c0 6-3 11-5 11s-4-3-2-7 5-5 7-4zM12 8c0-6 3-7 6-5 1 4-2 7-6 5z" {..._s} /></svg>;
    case 'Meat & Seafood':return <svg {...p}><path d="M14 4c4 0 6 3 6 6s-3 5-6 5c-1.5 3-4 4-6 3s-1-4 1-5c-1-3 1-6 4-6 .5-1.5 0-3 1-3z" {..._s} /><circle cx="15" cy="9" r="1" {..._s} /></svg>;
    case 'Dairy & Eggs':return <svg {...p}><path d="M8 3h8M9 3l-1 4v13a1 1 0 001 1h6a1 1 0 001-1V7l-1-4M8.3 8h7.4" {..._s} /></svg>;
    case 'Bakery':return <svg {...p}><path d="M5 11c0-3 3-5 7-5s7 2 7 5c0 1-1 1.5-2 1.5V18a1 1 0 01-1 1H8a1 1 0 01-1-1v-5.5C6 12.5 5 12 5 11z" {..._s} /><path d="M10 9v8M14 9v8" {..._s} /></svg>;
    case 'Pantry':return <svg {...p}><ellipse cx="12" cy="6" rx="6" ry="2.2" {..._s} /><path d="M6 6v12c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2V6" {..._s} /><path d="M8.5 10h7" {..._s} /></svg>;
    case 'Snacks & Drinks':return <svg {...p}><path d="M7 5h10l-1 15a1 1 0 01-1 1H9a1 1 0 01-1-1L7 5z" {..._s} /><path d="M7.4 10h9.2M13 3v2" {..._s} /></svg>;
    case 'Frozen':return <svg {...p}><path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9M12 6l-2.5-2M12 6l2.5-2M12 18l-2.5 2M12 18l2.5 2M6 9l.3-3M6 9l-3 .3M18 15l-.3 3M18 15l3-.3" {..._s} /></svg>;
    case 'Household':return <svg {...p}><path d="M9 3l1 9M14 4l-2 8M8 12h8l1 8H7l1-8z" {..._s} /><path d="M9 16h6" {..._s} /></svg>;
    case 'Health & Beauty':return <svg {...p}><path d="M9 8h6v11a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" {..._s} /><path d="M10 8V5a1 1 0 011-1h2a1 1 0 011 1v3M9.5 12h5" {..._s} /></svg>;
    default:return <svg {...p}><path d="M3 8l9-4 9 4v8l-9 4-9-4V8z" {..._s} /><path d="M3 8l9 4 9-4M12 12v8" {..._s} /></svg>;
  }
}

// CatGlyph — respects the icon-style preference ('emoji' | 'line')
export function CatGlyph({ cat, mode = 'emoji', size = 24 }) {
  if (mode === 'emoji') return <span className="emoji" style={{ fontSize: size }}>{CAT_EMOJI[cat] || '📦'}</span>;
  return <CatLine cat={cat} size={size} />;
}
