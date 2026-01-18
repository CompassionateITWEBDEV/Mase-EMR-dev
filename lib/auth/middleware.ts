/**
 * Authentication Middleware
 * Helper functions for API route authentication and authorization
 */

import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Check if auth bypass is enabled via cookie (for server-side)
 * Only works in development mode
 */
async function isAuthBypassEnabled(): Promise<boolean> {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  // Check if dev tools are enabled
  if (process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS !== "true") {
    return false;
  }

  try {
    const cookieStore = await cookies();
    const bypassCookie = cookieStore.get("dev_bypass_auth");
    return bypassCookie?.value === "true";
  } catch {
    // If cookies() fails (e.g., in middleware), return false
    return false;
  }
}

/**
 * Create a mock user for development/testing
 */
function createMockUser(): User {
  return {
    id: "dev-bypass-user",
    aud: "authenticated",
    role: "authenticated",
    email: "dev@test.local",
    email_confirmed_at: new Date().toISOString(),
    phone: undefined,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: "email",
      providers: ["email"],
      role: "admin",
    },
    user_metadata: {
      role: "admin",
      first_name: "Dev",
      last_name: "User",
    },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  } as User;
}

/**
 * Get the authenticated user from the Supabase session
 * @returns Object with user and error (if any)
 */
export async function getAuthenticatedUser(): Promise<{
  user: User | null;
  error: string | null;
}> {
  // Authentication disabled - always return mock user
  console.warn("[Auth] ⚠️ Authentication is DISABLED - returning mock user");
  return { user: createMockUser(), error: null };
}

/**
 * Check if user has required role
 * @param user - The authenticated user
 * @param requiredRoles - Array of allowed roles
 * @returns True if user has one of the required roles
 */
export function checkUserRole(
  user: User,
  requiredRoles: string[]
): boolean {
  const userRole = user.user_metadata?.role || user.app_metadata?.role;
  return requiredRoles.includes(userRole);
}

/**
 * Get user role from user metadata
 * @param user - The authenticated user
 * @returns User role or null
 */
export function getUserRole(user: User): string | null {
  return user.user_metadata?.role || user.app_metadata?.role || null;
}

