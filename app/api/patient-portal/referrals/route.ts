import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 })
    }

    // Get existing referral requests from case communications
    const { data: referrals } = await supabase
      .from("case_communications")
      .select("*")
      .eq("patient_id", patientId)
      .eq("message_type", "referral_request")
      .order("created_at", { ascending: false })

    return NextResponse.json({ referrals: referrals || [] })
  } catch (error) {
    console.error("Error fetching referrals:", error)
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { patientId, serviceType, reason, urgency, notes } = body

    const { data, error } = await supabase
      .from("case_communications")
      .insert({
        patient_id: patientId,
        message_type: "referral_request",
        priority: urgency,
        subject: `Service Referral Request: ${serviceType}`,
        message: `Service Type: ${serviceType}\nReason: ${reason}\nNotes: ${notes || "None"}`,
        metadata: { serviceType, reason, urgency, requestedAt: new Date().toISOString() },
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, referral: data })
  } catch (error) {
    console.error("Error creating referral request:", error)
    return NextResponse.json({ error: "Failed to create referral request" }, { status: 500 })
  }
}
