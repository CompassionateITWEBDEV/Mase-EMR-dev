/**
 * Providers Sync API Route
 * Manually sync eligible staff members to providers table
 * POST /api/providers/sync
 */

import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";

// Eligible staff roles that should appear as providers
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
 * POST /api/providers/sync
 * Manually sync eligible staff members to providers table
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    // Fetch eligible staff members
    const { data: staffMembers, error: staffError } = await supabase
      .from("staff")
      .select("id, first_name, last_name, email, phone, role, department, license_number, license_type, is_active, created_at")
      .in("role", ELIGIBLE_PROVIDER_ROLES)
      .eq("is_active", true);

    if (staffError) {
      console.error("[API] Error fetching staff:", staffError);
      return NextResponse.json(
        { error: "Failed to fetch staff members", details: staffError.message },
        { status: 500 }
      );
    }

    if (!staffMembers || staffMembers.length === 0) {
      return NextResponse.json({
        message: "No eligible staff members found to sync",
        synced: 0,
        eligibleRoles: ELIGIBLE_PROVIDER_ROLES,
      });
    }

    // Prepare provider records
    const providerRecords = staffMembers.map((staff) => ({
      id: staff.id,
      first_name: staff.first_name,
      last_name: staff.last_name,
      email: staff.email,
      phone: staff.phone || null,
      license_number: staff.license_number || null,
      license_type: staff.license_type || null,
      specialization: getSpecializationFromRole(staff.role, staff.department),
      is_active: staff.is_active,
      created_at: staff.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Upsert providers (insert or update)
    const { data: insertedProviders, error: insertError } = await supabase
      .from("providers")
      .upsert(providerRecords, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select();

    if (insertError) {
      console.error("[API] Error syncing providers:", insertError);
      return NextResponse.json(
        { error: "Failed to sync providers", details: insertError.message },
        { status: 500 }
      );
    }

    console.log(`[API] Synced ${insertedProviders?.length || 0} staff members to providers table`);

    return NextResponse.json({
      message: "Staff members synced to providers table successfully",
      synced: insertedProviders?.length || 0,
      providers: insertedProviders,
      eligibleRoles: ELIGIBLE_PROVIDER_ROLES,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[API] Providers sync error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to sync providers" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/providers/sync
 * Get sync status and eligible staff count
 */
export async function GET() {
  try {
    const supabase = createServiceClient();

    // Count eligible staff members
    const { count: eligibleStaffCount, error: staffCountError } = await supabase
      .from("staff")
      .select("*", { count: "exact", head: true })
      .in("role", ELIGIBLE_PROVIDER_ROLES)
      .eq("is_active", true);

    // Count providers that match staff
    const { data: staffMembers } = await supabase
      .from("staff")
      .select("id")
      .in("role", ELIGIBLE_PROVIDER_ROLES)
      .eq("is_active", true);

    const staffIds = staffMembers?.map((s) => s.id) || [];
    const { count: syncedProviderCount } = await supabase
      .from("providers")
      .select("*", { count: "exact", head: true })
      .in("id", staffIds);

    return NextResponse.json({
      eligibleStaffCount: eligibleStaffCount || 0,
      syncedProviderCount: syncedProviderCount || 0,
      eligibleRoles: ELIGIBLE_PROVIDER_ROLES,
      needsSync: (eligibleStaffCount || 0) > (syncedProviderCount || 0),
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    return NextResponse.json(
      { error: err.message || "Failed to get sync status" },
      { status: 500 }
    );
  }
}
