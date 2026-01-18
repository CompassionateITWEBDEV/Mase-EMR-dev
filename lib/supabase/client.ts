import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[v0] Supabase environment variables not configured, using placeholder")
    // Return a mock client that won't crash but won't work either
    return createSupabaseBrowserClient("https://placeholder.supabase.co", "placeholder-key")
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseKey)
}

export const createBrowserClient = createClient
