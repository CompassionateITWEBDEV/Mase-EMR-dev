import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Reset transmission status to pending for retry
    const { data, error } = await supabase
      .from("eprescribing_transmissions")
      .update({
        status: "pending",
        retry_count: supabase.rpc("increment_retry_count", { row_id: id }),
        last_retry_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      // If RPC doesn't exist, do a simple update
      const { data: simpleData, error: simpleError } = await supabase
        .from("eprescribing_transmissions")
        .update({
          status: "pending",
          last_retry_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (simpleError) {
        console.error("Error retrying transmission:", simpleError)
        return NextResponse.json({ error: simpleError.message }, { status: 500 })
      }

      return NextResponse.json(simpleData)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error retrying transmission:", error)
    return NextResponse.json({ error: "Failed to retry transmission" }, { status: 500 })
  }
}
