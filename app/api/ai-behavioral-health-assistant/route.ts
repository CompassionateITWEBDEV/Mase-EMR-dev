import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { patientId, query } = await request.json()

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch comprehensive patient data
    const [{ data: patient }, { data: vitals }, { data: medications }, { data: uds }, { data: assessments }] =
      await Promise.all([
        supabase.from("patients").select("*").eq("id", patientId).single(),
        supabase
          .from("vital_signs")
          .select("*")
          .eq("patient_id", patientId)
          .order("measurement_date", { ascending: false })
          .limit(30),
        supabase.from("medications").select("*").eq("patient_id", patientId).eq("status", "active"),
        supabase
          .from("urine_drug_screens")
          .select("*")
          .eq("patient_id", patientId)
          .order("collection_date", { ascending: false })
          .limit(10),
        supabase
          .from("assessments")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false })
          .limit(5),
      ])

    // Analyze vital signs for critical values
    const latestVitals = vitals?.[0]
    const recommendations: any[] = []

    // Critical vital signs check
    if (latestVitals) {
      if (latestVitals.systolic_bp > 180 || latestVitals.diastolic_bp > 120) {
        recommendations.push({
          category: "Cardiovascular",
          priority: "critical",
          title: "Hypertensive Crisis Detected",
          recommendation:
            "Immediate medical evaluation required. Consider emergency department referral. Review all medications that may contribute to hypertension.",
          reasoning: `Blood pressure ${latestVitals.systolic_bp}/${latestVitals.diastolic_bp} mmHg exceeds safe thresholds.`,
          evidence: "ACC/AHA Guidelines: BP >180/120 requires urgent evaluation",
        })
      }

      if (latestVitals.heart_rate > 120) {
        recommendations.push({
          category: "Cardiovascular",
          priority: "warning",
          title: "Tachycardia Detected",
          recommendation:
            "Evaluate for substance withdrawal, anxiety, or medication effects. Consider EKG and cardiac monitoring.",
          reasoning: `Heart rate ${latestVitals.heart_rate} bpm is elevated above normal range.`,
          evidence: "May indicate opioid withdrawal, stimulant use, or anxiety disorder",
        })
      }

      if (latestVitals.oxygen_saturation < 90) {
        recommendations.push({
          category: "Respiratory",
          priority: "critical",
          title: "Hypoxemia Detected",
          recommendation:
            "Urgent oxygen therapy and pulmonary assessment needed. Rule out opioid overdose or respiratory depression.",
          reasoning: `O2 saturation ${latestVitals.oxygen_saturation}% indicates inadequate oxygenation.`,
          evidence: "SpO2 <90% requires immediate intervention per ACLS guidelines",
        })
      }

      // Weight trend analysis
      if (vitals && vitals.length >= 2) {
        const weightChange = vitals[0].weight - vitals[1].weight
        if (Math.abs(weightChange) > 10) {
          recommendations.push({
            category: "Nutrition",
            priority: "warning",
            title: "Significant Weight Change",
            recommendation: `${weightChange > 0 ? "Weight gain" : "Weight loss"} of ${Math.abs(weightChange).toFixed(1)} lbs detected. Assess nutritional status, medication side effects, and metabolic function.`,
            reasoning:
              "Rapid weight changes may indicate medication effects, substance use patterns, or medical complications.",
            evidence: "Weight changes >10 lbs/week warrant clinical evaluation",
          })
        }
      }
    }

    // Medication analysis
    if (medications && medications.length > 0) {
      const opioidMeds = medications.filter(
        (m: any) =>
          m.medication_name?.toLowerCase().includes("methadone") ||
          m.medication_name?.toLowerCase().includes("buprenorphine") ||
          m.medication_name?.toLowerCase().includes("suboxone"),
      )

      if (opioidMeds.length > 0 && uds && uds.length > 0) {
        const latestUDS = uds[0]
        const hasOpioids = latestUDS.positive_for?.some(
          (s: string) => s.toLowerCase().includes("opioid") || s.toLowerCase().includes("opiates"),
        )

        if (!hasOpioids && opioidMeds.length > 0) {
          recommendations.push({
            category: "Medication Adherence",
            priority: "warning",
            title: "MAT Medication Not Detected in UDS",
            recommendation:
              "Latest UDS does not show expected MAT medication. Assess adherence, diversion risk, or metabolism issues. Consider witnessed dosing.",
            reasoning: `Patient prescribed ${opioidMeds[0].medication_name} but not detected in recent UDS.`,
            evidence: "Absence of prescribed MAT in UDS indicates non-adherence or diversion",
          })
        }
      }

      // Check for multiple controlled substances
      if (medications.length >= 3) {
        recommendations.push({
          category: "Polypharmacy",
          priority: "info",
          title: "Multiple Active Medications",
          recommendation: `Patient on ${medications.length} medications. Review for drug interactions, especially CNS depressants. Consider medication reconciliation.`,
          reasoning: "Multiple medications increase risk of interactions and adverse events.",
          evidence: "SAMHSA Guidelines recommend regular medication reviews in SUD treatment",
        })
      }
    }

    // UDS analysis
    if (uds && uds.length >= 2) {
      const recentPositives = uds.slice(0, 3).filter((u: any) => u.positive_for && u.positive_for.length > 0)
      if (recentPositives.length >= 2) {
        recommendations.push({
          category: "Substance Use",
          priority: "warning",
          title: "Ongoing Substance Use Detected",
          recommendation:
            "Multiple recent positive UDS results. Consider intensifying treatment, increasing counseling frequency, and reassessing MAT dosage.",
          reasoning: `${recentPositives.length} of last 3 UDS tests positive for illicit substances.`,
          evidence: "Continued use during MAT indicates need for treatment modification",
        })
      }
    }

    // General behavioral health recommendations
    if (!recommendations.some((r) => r.priority === "critical")) {
      recommendations.push({
        category: "Treatment Planning",
        priority: "info",
        title: "Routine Monitoring Recommended",
        recommendation:
          "Continue current treatment plan. Schedule routine vital signs monitoring, UDS testing per protocol, and regular counseling sessions.",
        reasoning: "Patient showing stable clinical indicators.",
        evidence: "ASAM guidelines recommend ongoing monitoring in MAT programs",
      })
    }

    // Dosage optimization recommendation
    if (query?.toLowerCase().includes("dosage") || query?.toLowerCase().includes("dose")) {
      const opioidMed = medications?.find(
        (m: any) =>
          m.medication_name?.toLowerCase().includes("methadone") ||
          m.medication_name?.toLowerCase().includes("buprenorphine"),
      )

      if (opioidMed) {
        recommendations.push({
          category: "Dosage Optimization",
          priority: "info",
          title: "MAT Dosage Assessment",
          recommendation: `Current ${opioidMed.medication_name} dose: ${opioidMed.dosage}. Assess withdrawal symptoms, cravings, and UDS results. Consider dose adjustment if patient reports withdrawal or continued use.`,
          reasoning: "Optimal MAT dosing prevents withdrawal and reduces illicit opioid use.",
          evidence: "Methadone: 60-120mg typical maintenance. Buprenorphine: 12-24mg typical",
        })
      }
    }

    return NextResponse.json({
      success: true,
      patientName: `${patient?.first_name} ${patient?.last_name}`,
      recommendations: recommendations.sort((a, b) => {
        const priority = { critical: 0, warning: 1, info: 2 }
        return priority[a.priority as keyof typeof priority] - priority[b.priority as keyof typeof priority]
      }),
      summary: {
        totalVitals: vitals?.length || 0,
        activeMedications: medications?.length || 0,
        recentUDS: uds?.length || 0,
        criticalAlerts: recommendations.filter((r) => r.priority === "critical").length,
      },
    })
  } catch (error) {
    console.error("AI analysis error:", error)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
