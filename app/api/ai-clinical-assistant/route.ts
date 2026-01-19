import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { patientId } = await request.json()

    const supabase = createServiceClient()

    // Fetch comprehensive patient data
    const [
      { data: patient },
      { data: medications },
      { data: vitals },
      { data: labs },
      { data: encounters },
      { data: conditions },
    ] = await Promise.all([
      supabase.from("patients").select("*").eq("id", patientId).single(),
      supabase.from("medications").select("*").eq("patient_id", patientId).eq("status", "active"),
      supabase
        .from("vital_signs")
        .select("*")
        .eq("patient_id", patientId)
        .order("measurement_date", { ascending: false })
        .limit(10),
      supabase
        .from("lab_results")
        .select("*")
        .eq("patient_id", patientId)
        .order("result_date", { ascending: false })
        .limit(20),
      supabase
        .from("encounters")
        .select("*")
        .eq("patient_id", patientId)
        .order("encounter_date", { ascending: false })
        .limit(5),
      supabase
        .from("assessments")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    // AI Analysis Logic (This would typically call an AI service like OpenAI)
    const analysis = {
      clinicalSummary: generateClinicalSummary(patient, medications, vitals, labs),
      riskAlerts: identifyRiskAlerts(patient, medications, vitals, labs),
      recommendations: generateRecommendations(patient, medications, labs),
      drugInteractions: analyzeDrugInteractions(medications),
      labSuggestions: suggestLabOrders(patient, labs),
      differentialDiagnosis: generateDifferentialDx(patient, encounters, vitals),
      preventiveCareGaps: identifyPreventiveCareGaps(patient, encounters),
      patientEducation: recommendPatientEducation(patient, medications),
    }

    return NextResponse.json(analysis)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper functions for AI analysis
function generateClinicalSummary(patient: any, medications: any[], vitals: any[], labs: any[]) {
  // In production, this would use AI/ML models
  return {
    summary: "Comprehensive clinical summary based on chart review",
    keyFindings: ["Uncontrolled diabetes", "Declining renal function", "Hypertension trending up"],
  }
}

function identifyRiskAlerts(patient: any, medications: any[], vitals: any[], labs: any[]) {
  return [
    { level: "critical", message: "Declining renal function with current metformin dose" },
    { level: "warning", message: "Blood pressure trending up over last 3 visits" },
    { level: "info", message: "Due for annual diabetic retinal exam" },
  ]
}

function generateRecommendations(patient: any, medications: any[], labs: any[]) {
  return [
    { category: "Diabetes Management", recommendation: "Consider adding GLP-1 agonist", evidence: "SUSTAIN-6 trial" },
    { category: "Hypertension", recommendation: "Increase lisinopril dose", evidence: "ADA/ACC guidelines" },
    {
      category: "Medication Safety",
      recommendation: "Adjust metformin for renal function",
      evidence: "FDA guidelines",
    },
  ]
}

function analyzeDrugInteractions(medications: any[]) {
  return { majorInteractions: [], moderateInteractions: [], minorInteractions: [] }
}

function suggestLabOrders(patient: any, recentLabs: any[]) {
  return [
    { test: "Comprehensive Metabolic Panel", reason: "Monitor renal function", urgency: "This week" },
    { test: "HbA1c", reason: "Assess glycemic control", urgency: "Today" },
  ]
}

function generateDifferentialDx(patient: any, encounters: any[], vitals: any[]) {
  return [
    { diagnosis: "Diabetic Nephropathy", probability: "Primary", confirmed: true },
    { diagnosis: "Uncontrolled Diabetes with Complications", probability: "High", confirmed: false },
  ]
}

function identifyPreventiveCareGaps(patient: any, encounters: any[]) {
  return [
    { measure: "Diabetic Eye Exam", status: "overdue", daysOverdue: 45 },
    { measure: "Diabetic Foot Exam", status: "due", daysDue: 7 },
  ]
}

function recommendPatientEducation(patient: any, medications: any[]) {
  return [
    "Signs and symptoms of hypoglycemia",
    "Importance of medication adherence",
    "Dietary modifications for diabetes and CKD",
  ]
}
