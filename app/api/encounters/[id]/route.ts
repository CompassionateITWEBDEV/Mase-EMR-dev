import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get encounter details
    const { data: encounter, error: encError } = await supabase
      .from("appointments")
      .select(`
        *,
        patients (id, first_name, last_name, date_of_birth, gender, phone, email, address),
        providers (id, first_name, last_name, specialization)
      `)
      .eq("id", id)
      .single()

    if (encError) throw encError

    const patientId = encounter.patient_id

    // Get patient medications
    const { data: medications } = await supabase
      .from("patient_medications")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "active")
      .order("medication_name")

    // Get vital signs with history for comparison
    const { data: vitals } = await supabase
      .from("vital_signs")
      .select("*")
      .eq("patient_id", patientId)
      .order("measurement_date", { ascending: false })
      .limit(10)

    // Get assessments with diagnosis codes
    const { data: assessments } = await supabase
      .from("assessments")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(5)

    // Get progress notes
    const { data: notes } = await supabase
      .from("progress_notes")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(5)

    // Get treatment plans
    const { data: treatmentPlans } = await supabase
      .from("treatment_plans")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "active")
      .limit(1)

    return NextResponse.json({
      encounter,
      medications: medications || [],
      vitals: vitals || [],
      assessments: assessments || [],
      notes: notes || [],
      treatmentPlans: treatmentPlans || [],
    })
  } catch (error) {
    console.error("Error fetching encounter details:", error)
    return NextResponse.json({ error: "Failed to fetch encounter" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Update encounter/appointment
    if (body.status) {
      const { error: encError } = await supabase
        .from("appointments")
        .update({ status: body.status, notes: body.notes })
        .eq("id", id)

      if (encError) throw encError
    }

    // Save vital signs if provided
    if (body.vitals && body.patient_id) {
      const { error: vitalError } = await supabase.from("vital_signs").insert({
        patient_id: body.patient_id,
        provider_id: body.provider_id,
        measurement_date: new Date().toISOString(),
        systolic_bp: body.vitals.systolic_bp,
        diastolic_bp: body.vitals.diastolic_bp,
        heart_rate: body.vitals.heart_rate,
        respiratory_rate: body.vitals.respiratory_rate,
        temperature: body.vitals.temperature,
        temperature_unit: "F",
        oxygen_saturation: body.vitals.oxygen_saturation,
        weight: body.vitals.weight,
        weight_unit: "lbs",
        height_feet: body.vitals.height_feet,
        height_inches: body.vitals.height_inches,
        pain_scale: body.vitals.pain_scale,
        pain_location: body.vitals.pain_location,
        notes: body.vitals.notes,
      })

      if (vitalError) console.error("Vital error:", vitalError)
    }

    // Save assessment with diagnosis codes if provided
    if (body.assessment && body.patient_id) {
      const { error: assessError } = await supabase.from("assessments").insert({
        patient_id: body.patient_id,
        provider_id: body.provider_id,
        appointment_id: id,
        assessment_type: "encounter",
        chief_complaint: body.chief_complaint,
        history_present_illness: body.hpi,
        diagnosis_codes: body.diagnosis_codes || [],
        treatment_plan: body.plan,
        mental_status_exam: body.mental_status_exam,
        risk_assessment: body.risk_assessment,
      })

      if (assessError) console.error("Assessment error:", assessError)
    }

    // Save progress note if provided
    if (body.note && body.patient_id) {
      const { error: noteError } = await supabase.from("progress_notes").insert({
        patient_id: body.patient_id,
        provider_id: body.provider_id,
        appointment_id: id,
        note_type: "SOAP",
        subjective: body.note.subjective,
        objective: body.note.objective,
        assessment: body.note.assessment,
        plan: body.note.plan,
      })

      if (noteError) console.error("Note error:", noteError)
    }

    // Link Evidence-Based Practices if provided
    if (body.ebp_deliveries && Array.isArray(body.ebp_deliveries) && body.ebp_deliveries.length > 0) {
      const { createServiceClient } = await import("@/lib/supabase/service-role")
      const serviceSupabase = createServiceClient()
      
      for (const ebpDelivery of body.ebp_deliveries) {
        if (ebpDelivery.ebp_id && ebpDelivery.patient_id) {
          const deliveryDate = ebpDelivery.delivery_date || new Date().toISOString().split('T')[0]
          
          // Check for duplicate
          const { data: existing } = await serviceSupabase
            .from("ebp_patient_delivery")
            .select("id")
            .eq("ebp_id", ebpDelivery.ebp_id)
            .eq("patient_id", ebpDelivery.patient_id)
            .eq("delivery_date", deliveryDate)
            .maybeSingle()

          if (!existing) {
            await serviceSupabase.from("ebp_patient_delivery").insert({
              ebp_id: ebpDelivery.ebp_id,
              patient_id: ebpDelivery.patient_id,
              encounter_id: id, // Link to this encounter
              delivery_date: deliveryDate,
              delivery_type: ebpDelivery.delivery_type || 'session',
              delivered_by: body.provider_id,
              notes: ebpDelivery.notes || null,
            })
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating encounter:", error)
    return NextResponse.json({ error: "Failed to update encounter" }, { status: 500 })
  }
}
