import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: precautions, error } = await supabase
      .from("patient_precautions")
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name,
          mrn
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) throw error

    const formattedPrecautions =
      precautions?.map((p: any) => ({
        id: p.id,
        patient_id: p.patient_id,
        patient_name: p.patients ? `${p.patients.first_name} ${p.patients.last_name}` : "Unknown",
        mrn: p.patients?.mrn || "N/A",
        precaution_type: p.precaution_type,
        custom_text: p.custom_text,
        icon: p.icon,
        color: p.color,
        created_by: p.created_by,
        created_at: p.created_at,
        updated_at: p.updated_at,
        is_active: p.is_active,
        show_on_chart: p.show_on_chart,
      })) || []

    return NextResponse.json({ precautions: formattedPrecautions })
  } catch (error: any) {
    console.error("[v0] Error fetching precautions:", error)
    return NextResponse.json({ precautions: [], error: error.message })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("patient_precautions")
      .insert({
        patient_id: body.patient_id,
        precaution_type: body.precaution_type,
        custom_text: body.custom_text,
        icon: body.icon,
        color: body.color,
        created_by: body.created_by || "System",
        is_active: true,
        show_on_chart: body.show_on_chart ?? true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ precaution: data })
  } catch (error: any) {
    console.error("[v0] Error creating precaution:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
