/**
 * Authentication Middleware
 * Helper functions for API route authentication and authorization
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
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

  try {
    const cookieStore = await cookies();
    const bypassCookie = cookieStore.get("dev_bypass_auth");
    // Allow bypass if cookie is set, even without NEXT_PUBLIC_ENABLE_DEV_TOOLS
    // This enables demo logins to work in development
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
 * Create a User object from Super Admin data
 */
function createSuperAdminUser(superAdmin: {
  id: string;
  email: string;
  full_name?: string;
}): User {
  return {
    id: superAdmin.id,
    aud: "authenticated",
    role: "authenticated",
    email: superAdmin.email,
    email_confirmed_at: new Date().toISOString(),
    phone: undefined,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: "super_admin",
      providers: ["super_admin"],
      role: "super_admin",
    },
    user_metadata: {
      role: "super_admin",
      first_name: superAdmin.full_name?.split(" ")[0] || "Super",
      last_name: superAdmin.full_name?.split(" ").slice(1).join(" ") || "Admin",
      user_type: "super_admin",
    },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  } as User;
}

/**
 * Check if Super Admin session is valid
 * @returns Super Admin data if session is valid, null otherwise
 */
async function getSuperAdminSession(): Promise<{
  id: string;
  email: string;
  full_name?: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("super_admin_session")?.value;

    if (!sessionToken) {
      console.log("[Auth] No super_admin_session cookie found");
      return null;
    }

    console.log("[Auth] Found super_admin_session cookie, checking validity...");

    // Use service client to bypass RLS and check session
    const supabase = createServiceClient();
    
    // First, get the session
    const { data: session, error: sessionError } = await supabase
      .from("super_admin_sessions")
      .select("super_admin_id, expires_at")
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError) {
      console.error("[Auth] Error querying super_admin_sessions:", sessionError.message);
      // In development mode, allow if cookie exists (tables might not exist)
      if (process.env.NODE_ENV === "development") {
        console.warn("[Auth] DEV MODE: Returning mock Super Admin due to DB error");
        return {
          id: "dev-super-admin",
          email: "admin@maseemr.com",
          full_name: "Dev Super Admin",
        };
      }
      return null;
    }

    if (!session) {
      console.log("[Auth] No valid super admin session found in database");
      return null;
    }

    // Then, get the admin details
    const { data: admin, error: adminError } = await supabase
      .from("super_admins")
      .select("id, email, full_name, is_active")
      .eq("id", session.super_admin_id)
      .eq("is_active", true)
      .single();

    if (adminError) {
      console.error("[Auth] Error querying super_admins:", adminError.message);
      // In development mode, allow if session exists (admin table might not exist)
      if (process.env.NODE_ENV === "development") {
        console.warn("[Auth] DEV MODE: Returning mock Super Admin due to admin lookup error");
        return {
          id: session.super_admin_id,
          email: "admin@maseemr.com",
          full_name: "Dev Super Admin",
        };
      }
      return null;
    }

    if (!admin) {
      console.log("[Auth] No active super admin found for session");
      return null;
    }

    console.log("[Auth] Super Admin session valid for:", admin.email);
    return {
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name || undefined,
    };
  } catch (error) {
    console.error("[Auth] Exception checking Super Admin session:", error);
    // In development mode, return mock admin on exception
    if (process.env.NODE_ENV === "development") {
      try {
        const cookieStore = await cookies();
        if (cookieStore.get("super_admin_session")?.value) {
          console.warn("[Auth] DEV MODE: Returning mock Super Admin due to exception");
          return {
            id: "dev-super-admin",
            email: "admin@maseemr.com",
            full_name: "Dev Super Admin",
          };
        }
      } catch {
        // Ignore nested exception
      }
    }
    return null;
  }
}

/**
 * Get the authenticated user from the Supabase session or Super Admin session
 * @returns Object with user and error (if any)
 */
export async function getAuthenticatedUser(): Promise<{
  user: User | null;
  error: string | null;
}> {
  // Log available cookies for debugging
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieNames = allCookies.map(c => c.name);
    console.log("[Auth] Available cookies:", cookieNames.join(", ") || "(none)");
    console.log("[Auth] Has super_admin_session:", cookieNames.includes("super_admin_session"));
  } catch (e) {
    console.log("[Auth] Could not read cookies for debug");
  }

  // Check if auth bypass is enabled (dev mode only)
  const bypassAuth = await isAuthBypassEnabled();

  if (bypassAuth) {
    console.warn("[DevTools] ⚠️ Auth bypass is ACTIVE - returning mock user");
    return { user: createMockUser(), error: null };
  }

  // First, check for Super Admin session
  const superAdmin = await getSuperAdminSession();
  if (superAdmin) {
    console.log("[Auth] Super Admin session found:", superAdmin.email);
    return { user: createSuperAdminUser(superAdmin), error: null };
  }

  // Then check for regular Supabase auth session
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("[Auth] Error getting user:", error.message);
      return { user: null, error: error.message };
    }

    if (!user) {
      console.warn("[Auth] No user found in session");
      return { user: null, error: "User not authenticated" };
    }

    return { user, error: null };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[Auth] Exception getting user:", err.message);
    return { user: null, error: err.message };
  }
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

