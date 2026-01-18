import { createServiceClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"
import { checkNewDrugInteraction } from "@/lib/services/drug-interaction-service"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query = supabase
      .from("prescriptions")
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name
        )
      `)
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: prescriptions, error } = await query

    if (error) {
      console.error("Error fetching prescriptions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get providers for prescriber names
    const { data: providers } = await supabase.from("providers").select("id, first_name, last_name")

    const providerMap = new Map((providers || []).map((p) => [p.id, `Dr. ${p.first_name} ${p.last_name}`]))

    // Format the data
    const formattedPrescriptions = (prescriptions || []).map((rx) => ({
      ...rx,
      patient_name: rx.patients ? `${rx.patients.first_name} ${rx.patients.last_name}` : "Unknown Patient",
      prescriber_name: providerMap.get(rx.prescribed_by) || "Unknown Provider",
    }))

    // Get patients for dropdown
    const { data: patients } = await supabase.from("patients").select("id, first_name, last_name").order("last_name")

    const { data: allProviders } = await supabase
      .from("providers")
      .select("id, first_name, last_name, specialization")
      .order("last_name")

    return NextResponse.json({
      prescriptions: formattedPrescriptions,
      patients: patients || [],
      providers: allProviders || [],
    })
  } catch (error) {
    console.error("Error in prescriptions API:", error)
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const skipInteractionCheck = body.skip_interaction_check === true
    const forceCreate = body.force_create === true

    // Check for drug interactions before creating prescription
    if (!skipInteractionCheck && body.patient_id && body.medication_name) {
      try {
        // Get patient's current active medications
        const { data: patientMeds } = await supabase
          .from("patient_medications")
          .select("medication_name")
          .eq("patient_id", body.patient_id)
          .eq("status", "active")

        const existingMedNames = (patientMeds || []).map((m) => m.medication_name)

        // Check for interactions with the new medication
        if (existingMedNames.length > 0) {
          const interactions = await checkNewDrugInteraction(
            body.medication_name,
            existingMedNames
          )

          // If there are major or contraindicated interactions, block unless forced
          const criticalInteractions = interactions.filter(
            (i) => i.severity === "contraindicated" || i.severity === "major"
          )

          if (criticalInteractions.length > 0 && !forceCreate) {
            return NextResponse.json(
              {
                error: "Drug interactions detected",
                interactions: criticalInteractions,
                warning: "Critical drug interactions were found. Review the interactions and confirm to proceed.",
                requiresConfirmation: true,
              },
              { status: 409 } // Conflict status
            )
          }

          // For moderate/minor interactions, include as warnings but allow creation
          const allInteractions = interactions.filter(
            (i) => i.severity && ["minor", "moderate", "major", "contraindicated"].includes(i.severity)
          )
          
          if (allInteractions.length > 0) {
            body.interaction_warnings = allInteractions
          }
        }
      } catch (interactionError) {
        // Log but don't block prescription creation if interaction check fails
        console.error("Drug interaction check failed:", interactionError)
      }
    }

    const prescriptionData = {
      patient_id: body.patient_id,
      prescribed_by: body.prescribed_by,
      medication_name: body.medication_name,
      generic_name: body.generic_name || null,
      dosage: body.dosage,
      quantity: body.quantity,
      refills: body.refills,
      directions: body.directions,
      pharmacy_name: body.pharmacy_name || null,
      pharmacy_address: body.pharmacy_address || null,
      pharmacy_phone: body.pharmacy_phone || null,
      pharmacy_npi: body.pharmacy_npi || null,
      status: "pending",
      prescribed_date: new Date().toISOString(),
      notes: body.notes || null,
    }

    const { data, error } = await supabase.from("prescriptions").insert(prescriptionData).select().single()

    if (error) {
      console.error("Error creating prescription:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Include any interaction warnings in the response
    const response: Record<string, unknown> = { ...data }
    if (body.interaction_warnings) {
      response.interaction_warnings = body.interaction_warnings
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in prescriptions POST:", error)
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Prescription ID is required" }, { status: 400 })
    }

    if (updates.status === "sent") {
      updates.sent_date = new Date().toISOString()
    } else if (updates.status === "filled") {
      updates.filled_date = new Date().toISOString()
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from("prescriptions").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating prescription:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sync with patient_medications when prescription is filled
    if (updates.status === "filled" && data) {
      await syncPrescriptionToMedicationList(supabase, data)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in prescriptions PUT:", error)
    return NextResponse.json({ error: "Failed to update prescription" }, { status: 500 })
  }
}

/**
 * Extracts frequency from prescription directions
 * e.g., "Take one tablet twice daily" -> "twice daily"
 */
function extractFrequencyFromDirections(directions: string | null): string {
  if (!directions) return "as directed"
  
  const lowerDirections = directions.toLowerCase()
  
  // Common frequency patterns
  const patterns = [
    { regex: /once\s*(a\s*)?daily|once\s*per\s*day|q\.?d\.?|qd/i, value: "once daily" },
    { regex: /twice\s*(a\s*)?daily|twice\s*per\s*day|b\.?i\.?d\.?|bid/i, value: "twice daily" },
    { regex: /three\s*times\s*(a\s*)?daily|three\s*times\s*per\s*day|t\.?i\.?d\.?|tid/i, value: "three times daily" },
    { regex: /four\s*times\s*(a\s*)?daily|four\s*times\s*per\s*day|q\.?i\.?d\.?|qid/i, value: "four times daily" },
    { regex: /every\s*(\d+)\s*hours?/i, value: (match: RegExpMatchArray) => `every ${match[1]} hours` },
    { regex: /at\s*bedtime|h\.?s\.?|hs/i, value: "at bedtime" },
    { regex: /as\s*needed|p\.?r\.?n\.?|prn/i, value: "as needed" },
    { regex: /weekly/i, value: "weekly" },
    { regex: /every\s*other\s*day|q\.?o\.?d\.?|qod/i, value: "every other day" },
  ]
  
  for (const pattern of patterns) {
    const match = lowerDirections.match(pattern.regex)
    if (match) {
      return typeof pattern.value === "function" ? pattern.value(match) : pattern.value
    }
  }
  
  return "as directed"
}

/**
 * Syncs a filled prescription to the patient_medications list
 */
async function syncPrescriptionToMedicationList(
  supabase: ReturnType<typeof createServiceClient>,
  prescription: {
    patient_id: string
    medication_name: string
    generic_name?: string | null
    dosage?: string | null
    directions?: string | null
    prescribed_by: string
    pharmacy_id?: string | null
    filled_date?: string | null
  }
) {
  try {
    // Check if medication already exists for this patient
    const { data: existingMed } = await supabase
      .from("patient_medications")
      .select("id")
      .eq("patient_id", prescription.patient_id)
      .ilike("medication_name", prescription.medication_name)
      .eq("status", "active")
      .single()

    const medicationData = {
      patient_id: prescription.patient_id,
      medication_name: prescription.medication_name,
      generic_name: prescription.generic_name || null,
      dosage: prescription.dosage || "as prescribed",
      frequency: extractFrequencyFromDirections(prescription.directions || null),
      route: "oral", // Default, could be extracted from dosage_form if available
      start_date: prescription.filled_date 
        ? new Date(prescription.filled_date).toISOString().split("T")[0] 
        : new Date().toISOString().split("T")[0],
      status: "active",
      prescribed_by: prescription.prescribed_by,
      pharmacy_id: prescription.pharmacy_id || null,
      updated_at: new Date().toISOString(),
    }

    if (existingMed) {
      // Update existing medication
      await supabase
        .from("patient_medications")
        .update(medicationData)
        .eq("id", existingMed.id)
    } else {
      // Insert new medication
      await supabase
        .from("patient_medications")
        .insert({
          ...medicationData,
          created_at: new Date().toISOString(),
        })
    }

    console.log(`Synced prescription to patient_medications for patient ${prescription.patient_id}`)
  } catch (error) {
    // Log but don't fail the prescription update
    console.error("Error syncing prescription to medication list:", error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Prescription ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("prescriptions").delete().eq("id", id)

    if (error) {
      console.error("Error deleting prescription:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in prescriptions DELETE:", error)
    return NextResponse.json({ error: "Failed to delete prescription" }, { status: 500 })
  }
}
