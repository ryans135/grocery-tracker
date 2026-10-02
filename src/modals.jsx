// modals.jsx — sheet shell + all dialogs + toast

import { useState, useRef } from "react";
import { Icon } from "./icons";
import { CATEGORIES, UNITS } from "./data";
import { supabase } from "./supabase";

const PHOTO_BUCKET = "item-photos";

function photoPathFromUrl(url) {
  const marker = `/storage/v1/object/public/${PHOTO_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

// ── Sheet shell ──
function Sheet({ title, onClose, children, footer, center, grab = true }) {
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`sheet${center ? ' sheet--center' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        {!center && grab && <div className="sheet-grab" />}
        <div className="sheet-head">
          <h2 className="sheet-title">{title}</h2>
          <button className="btn btn--ghost btn--icon btn--sm" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, req, children }) {
  return (
    <div className="field">
      <label className="field-label">{label}{req && <span className="req"> *</span>}</label>
      {children}
    </div>
  );
}

const emptyItem = { id: null, name: "", category: "Pantry", quantity: "", unit: "pcs", expiry: "", notes: "", photo: "" };
const emptyShop = { id: null, name: "", category: "Pantry", quantity: "", unit: "pcs", note: "", checked: false };

// ── Item editor ──
export function ItemModal({ item, onClose, onSave, onArchive, onDelete }) {
  const [form, setForm] = useState(item || emptyItem);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim() && form.quantity !== "";
  const handlePhoto = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setBusy(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file);
    if (error) { setBusy(false); alert("Photo upload failed: " + error.message); return; }
    const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    const oldPath = form.photo && photoPathFromUrl(form.photo);
    set("photo", data.publicUrl);
    setBusy(false);
    if (oldPath) supabase.storage.from(PHOTO_BUCKET).remove([oldPath]);
  };
  const removePhoto = () => {
    const oldPath = form.photo && photoPathFromUrl(form.photo);
    set("photo", "");
    if (oldPath) supabase.storage.from(PHOTO_BUCKET).remove([oldPath]);
  };
  return (
    <Sheet title={item?.id ? "Edit item" : "Add item"} onClose={onClose}
      footer={<>
        {item?.id ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--ghost btn--sm" onClick={() => onArchive(form)} style={{ color: 'var(--ink-2)' }}><Icon name="archive" size={15} />Archive</button>
            <button className="btn btn--danger btn--sm" onClick={() => onDelete(form)}><Icon name="trash" size={15} />Delete</button>
          </div>
        ) : (
          <span className="meta">Enter to save</span>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn btn--secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn--primary" disabled={!valid} onClick={() => valid && onSave(form)}>Save item</button>
      </>}>
      <Field label="Item name" req>
        <input className="input" autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Susu UHT Full Cream" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Quantity" req>
          <input className="input" type="number" min="0" inputMode="decimal" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="0" />
        </Field>
        <Field label="Unit">
          <select className="select" value={form.unit} onChange={(e) => set("unit", e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
        </Field>
      </div>
      <Field label="Category">
        <select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Expiry date">
        <input className="input" type="date" value={form.expiry || ""} onChange={(e) => set("expiry", e.target.value)} />
      </Field>
      <Field label="Notes">
        <input className="input" value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Optional — store, location…" />
      </Field>
      <Field label="Photo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" className="media media--lg" onClick={() => fileRef.current.click()}
            style={{ border: '1.5px dashed var(--line-2)', cursor: 'pointer' }} aria-label="Upload photo">
            {busy ? <span className="spin" /> : form.photo ? <img src={form.photo} alt="" /> : <Icon name="camera" size={22} />}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => fileRef.current.click()} disabled={busy}>
              {form.photo ? 'Change' : 'Upload'}
            </button>
            {form.photo && <button type="button" className="btn btn--ghost btn--sm" style={{ color: 'var(--exp-fg)' }} onClick={removePhoto}>Remove</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        </div>
      </Field>
    </Sheet>
  );
}

// ── Shopping item editor ──
export function ShoppingItemModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || emptyShop);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim();
  return (
    <Sheet title={item?.id ? "Edit shopping item" : "Add to shopping list"} onClose={onClose}
      footer={<>
        <button className="btn btn--secondary" onClick={onClose} style={{ marginLeft: 'auto' }}>Cancel</button>
        <button className="btn btn--primary" disabled={!valid} onClick={() => valid && onSave(form)}>Save</button>
      </>}>
      <Field label="Item name" req>
        <input className="input" autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Minyak Goreng" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Quantity">
          <input className="input" type="number" min="0" inputMode="decimal" value={form.quantity || ""} onChange={(e) => set("quantity", e.target.value)} placeholder="optional" />
        </Field>
        <Field label="Unit">
          <select className="select" value={form.unit} onChange={(e) => set("unit", e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
        </Field>
      </div>
      <Field label="Category">
        <select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Note">
        <input className="input" value={form.note || ""} onChange={(e) => set("note", e.target.value)} placeholder="e.g. beli 2 pack, cek tanggal" />
      </Field>
    </Sheet>
  );
}

// ── Low-stock suggest ──
export function SuggestModal({ item, onAdd, onClose }) {
  const q = parseFloat(item.quantity);
  return (
    <Sheet title="Add to shopping list?" onClose={onClose} center
      footer={<>
        <button className="btn btn--secondary" onClick={onClose}>Not now</button>
        <button className="btn btn--primary" onClick={() => { onAdd(item); onClose(); }} style={{ marginLeft: 'auto' }}>Add to list</button>
      </>}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="media media--lg" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          <Icon name="cart" size={26} />
        </div>
        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-2)', margin: 0 }}>
          <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{item.name}</b> is {q === 0 ? 'out of stock' : `running low (${item.quantity} ${item.unit} left)`}. Want it on the shopping list?
        </p>
      </div>
    </Sheet>
  );
}

// ── Name picker ──
export function NameModal({ onSet }) {
  return (
    <Sheet title="Who's using the app?" onClose={() => {}} center grab={false}>
      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)', margin: '0 0 16px' }}>So the activity log can track who made each change.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        {["Ryan", "Keke"].map((n) => (
          <button key={n} onClick={() => onSet(n)} className="card"
            style={{ flex: 1, padding: '22px 0', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: 'var(--fs-title)', fontWeight: 600, color: 'var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{n[0]}</span>
            {n}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

// ── Confirm ──
export function ConfirmModal({ title, message, confirmLabel = "Confirm", danger = false, onConfirm, onClose }) {
  return (
    <Sheet title={title} onClose={onClose} center
      footer={<>
        <button className="btn btn--secondary" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'btn--danger-solid' : 'btn--primary'}`} onClick={() => { onConfirm(); onClose(); }} style={{ marginLeft: 'auto' }}>{confirmLabel}</button>
      </>}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {danger && <div className="media" style={{ background: 'var(--exp-bg)', color: 'var(--exp-fg)', flexShrink: 0 }}><Icon name="alert" size={22} /></div>}
        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-2)', margin: '4px 0' }}>{message}</p>
      </div>
    </Sheet>
  );
}

// ── Toast ──
export function Toast({ toast, onClose }) {
  if (!toast) return null;
  const icon = toast.type === 'error' ? 'alert' : toast.type === 'success' ? 'check' : 'bell';
  return (
    <div className={`toast toast--${toast.type || 'info'}`} role="status" onClick={() => !toast.undo && onClose()}>
      <Icon name={icon} size={16} />
      <span style={{ flex: 1 }}>{toast.message}</span>
      {toast.undo && (
        <button className="toast-undo" onClick={(e) => { e.stopPropagation(); toast.undo(); onClose(); }}>
          <Icon name="undo" size={13} />Undo
        </button>
      )}
    </div>
  );
}
