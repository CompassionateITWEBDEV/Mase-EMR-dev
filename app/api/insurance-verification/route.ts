import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (patientId) {
      // Get verification history for specific patient
      const { data, error } = await supabase
        .from("insurance_verification_history")
        .select(`
          *,
          patients(id, first_name, last_name, dob),
          patient_insurance(
            insurance_name,
            policy_number,
            group_number,
            subscriber_name
          )
        `)
        .eq("patient_id", patientId)
        .order("verification_date", { ascending: false })

      if (error) throw error
      return NextResponse.json(data || [])
    }

    // Get recent verifications
    const { data, error } = await supabase
      .from("insurance_verification_history")
      .select(`
        *,
        patients(id, first_name, last_name, dob, patient_number)
      `)
      .order("verification_date", { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching insurance verifications:", error)
    return NextResponse.json({ error: "Failed to fetch verifications" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    // In production, this would call a real insurance verification API
    // For now, we'll simulate a verification
    const verificationResult = {
      patient_id: body.patientId,
      insurance_id: body.insuranceId,
      eligibility_status: "active",
      coverage_start_date: new Date().toISOString().split("T")[0],
      coverage_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      copay_amount: 20.0,
      deductible_amount: 2000.0,
      deductible_met: 500.0,
      out_of_pocket_max: 6000.0,
      out_of_pocket_met: 1200.0,
      authorization_required: body.serviceType === "inpatient" || body.serviceType === "residential",
      benefits_summary: {
        behavioral_health_covered: true,
        inpatient_days_allowed: 30,
        outpatient_visits_allowed: 52,
        substance_abuse_coverage: true,
        mental_health_parity: true,
      },
      response_code: "AAA",
      verified_by: body.verifiedBy,
    }

    const { data, error } = await supabase.from("insurance_verification_history").insert(verificationResult).select()

    if (error) throw error
    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error verifying insurance:", error)
    return NextResponse.json({ error: "Failed to verify insurance" }, { status: 500 })
  }
}
