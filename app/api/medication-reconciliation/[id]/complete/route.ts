import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface ReconciledMedication {
  id: string
  medication_name: string
  dosage: string
  frequency: string
  route: string
  source: "home" | "hospital" | "provider" | "pharmacy"
  verified: boolean
  action: "continue" | "discontinue" | "modify" | "new" | "pending"
  notes?: string
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { reconciled_medications, notes } = body

    const supabase = await createClient()

    // First, get the session to retrieve the patient_id
    const { data: session, error: sessionError } = await supabase
      .from("medication_reconciliation_sessions")
      .select("patient_id, created_by")
      .eq("id", id)
      .single()

    if (sessionError || !session) {
      console.error("Error fetching reconciliation session:", sessionError)
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Update reconciliation session as completed
    const { data, error } = await supabase
      .from("medication_reconciliation_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        reconciled_medications: reconciled_medications || [],
        notes: notes || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error completing reconciliation:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sync reconciled medications to patient_medications table
    if (reconciled_medications && Array.isArray(reconciled_medications)) {
      await syncReconciledMedicationsToPatientList(
        supabase,
        session.patient_id,
        session.created_by,
        reconciled_medications as ReconciledMedication[]
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error completing reconciliation:", error)
    return NextResponse.json({ error: "Failed to complete reconciliation" }, { status: 500 })
  }
}

/**
 * Syncs reconciled medications to the patient_medications table
 * Based on the action taken during reconciliation:
 * - continue: Ensure medication is active
 * - discontinue: Mark as discontinued with reason
 * - new: Create new medication entry
 * - modify: Update existing medication
 */
async function syncReconciledMedicationsToPatientList(
  supabase: Awaited<ReturnType<typeof createClient>>,
  patientId: string,
  providerId: string,
  medications: ReconciledMedication[]
) {
  const today = new Date().toISOString().split("T")[0]
  const now = new Date().toISOString()

  for (const med of medications) {
    if (!med.verified) continue // Skip unverified medications

    try {
      switch (med.action) {
        case "continue":
          // Ensure medication is active in the list
          await supabase
            .from("patient_medications")
            .upsert(
              {
                patient_id: patientId,
                medication_name: med.medication_name,
                dosage: med.dosage,
                frequency: med.frequency,
                route: med.route,
                status: "active",
                start_date: today,
                notes: med.notes || null,
                updated_at: now,
              },
              { onConflict: "patient_id,medication_name" }
            )
          break

        case "discontinue":
          // Find and mark existing medication as discontinued
          const { data: existingMed } = await supabase
            .from("patient_medications")
            .select("id")
            .eq("patient_id", patientId)
            .ilike("medication_name", med.medication_name)
            .eq("status", "active")
            .single()

          if (existingMed) {
            await supabase
              .from("patient_medications")
              .update({
                status: "discontinued",
                end_date: today,
                discontinuation_reason: med.notes || "Discontinued during medication reconciliation",
                discontinued_by: providerId,
                discontinued_at: now,
                updated_at: now,
              })
              .eq("id", existingMed.id)
          }
          break

        case "new":
          // Add new medication to the list
          await supabase.from("patient_medications").insert({
            patient_id: patientId,
            medication_name: med.medication_name,
            dosage: med.dosage,
            frequency: med.frequency,
            route: med.route,
            start_date: today,
            status: "active",
            prescribed_by: providerId,
            notes: med.notes || "Added during medication reconciliation",
            created_at: now,
            updated_at: now,
          })
          break

        case "modify":
          // Update existing medication with new details
          await supabase
            .from("patient_medications")
            .update({
              dosage: med.dosage,
              frequency: med.frequency,
              route: med.route,
              notes: med.notes || null,
              updated_at: now,
            })
            .eq("patient_id", patientId)
            .ilike("medication_name", med.medication_name)
            .eq("status", "active")
          break

        default:
          // Skip pending or unknown actions
          break
      }
    } catch (error) {
      console.error(`Error syncing medication ${med.medication_name}:`, error)
      // Continue with other medications even if one fails
    }
  }

  console.log(`Synced ${medications.length} reconciled medications for patient ${patientId}`)
}
