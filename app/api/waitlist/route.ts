import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("appointment_waitlist")
      .select(`
        *,
        patients(id, first_name, last_name, phone, patient_number),
        providers(id, first_name, last_name)
      `)
      .eq("status", "active")
      .order("priority", { ascending: false })
      .order("earliest_date", { ascending: true })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching waitlist:", error)
    return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { data, error } = await supabase.from("appointment_waitlist").insert(body).select()

    if (error) throw error
    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error adding to waitlist:", error)
    return NextResponse.json({ error: "Failed to add to waitlist" }, { status: 500 })
  }
}
