import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { searchParams } = new URL(request.url)

  const prescriptionId = searchParams.get("prescription_id")
  const status = searchParams.get("status")

  let query = supabase
    .from("e_prescribing_transmissions")
    .select(`
      *,
      prescription:prescriptions(
        id,
        medication_name,
        patient:patients(id, first_name, last_name),
        pharmacy:pharmacies(id, name)
      )
    `)
    .order("created_at", { ascending: false })

  if (prescriptionId) {
    query = query.eq("prescription_id", prescriptionId)
  }

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching transmissions:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform data to match frontend interface
  const transmissions = data?.map((tx: any) => ({
    id: tx.id,
    prescription_id: tx.prescription_id,
    patient_name: tx.prescription?.patient
      ? `${tx.prescription.patient.first_name} ${tx.prescription.patient.last_name}`
      : "Unknown",
    medication: tx.prescription?.medication_name || "Unknown",
    pharmacy: tx.prescription?.pharmacy?.name || "Unknown",
    status: tx.status,
    timestamp: tx.transmitted_at || tx.created_at,
    error_message: tx.error_message,
    retry_count: tx.retry_count,
  }))

  return NextResponse.json({ transmissions })
}
