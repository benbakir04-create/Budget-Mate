import { createClient } from '@supabase/supabase-js';

// Public values only (ADR 0005): the browser holds the publishable key, and every
// permission is enforced in PostgreSQL (RLS and functions). Never put the secret key here.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// While the move to Supabase is in progress (ROADMAP phase 4), the app talks to Supabase
// when its URL is set, and to the old Express server otherwise. Demo mode wins over both.
export const USE_SUPABASE = Boolean(url) && import.meta.env.VITE_DEMO_MODE !== 'true';

if (USE_SUPABASE && !key) {
  throw new Error(
    'VITE_SUPABASE_PUBLISHABLE_KEY is missing. Copy frontend/.env.example to frontend/.env.local.'
  );
}

export const supabase = USE_SUPABASE
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
