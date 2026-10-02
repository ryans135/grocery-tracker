// One-time migration: move existing base64-embedded item photos out of
// the items.photo column and into the item-photos Storage bucket.
//
// Run AFTER photo-storage-setup.sql has been applied in the Supabase
// SQL editor (the bucket + policies must exist first).
//
// Usage: node --env-file=.env supabase/migrate-photos.js

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const BUCKET = "item-photos";

const { data: items, error } = await supabase.from("items").select("id, name, photo");
if (error) throw error;

let migrated = 0, skipped = 0, failed = 0;

for (const item of items) {
  if (!item.photo || !item.photo.startsWith("data:")) { skipped++; continue; }

  const match = item.photo.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) { console.log("skip (unrecognized format):", item.name); skipped++; continue; }

  const [, mime, base64] = match;
  const ext = mime.split("/")[1]?.split("+")[0] || "jpg";
  const buffer = Buffer.from(base64, "base64");
  const path = `${item.id}.${ext}`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: true,
  });
  if (upErr) { console.error("upload failed:", item.name, upErr.message); failed++; continue; }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { error: updErr } = await supabase.from("items").update({ photo: data.publicUrl }).eq("id", item.id);
  if (updErr) { console.error("db update failed:", item.name, updErr.message); failed++; continue; }

  console.log("migrated:", item.name, "->", (buffer.length / 1024).toFixed(0) + "KB photo");
  migrated++;
}

console.log(`\nDone. Migrated ${migrated}, skipped ${skipped} (no photo), failed ${failed}.`);
