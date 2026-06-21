// Header quote source — reads the Supabase `wisdom_phrases` table (single
// source of truth). Returns [] when Supabase is unavailable (local-only mode),
// in which case the header simply shows no quote. Never throws.

import { supabase, isSupabaseEnabled } from "./supabase.js";

export async function loadWisdom() {
  if (!isSupabaseEnabled()) return [];
  try {
    const { data, error } = await supabase
      .from("wisdom_phrases")
      .select("text, note, category, tags, rotation, active")
      .eq("active", true);
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

// Pick one phrase string at random. Excludes rotation:false (dating) unless
// includeExcluded is set. Returns the text, or null if the pool is empty —
// Header guards on null so nothing renders in that case.
export function pickQuote(list, { includeExcluded = false } = {}) {
  const pool = (list || []).filter((p) => includeExcluded || p.rotation !== false);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)].text;
}
