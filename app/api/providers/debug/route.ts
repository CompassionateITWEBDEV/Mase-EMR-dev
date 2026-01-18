/**
 * Debug endpoint to check staff members and their eligibility as providers
 * GET /api/providers/debug
 */

import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Staff roles that should appear as providers in appointment management
const ELIGIBLE_PROVIDER_ROLES = [
  "doctor",
  "counselor",
  "case_manager",
  "supervisor",
  "rn", // Registered Nurse
  "peer_recovery", // Peer Recovery Specialist
] as const;

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Fetch all staff members
    const { data: allStaff, error: staffError } = await supabase
      .from("staff")
      .select("id, first_name, last_name, email, role, department, is_active")
      .order("last_name", { ascending: true });

    if (staffError) {
      return NextResponse.json(
        {
          error: "Failed to fetch staff",
          details: staffError.message,
          code: staffError.code,
        },
        { status: 500 }
      );
    }

    // Analyze staff members
    const analysis = {
      totalStaff: allStaff?.length || 0,
      eligibleRoles: ELIGIBLE_PROVIDER_ROLES,
      staffMembers: allStaff?.map((staff) => ({
        id: staff.id,
        name: `${staff.first_name} ${staff.last_name}`,
        email: staff.email,
        role: staff.role,
        roleLowercase: staff.role?.toLowerCase(),
        department: staff.department,
        isActive: staff.is_active,
        isEligible: ELIGIBLE_PROVIDER_ROLES.includes(staff.role?.toLowerCase() as any),
        roleMatches: ELIGIBLE_PROVIDER_ROLES.filter(
          (eligibleRole) => staff.role?.toLowerCase() === eligibleRole.toLowerCase()
        ),
      })) || [],
      summary: {
        totalEligible: allStaff?.filter((s) =>
          ELIGIBLE_PROVIDER_ROLES.includes(s.role?.toLowerCase() as any)
        ).length || 0,
        totalActiveEligible: allStaff?.filter(
          (s) =>
            s.is_active &&
            ELIGIBLE_PROVIDER_ROLES.includes(s.role?.toLowerCase() as any)
        ).length || 0,
        totalInactiveEligible: allStaff?.filter(
          (s) =>
            !s.is_active &&
            ELIGIBLE_PROVIDER_ROLES.includes(s.role?.toLowerCase() as any)
        ).length || 0,
        rolesFound: [
          ...new Set(allStaff?.map((s) => s.role?.toLowerCase()).filter(Boolean) || []),
        ],
        rolesNotEligible: [
          ...new Set(
            allStaff
              ?.map((s) => s.role?.toLowerCase())
              .filter(
                (r) => r && !ELIGIBLE_PROVIDER_ROLES.includes(r as any)
              ) || []
          ),
        ],
      },
    };

    return NextResponse.json(analysis, { status: 200 });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[API] Debug endpoint error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to analyze staff" },
      { status: 500 }
    );
  }
}
