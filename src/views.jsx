// views.jsx — Inventory, Out of stock, Shopping, Archived, Activity.

import { Icon, CatGlyph } from "./icons";
import { Badge, CATEGORIES, daysUntilExpiry, expiryStatus, fmtAgo, fmtDate, fmtTs } from "./data";
import { EmptyState, LoadingState } from "./chrome";

function Media({ item, iconMode, lg }) {
  return (
    <div className={`media${lg ? ' media--lg' : ''}`}>
      {item.photo ? <img src={item.photo} alt="" /> : <CatGlyph cat={item.category} mode={iconMode} size={lg ? 26 : 21} />}
    </div>
  );
}

function Stepper({ item, onQty }) {
  return (
    <div className="stepper" onClick={e => e.stopPropagation()}>
      <button onClick={() => onQty(item, (parseFloat(item.quantity) || 0) - 1)} aria-label="Decrease">−</button>
      <input type="number" min="0" value={item.quantity} onChange={e => onQty(item, e.target.value)} aria-label={`${item.name} quantity`} />
      <button onClick={() => onQty(item, (parseFloat(item.quantity) || 0) + 1)} aria-label="Increase">+</button>
    </div>
  );
}

function ModLine({ item }) {
  const ts = item.modified || item.added;
  if (!ts) return null;
  return <div className="meta meta-mod" title={fmtTs(ts)}><Icon name="clock" size={11} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>edited {fmtAgo(ts)} · {fmtDate(ts)}</span></div>;
}

function ItemRow({ item, iconMode, density, onEdit, onQty }) {
  const days = daysUntilExpiry(item.expiry);
  const s = expiryStatus(days);
  const cls = `row${s === 'expired' ? ' row--expired' : s === 'critical' ? ' row--critical' : ''}`;

  if (density === 'comfortable') {
    return (
      <div className={cls} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 0, overflow: 'hidden' }}>
        <button onClick={() => onEdit(item)} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '11px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <Media item={item} iconMode={iconMode} lg />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="item-name name-clamp">{item.name}</div>
            <div className="row-meta">
              <Badge days={days} />
              <span className="catpill"><CatGlyph cat={item.category} mode="line" size={12} />{item.category}</span>
            </div>
            <ModLine item={item} />
          </div>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderTop: '1px solid var(--line)', background: 'var(--card-2)' }}>
          <Stepper item={item} onQty={onQty} />
          <span className="meta" style={{ fontWeight: 600 }}>{item.unit}</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn--ghost btn--sm" onClick={() => onEdit(item)}><Icon name="edit" size={14} />Details</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cls} compact`} style={{ alignItems: 'flex-start' }}>
      <button onClick={() => onEdit(item)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
        <Media item={item} iconMode={iconMode} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="item-name name-clamp">{item.name}</div>
          <div className="row-meta">
            <Badge days={days} />
            <span className="meta cat-meta">{item.category}</span>
          </div>
          <ModLine item={item} />
        </div>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 2 }}>
        <Stepper item={item} onQty={onQty} />
        <span className="meta" style={{ minWidth: 22, textAlign: 'left' }}>{item.unit}</span>
        <button className="btn btn--ghost btn--icon btn--sm" onClick={() => onEdit(item)} aria-label="Details" style={{ color: 'var(--ink-3)' }}><Icon name="chevR" size={16} /></button>
      </div>
    </div>
  );
}

function ItemThumb({ item, iconMode, onClick }) {
  const days = daysUntilExpiry(item.expiry);
  const s = expiryStatus(days);
  return (
    <div className={`thumb${s === 'expired' ? ' thumb--expired' : s === 'critical' ? ' thumb--critical' : ''}`} onClick={onClick}>
      <div className="thumb-media">
        {item.photo ? <img src={item.photo} alt="" /> : <CatGlyph cat={item.category} mode={iconMode} size={38} />}
        <span className="thumb-badge"><Badge days={days} /></span>
      </div>
      <div className="thumb-body">
        <div className="item-name name-clamp" style={{ fontSize: 'var(--fs-sm)' }}>{item.name}</div>
        <div className="meta" style={{ marginTop: 2 }}>{item.quantity} {item.unit} · {item.category}</div>
        <ModLine item={item} />
      </div>
    </div>
  );
}

function SectionHead({ cat }) {
  return (
    <div className="sec-head">
      <CatGlyph cat={cat} mode="line" size={15} />
      <span className="sec-head-label">{cat}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    </div>
  );
}

