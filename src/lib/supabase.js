// Supabase client singleton.
//
// If env vars are missing the client is null and the rest of the app falls
// back to localStorage-only mode. This keeps local development cheap and lets
// the dashboard run without any cloud account.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env?.VITE_SUPABASE_URL;
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
}) : null;

export const isSupabaseEnabled = () => supabase !== null;
