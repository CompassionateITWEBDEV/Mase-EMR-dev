import { createServerClient } from '@/lib/supabase/server-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const patientId = searchParams.get('patientId')
  const zipCode = searchParams.get('zipCode')

  if (!patientId || !zipCode) {
    return NextResponse.json({ error: 'patientId and zipCode required' }, { status: 400 })
  }

  const supabase = await createServerClient()

  // Get patient EHR data
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single()

  if (patientError) {
    console.error('[v0] Patient query error:', patientError)
    return NextResponse.json({ error: 'Failed to fetch patient data' }, { status: 500 })
  }

  // Get local surveillance data by county/ZIP
  const { data: surveillance, error: surveillanceError } = await supabase
    .from('michigan_overdose_surveillance')
    .select('*')
    .eq('zip_code', zipCode)
    .order('report_date', { ascending: false })
    .limit(1)

  // Get MiTracking environmental data
  const { data: environmental, error: envError } = await supabase
    .from('mitracking_environmental_health')
    .select('*')
    .eq('zip_code', zipCode)
    .single()

  // Get ODMAP real-time alerts
  const { data: odmap, error: odmapError } = await supabase
    .from('odmap_alerts')
    .select('*')
    .eq('zip_code', zipCode)
    .gte('alert_timestamp', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .order('alert_timestamp', { ascending: false })

  // Calculate AI-based risk score
  const riskScore = calculateRiskScore({
    patient,
    surveillance: surveillance?.[0],
    environmental,
    odmap,
  })

  return NextResponse.json({
    patientId,
    zipCode,
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    surveillance: surveillance?.[0] || null,
    environmental: environmental || null,
    odmap: odmap || [],
    recommendations: generateRecommendations(riskScore, surveillance?.[0], environmental),
  })
}

function calculateRiskScore(data: any): number {
  let score = 0

  // Patient factors (0-30 points)
  if (data.patient?.active_medications?.some((m: any) => m.includes('opioid'))) score += 10
  if (data.patient?.prior_overdoses > 0) score += 15
  if (data.patient?.mental_health_dx) score += 5

  // Surveillance factors (0-40 points)
  if (data.surveillance?.overdose_rate > 30) score += 20
  if (data.surveillance?.fentanyl_prevalence > 60) score += 15
  if (data.surveillance?.polysubstance_rate > 40) score += 5

  // Environmental factors (0-20 points)
  if (data.environmental?.lead_exposure_pct > 5) score += 10
  if (data.environmental?.air_quality_index > 100) score += 5
  if (data.environmental?.water_contaminants === 'High') score += 5

  // ODMAP real-time spike (0-10 points)
  if (data.odmap?.length > 10) score += 10

  return Math.min(score, 100)
}

function getRiskLevel(score: number): string {
  if (score >= 70) return 'CRITICAL'
  if (score >= 50) return 'HIGH'
  if (score >= 30) return 'MODERATE'
  return 'LOW'
}

function generateRecommendations(score: number, surveillance: any, environmental: any): string[] {
  const recommendations = []

  if (score >= 70) {
    recommendations.push('Immediate naloxone prescription and training')
    recommendations.push('Consider inpatient stabilization or intensive outpatient program')
    recommendations.push('Daily check-ins and crisis planning')
  }

  if (surveillance?.fentanyl_prevalence > 60) {
    recommendations.push('Educate on fentanyl/xylazine risks and test strip use')
  }

  if (environmental?.lead_exposure_pct > 5) {
    recommendations.push('Screen for cognitive/behavioral impacts of lead exposure')
    recommendations.push('Refer to environmental health services for remediation')
  }

  return recommendations
}
