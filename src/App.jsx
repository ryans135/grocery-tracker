// App.jsx — Pantry tracker. Supabase-backed; realtime channel reloads on any change.

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { CATEGORIES, daysUntilExpiry, sortItems } from "./data";
import {
  Sidebar, MobileBar, BottomNav, Fab, Toolbar, SummaryBar, ViewHead,
  ErrorBanner,
} from "./chrome";
import {
  InventoryView, OutOfStockView, ShoppingView, ArchivedView, LogView,
} from "./views";
import {
  ItemModal, ShoppingItemModal, SuggestModal, ConfirmModal, NameModal, Toast,
} from "./modals";
import { Icon } from "./icons";
import "./app.css";

const ICON_MODE = "emoji";
const DENSITY = "compact";

function catCounts(list) {
  const m = {};
  list.forEach((i) => { m[i.category] = (m[i.category] || 0) + 1; });
  return CATEGORIES.filter((c) => c !== "All" && m[c]).map((c) => ({ name: c, n: m[c] }));
}

const stamp = () => new Date().toISOString();

export default function App() {
  const [items, setItems] = useState([]);
  const [shop, setShop] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const [view, setViewRaw] = useState("list");
  const [displayMode, setDisplayMode] = useState("list");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("expiry");
  const [expiryOnly, setExpiryOnly] = useState(false);
  const [cat, setCat] = useState("All");
  const [user, setUser] = useState(() => localStorage.getItem("grocery_user") || "");

  const [itemModal, setItemModal] = useState(null);
  const [shopModal, setShopModal] = useState(null);
  const [suggest, setSuggest] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const setView = (v) => { setViewRaw(v); setCat("All"); setSearch(""); };
  const showToast = (message, type = "info", undo = null) => setToast({ message, type, undo });

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const x = setTimeout(() => setToast(null), toast.undo ? 5500 : 3000);
    return () => clearTimeout(x);
  }, [toast]);

  // ── data loaders ──
  const loadItems = useCallback(async () => {
    const { data, error } = await supabase.from("items").select("*").order("name");
    if (error) { setError("Items: " + error.message); return; }
    setError(null);
    setItems(data || []);
  }, []);
  const loadShop = useCallback(async () => {
    const { data, error } = await supabase.from("shopping_list").select("*").order("category");
    if (error) { console.error("Shopping:", error.message); return; }
    setShop(data || []);
  }, []);
  const loadLogs = useCallback(async () => {
    const { data, error } = await supabase.from("logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) { console.error("Logs:", error.message); return; }
    setLogs(data || []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    await Promise.all([loadItems(), loadShop(), loadLogs()]);
    setLoading(false);
  }, [loadItems, loadShop, loadLogs]);

  // Silent refetch — runs after every mutation as a safety net in case the
  // realtime subscription isn't firing (e.g. tables not in supabase_realtime publication).
  const reloadAll = useCallback(() => {
    loadItems(); loadShop(); loadLogs();
  }, [loadItems, loadShop, loadLogs]);

  useEffect(() => {
    load();
    const ch = supabase.channel("realtime-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, loadItems)
      .on("postgres_changes", { event: "*", schema: "public", table: "logs" }, loadLogs)
      .on("postgres_changes", { event: "*", schema: "public", table: "shopping_list" }, loadShop)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [load, loadItems, loadShop, loadLogs]);

  // ── mutations ──
  const addLog = async (action, item_name, detail = "") => {
    await supabase.from("logs").insert({ action, item_name, detail, username: user });
  };

  const saveItem = async (form) => {
    const isEdit = !!form.id;
    const ts = stamp();
    const rec = {
      id: form.id || crypto.randomUUID(),
      name: form.name, category: form.category,
      quantity: form.quantity, unit: form.unit,
      expiry: form.expiry || null, notes: form.notes || "",
      photo: form.photo || "",
      added: form.added || ts, modified: ts,
      archived: form.archived || false,
      updated_at: ts,
    };
    const { error } = await supabase.from("items").upsert(rec);
    if (error) { showToast("Save failed: " + error.message, "error"); return; }
    await addLog(isEdit ? "edited" : "added", form.name,
      isEdit ? `qty: ${form.quantity} ${form.unit}` : `${form.quantity} ${form.unit}, ${form.category}`);
    setItemModal(null);
    showToast(isEdit ? "Item updated" : "Item added", "success");
    if (!isEdit && parseFloat(form.quantity) <= 1) setSuggest(rec);
    reloadAll();
  };

  const askDelete = (item) => setConfirm({
    title: "Remove item?",
    message: `Remove "${item.name}" from your pantry?`,
    confirmLabel: "Remove",
    danger: true,
    onConfirm: async () => {
      const snap = { ...item };
      await supabase.from("items").delete().eq("id", item.id);
      await addLog("removed", item.name);
      showToast("Item removed", "info", async () => {
        const { ...rest } = snap;
        await supabase.from("items").insert(rest);
        await addLog("added", item.name, "restored (undo)");
        reloadAll();
      });
      reloadAll();
    },
  });

  const archiveItem = async (item) => {
    const ts = stamp();
    await supabase.from("items").update({ archived: true, modified: ts, updated_at: ts }).eq("id", item.id);
    await addLog("edited", item.name, "archived");
    setItemModal(null);
    showToast(`"${item.name}" archived`, "info", async () => {
      const t2 = stamp();
      await supabase.from("items").update({ archived: false, modified: t2, updated_at: t2 }).eq("id", item.id);
      reloadAll();
    });
    reloadAll();
  };

  const restoreItem = async (item) => {
    const ts = stamp();
    await supabase.from("items").update({ archived: false, modified: ts, updated_at: ts }).eq("id", item.id);
    await addLog("edited", item.name, "restored");
    showToast(`"${item.name}" restored`, "success", async () => {
      const t2 = stamp();
      await supabase.from("items").update({ archived: true, modified: t2, updated_at: t2 }).eq("id", item.id);
      reloadAll();
    });
    reloadAll();
  };

  const setQty = async (item, val) => {
    if (String(val).trim() === "") return;
    const q = Math.max(0, parseFloat(val) || 0);
    const prev = parseFloat(item.quantity) || 0;
    if (q === prev) return;
    const ts = stamp();
    await supabase.from("items").update({ quantity: String(q), modified: ts, updated_at: ts }).eq("id", item.id);
    await addLog(q > prev ? "restocked" : "consumed", item.name, `${prev} → ${q} ${item.unit}`);
    showToast(q > prev ? "Stock increased" : "Stock reduced", "info", async () => {
      const t2 = stamp();
      await supabase.from("items").update({ quantity: String(prev), modified: t2, updated_at: t2 }).eq("id", item.id);
      reloadAll();
    });
    if (q <= 1 && q < prev) setSuggest({ ...item, quantity: String(q) });
    reloadAll();
  };

  const saveShop = async (form) => {
    const isEdit = !!form.id;
    const rec = {
      id: form.id || crypto.randomUUID(),
      name: form.name, category: form.category,
      quantity: form.quantity || "", unit: form.unit,
      note: form.note || "", checked: form.checked || false,
    };
    const { error } = await supabase.from("shopping_list").upsert(rec);
    if (error) { showToast("Save failed: " + error.message, "error"); return; }
    setShopModal(null);
    showToast(isEdit ? "Updated" : "Added to list", "success");
    reloadAll();
  };

  const addToShop = async (item) => {
    if (shop.some((s) => s.name.toLowerCase() === item.name.toLowerCase())) {
      showToast(`"${item.name}" is already on the list`, "info");
      return;
    }
    const rec = {
      id: crypto.randomUUID(), name: item.name,
      category: item.category || "Other",
      quantity: item.quantity || "1", unit: item.unit || "pcs",
      note: "", checked: false,
    };
    await supabase.from("shopping_list").insert(rec);
    showToast(`Added "${item.name}" to shopping list`, "success", async () => {
      await supabase.from("shopping_list").delete().eq("id", rec.id);
      reloadAll();
    });
    reloadAll();
  };

  const toggleCheck = async (s) => {
    await supabase.from("shopping_list").update({ checked: !s.checked }).eq("id", s.id);
    reloadAll();
  };

  const delShop = async (s) => {
    const snap = { ...s };
    await supabase.from("shopping_list").delete().eq("id", s.id);
    showToast("Removed from list", "info", async () => {
      await supabase.from("shopping_list").insert(snap);
      reloadAll();
    });
    reloadAll();
  };

  // Done shopping: push checked entries into pantry stock, then clear them.
  const sweep = () => {
    const checked = shop.filter((s) => s.checked);
    if (!checked.length) return;
    setConfirm({
      title: "Done shopping?",
      message: `Add ${checked.length} item(s) into your pantry stock and clear them from the list?`,
      confirmLabel: "Add to pantry",
      onConfirm: async () => {
        for (const s of checked) {
          const add = parseFloat(s.quantity) || 1;
          const existing = items.find((i) => i.name.toLowerCase() === s.name.toLowerCase());
          const ts = stamp();
          if (existing) {
            const prev = parseFloat(existing.quantity) || 0;
            const q = prev + add;
            await supabase.from("items").update({
              quantity: String(q),
              unit: s.unit || existing.unit,
              archived: false,
              modified: ts, updated_at: ts,
            }).eq("id", existing.id);
            await addLog("restocked", s.name, `${prev} → ${q} ${s.unit || existing.unit}`);
          } else {
            const newItem = {
              id: crypto.randomUUID(),
              name: s.name, category: s.category || "Other",
              quantity: String(add), unit: s.unit || "pcs",
              expiry: null, notes: s.note || "", photo: "",
              added: ts, modified: ts, archived: false, updated_at: ts,
            };
            await supabase.from("items").insert(newItem);
            await addLog("added", s.name, `${add} ${s.unit || "pcs"}, from shopping list`);
          }
          await supabase.from("shopping_list").delete().eq("id", s.id);
        }
        showToast("Pantry stock updated", "success");
        reloadAll();
      },
    });
  };

  const signOut = () => supabase.auth.signOut();

  const refresh = async () => {
    setSyncing(true);
    await load();
    setTimeout(() => setSyncing(false), 400);
  };

  // ── derived ──
  const active = items.filter((i) => !i.archived);
  const archived = items.filter((i) => i.archived);
  const inStock = active.filter((i) => parseFloat(i.quantity) > 0);
  const oos = active.filter((i) => parseFloat(i.quantity) <= 0);
  const soonCount = inStock.filter((i) => {
    const d = daysUntilExpiry(i.expiry);
    return d !== null && d <= 7;
  }).length;

  const baseList = view === "oos" ? oos : view === "shopping" ? shop : view === "archived" ? archived : inStock;
  const cats = catCounts(baseList);

  const matchText = (i) => {
    const q = search.toLowerCase();
    return i.name.toLowerCase().includes(q) || (i.notes || i.note || "").toLowerCase().includes(q);
  };
  const applyFilter = (list) => list.filter((i) => cat === "All" || i.category === cat).filter(matchText);

  const stockList = sortItems(
    applyFilter(inStock).filter((i) => !expiryOnly || (daysUntilExpiry(i.expiry) !== null && daysUntilExpiry(i.expiry) <= 7)),
    sortBy
  );
  const oosList = sortItems(applyFilter(oos), sortBy);
  const shopList = sortItems(applyFilter(shop), sortBy);
  const archivedList = sortItems(applyFilter(archived), sortBy);

  const checkedCount = shop.filter((s) => s.checked).length;
  const grouped = sortBy === "category";
  const titles = { list: "Pantry", oos: "Out of stock", shopping: "Shopping list", archived: "Archived", log: "Activity" };
  const counts = { list: stockList.length, oos: oosList.length, shopping: shopList.length, archived: archivedList.length, log: logs.length };

  if (!user) {
    return (
      <div className="gt-app">
        <NameModal onSet={(n) => { localStorage.setItem("grocery_user", n); setUser(n); }} />
      </div>
    );
  }

  return (
    <div className="gt-app">
      <div className="shell">
        <Sidebar view={view} setView={setView} oosCount={oos.length} shopCount={shop.length} onAdd={() => setItemModal({})} onSignOut={signOut} />
        <main className="main">
          <MobileBar syncing={syncing} onRefresh={refresh} onSignOut={signOut} />
          <div className="content">
            {error && <ErrorBanner msg={error} onRetry={() => { setError(null); load(); }} />}

            <ViewHead title={titles[view]} count={counts[view]}>
              {view === "shopping" && (
                <>
                  {checkedCount > 0 && (
                    <button className="btn btn--secondary btn--sm" onClick={sweep}>
                      <Icon name="check" size={15} />Done shopping
                    </button>
                  )}
                  <button className="btn btn--primary btn--sm" onClick={() => setShopModal({})}>
                    <Icon name="plus" size={15} />Add
                  </button>
                </>
              )}
            </ViewHead>

            {view === "list" && (
              <SummaryBar
                soon={soonCount} oos={oos.length} total={inStock.length}
                onAll={() => { setExpiryOnly(false); setCat("All"); }}
                onSoon={() => setExpiryOnly(true)}
                onOos={() => setView("oos")}
              />
            )}

            {(view === "list" || view === "oos" || view === "shopping" || view === "archived") && (
              <Toolbar
                search={search} setSearch={setSearch}
                displayMode={displayMode} setDisplayMode={setDisplayMode}
                sortBy={sortBy} setSortBy={setSortBy}
                expiryOnly={expiryOnly} setExpiryOnly={setExpiryOnly}
                cats={cats} cat={cat} setCat={setCat}
                showSort showDisplay showCategory={cats.length > 0} showExpiryFilter={view === "list"}
              />
            )}

            {view === "list" && (
              <InventoryView
                items={stockList} loading={loading} displayMode={displayMode}
                iconMode={ICON_MODE} density={DENSITY} grouped={grouped}
                onEdit={(i) => setItemModal(i)} onDelete={askDelete} onQty={setQty}
                onAdd={() => setItemModal({})}
              />
            )}
            {view === "oos" && (
              <OutOfStockView
                items={oosList} displayMode={displayMode} iconMode={ICON_MODE} grouped={grouped}
                onList={addToShop} onRestock={(i) => setItemModal(i)} onEdit={(i) => setItemModal(i)}
              />
            )}
            {view === "shopping" && (
              <ShoppingView
                items={shopList} loading={loading} displayMode={displayMode} iconMode={ICON_MODE} grouped={grouped}
                onToggle={toggleCheck} onEdit={(s) => setShopModal(s)} onDelete={delShop}
              />
            )}
            {view === "archived" && (
              <ArchivedView
                items={archivedList} displayMode={displayMode} iconMode={ICON_MODE} grouped={grouped}
                onRestore={restoreItem} onDelete={askDelete}
              />
            )}
            {view === "log" && <LogView logs={logs} />}
          </div>
        </main>
      </div>

      <Fab onClick={() => view === "shopping" ? setShopModal({}) : setItemModal({})} />
      <BottomNav view={view} setView={setView} oosCount={oos.length} shopCount={shop.length} />

      {itemModal !== null && (
        <ItemModal
          item={itemModal?.id ? itemModal : null}
          onClose={() => setItemModal(null)}
          onSave={saveItem}
          onArchive={archiveItem}
          onDelete={(it) => { setItemModal(null); askDelete(it); }}
        />
      )}
      {shopModal !== null && (
        <ShoppingItemModal item={shopModal?.id ? shopModal : null} onClose={() => setShopModal(null)} onSave={saveShop} />
      )}
      {suggest && <SuggestModal item={suggest} onAdd={addToShop} onClose={() => setSuggest(null)} />}
      {confirm && <ConfirmModal {...confirm} onClose={() => setConfirm(null)} />}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
