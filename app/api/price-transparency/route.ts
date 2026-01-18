import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const location = searchParams.get("location")

    let query = supabase.from("price_transparency").select("*").order("service_code")

    if (search) {
      query = query.or(`service_code.ilike.%${search}%,service_description.ilike.%${search}%`)
    }

    if (location) {
      query = query.eq("facility_location", location)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ prices: data })
  } catch (error: unknown) {
    const err = error as Error
    console.error("Error fetching price transparency:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { data, error } = await supabase.from("price_transparency").insert(body).select().single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: unknown) {
    const err = error as Error
    console.error("Error creating price:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
