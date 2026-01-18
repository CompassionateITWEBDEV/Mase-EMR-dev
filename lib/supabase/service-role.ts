import { createClient } from "@supabase/supabase-js"

/**
 * Helper that creates a Supabase client using the service role key.
 *
 * The service role key is required for privileged operations executed from
 * backend API routes (e.g. dispensing transactions). This client bypasses
 * Row Level Security (RLS) policies.
 */
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not configured")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Alias for backward compatibility
export const createServiceRoleClient = createServiceClient
