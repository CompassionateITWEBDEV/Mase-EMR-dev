import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { SdohRiskLevel } from "@/lib/health-equity-types"

// GET - Get SDOH integration data and analysis
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    const includeEncounters = searchParams.get("include_encounters") === "true"
    const patientId = searchParams.get("patient_id")
    
    // Get patient SDOH scores
    let scoresQuery = supabase
      .from("patient_sdoh_scores")
      .select("*")
    
    if (patientId) {
      scoresQuery = scoresQuery.eq("patient_id", patientId)
    }
    
    const { data: sdohScores, error: scoresError } = await scoresQuery
    
    if (scoresError) {
      return NextResponse.json(
        { success: false, error: scoresError.message },
        { status: 500 }
      )
    }
    
    // Calculate summary statistics
    const scores = sdohScores || []
    const summary = {
      total_patients: scores.length,
      risk_distribution: {
        low: scores.filter(s => s.risk_level === "low").length,
        moderate: scores.filter(s => s.risk_level === "moderate").length,
        high: scores.filter(s => s.risk_level === "high").length,
        very_high: scores.filter(s => s.risk_level === "very_high").length,
      },
      domain_prevalence: {
        housing_instability: scores.filter(s => s.has_housing_instability).length,
        food_insecurity: scores.filter(s => s.has_food_insecurity).length,
        transportation_barrier: scores.filter(s => s.has_transportation_barrier).length,
        employment_barrier: scores.filter(s => s.has_employment_barrier).length,
        social_isolation: scores.filter(s => s.has_social_isolation).length,
        healthcare_access_barrier: scores.filter(s => s.has_healthcare_access_barrier).length,
      },
      average_composite_score: scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + (s.composite_sdoh_score || 0), 0) / scores.length * 10) / 10
        : 0,
      domain_averages: {
        housing: scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + (s.housing_risk_score || 0), 0) / scores.length * 10) / 10
          : 0,
        food_security: scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + (s.food_security_risk_score || 0), 0) / scores.length * 10) / 10
          : 0,
        transportation: scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + (s.transportation_risk_score || 0), 0) / scores.length * 10) / 10
          : 0,
        employment: scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + (s.employment_risk_score || 0), 0) / scores.length * 10) / 10
          : 0,
        social_support: scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + (s.social_support_risk_score || 0), 0) / scores.length * 10) / 10
          : 0,
        healthcare_access: scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + (s.healthcare_access_risk_score || 0), 0) / scores.length * 10) / 10
          : 0,
      },
    }
    
    const result: any = {
      success: true,
      summary,
      scores: patientId ? scores : undefined,
    }
    
    // Optionally include CHW encounters
    if (includeEncounters) {
      const { data: encounters, error: encountersError } = await supabase
        .from("chw_encounters")
        .select(`
          *,
          chw_encounter_demographics(*),
          chw_encounter_housing(*),
          chw_encounter_food_security(*),
          chw_encounter_transportation(*),
          chw_encounter_utilities(*)
        `)
        .order("encounter_date", { ascending: false })
        .limit(100)
      
      if (!encountersError) {
        result.recent_encounters = encounters
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error("Error in GET /api/research/health-equity/sdoh:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// POST - Calculate and update SDOH scores from CHW encounters
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    
    const { patient_id, recalculate_all = false } = body
    
    // Get patients to process
    let patientIds: string[] = []
    
    if (patient_id) {
      patientIds = [patient_id]
    } else if (recalculate_all) {
      // Get all patients with CHW encounters
      const { data: encounters } = await supabase
        .from("chw_encounters")
        .select("patient_id")
        .not("patient_id", "is", null)
      
      if (encounters) {
        patientIds = [...new Set(encounters.map(e => e.patient_id))]
      }
    } else {
      // Get patients with encounters but no scores, or outdated scores
      const { data: encounters } = await supabase
        .from("chw_encounters")
        .select("patient_id, encounter_date")
        .not("patient_id", "is", null)
        .order("encounter_date", { ascending: false })
      
      if (encounters) {
        const uniquePatients = [...new Set(encounters.map(e => e.patient_id))]
        
        const { data: existingScores } = await supabase
          .from("patient_sdoh_scores")
          .select("patient_id, updated_at")
        
        const existingMap = new Map(existingScores?.map(s => [s.patient_id, s.updated_at]) || [])
        
        // Filter to patients without scores or with outdated scores
        patientIds = uniquePatients.filter(pid => {
          const existingDate = existingMap.get(pid)
          if (!existingDate) return true
          
          // Check if there are newer encounters
          const latestEncounter = encounters.find(e => e.patient_id === pid)
          if (latestEncounter && new Date(latestEncounter.encounter_date) > new Date(existingDate)) {
            return true
          }
          return false
        })
      }
    }
    
    if (patientIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No patients to process",
        processed: 0,
      })
    }
    
    let processed = 0
    let errors: string[] = []
    
    for (const pid of patientIds) {
      try {
        const score = await calculatePatientSdohScore(supabase, pid)
        
        const { error: upsertError } = await supabase
          .from("patient_sdoh_scores")
          .upsert(score, { onConflict: "patient_id" })
        
        if (upsertError) {
          errors.push(`Patient ${pid}: ${upsertError.message}`)
        } else {
          processed++
        }
      } catch (err) {
        errors.push(`Patient ${pid}: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${processed} of ${patientIds.length} patients`,
      processed,
      total: patientIds.length,
      errors: errors.length > 0 ? errors : undefined,
    })
    
  } catch (error) {
    console.error("Error in POST /api/research/health-equity/sdoh:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Calculate SDOH score for a single patient from their CHW encounters
async function calculatePatientSdohScore(supabase: any, patientId: string) {
  // Get all CHW encounters for this patient
  const { data: encounters, error } = await supabase
    .from("chw_encounters")
    .select(`
      id,
      encounter_date,
      chw_encounter_housing(*),
      chw_encounter_food_security(*),
      chw_encounter_transportation(*),
      chw_encounter_utilities(*),
      chw_encounter_employment(*),
      chw_encounter_family_support(*),
      chw_encounter_mental_health(*),
      chw_encounter_healthcare_access(*)
    `)
    .eq("patient_id", patientId)
    .order("encounter_date", { ascending: false })
  
  if (error || !encounters || encounters.length === 0) {
    return createDefaultScore(patientId)
  }
  
  // Use most recent encounter data
  const latest = encounters[0]
  
  // Calculate domain scores (0-100, higher = more risk)
  const housing = calculateHousingRisk(latest.chw_encounter_housing?.[0])
  const food = calculateFoodSecurityRisk(latest.chw_encounter_food_security?.[0])
  const transportation = calculateTransportationRisk(latest.chw_encounter_transportation?.[0])
  const employment = calculateEmploymentRisk(latest.chw_encounter_employment?.[0])
  const socialSupport = calculateSocialSupportRisk(latest.chw_encounter_family_support?.[0])
  const healthcareAccess = calculateHealthcareAccessRisk(latest.chw_encounter_healthcare_access?.[0])
  const utilities = calculateUtilityRisk(latest.chw_encounter_utilities?.[0])
  const mentalHealth = calculateMentalHealthRisk(latest.chw_encounter_mental_health?.[0])
  
  // Calculate composite score (weighted average)
  const weights = {
    housing: 0.20,
    food: 0.15,
    transportation: 0.15,
    employment: 0.10,
    socialSupport: 0.15,
    healthcareAccess: 0.15,
    utilities: 0.05,
    mentalHealth: 0.05,
  }
  
  const compositeScore = 
    housing * weights.housing +
    food * weights.food +
    transportation * weights.transportation +
    employment * weights.employment +
    socialSupport * weights.socialSupport +
    healthcareAccess * weights.healthcareAccess +
    utilities * weights.utilities +
    mentalHealth * weights.mentalHealth
  
  // Determine risk level
  let riskLevel: SdohRiskLevel = "low"
  if (compositeScore >= 70) riskLevel = "very_high"
  else if (compositeScore >= 50) riskLevel = "high"
  else if (compositeScore >= 30) riskLevel = "moderate"
  
  return {
    patient_id: patientId,
    housing_risk_score: Math.round(housing * 10) / 10,
    food_security_risk_score: Math.round(food * 10) / 10,
    transportation_risk_score: Math.round(transportation * 10) / 10,
    employment_risk_score: Math.round(employment * 10) / 10,
    social_support_risk_score: Math.round(socialSupport * 10) / 10,
    healthcare_access_risk_score: Math.round(healthcareAccess * 10) / 10,
    utility_risk_score: Math.round(utilities * 10) / 10,
    mental_health_risk_score: Math.round(mentalHealth * 10) / 10,
    composite_sdoh_score: Math.round(compositeScore * 10) / 10,
    risk_level: riskLevel,
    has_housing_instability: housing >= 50,
    has_food_insecurity: food >= 50,
    has_transportation_barrier: transportation >= 50,
    has_employment_barrier: employment >= 50,
    has_social_isolation: socialSupport >= 50,
    has_healthcare_access_barrier: healthcareAccess >= 50,
    last_assessment_date: latest.encounter_date,
    last_chw_encounter_id: latest.id,
    assessment_count: encounters.length,
    updated_at: new Date().toISOString(),
  }
}

function createDefaultScore(patientId: string) {
  return {
    patient_id: patientId,
    housing_risk_score: 0,
    food_security_risk_score: 0,
    transportation_risk_score: 0,
    employment_risk_score: 0,
    social_support_risk_score: 0,
    healthcare_access_risk_score: 0,
    utility_risk_score: 0,
    mental_health_risk_score: 0,
    composite_sdoh_score: 0,
    risk_level: "low" as SdohRiskLevel,
    has_housing_instability: false,
    has_food_insecurity: false,
    has_transportation_barrier: false,
    has_employment_barrier: false,
    has_social_isolation: false,
    has_healthcare_access_barrier: false,
    assessment_count: 0,
    updated_at: new Date().toISOString(),
  }
}

// Domain-specific risk calculations
function calculateHousingRisk(housing: any): number {
  if (!housing) return 0
  
  let risk = 0
  
  // Housing stability
  if (housing.housing_status === "homeless") risk += 40
  else if (housing.housing_status === "unstable") risk += 25
  else if (housing.housing_status === "temporary") risk += 15
  
  // Housing quality concerns
  if (housing.quality_concern_safety) risk += 15
  if (housing.quality_concern_utilities) risk += 10
  if (housing.quality_concern_pests) risk += 5
  if (housing.quality_concern_mold) risk += 10
  
  // Eviction risk
  if (housing.eviction_risk) risk += 20
  
  return Math.min(100, risk)
}

function calculateFoodSecurityRisk(food: any): number {
  if (!food) return 0
  
  let risk = 0
  
  // Food access
  if (food.food_insecure) risk += 40
  if (food.skipped_meals_last_week) risk += food.skipped_meals_last_week * 5
  if (food.worried_about_food) risk += 20
  if (food.ran_out_of_food) risk += 30
  
  // SNAP/assistance
  if (food.needs_snap && !food.has_snap) risk += 10
  
  return Math.min(100, risk)
}

function calculateTransportationRisk(transport: any): number {
  if (!transport) return 0
  
  let risk = 0
  
  // Transportation barriers
  if (!transport.has_reliable_transportation) risk += 40
  if (transport.missed_appointments_due_to_transport) risk += 30
  if (transport.transportation_cost_barrier) risk += 20
  if (transport.needs_assistance_getting_to_appointments) risk += 10
  
  return Math.min(100, risk)
}

function calculateEmploymentRisk(employment: any): number {
  if (!employment) return 0
  
  let risk = 0
  
  // Employment status
  if (employment.employment_status === "unemployed") risk += 40
  else if (employment.employment_status === "underemployed") risk += 20
  
  // Income concerns
  if (employment.income_insufficient) risk += 30
  if (employment.needs_job_training) risk += 15
  if (employment.barriers_to_employment) risk += 15
  
  return Math.min(100, risk)
}

function calculateSocialSupportRisk(support: any): number {
  if (!support) return 0
  
  let risk = 0
  
  // Social isolation
  if (support.lives_alone) risk += 15
  if (!support.has_emergency_contact) risk += 20
  if (support.feels_isolated) risk += 30
  if (!support.has_supportive_family) risk += 20
  if (support.caregiver_burden) risk += 15
  
  return Math.min(100, risk)
}

function calculateHealthcareAccessRisk(healthcare: any): number {
  if (!healthcare) return 0
  
  let risk = 0
  
  // Insurance and access
  if (!healthcare.has_health_insurance) risk += 35
  if (!healthcare.has_primary_care_provider) risk += 25
  if (healthcare.avoided_care_due_to_cost) risk += 20
  if (healthcare.missed_medications_due_to_cost) risk += 20
  
  return Math.min(100, risk)
}

function calculateUtilityRisk(utilities: any): number {
  if (!utilities) return 0
  
  let risk = 0
  
  // Utility concerns
  if (utilities.utility_shutoff_risk) risk += 40
  if (utilities.past_shutoff) risk += 25
  if (utilities.difficulty_paying_utilities) risk += 20
  if (utilities.no_phone_service) risk += 15
  
  return Math.min(100, risk)
}

function calculateMentalHealthRisk(mentalHealth: any): number {
  if (!mentalHealth) return 0
  
  let risk = 0
  
  // Mental health indicators from SDOH perspective
  if (mentalHealth.stress_level === "high" || mentalHealth.stress_level === "very_high") risk += 30
  if (mentalHealth.trauma_history) risk += 25
  if (mentalHealth.domestic_violence_concern) risk += 35
  if (mentalHealth.grief_loss_recent) risk += 10
  
  return Math.min(100, risk)
}

