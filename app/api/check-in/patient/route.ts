import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { patientNumber, mobilePhone, serviceType, checkInMethod } = body

    // Find patient by number
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, first_name, last_name, patient_number")
      .eq("patient_number", patientNumber)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ message: "Patient not found. Please check your patient number." }, { status: 404 })
    }

    // Check if already checked in today
    const today = new Date().toISOString().split("T")[0]
    const { data: existing } = await supabase
      .from("patient_check_ins")
      .select("id, status, queue_position")
      .eq("patient_id", patient.id)
      .gte("check_in_time", `${today}T00:00:00`)
      .in("status", ["waiting", "called", "return-later"])
      .single()

    if (existing) {
      // Return existing queue status
      const { data: queueAhead } = await supabase
        .from("patient_check_ins")
        .select("id", { count: "exact" })
        .lt("queue_position", existing.queue_position)
        .in("status", ["waiting", "called"])

      return NextResponse.json({
        queueId: existing.id,
        patientNumber: patient.patient_number,
        position: existing.queue_position,
        totalAhead: queueAhead?.length || 0,
        estimatedWaitMinutes: (queueAhead?.length || 0) * 8,
        status: existing.status,
        serviceType,
        checkInTime: new Date().toISOString(),
        clinicMessage: "You are already checked in. Please wait for your number to be called.",
      })
    }

    // Get next queue position
    const { data: lastInQueue } = await supabase
      .from("patient_check_ins")
      .select("queue_position")
      .gte("check_in_time", `${today}T00:00:00`)
      .order("queue_position", { ascending: false })
      .limit(1)
      .single()

    const nextPosition = (lastInQueue?.queue_position || 0) + 1

    // Create check-in record
    const { data: checkIn, error: checkInError } = await supabase
      .from("patient_check_ins")
      .insert({
        patient_id: patient.id,
        patient_number: patientNumber,
        check_in_time: new Date().toISOString(),
        check_in_method: checkInMethod || "mobile",
        queue_position: nextPosition,
        status: "waiting",
        service_type: serviceType || "dosing",
        mobile_phone: mobilePhone,
        priority: "normal",
      })
      .select()
      .single()

    if (checkInError) throw checkInError

    // Count patients ahead
    const { data: ahead } = await supabase
      .from("patient_check_ins")
      .select("id", { count: "exact" })
      .lt("queue_position", nextPosition)
      .in("status", ["waiting", "called"])
      .gte("check_in_time", `${today}T00:00:00`)

    const totalAhead = ahead?.length || nextPosition - 1

    return NextResponse.json({
      queueId: checkIn.id,
      patientNumber: patient.patient_number,
      position: nextPosition,
      totalAhead,
      estimatedWaitMinutes: totalAhead * 8,
      status: "waiting",
      serviceType,
      checkInTime: checkIn.check_in_time,
      clinicMessage: "You're checked in! Please wait in the lobby and we'll call your number.",
    })
  } catch (error) {
    console.error("Error during patient check-in:", error)
    return NextResponse.json({ message: "Check-in failed. Please try again." }, { status: 500 })
  }
}
