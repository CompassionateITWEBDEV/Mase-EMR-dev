import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const countyId = searchParams.get("countyId")

    if (!countyId) {
      return NextResponse.json({ error: "County ID is required" }, { status: 400 })
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
        result = await supabase.from("wic_participants").insert(data).select().single()
        break

      case "immunization_clinic":
        result = await supabase.from("immunization_clinics").insert(data).select().single()
        break

      case "std_visit":
        result = await supabase.from("std_clinic_visits").insert(data).select().single()
        break

      case "mch_program":
        result = await supabase.from("mch_programs").insert(data).select().single()
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
