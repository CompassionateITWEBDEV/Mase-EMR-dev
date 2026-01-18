import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const countyId = searchParams.get("countyId")
    const action = searchParams.get("action")
    const type = searchParams.get("type")

    // Handle list requests (for fetching records)
    if (action === "list") {
      switch (type) {
        case "wic":
          const { data: wicData, error: wicError } = await supabase
            .from("wic_enrollments")
            .select("*, patients(first_name, last_name, date_of_birth)")
            .order("enrollment_date", { ascending: false })
            .limit(50)
          if (wicError && wicError.code === "42P01") {
            // Try alternative table name
            const { data: altWicData } = await supabase
              .from("wic_participants")
              .select("*, patients(first_name, last_name, date_of_birth)")
              .order("enrollment_date", { ascending: false })
              .limit(50)
            return NextResponse.json({ data: altWicData || [] })
          }
          return NextResponse.json({ data: wicData || [] })

        case "vaccinations":
          const { data: vaccData, error: vaccError } = await supabase
            .from("vaccinations")
            .select("*, patients(first_name, last_name)")
            .order("administration_date", { ascending: false })
            .limit(50)
          if (vaccError && vaccError.code === "42P01") {
            const { data: altVaccData } = await supabase
              .from("patient_vaccinations")
              .select("*, patients(first_name, last_name)")
              .order("administration_date", { ascending: false })
              .limit(50)
            return NextResponse.json({ data: altVaccData || [] })
          }
          return NextResponse.json({ data: vaccData || [] })

        case "sti":
          const { data: stiData } = await supabase
            .from("sti_clinic_visits")
            .select("*, patients(first_name, last_name)")
            .order("visit_date", { ascending: false })
            .limit(50)
          return NextResponse.json({ data: stiData || [] })

        case "mch":
          const { data: mchData, error: mchError } = await supabase
            .from("maternal_child_health_visits")
            .select("*, patients(first_name, last_name)")
            .order("visit_date", { ascending: false })
            .limit(50)
          if (mchError && mchError.code === "42P01") {
            const { data: altMchData } = await supabase
              .from("mch_programs")
              .select("*, patients(first_name, last_name)")
              .order("created_at", { ascending: false })
              .limit(50)
            return NextResponse.json({ data: altMchData || [] })
          }
          return NextResponse.json({ data: mchData || [] })

        case "disease":
          const { data: diseaseData } = await supabase
            .from("communicable_disease_reports")
            .select("*, patients(first_name, last_name)")
            .order("reported_date", { ascending: false })
            .limit(50)
          return NextResponse.json({ data: diseaseData || [] })

        case "tb":
          const { data: tbData } = await supabase
            .from("tb_cases")
            .select("*, patients(first_name, last_name)")
            .order("diagnosis_date", { ascending: false })
            .limit(50)
          return NextResponse.json({ data: tbData || [] })

        case "environmental":
          const { data: envData } = await supabase
            .from("environmental_health_inspections")
            .select("*")
            .order("inspection_date", { ascending: false })
            .limit(50)
          return NextResponse.json({ data: envData || [] })

        case "patients":
          const { data: patientsData } = await supabase
            .from("patients")
            .select("id, first_name, last_name, date_of_birth")
            .order("last_name")
            .limit(100)
          return NextResponse.json({ data: patientsData || [] })

        default:
          return NextResponse.json({ error: "Invalid type" }, { status: 400 })
      }
    }

    // Handle stats request (no countyId required for general stats)
    if (action === "stats") {
      const [wic, vacc, sti, disease, tb, mch, env] = await Promise.all([
        supabase.from("wic_enrollments").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase
          .from("vaccinations")
          .select("id", { count: "exact", head: true })
          .gte("administration_date", new Date(new Date().setDate(1)).toISOString().split("T")[0]),
        supabase
          .from("sti_clinic_visits")
          .select("id", { count: "exact", head: true })
          .gte("visit_date", new Date(new Date().setDate(1)).toISOString().split("T")[0]),
        supabase
          .from("communicable_disease_reports")
          .select("id", { count: "exact", head: true })
          .gte("reported_date", new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]),
        supabase.from("tb_cases").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase
          .from("maternal_child_health_visits")
          .select("id", { count: "exact", head: true })
          .gte("visit_date", new Date(new Date().setDate(1)).toISOString().split("T")[0]),
        supabase
          .from("environmental_health_inspections")
          .select("id", { count: "exact", head: true })
          .gte("inspection_date", new Date(new Date().setDate(1)).toISOString().split("T")[0]),
      ])

      return NextResponse.json({
        stats: {
          wicParticipants: wic.count || 0,
          immunizations: vacc.count || 0,
          stdVisits: sti.count || 0,
          diseaseReports: disease.count || 0,
          tbCases: tb.count || 0,
          mchCases: mch.count || 0,
          envInspections: env.count || 0,
        },
      })
    }

    // Original county-specific endpoint (requires countyId)
    if (!countyId) {
      return NextResponse.json({ error: "County ID is required for county-specific data" }, { status: 400 })
    }

    // Fetch county health department overview
    const { data: countyData, error: countyError } = await supabase
      .from("county_health_departments")
      .select("*")
      .eq("id", countyId)
      .single()

    if (countyError) throw countyError

    // Fetch service statistics
    const [wicStats, immunizationStats, stdStats, mchStats, diseaseStats, tbStats] = await Promise.all([
      // WIC program stats
      supabase
        .from("wic_participants")
        .select("id, participant_type")
        .eq("county_dept_id", countyId),

      // Immunization stats (this month)
      supabase
        .from("vaccinations")
        .select("id, vaccine_name")
        .eq("organization_id", countyData.organization_id)
        .gte("administration_date", new Date(new Date().setDate(1)).toISOString()),

      // STD clinic stats (this month)
      supabase
        .from("std_clinic_visits")
        .select("id, services_provided")
        .eq("county_dept_id", countyId)
        .gte("visit_date", new Date(new Date().setDate(1)).toISOString()),

      // MCH program stats
      supabase
        .from("mch_programs")
        .select("id, program_type, program_status")
        .eq("county_dept_id", countyId)
        .eq("program_status", "active"),

      // Communicable disease reports (this year)
      supabase
        .from("communicable_disease_reports")
        .select("id, disease_name, case_status")
        .eq("county_dept_id", countyId)
        .gte("report_date", new Date(new Date().getFullYear(), 0, 1).toISOString()),

      // Active TB cases
      supabase
        .from("tb_cases")
        .select("id, case_type")
        .eq("county_dept_id", countyId)
        .eq("case_status", "active"),
    ])

    return NextResponse.json({
      county: countyData,
      statistics: {
        wic: {
          totalParticipants: wicStats.data?.length || 0,
          byType:
            wicStats.data?.reduce((acc: any, p: any) => {
              acc[p.participant_type] = (acc[p.participant_type] || 0) + 1
              return acc
            }, {}) || {},
        },
        immunizations: {
          thisMonth: immunizationStats.data?.length || 0,
          topVaccines: immunizationStats.data?.slice(0, 5) || [],
        },
        stdClinic: {
          visitsThisMonth: stdStats.data?.length || 0,
        },
        mch: {
          activeCases: mchStats.data?.length || 0,
          byProgram:
            mchStats.data?.reduce((acc: any, p: any) => {
              acc[p.program_type] = (acc[p.program_type] || 0) + 1
              return acc
            }, {}) || {},
        },
        communicableDiseases: {
          reportsThisYear: diseaseStats.data?.length || 0,
          topDiseases: diseaseStats.data?.slice(0, 5) || [],
        },
        tb: {
          activeCases: tbStats.data?.length || 0,
        },
      },
    })
  } catch (error: any) {
    console.error("[County Health API Error]:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch county health data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { type, data } = body

    let result

    switch (type) {
      case "wic_participant":
      case "wic_enrollment":
        // Try wic_participants first (schema standard), fallback to wic_enrollments if needed
        result = await supabase.from("wic_participants").insert(data).select().single()
        if (result.error && result.error.code === "42P01") {
          // Table doesn't exist, try alternative name
          result = await supabase.from("wic_enrollments").insert(data).select().single()
        }
        break

      case "immunization_clinic":
      case "vaccination":
        // Try patient_vaccinations first (schema standard), fallback to vaccinations if needed
        result = await supabase.from("patient_vaccinations").insert(data).select().single()
        if (result.error && result.error.code === "42P01") {
          // Table doesn't exist, try alternative name
          result = await supabase.from("vaccinations").insert(data).select().single()
        }
        break

      case "std_visit":
      case "sti_visit":
        result = await supabase.from("sti_clinic_visits").insert(data).select().single()
        break

      case "mch_program":
      case "mch_visit":
        // Try mch_programs first, fallback to maternal_child_health_visits if needed
        result = await supabase.from("mch_programs").insert(data).select().single()
        if (result.error && result.error.code === "42P01") {
          // Table doesn't exist, try alternative name
          result = await supabase.from("maternal_child_health_visits").insert(data).select().single()
        }
        break

      case "disease_report":
        result = await supabase.from("communicable_disease_reports").insert(data).select().single()
        break

      case "tb_case":
        result = await supabase.from("tb_cases").insert(data).select().single()
        break

      case "environmental_inspection":
        result = await supabase.from("environmental_health_inspections").insert(data).select().single()
        break

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    if (result.error) throw result.error

    return NextResponse.json({ success: true, data: result.data })
  } catch (error: any) {
    console.error("[County Health API Error]:", error)
    return NextResponse.json({ error: error.message || "Failed to create county health record" }, { status: 500 })
  }
}
