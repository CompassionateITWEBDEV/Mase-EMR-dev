import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("prior_auth_requests_edi")
      .select(`
        *,
        patients:patient_id (first_name, last_name),
        providers:provider_id (first_name, last_name),
        payers:payer_id (payer_name)
      `)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching prior auths:", error)
      return NextResponse.json({ priorAuths: [] })
    }

    const priorAuths = (data || []).map((auth) => ({
      id: auth.request_number || auth.id,
      patientName: auth.patients ? `${auth.patients.first_name} ${auth.patients.last_name}` : "Unknown Patient",
      service: auth.service_type || "Unknown Service",
      status: mapAuthStatus(auth.auth_status),
      submittedDate: auth.requested_at
        ? new Date(auth.requested_at).toISOString().split("T")[0]
        : new Date(auth.created_at).toISOString().split("T")[0],
      responseDate: auth.responded_at ? new Date(auth.responded_at).toISOString().split("T")[0] : undefined,
      authNumber: auth.auth_number || undefined,
      expirationDate: auth.expiration_date || undefined,
      notes: auth.notes || auth.denial_reason || undefined,
      urgencyLevel: auth.urgency_level || "routine",
      diagnosisCodes: auth.diagnosis_codes || [],
      procedureCodes: auth.procedure_codes || [],
      payerName: auth.payers?.payer_name || "Unknown Payer",
      providerName: auth.providers ? `${auth.providers.first_name} ${auth.providers.last_name}` : "Unknown Provider",
    }))

    return NextResponse.json({ priorAuths })
  } catch (error) {
    console.error("Error in prior auth API:", error)
    return NextResponse.json({ priorAuths: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const requestNumber = `PA${Date.now().toString().slice(-6)}`

    const { data, error } = await supabase
      .from("prior_auth_requests_edi")
      .insert({
        request_number: requestNumber,
        patient_id: body.patientId || null,
        service_type: body.service,
        request_type: "initial",
        urgency_level: body.urgency || "routine",
        diagnosis_codes: body.diagnosis ? [body.diagnosis] : [],
        notes: body.justification,
        auth_status: "pending",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating prior auth:", error)
      return NextResponse.json({ error: "Failed to create prior authorization" }, { status: 500 })
    }

    return NextResponse.json({ success: true, priorAuth: data })
  } catch (error) {
    console.error("Error in prior auth POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function mapAuthStatus(status: string | null): "pending" | "approved" | "denied" | "expired" {
  if (!status) return "pending"
  const normalized = status.toLowerCase()
  if (normalized.includes("approved") || normalized.includes("authorized")) return "approved"
  if (normalized.includes("denied") || normalized.includes("rejected")) return "denied"
  if (normalized.includes("expired")) return "expired"
  return "pending"
}
