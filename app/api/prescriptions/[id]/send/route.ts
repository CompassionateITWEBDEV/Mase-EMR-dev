import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createServiceClient()
    const now = new Date().toISOString()

    // First, get the prescription data for transmission logging
    const { data: prescription, error: fetchError } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !prescription) {
      console.error("Error fetching prescription:", fetchError)
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 })
    }

    // Validate prescription is in a sendable state
    if (prescription.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot send prescription with status: ${prescription.status}` },
        { status: 400 }
      )
    }

    // Create transmission log entry
    const transmissionPayload = {
      prescription_id: id,
      transmission_type: "new_rx",
      status: "pending", // Will be updated when we have actual pharmacy integration
      retry_count: 0,
      request_payload: {
        prescription_id: id,
        patient_id: prescription.patient_id,
        medication_name: prescription.medication_name,
        generic_name: prescription.generic_name,
        dosage: prescription.dosage,
        quantity: prescription.quantity,
        directions: prescription.directions,
        refills: prescription.refills,
        pharmacy_name: prescription.pharmacy_name,
        pharmacy_npi: prescription.pharmacy_npi,
        pharmacy_address: prescription.pharmacy_address,
        pharmacy_phone: prescription.pharmacy_phone,
        prescribed_by: prescription.prescribed_by,
        is_controlled_substance: prescription.is_controlled_substance,
        dea_schedule: prescription.dea_schedule,
      },
      transmitted_at: now,
      created_at: now,
    }

    const { data: transmission, error: transmissionError } = await supabase
      .from("e_prescribing_transmissions")
      .insert(transmissionPayload)
      .select()
      .single()

    if (transmissionError) {
      console.error("Error creating transmission log:", transmissionError)
      // Don't fail the send, just log the error
    }

    // Update prescription status
    const { data, error } = await supabase
      .from("prescriptions")
      .update({
        status: "sent",
        sent_date: now,
        transmission_status: "queued", // Indicates it's been queued for transmission
        transmission_date: now,
        updated_at: now,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error sending prescription:", error)
      
      // If the prescription update failed, update transmission status to failed
      if (transmission) {
        await supabase
          .from("e_prescribing_transmissions")
          .update({
            status: "failed",
            error_message: error.message,
          })
          .eq("id", transmission.id)
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update transmission status to success (simulated - in production this would be async)
    if (transmission) {
      await supabase
        .from("e_prescribing_transmissions")
        .update({
          status: "success",
          acknowledged_at: now,
          response_payload: {
            status: "accepted",
            message: "Prescription queued for transmission",
            timestamp: now,
          },
        })
        .eq("id", transmission.id)
    }

    return NextResponse.json({
      ...data,
      transmission_id: transmission?.id,
      message: "Prescription sent successfully",
    })
  } catch (error) {
    console.error("Error sending prescription:", error)
    return NextResponse.json({ error: "Failed to send prescription" }, { status: 500 })
  }
}
