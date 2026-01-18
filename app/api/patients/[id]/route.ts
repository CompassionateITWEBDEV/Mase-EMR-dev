import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select(
        `
          id,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone,
          email,
          address,
          emergency_contact_name,
          emergency_contact_phone,
          insurance_provider,
          insurance_id
        `,
      )
      .eq("id", params.id)
      .single()

    if (patientError) {
      const status = patientError.code === "PGRST116" ? 404 : 500
      return NextResponse.json({ patient: null, insurance: [], medications: [], error: patientError.message }, { status })
    }

    const [{ data: insurance, error: insuranceError }, { data: medications, error: medicationsError }] =
      await Promise.all([
        supabase
          .from("patient_insurance")
          .select(
            `
              id,
              policy_number,
              group_number,
              effective_date,
              termination_date,
              copay_amount,
              is_primary,
              status,
              coverage_level,
              payer:insurance_payers(payer_name, payer_id)
            `,
          )
          .eq("patient_id", params.id)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("patient_medications")
          .select("id, medication_name, dosage, frequency, route, start_date, end_date, status")
          .eq("patient_id", params.id)
          .order("start_date", { ascending: false }),
      ])

    if (insuranceError || medicationsError) {
      const message = insuranceError?.message || medicationsError?.message || "Failed to load patient data"
      return NextResponse.json({ patient, insurance: [], medications: [], error: message }, { status: 500 })
    }

    return NextResponse.json({
      patient,
      insurance: insurance || [],
      medications: medications || [],
    })
  } catch (error) {
    console.error("[v0] Patient detail API error:", error)
    return NextResponse.json(
      { patient: null, insurance: [], medications: [], error: "Failed to fetch patient data" },
      { status: 500 },
    )
  }
}
