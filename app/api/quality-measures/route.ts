import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const specialty = searchParams.get("specialty")
    const year = searchParams.get("year") || new Date().getFullYear().toString()

    // Fetch quality measures
    let measuresQuery = supabase.from("quality_measures").select("*").order("measure_id")

    if (specialty && specialty !== "all") {
      measuresQuery = measuresQuery.eq("specialty", specialty)
    }

    const { data: measures, error: measuresError } = await measuresQuery

    if (measuresError) throw measuresError

    const { data: tracking, error: trackingError } = await supabase
      .from("quality_measure_tracking")
      .select(`
        *,
        patients (id, first_name, last_name),
        encounters (id, encounter_date, chief_complaint)
      `)
      .eq("reporting_year", Number.parseInt(year))

    if (trackingError) {
      console.error("Tracking error:", trackingError)
      // Continue without tracking data if table doesn't exist or has issues
    }

    // Calculate performance for each measure
    const measuresWithPerformance = measures?.map((measure) => {
      const measureTracking = tracking?.filter((t) => t.measure_id === measure.id) || []

      const denominator = measureTracking.filter((t) => t.in_denominator && !t.excluded).length
      const numerator = measureTracking.filter((t) => t.in_numerator && t.in_denominator && !t.excluded).length

      const performanceRate = denominator > 0 ? Number.parseFloat(((numerator / denominator) * 100).toFixed(1)) : 0
      const totalTracking = measureTracking.length
      const dataCompleteness =
        totalTracking > 0
          ? Number.parseFloat(
              ((measureTracking.filter((t) => t.performance_met !== null).length / totalTracking) * 100).toFixed(1),
            )
          : 0

      return {
        ...measure,
        denominator,
        numerator,
        performance_rate: performanceRate,
        data_completeness: dataCompleteness,
        meets_minimum: denominator >= 20,
        meets_data_completeness: dataCompleteness >= 75,
      }
    })

    return NextResponse.json({
      measures: measuresWithPerformance || [],
      year,
      specialty,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error("Error fetching quality measures:", err)
    return NextResponse.json({ measures: [], error: err.message }, { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("quality_measure_tracking")
      .insert({
        measure_id: body.measure_id,
        patient_id: body.patient_id,
        encounter_id: body.encounter_id,
        reporting_year: body.reporting_year || new Date().getFullYear(),
        in_numerator: body.in_numerator || false,
        in_denominator: body.in_denominator || true,
        excluded: body.excluded || false,
        exclusion_reason: body.exclusion_reason,
        performance_met: body.performance_met,
        recorded_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: unknown) {
    const err = error as Error
    console.error("Error recording quality measure:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
