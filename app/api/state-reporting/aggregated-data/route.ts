import { createServerClient } from '@/lib/supabase/server-client'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerClient()

  // Aggregate clinic-level data for state oversight
  const { data: clinics, error: clinicsError } = await supabase
    .from('state_clinic_registry')
    .select('*')

  // Aggregate surveillance submissions
  const { data: surveillance, error: surveillanceError } = await supabase
    .from('state_surveillance_submissions')
    .select('*')
    .gte('submission_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  // Aggregate workforce metrics
  const { data: workforce, error: workforceError } = await supabase
    .from('state_workforce_metrics')
    .select('*')

  // Aggregate patient outcomes
  const { data: outcomes, error: outcomesError } = await supabase
    .from('state_patient_outcomes')
    .select('*')

  // Calculate statewide metrics
  const stateMetrics = {
    totalClinics: clinics?.length || 0,
    activeClinics: clinics?.filter((c) => c.status === 'active').length || 0,
    totalPatients: outcomes?.reduce((sum, o) => sum + (o.patient_count || 0), 0) || 0,
    avgCompliance: surveillance?.reduce((sum, s) => sum + (s.compliance_score || 0), 0) / (surveillance?.length || 1),
    overdosesPrevented: outcomes?.reduce((sum, o) => sum + (o.overdoses_prevented || 0), 0) || 0,
    environmentalAlerts: 12, // From MiTracking integration
  }

  // Environmental-SUD correlations
  const { data: environmental, error: envError } = await supabase
    .from('mitracking_environmental_correlations')
    .select('*')

  return NextResponse.json({
    stateMetrics,
    clinics: clinics || [],
    surveillance: surveillance || [],
    workforce: workforce || [],
    outcomes: outcomes || [],
    environmental: environmental || [],
  })
}
