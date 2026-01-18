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

    // Get peer coach messages
    const { data: messages } = await supabase
      .from("case_communications")
      .select("*")
      .eq("patient_id", patientId)
      .eq("message_type", "peer_support")
      .order("created_at", { ascending: true })

    // Get assigned peer coach from care team
    const { data: careTeam } = await supabase
      .from("care_team_members")
      .select(`
        *,
        provider:providers(first_name, last_name, phone, email, specialization)
      `)
      .eq("role", "peer_support_specialist")
      .limit(1)
      .single()

    return NextResponse.json({
      messages: messages || [],
      peerCoach: careTeam?.provider || null,
    })
  } catch (error) {
    console.error("Error fetching peer coach data:", error)
    return NextResponse.json({ error: "Failed to fetch peer coach data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { patientId, message } = body

    const { data, error } = await supabase
      .from("case_communications")
      .insert({
        patient_id: patientId,
        message_type: "peer_support",
        priority: "normal",
        subject: "Message to Peer Recovery Coach",
        message: message,
        is_read: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, message: data })
  } catch (error) {
    console.error("Error sending peer coach message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
