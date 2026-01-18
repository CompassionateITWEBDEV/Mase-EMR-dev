import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patient_id")
    const encounterId = searchParams.get("encounter_id")

    if (!patientId) {
      return NextResponse.json({ error: "patient_id required" }, { status: 400 })
    }

    // Fetch patient data
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*, patient_medications(*), patient_diagnoses(*), vital_signs(*)")
      .eq("id", patientId)
      .single()

    if (patientError) throw patientError

    // Fetch active CDS rules
    const { data: rules, error: rulesError } = await supabase
      .from("clinical_decision_rules")
      .select("*")
      .eq("active", true)

    if (rulesError) throw rulesError

    // Fetch existing alerts for this patient
    const { data: existingAlerts, error: alertsError } = await supabase
      .from("cds_alerts")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "active")

    if (alertsError) throw alertsError

    // Evaluate rules and generate alerts
    const triggeredAlerts = []

    for (const rule of rules || []) {
      const shouldTrigger = evaluateRule(rule, patient)

      if (shouldTrigger) {
        // Check if alert already exists
        const existingAlert = existingAlerts?.find((a) => a.rule_id === rule.id)

        if (!existingAlert) {
          triggeredAlerts.push({
            patient_id: patientId,
            encounter_id: encounterId,
            rule_id: rule.id,
            alert_text: rule.recommendation_text,
            severity: rule.severity,
            status: "active",
          })
        }
      }
    }

    // Insert new alerts
    if (triggeredAlerts.length > 0) {
      const { error: insertError } = await supabase.from("cds_alerts").insert(triggeredAlerts)

      if (insertError) throw insertError
    }

    // Fetch all active alerts for this patient
    const { data: allAlerts, error: allAlertsError } = await supabase
      .from("cds_alerts")
      .select(`
        *,
        clinical_decision_rules (rule_name, rule_type, severity, evidence_source)
      `)
      .eq("patient_id", patientId)
      .eq("status", "active")
      .order("severity", { ascending: false })

    if (allAlertsError) throw allAlertsError

    return NextResponse.json({
      alerts: allAlerts,
      new_alerts_count: triggeredAlerts.length,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error("Error fetching CDS alerts:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("cds_alerts")
      .update({
        status: body.status,
        acknowledged_by: body.acknowledged_by,
        acknowledged_at: body.status === "acknowledged" ? new Date().toISOString() : null,
        override_reason: body.override_reason,
      })
      .eq("id", body.alert_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: unknown) {
    const err = error as Error
    console.error("Error updating CDS alert:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Helper function to evaluate CDS rules
function evaluateRule(rule: any, patient: any): boolean {
  const conditions = rule.trigger_conditions

  // Drug interaction checks
  if (rule.rule_type === "drug-interaction") {
    const medications = patient.patient_medications?.map((m: any) => m.medication_name?.toLowerCase()) || []

    if (conditions.medications) {
      const requiredMeds = conditions.medications
      return requiredMeds.every((med: string) =>
        medications.some((patientMed: string) => patientMed.includes(med.toLowerCase())),
      )
    }
  }

  // Age-based reminders
  if (conditions.age) {
    const age = calculateAge(patient.date_of_birth)
    const ageCondition = conditions.age

    if (ageCondition.includes(">=")) {
      const minAge = Number.parseInt(ageCondition.replace(">=", ""))
      if (age < minAge) return false
    }

    if (ageCondition.includes("-")) {
      const [minAge, maxAge] = ageCondition.split("-").map((a: string) => Number.parseInt(a))
      if (age < minAge || age > maxAge) return false
    }
  }

  // Diagnosis-based rules
  if (conditions.diagnosis) {
    const diagnoses = patient.patient_diagnoses?.map((d: any) => d.icd10_code) || []
    const requiredDiagnoses = Array.isArray(conditions.diagnosis) ? conditions.diagnosis : [conditions.diagnosis]

    return requiredDiagnoses.some((reqDx: string) =>
      diagnoses.some((dx: string) => dx.toLowerCase().includes(reqDx.toLowerCase())),
    )
  }

  return false
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}
