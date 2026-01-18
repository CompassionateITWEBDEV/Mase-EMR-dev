import { createServiceClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"
import { checkNewDrugInteraction } from "@/lib/services/drug-interaction-service"

/**
 * POST /api/drug-interactions/check
 * Check for drug interactions between a new medication and existing medications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { medication_name, patient_id, existing_medications } = body

    if (!medication_name) {
      return NextResponse.json(
        { error: "Medication name is required" },
        { status: 400 }
      )
    }

    let medicationList: string[] = existing_medications || []

    // If patient_id is provided, fetch their active medications
    if (patient_id && !existing_medications) {
      const supabase = createServiceClient()
      const { data: patientMeds } = await supabase
        .from("patient_medications")
        .select("medication_name")
        .eq("patient_id", patient_id)
        .eq("status", "active")

      medicationList = (patientMeds || []).map((m) => m.medication_name)
    }

    // If no medications to check against, return empty
    if (medicationList.length === 0) {
      return NextResponse.json({
        interactions: [],
        message: "No existing medications to check against",
      })
    }

    // Check for interactions
    const interactions = await checkNewDrugInteraction(medication_name, medicationList)

    // Categorize interactions by severity
    const categorized = {
      contraindicated: interactions.filter((i) => i.severity === "contraindicated"),
      major: interactions.filter((i) => i.severity === "major"),
      moderate: interactions.filter((i) => i.severity === "moderate"),
      minor: interactions.filter((i) => i.severity === "minor"),
    }

    const hasCritical = categorized.contraindicated.length > 0 || categorized.major.length > 0

    return NextResponse.json({
      interactions,
      categorized,
      hasCritical,
      totalInteractions: interactions.length,
      checkedAgainst: medicationList,
    })
  } catch (error) {
    console.error("Error checking drug interactions:", error)
    return NextResponse.json(
      { error: "Failed to check drug interactions" },
      { status: 500 }
    )
  }
}
