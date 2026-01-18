import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"

interface InventoryLine {
  medication_id: number
  lot_id?: number | null
  bottle_id?: number | null
  qty_ml?: number | null
  qty_units?: number | null
  opened_container?: boolean
  counting_method: "exact" | "estimate"
  schedule_class?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      snapshot_type,
      opened_or_closed_of_business,
      taken_by,
      verified_by,
      note,
      registered_location,
      inventory_lines,
    } = body

    if (!snapshot_type || !taken_by || !Array.isArray(inventory_lines) || inventory_lines.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const invalidScheduleII = inventory_lines.filter(
      (line: InventoryLine) => line.schedule_class === "II" && line.counting_method !== "exact",
    )

    if (invalidScheduleII.length > 0) {
      return NextResponse.json(
        { error: "Schedule II substances require exact counting method" },
        { status: 400 },
      )
    }

    const supabase = await createServiceRoleClient()

    const { data: snapshot, error: snapshotError } = await supabase
      .from("inventory_snapshots")
      .insert({
        snapshot_type,
        opened_or_closed_of_business,
        taken_by,
        verified_by,
        note,
        locked: true,
        registered_location: registered_location || "Main Treatment Center",
      })
      .select("id, taken_at")
      .single()

    if (snapshotError) {
      console.error("[inventory] snapshot insert error", snapshotError)
      return NextResponse.json({ error: "Failed to persist inventory snapshot" }, { status: 500 })
    }

    if (inventory_lines.length > 0) {
      const { error: linesError } = await supabase.from("inventory_snapshot_lines").insert(
        inventory_lines.map((line: InventoryLine) => ({
          snapshot_id: snapshot.id,
          medication_id: line.medication_id,
          lot_id: line.lot_id ?? null,
          bottle_id: line.bottle_id ?? null,
          qty_ml: line.qty_ml ?? null,
          qty_units: line.qty_units ?? null,
          opened_container: line.opened_container ?? false,
          counting_method: line.counting_method,
        })),
      )

      if (linesError) {
        console.error("[inventory] snapshot line insert error", linesError)
        return NextResponse.json({ error: "Failed to persist inventory lines" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      snapshot_id: snapshot.id,
      taken_at: snapshot.taken_at,
    })
  } catch (error) {
    console.error("[inventory] Error creating inventory snapshot", error)
    return NextResponse.json({ error: "Failed to create inventory snapshot" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    const { data: snapshots, error } = await supabase
      .from("inventory_snapshots")
      .select("*, lines:inventory_snapshot_lines(*)")
      .order("taken_at", { ascending: false })
      .limit(25)

    if (error) {
      console.error("[inventory] snapshot fetch error", error)
      return NextResponse.json({ error: "Failed to fetch inventory snapshots" }, { status: 500 })
    }

    return NextResponse.json({ snapshots: snapshots ?? [] })
  } catch (error) {
    console.error("[inventory] snapshot fetch exception", error)
    return NextResponse.json({ error: "Failed to fetch inventory snapshots" }, { status: 500 })
  }
}
