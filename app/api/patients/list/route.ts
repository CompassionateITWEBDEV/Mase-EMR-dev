import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/middleware"

/**
 * GET /api/patients/list
 * 
 * @deprecated This endpoint is maintained for backward compatibility.
 * Use /api/patients?includeStats=true instead.
 * 
 * This endpoint redirects to the unified /api/patients endpoint with includeStats=true
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
        path: "/api/patients/list",
      });
      
      // In development, allow the request to proceed with service role client
      // In production, this should be strict
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { patients: [], error: "Unauthorized" },
          { status: 401 }
        );
      } else {
        console.warn("[API] Development mode: Allowing request without authentication");
      }
    }

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")

    // First, check if there are any patients in the database
    const { count: patientCount, error: countError } = await supabase
      .from("patients")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("[v0] Error counting patients:", countError.message)
      return NextResponse.json(
        { patients: [], error: `Database error: ${countError.message}` },
        { status: 500 }
      )
    }

    console.log(`[v0] Total patients in database: ${patientCount || 0}`)

    if (!patientCount || patientCount === 0) {
      console.log("[v0] No patients found in database")
      return NextResponse.json({
        patients: [],
        stats: {
          total: 0,
          active: 0,
          highRisk: 0,
          recentAppointments: 0,
        },
      })
    }

    // First, try to fetch patients with all related data
    let query = supabase
      .from("patients")
      .select(`
        *,
        appointments(
          id,
          appointment_date,
          status,
          provider_id
        ),
        assessments(
          id,
          assessment_type,
          risk_assessment,
          created_at
        ),
        medications(
          id,
          medication_name,
          dosage,
          status
        )
      `)
      .order("created_at", { ascending: false })

    // Apply search filter if provided
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    // Apply status filter if provided
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    // Apply limit if provided, otherwise fetch all (with a reasonable max)
    if (limit) {
      query = query.limit(Number.parseInt(limit))
    } else {
      // No limit means fetch all patients
      query = query.limit(10000) // Set a high limit to get all patients
    }

    let { data: patients, error } = await query

    // If query with relations fails, try fetching just patients without relations
    if (error) {
      console.warn("[v0] Error fetching patients with relations, trying without relations:", error.message)
      
      // Fallback: fetch patients without related data
      let fallbackQuery = supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false })

      if (search) {
        fallbackQuery = fallbackQuery.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
        )
      }

      if (status && status !== "all") {
        fallbackQuery = fallbackQuery.eq("status", status)
      }

      if (limit) {
        fallbackQuery = fallbackQuery.limit(Number.parseInt(limit))
      } else {
        fallbackQuery = fallbackQuery.limit(10000)
      }

      const fallbackResult = await fallbackQuery

      if (fallbackResult.error) {
        console.error("[v0] Error fetching patients (fallback):", fallbackResult.error.message)
        return NextResponse.json(
          { patients: [], error: fallbackResult.error.message },
          { status: 500 }
        )
      }

      patients = fallbackResult.data || []
      
      // If we got patients without relations, fetch related data separately
      if (patients.length > 0) {
        const patientIds = patients.map((p: any) => p.id)
        
        // Fetch related data in parallel
        const [appointmentsResult, assessmentsResult, medicationsResult] = await Promise.all([
          supabase
            .from("appointments")
            .select("id, patient_id, appointment_date, status, provider_id")
            .in("patient_id", patientIds)
            .order("appointment_date", { ascending: false }),
          supabase
            .from("assessments")
            .select("id, patient_id, assessment_type, risk_assessment, created_at")
            .in("patient_id", patientIds)
            .order("created_at", { ascending: false }),
          supabase
            .from("medications")
            .select("id, patient_id, medication_name, dosage, status")
            .in("patient_id", patientIds),
        ])

        // Attach related data to patients
        patients = patients.map((patient: any) => ({
          ...patient,
          appointments: appointmentsResult.data?.filter((apt: any) => apt.patient_id === patient.id) || [],
          assessments: assessmentsResult.data?.filter((ass: any) => ass.patient_id === patient.id) || [],
          medications: medicationsResult.data?.filter((med: any) => med.patient_id === patient.id) || [],
        }))
      }
    }

    if (!patients || patients.length === 0) {
      console.log("[v0] No patients found in database")
      return NextResponse.json({
        patients: [],
        stats: {
          total: 0,
          active: 0,
          highRisk: 0,
          recentAppointments: 0,
        },
      })
    }

    // Calculate statistics
    const totalCount = patients?.length || 0
    
    // Count high risk patients (those with high risk assessment)
    const highRiskCount =
      patients?.filter((p) =>
        p.assessments?.some(
          (a: { risk_assessment?: { level?: string } }) =>
            a.risk_assessment &&
            typeof a.risk_assessment === "object" &&
            "level" in a.risk_assessment &&
            a.risk_assessment.level === "high"
        )
      ).length || 0

    // Count patients with recent appointments (within last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const recentAppointmentsCount =
      patients?.filter((p) =>
        p.appointments?.some(
          (apt: { appointment_date: string }) =>
            new Date(apt.appointment_date) >= new Date(weekAgo)
        )
      ).length || 0

    // Active patients are those with recent appointments or active medications
    const activeCount =
      patients?.filter(
        (p) =>
          p.appointments?.some(
            (apt: { appointment_date: string }) =>
              new Date(apt.appointment_date) >= new Date(weekAgo)
          ) || p.medications?.some((med: { status: string }) => med.status === "active")
      ).length || 0

    console.log(`[v0] Fetched ${totalCount} patients with relations`)
    console.log(`[v0] Sample patient data:`, patients[0] ? {
      id: patients[0].id,
      name: `${patients[0].first_name} ${patients[0].last_name}`,
      hasAppointments: !!patients[0].appointments?.length,
      hasAssessments: !!patients[0].assessments?.length,
      hasMedications: !!patients[0].medications?.length,
    } : "No patients")

    return NextResponse.json({
      patients: patients || [],
      stats: {
        total: totalCount,
        active: activeCount,
        highRisk: highRiskCount,
        recentAppointments: recentAppointmentsCount,
      },
    })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[v0] Patients list API error:", err)
    return NextResponse.json(
      {
        patients: [],
        error: err.message || "Failed to fetch patients",
      },
      { status: 500 }
    )
  }
}

