import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("quality_measures")
      .insert({
        measure_id: body.measure_id,
        measure_name: body.measure_name,
        measure_type: body.measure_type,
        specialty: body.specialty,
        description: body.description,
        numerator_criteria: body.numerator_criteria,
        denominator_criteria: body.denominator_criteria,
        is_active: true,
        high_priority: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: unknown) {
    const err = error as Error
    console.error("Error adding quality measure:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
