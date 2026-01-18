import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patientId,
      incidentDate,
      incidentTime,
      incidentLocation,
      category,
      type,
      description,
      witnessNames,
      isAnonymous,
      contactName,
      contactPhone,
      contactEmail,
    } = body

    // Generate complaint number
    const complaintNumber = `RR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`

    const supabase = await createServerClient()

    // Get current user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Insert complaint into database
    const { data: complaint, error } = await supabase
      .from("recipient_rights_complaints")
      .insert({
        complaint_number: complaintNumber,
        complainant_patient_id: isAnonymous ? null : patientId,
        complainant_type: isAnonymous ? "anonymous" : "patient",
        complainant_name: isAnonymous ? "Anonymous" : contactName,
        complainant_phone: contactPhone,
        complainant_email: contactEmail,
        is_anonymous: isAnonymous,
        complaint_date: new Date().toISOString(),
        incident_date: incidentDate,
        incident_time: incidentTime,
        incident_location: incidentLocation,
        complaint_category: category,
        complaint_type: type,
        complaint_description: description,
        witnesses: witnessNames ? witnessNames.split(",").map((w: string) => w.trim()) : [],
        investigation_status: "pending",
        status: "open",
        priority: category === "abuse" || category === "neglect" ? "urgent" : "normal",
        severity: category === "abuse" ? "critical" : "moderate",
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting complaint:", error)
      return NextResponse.json({ error: "Failed to file complaint" }, { status: 500 })
    }

    // Log the activity
    await supabase.from("recipient_rights_activity_log").insert({
      complaint_id: complaint.id,
      action: "complaint_filed",
      action_description: `Complaint ${complaintNumber} filed via patient portal`,
      performed_by: user?.id,
      performed_by_name: isAnonymous ? "Anonymous" : contactName,
      performed_by_role: "patient",
    })

    console.log("[v0] Recipient rights complaint filed:", complaintNumber)

    return NextResponse.json({
      success: true,
      complaint,
      message: "Complaint filed successfully. A Recipient Rights Officer will contact you within 24 hours.",
    })
  } catch (error) {
    console.error("Error filing recipient rights complaint:", error)
    return NextResponse.json({ error: "Failed to file complaint" }, { status: 500 })
  }
}
