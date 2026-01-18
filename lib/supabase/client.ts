import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"
import { shouldDisableTokenRefresh } from "@/lib/dev-tools/auth-toggle-context"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[v0] Supabase environment variables not configured, using placeholder")
    // Return a mock client that won't crash but won't work either
    return createSupabaseBrowserClient("https://placeholder.supabase.co", "placeholder-key")
  }

  // Check if token refresh should be disabled (dev mode only)
  const disableRefresh = shouldDisableTokenRefresh()

  if (disableRefresh) {
    console.warn("[DevTools] ⚠️ Token refresh is DISABLED - autoRefreshToken set to false")
    return createSupabaseBrowserClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: true, // Keep session persistence, just disable auto-refresh
      },
    })
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseKey)
}

export const createBrowserClient = createClient
