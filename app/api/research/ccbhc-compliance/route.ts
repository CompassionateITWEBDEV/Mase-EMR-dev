import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get("organization_id")

    // Initialize default response
    let latestAudit: any = null
    let serviceCompliance: any[] = []
    let careCoordination: any[] = []
    let qualityOutcomes: any[] = []

    // Fetch latest CCBHC compliance audit
    try {
      let auditQuery = supabase
        .from("ccbhc_certification_audits")
        .select("*")
        .order("audit_date", { ascending: false })
        .limit(1)

      if (organizationId) {
        auditQuery = auditQuery.eq("organization_id", organizationId)
      }

      const { data: audits, error: auditError } = await auditQuery

      if (!auditError && audits && audits.length > 0) {
        latestAudit = audits[0]
      } else if (auditError) {
        console.error("[Research] Error fetching audits:", auditError)
      }
    } catch (err) {
      console.error("[Research] Exception fetching audits:", err)
    }

    // Fetch service compliance
    try {
      let serviceQuery = supabase.from("ccbhc_core_services_compliance").select("*")

      if (organizationId) {
        serviceQuery = serviceQuery.eq("organization_id", organizationId)
      }

      const { data: services, error: serviceError } = await serviceQuery

      if (!serviceError && services) {
        serviceCompliance = services
      } else if (serviceError) {
        console.error("[Research] Error fetching service compliance:", serviceError)
      }
    } catch (err) {
      console.error("[Research] Exception fetching service compliance:", err)
    }

    // Fetch care coordination metrics
    // Note: ccbhc_care_coordination table doesn't have organization_id column
    try {
      const { data: careCoord, error: careCoordError } = await supabase
        .from("ccbhc_care_coordination")
        .select("patient_id, care_coordinator_id, coordination_status")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (!careCoordError && careCoord) {
        careCoordination = careCoord
      } else if (careCoordError) {
        console.error("[Research] Error fetching care coordination:", careCoordError)
      }
    } catch (err) {
      console.error("[Research] Exception fetching care coordination:", err)
    }

    // Calculate metrics
    const totalPatients = new Set(careCoordination.map((c: any) => c.patient_id) || []).size
    const patientsWithCoordinator = new Set(
      careCoordination.filter((c: any) => c.care_coordinator_id).map((c: any) => c.patient_id) || []
    ).size
    const totalCoordinationEvents = careCoordination.length || 0

    // Fetch quality outcomes
    try {
      let qualityQuery = supabase.from("ccbhc_quality_measures").select("*")

      if (organizationId) {
        qualityQuery = qualityQuery.eq("organization_id", organizationId)
      }

      const { data: quality, error: qualityError } = await qualityQuery

      if (!qualityError && quality) {
        qualityOutcomes = quality
      } else if (qualityError) {
        console.error("[Research] Error fetching quality outcomes:", qualityError)
      }
    } catch (err) {
      console.error("[Research] Exception fetching quality outcomes:", err)
    }

    return NextResponse.json({
      audit: latestAudit,
      serviceCompliance: serviceCompliance,
      careCoordination: {
        total_patients: totalPatients,
        patients_with_coordinator: patientsWithCoordinator,
        total_coordination_events: totalCoordinationEvents,
      },
      qualityOutcomes: qualityOutcomes,
    })
  } catch (error: any) {
    console.error("[Research] Error fetching CCBHC compliance:", error)
    // Return empty data structure instead of error to allow page to render
    return NextResponse.json({
      audit: null,
      serviceCompliance: [],
      careCoordination: {
        total_patients: 0,
        patients_with_coordinator: 0,
        total_coordination_events: 0,
      },
      qualityOutcomes: [],
    })
  }
}
