import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hgvqqhltofprecqhlyyv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndnFxaGx0b2ZwcmVjcWhseXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NjE3MjEsImV4cCI6MjA3MjQzNzcyMX0.iDU1HFyUJ6UyDkbljx2Zd_pXdPZzWAk6PPfp26ddNNA";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("❌ Variáveis do Supabase não configuradas corretamente.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
