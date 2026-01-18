import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerClient()
  const body = await request.json()
  const { reason, discontinued_by } = body

  const { data, error } = await supabase
    .from("patient_medications")
    .update({
      status: "discontinued",
      discontinuation_reason: reason,
      discontinued_by,
      discontinued_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error discontinuing medication:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ medication: data })
}
