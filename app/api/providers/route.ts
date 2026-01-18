/**
 * Providers API Route
 * Handles fetching providers list
 * Now includes eligible staff members from the staff table
 */

import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";

// Staff roles that should appear as providers in appointment management
const ELIGIBLE_PROVIDER_ROLES = [
  "doctor",
  "counselor",
  "case_manager",
  "supervisor",
  "rn", // Registered Nurse
  "peer_recovery", // Peer Recovery Specialist
] as const;

/**
 * Maps staff role to a display specialization
 */
function getSpecializationFromRole(role: string, department: string | null): string {
  const roleMap: Record<string, string> = {
    doctor: "Physician",
    counselor: "Counseling",
    case_manager: "Case Management",
    supervisor: "Clinical Supervisor",
    rn: "Nursing",
    peer_recovery: "Peer Recovery",
  };
  
  const baseSpecialization = roleMap[role] || role;
  return department ? `${baseSpecialization} - ${department}` : baseSpecialization;
}

/**
 * GET /api/providers
 * Fetch list of providers from both providers table and eligible staff members
 */
export async function GET(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    // Log authentication details for debugging
    if (authError || !user) {
      console.warn("[API] Authentication failed:", {
        hasError: !!authError,
        errorMessage: authError,
        hasUser: !!user,
        path: "/api/providers",
      });

      // In development, allow the request to proceed with service role client
      // In production, this should be strict
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { providers: [], error: "Unauthorized" },
          { status: 401 }
        );
      } else {
        console.warn(
          "[API] Development mode: Allowing request without authentication"
        );
      }
    }

    // Always use service role client for provider lookups
    // Provider data (names, specializations) is non-sensitive lookup data
    // that any authenticated user should be able to access for scheduling
    // This bypasses RLS which would otherwise block access due to restrictive policies
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty");
    const activeParam = searchParams.get("active");
    const active = activeParam !== "false"; // Default to true
    
    console.log("[API] Providers request:", { 
      active: activeParam, 
      activeFilter: active, 
      specialty,
      eligibleRoles: ELIGIBLE_PROVIDER_ROLES 
    });

    // Fetch providers from providers table
    let providersQuery = supabase
      .from("providers")
      .select("id, first_name, last_name, specialization, email")
      .order("last_name", { ascending: true });

    // Filter by active status if providers table has is_active field
    if (active) {
      providersQuery = providersQuery.eq("is_active", true).or("is_active.is.null");
    }

    // Filter by specialty if provided
    if (specialty) {
      providersQuery = providersQuery.eq("specialization", specialty);
    }

    const { data: providers, error: providersError } = await providersQuery;

    // Handle providers table errors gracefully
    let providersList: Array<{
      id: string;
      first_name: string;
      last_name: string;
      specialization: string | null;
      email: string;
    }> = [];

    if (providersError) {
      // If table doesn't exist, continue with empty array
      if (providersError.code === "42P01") {
        console.warn("[API] providers table not found, continuing with staff only");
      }
      // If is_active column doesn't exist, retry without the filter
      else if (providersError.message?.includes("is_active") || providersError.code === "42703") {
        console.warn("[API] is_active column not found, retrying without filter");
        const retryQuery = supabase
          .from("providers")
          .select("id, first_name, last_name, specialization, email")
          .order("last_name", { ascending: true });
        
        if (specialty) {
          retryQuery.eq("specialization", specialty);
        }
        
        const { data: retryData, error: retryError } = await retryQuery;
        
        if (!retryError && retryData) {
          providersList = retryData;
        }
      } else {
        console.error("[API] Error fetching providers:", providersError);
      }
    } else if (providers) {
      providersList = providers;
    }

    // Fetch eligible staff members from staff table
    // NOTE: We fetch all staff first, then filter by role in JavaScript
    // because Supabase's .in() is case-sensitive, but roles in DB might have different casing
    const allStaffQuery = supabase
      .from("staff")
      .select("id, first_name, last_name, email, role, department, is_active")
      .order("last_name", { ascending: true });

    console.log("[API] Fetching staff with roles:", ELIGIBLE_PROVIDER_ROLES, "active filter:", active);
    
    const { data: allStaff, error: allStaffError } = await allStaffQuery;
    
    if (allStaffError) {
      console.error("[API] Error fetching all staff:", {
        code: allStaffError.code,
        message: allStaffError.message,
        details: allStaffError.details,
      });
    }
    
    console.log("[API] All staff in database:", {
      total: allStaff?.length || 0,
      hasError: !!allStaffError,
      staff: allStaff?.map(s => ({
        name: `${s.first_name} ${s.last_name}`,
        role: s.role,
        roleLowercase: s.role?.toLowerCase(),
        active: s.is_active,
        eligible: ELIGIBLE_PROVIDER_ROLES.includes(s.role?.toLowerCase() as any)
      })) || []
    });
    
    // Filter staff by eligible roles (case-insensitive) and active status
    console.log("[API] Filtering staff members...", {
      totalStaff: allStaff?.length || 0,
      eligibleRoles: ELIGIBLE_PROVIDER_ROLES,
      activeFilter: active,
      activeParam: activeParam,
    });
    
    // Convert eligible roles to lowercase for comparison
    const eligibleRolesLower = ELIGIBLE_PROVIDER_ROLES.map(r => r.toLowerCase());
    
    let staffMembers = allStaff?.filter((staff) => {
      const roleLower = staff.role?.toLowerCase() || "";
      const isEligible = roleLower && eligibleRolesLower.includes(roleLower);
      
      // Log first few for debugging
      if (allStaff && allStaff.indexOf(staff) < 5) {
        console.log("[API] Checking staff member:", {
          name: `${staff.first_name} ${staff.last_name}`,
          role: staff.role,
          roleLowercase: roleLower,
          eligibleRolesLower,
          isEligible,
          isActive: staff.is_active,
          willInclude: isEligible && (active ? staff.is_active === true : true),
        });
      }
      
      if (!isEligible) return false;
      
      // If active filter is true, only return active staff
      // If active filter is false, return all (both active and inactive)
      if (active) {
        return staff.is_active === true;
      }
      return true; // Return all when active=false
    }) || [];
    
    const staffError = allStaffError;
    
    console.log("[API] Filtering complete:", {
      staffMembersCount: staffMembers.length,
      staffMembers: staffMembers.map(s => ({
        name: `${s.first_name} ${s.last_name}`,
        role: s.role,
        active: s.is_active,
      })),
    });
    
    if (staffError) {
      console.error("[API] Staff query error:", {
        code: staffError.code,
        message: staffError.message,
        details: staffError.details,
        hint: staffError.hint
      });
    } else {
      console.log(`[API] Found ${staffMembers.length} staff members with eligible roles (after case-insensitive filtering):`, 
        staffMembers.map(s => `${s.first_name} ${s.last_name} (${s.role}, active: ${s.is_active})`)
      );
    }

    // Map staff members to provider format
    let staffAsProviders: Array<{
      id: string;
      first_name: string;
      last_name: string;
      specialization: string | null;
      email: string;
    }> = [];

    if (!staffError && staffMembers) {
      staffAsProviders = staffMembers
        .filter((staff) => {
          // Additional filtering by specialty if provided
          if (specialty) {
            const staffSpecialization = getSpecializationFromRole(staff.role, staff.department);
            return staffSpecialization.toLowerCase().includes(specialty.toLowerCase());
          }
          return true;
        })
        .map((staff) => ({
          id: staff.id,
          first_name: staff.first_name,
          last_name: staff.last_name,
          specialization: getSpecializationFromRole(staff.role, staff.department),
          email: staff.email,
        }));
    } else if (staffError && staffError.code !== "42P01") {
      // Log error but don't fail if table doesn't exist
      console.warn("[API] Error fetching staff members:", staffError);
    }

    // Combine providers and staff, deduplicating by ID (providers table takes precedence)
    const providerMap = new Map<string, typeof providersList[0]>();
    
    // Add staff first (lower priority)
    staffAsProviders.forEach((staffProvider) => {
      if (!providerMap.has(staffProvider.id)) {
        providerMap.set(staffProvider.id, staffProvider);
      }
    });
    
    // Add providers from providers table (higher priority, will overwrite duplicates)
    providersList.forEach((provider) => {
      providerMap.set(provider.id, provider);
    });

    // Convert map to array and sort by last name
    const allProviders = Array.from(providerMap.values()).sort((a, b) => {
      const lastNameCompare = (a.last_name || "").localeCompare(b.last_name || "");
      if (lastNameCompare !== 0) return lastNameCompare;
      return (a.first_name || "").localeCompare(b.first_name || "");
    });

    console.log(`[API] Returning ${allProviders.length} providers (${providersList.length} from providers table, ${staffAsProviders.length} from staff table)`);
    
    if (allProviders.length === 0) {
      const debugInfo = {
        providersTableCount: providersList.length,
        staffTableCount: staffAsProviders.length,
        allStaffCount: allStaff?.length || 0,
        staffMembersAfterFilter: staffMembers.length,
        staffError: staffError ? { code: staffError.code, message: staffError.message } : null,
        providersError: providersError ? { code: providersError.code, message: providersError.message } : null,
        eligibleRoles: ELIGIBLE_PROVIDER_ROLES,
        activeFilter: active,
        activeParam: activeParam,
        allStaffRoles: allStaff?.map(s => ({ role: s.role, roleLower: s.role?.toLowerCase(), active: s.is_active })) || [],
        eligibleStaffCount: allStaff?.filter(s => {
          const roleLower = s.role?.toLowerCase();
          return roleLower && ELIGIBLE_PROVIDER_ROLES.includes(roleLower as any);
        }).length || 0,
      };
      
      console.warn("[API] No providers found! Debug info:", debugInfo);
      
      // Include debug info in response in development
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({ 
          providers: allProviders,
          debug: debugInfo 
        });
      }
    }

    return NextResponse.json({ providers: allProviders });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[API] Providers API error:", err);
    return NextResponse.json(
      { providers: [], error: err.message || "Failed to fetch providers" },
      { status: 500 }
    );
  }
}

