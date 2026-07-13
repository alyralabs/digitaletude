import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

// Lazy so a missing .env only breaks admin routes (which need Supabase),
// not the whole public site at module-load time.
export function supabaseClient(): SupabaseClient {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error(
        'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — see .env.example',
      )
    }
    client = createClient(url, key)
  }
  return client
}
