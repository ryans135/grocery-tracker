// data.jsx — categories, units, date/status helpers, sort comparator, Badge primitive.
// Locale id-ID for all date formatting.

// Consolidated 10 categories. "All" is a filter value only, never a stored category.
export const CATEGORIES = [
  "All",
  "Fresh Produce",     // fruits + vegetables
  "Meat & Seafood",    // poultry, beef, fish
  "Dairy & Eggs",      // milk, cheese, yoghurt, eggs
  "Bakery",            // bread, pastries
  "Pantry",            // grains, pasta, canned, condiments, oils, dry goods
  "Snacks & Drinks",   // chips, sweets, beverages, water, coffee
  "Frozen",            // anything from the freezer
  "Household",         // cleaning, paper goods, supplies
  "Health & Beauty",   // vitamins, medicine, self-care, make-up
  "Other",
];

export const UNITS = ["pcs", "kg", "g", "L", "mL", "pack", "box", "bottle", "bag", "sachet"];

export function daysUntilExpiry(d) {
  if (!d) return null;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const e = new Date(d); e.setHours(0, 0, 0, 0);
  return Math.round((e - t) / 86400000);
}

export function expiryStatus(days) {
  if (days === null) return "none";
  if (days < 0) return "expired";
  if (days <= 3) return "critical";
  if (days <= 7) return "soon";
  return "ok";
}

export function badgeLabel(days) {
  const s = expiryStatus(days);
  if (s === "none") return "no date";
  if (s === "expired") return `${Math.abs(days)}d ago`;
  if (days === 0) return "today";
  return `${days}d left`;
}

export function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtTs(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function fmtAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}

// Shared sort comparator used by Pantry, Out-of-stock, Shopping and Archived.
export function sortItems(list, sortBy) {
  const byExp = (a, b) => (daysUntilExpiry(a.expiry) ?? 9e9) - (daysUntilExpiry(b.expiry) ?? 9e9);
  return [...list].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'added') return new Date(b.added || 0) - new Date(a.added || 0);
    if (sortBy === 'modified') return new Date(b.modified || b.added || 0) - new Date(a.modified || a.added || 0);
    if (sortBy === 'category') return a.category.localeCompare(b.category) || byExp(a, b);
    return byExp(a, b); // expiry (default)
  });
}

// Badge primitive
export function Badge({ days }) {
  const s = expiryStatus(days);
  return (
    <span className={`badge badge--${s}`}>
      <span className="dot" />{badgeLabel(days)}
    </span>
  );
}