function GroupedList({ items, grouped, render }) {
  if (!grouped) return render(items);
  const order = CATEGORIES.filter(c => c !== 'All' && items.some(i => i.category === c));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {order.map(c => <div key={c}><SectionHead cat={c} />{render(items.filter(i => i.category === c))}</div>)}
    </div>
  );
}

// ── INVENTORY ──
export function InventoryView({ items, loading, displayMode, iconMode, density, grouped, onEdit, onQty, onAdd }) {
  if (loading) return <LoadingState grid={displayMode === 'grid'} />;
  if (!items.length) return <EmptyState icon="box" title="Nothing here yet" sub="Add your first pantry item, or pick another category."
    action={<button className="btn btn--primary" onClick={onAdd} style={{ marginTop: 4 }}><Icon name="plus" size={16} />Add item</button>} />;
  const render = (list) => displayMode === 'grid'
    ? <div className="thumb-grid">{list.map(it => <ItemThumb key={it.id} item={it} iconMode={iconMode} onClick={() => onEdit(it)} />)}</div>
    : <div className="list-grid">{list.map(it => <ItemRow key={it.id} item={it} iconMode={iconMode} density={density} onEdit={onEdit} onQty={onQty} />)}</div>;
  return <GroupedList items={items} grouped={grouped} render={render} />;
}

// ── OUT OF STOCK ──
export function OutOfStockView({ items, displayMode, iconMode, grouped, onList, onRestock, onEdit }) {
  if (!items.length) return <EmptyState icon="check" title="Fully stocked" sub="Nothing is out of stock right now." />;
  const render = (list) => displayMode === 'grid'
    ? <div className="thumb-grid">{list.map(it => (
        <div key={it.id} className={`thumb${expiryStatus(daysUntilExpiry(it.expiry)) === 'expired' ? ' thumb--expired' : ''}`}>
          <div className="thumb-media" onClick={() => onEdit(it)} style={{ cursor: 'pointer' }}>
            {it.photo ? <img src={it.photo} alt="" /> : <CatGlyph cat={it.category} mode={iconMode} size={38} />}
          </div>
          <div className="thumb-body">
            <div className="item-name name-clamp" style={{ fontSize: 'var(--fs-sm)' }}>{it.name}</div>
            <div className="meta" style={{ marginTop: 2 }}>{it.category}</div>
            <ModLine item={it} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="btn btn--secondary btn--sm" onClick={() => onList(it)} style={{ flex: 1 }}><Icon name="cart" size={13} />List</button>
              <button className="btn btn--primary btn--sm" onClick={() => onRestock(it)} style={{ flex: 1 }}>Restock</button>
            </div>
          </div>
        </div>
      ))}</div>
    : <div className="list-grid">{list.map(it => (
        <div key={it.id} className="row compact" style={{ alignItems: 'flex-start' }}>
          <button onClick={() => onEdit(it)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
            <Media item={it} iconMode={iconMode} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="item-name name-clamp">{it.name}</div>
              <div className="meta" style={{ marginTop: 2 }}>{it.category}</div>
              <ModLine item={it} />
            </div>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 2 }}>
            <button className="btn btn--secondary btn--sm" onClick={() => onList(it)} aria-label="Add to shopping list"><Icon name="cart" size={14} />List</button>
            <button className="btn btn--primary btn--sm" onClick={() => onRestock(it)}>Restock</button>
          </div>
        </div>
      ))}</div>;
  return <GroupedList items={items} grouped={grouped} render={render} />;
}

