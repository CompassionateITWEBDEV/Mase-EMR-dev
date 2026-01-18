import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")

    let query = supabase
      .from("patients")
      .select(`
        id,
        first_name,
        last_name,
        date_of_birth,
        phone,
        email,
        gender,
        address,
        client_number,
        program_type,
        updated_at,
        emergency_contact_name,
        emergency_contact_phone,
        insurance_provider,
        insurance_id,
        created_at
      `)
      .order("last_name", { ascending: true })

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (limit) {
      query = query.limit(Number.parseInt(limit))
    } else {
      query = query.limit(200)
    }

    const { data: patients, error } = await query

    if (error) {
      console.error("[v0] Error fetching patients:", error.message)
      return NextResponse.json({ patients: [], error: error.message }, { status: 500 })
    }

    console.log(`[v0] Fetched ${patients?.length || 0} patients`)
    return NextResponse.json({ patients: patients || [] })
  } catch (error) {
    console.error("[v0] Patients API error:", error)
    return NextResponse.json({ patients: [], error: "Failed to fetch patients" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from("patients")
      .insert({
        first_name: body.first_name || body.firstName,
        last_name: body.last_name || body.lastName,
        date_of_birth: body.date_of_birth || body.dateOfBirth,
        phone: body.phone,
        email: body.email,
        gender: body.gender,
        address: body.address,
        emergency_contact_name: body.emergency_contact_name,
        emergency_contact_phone: body.emergency_contact_phone,
        insurance_provider: body.insurance_provider,
        insurance_id: body.insurance_id,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating patient:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ patient: data })
  } catch (error) {
    console.error("[v0] Create patient error:", error)
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 })
  }
}
