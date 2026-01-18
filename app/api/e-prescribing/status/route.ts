import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get e-prescribing connection status and statistics
    const { data: transmissions, error } = await supabase
      .from("eprescribing_transmissions")
      .select("status, transmission_type")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (error && error.code !== "42P01") {
      throw error
    }

    const stats = {
      connected: true,
      lastSync: new Date().toISOString(),
      pending: (transmissions || []).filter((t) => t.status === "pending").length,
      completed: (transmissions || []).filter((t) => t.status === "completed").length,
      failed: (transmissions || []).filter((t) => t.status === "failed").length,
      totalToday: (transmissions || []).length,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching e-prescribing status:", error)
    return NextResponse.json({
      connected: false,
      lastSync: null,
      pending: 0,
      completed: 0,
      failed: 0,
      totalToday: 0,
      error: "Failed to fetch status",
    })
  }
}
