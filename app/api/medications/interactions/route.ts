import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get recent medication interactions
    const { data: interactions, error } = await supabase
      .from("drug_interactions")
      .select(`
        *,
        medication1:medications!drug_interactions_medication1_id_fkey(name),
        medication2:medications!drug_interactions_medication2_id_fkey(name)
      `)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === "42P01") {
        return NextResponse.json([])
      }
      throw error
    }

    return NextResponse.json(interactions || [])
  } catch (error) {
    console.error("Error fetching medication interactions:", error)
    return NextResponse.json([])
  }
}
