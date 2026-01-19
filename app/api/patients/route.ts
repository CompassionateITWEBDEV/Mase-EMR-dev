import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")
    const queryLimit = limit ? Number.parseInt(limit) : 200

    // If no search term, return all patients
    if (!search || search.trim() === "") {
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
          emergency_contact_name,
          emergency_contact_phone,
          insurance_provider,
          insurance_id,
          created_at
        `)
        .order("last_name", { ascending: true })
        .limit(queryLimit)

      if (status && status !== "all") {
        query = query.eq("status", status)
      }

      const { data: patients, error } = await query

      if (error) {
        console.error("[v0] Error fetching patients:", error.message)
        return NextResponse.json({ patients: [], error: error.message }, { status: 500 })
      }

      console.log(`[v0] Fetched ${patients?.length || 0} patients (no search)`)
      return NextResponse.json({ patients: patients || [] })
    }

    // Handle search - support full name search (e.g., "John Doe")
    const searchTerm = search.trim()
    const searchParts = searchTerm.split(/\s+/).filter(p => p.length > 0)

    let allPatients: any[] = []

    if (searchParts.length > 1) {
      // Multiple words: likely "FirstName LastName" format
      // Strategy 1: Search for first_name ILIKE first part AND last_name ILIKE second part
      const firstName = searchParts[0]
      const lastName = searchParts.slice(1).join(' ')

      // Query for exact full name match (first_name matches first word, last_name matches rest)
      const { data: fullNameMatches, error: fullNameError } = await supabase
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
          emergency_contact_name,
          emergency_contact_phone,
          insurance_provider,
          insurance_id,
          created_at
        `)
        .ilike("first_name", `%${firstName}%`)
        .ilike("last_name", `%${lastName}%`)
        .order("last_name", { ascending: true })
        .limit(queryLimit)

      if (!fullNameError && fullNameMatches) {
        allPatients = [...fullNameMatches]
      }

      // Also search each individual word in all fields to catch partial matches
      for (const word of searchParts) {
        const { data: wordMatches, error: wordError } = await supabase
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
            emergency_contact_name,
            emergency_contact_phone,
            insurance_provider,
            insurance_id,
            created_at
          `)
          .or(`first_name.ilike.%${word}%,last_name.ilike.%${word}%,phone.ilike.%${word}%`)
          .order("last_name", { ascending: true })
          .limit(queryLimit)

        if (!wordError && wordMatches) {
          // Add non-duplicate patients
          for (const patient of wordMatches) {
            if (!allPatients.find(p => p.id === patient.id)) {
              allPatients.push(patient)
            }
          }
        }
      }
    } else {
      // Single word: search all fields
      const { data: patients, error } = await supabase
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
          emergency_contact_name,
          emergency_contact_phone,
          insurance_provider,
          insurance_id,
          created_at
        `)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order("last_name", { ascending: true })
        .limit(queryLimit)

      if (error) {
        console.error("[v0] Error fetching patients:", error.message)
        return NextResponse.json({ patients: [], error: error.message }, { status: 500 })
      }

      allPatients = patients || []
    }

    // Sort by last_name and limit results
    allPatients.sort((a, b) => (a.last_name || "").localeCompare(b.last_name || ""))
    allPatients = allPatients.slice(0, queryLimit)

    console.log(`[v0] Fetched ${allPatients.length} patients for search: "${searchTerm}"`)
    return NextResponse.json({ patients: allPatients })
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
