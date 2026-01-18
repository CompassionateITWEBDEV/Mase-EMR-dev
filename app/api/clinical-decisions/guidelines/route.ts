import { createServerClient } from '@/lib/supabase/server-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const condition = searchParams.get('condition')
  const category = searchParams.get('category')

  const supabase = createServerClient()

  let query = supabase
    .from('clinical_practice_guidelines')
    .select('*')
    .eq('status', 'active')

  if (condition) {
    query = query.eq('condition', condition)
  }

  if (category) {
    query = query.eq('category', category)
  }

  const { data: guidelines, error } = await query.order('updated_at', { ascending: false })

  if (error) {
    console.error('[v0] Guidelines query error:', error)
    return NextResponse.json({ error: 'Failed to fetch guidelines' }, { status: 500 })
  }

  // Get evidence base sources
  const { data: evidenceSources, error: evidenceError } = await supabase
    .from('evidence_base_sources')
    .select('*')
    .order('quality_score', { ascending: false })

  return NextResponse.json({
    guidelines: guidelines || [],
    evidenceSources: evidenceSources || [],
  })
}