// ── SHOPPING LIST ──
export function ShoppingView({ items, loading, iconMode, displayMode, grouped, onToggle, onEdit, onDelete }) {
  if (loading) return <LoadingState grid={displayMode === 'grid'} />;
  if (!items.length) return <EmptyState icon="cart" title="Shopping list is empty" sub="Add items here, or send out-of-stock things over from your pantry." />;

  const shopRow = (s) => (
    <div key={s.id} className="row compact" style={{ opacity: s.checked ? .55 : 1 }}>
      <button className="check" data-on={s.checked} onClick={() => onToggle(s)} role="checkbox" aria-checked={s.checked} aria-label={s.name}>
        <Icon name="check" size={14} style={{ color: '#fff' }} />
      </button>
      <Media item={s} iconMode={iconMode} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="item-name name-clamp" style={{ textDecoration: s.checked ? 'line-through' : 'none' }}>{s.name}</div>
        {(s.quantity || s.note) && <div className="meta" style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.quantity ? `${s.quantity} ${s.unit}` : ''}{s.quantity && s.note ? ' · ' : ''}{s.note}</div>}
      </div>
      <button className="btn btn--ghost btn--icon btn--sm" onClick={() => onEdit(s)} aria-label="Edit"><Icon name="edit" size={15} /></button>
      <button className="btn btn--ghost btn--icon btn--sm" onClick={() => onDelete(s)} aria-label="Delete" style={{ color: 'var(--ink-3)' }}><Icon name="trash" size={15} /></button>
    </div>
  );

  const shopThumb = (s) => (
    <div key={s.id} className="thumb" style={{ opacity: s.checked ? .6 : 1 }} onClick={() => onEdit(s)}>
      <div className="thumb-media">
        {s.photo ? <img src={s.photo} alt="" /> : <CatGlyph cat={s.category} mode={iconMode} size={38} />}
        <button className="check" data-on={s.checked} onClick={(e) => { e.stopPropagation(); onToggle(s); }}
          role="checkbox" aria-checked={s.checked} aria-label={s.name} style={{ position: 'absolute', top: 7, left: 7 }}>
          <Icon name="check" size={14} style={{ color: '#fff' }} />
        </button>
      </div>
      <div className="thumb-body">
        <div className="item-name name-clamp" style={{ fontSize: 'var(--fs-sm)', textDecoration: s.checked ? 'line-through' : 'none' }}>{s.name}</div>
        <div className="meta" style={{ marginTop: 2 }}>{s.quantity ? `${s.quantity} ${s.unit} · ` : ''}{s.category}</div>
        {s.note && <div className="meta" style={{ marginTop: 2, fontStyle: 'italic' }}>{s.note}</div>}
      </div>
    </div>
  );

  const render = (list) => displayMode === 'grid'
    ? <div className="thumb-grid">{list.map(shopThumb)}</div>
    : <div className="list-grid">{list.map(shopRow)}</div>;
  return <GroupedList items={items} grouped={grouped} render={render} />;
}

// ── ARCHIVED ──
export function ArchivedView({ items, iconMode, displayMode, grouped, onRestore, onDelete }) {
  if (!items.length) return <EmptyState icon="archive" title="No archived items" sub="Archive an item from its details to stash it here without deleting it." />;
  const archThumb = (it) => (
    <div key={it.id} className="thumb">
      <div className="thumb-media">
        {it.photo ? <img src={it.photo} alt="" /> : <CatGlyph cat={it.category} mode={iconMode} size={38} />}
      </div>
      <div className="thumb-body">
        <div className="item-name name-clamp" style={{ fontSize: 'var(--fs-sm)' }}>{it.name}</div>
        <div className="meta" style={{ marginTop: 2 }}>{it.category}</div>
        <ModLine item={it} />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button className="btn btn--secondary btn--sm" onClick={() => onRestore(it)} style={{ flex: 1 }}><Icon name="restore" size={13} />Restore</button>
          <button className="btn btn--ghost btn--icon btn--sm" onClick={() => onDelete(it)} aria-label="Delete" style={{ color: 'var(--exp-fg)' }}><Icon name="trash" size={14} /></button>
        </div>
      </div>
    </div>
  );
  const archRow = (it) => (
    <div key={it.id} className="row compact" style={{ alignItems: 'flex-start' }}>
      <Media item={it} iconMode={iconMode} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="item-name name-clamp">{it.name}</div>
        <div className="meta" style={{ marginTop: 2 }}>{it.category}</div>
        <ModLine item={it} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 2 }}>
        <button className="btn btn--secondary btn--sm" onClick={() => onRestore(it)}><Icon name="restore" size={14} />Restore</button>
        <button className="btn btn--ghost btn--icon btn--sm" onClick={() => onDelete(it)} aria-label="Delete" style={{ color: 'var(--exp-fg)' }}><Icon name="trash" size={15} /></button>
      </div>
    </div>
  );
  const render = (list) => displayMode === 'grid'
    ? <div className="thumb-grid">{list.map(archThumb)}</div>
    : <div className="list-grid">{list.map(archRow)}</div>;
  return <GroupedList items={items} grouped={grouped} render={render} />;
}

// ── ACTIVITY LOG ──
export function LogView({ logs }) {
  if (!logs.length) return <EmptyState icon="clock" title="No activity yet" sub="Edits, restocks and removals show up here with who made them." />;
  return (
    <div className="card log-card" style={{ maxWidth: 680 }}>
      {logs.map(l => (
        <div key={l.id} className="log-row">
          <span className={`log-tag log-tag--${l.action}`}>{l.action}</span>
          <span className="log-name">{l.item_name}</span>
          {l.detail && <span className="log-detail">{l.detail}</span>}
          <span className="log-meta">{l.username} · {fmtAgo(l.created_at)}</span>
        </div>
      ))}
    </div>
  );
}
