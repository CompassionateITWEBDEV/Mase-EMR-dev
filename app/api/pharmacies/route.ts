import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { searchParams } = new URL(request.url)

  const isActive = searchParams.get("is_active")
  const acceptsEPrescribing = searchParams.get("accepts_e_prescribing")

  let query = supabase.from("pharmacies").select("*").order("name", { ascending: true })

  if (isActive !== null) {
    query = query.eq("is_active", isActive === "true")
  }

  if (acceptsEPrescribing !== null) {
    query = query.eq("accepts_e_prescribing", acceptsEPrescribing === "true")
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching pharmacies:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pharmacies: data })
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const body = await request.json()

  const { data, error } = await supabase.from("pharmacies").insert([body]).select().single()

  if (error) {
    console.error("[v0] Error creating pharmacy:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pharmacy: data })
}
