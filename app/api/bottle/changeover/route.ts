import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const {
      old_bottle_id,
      new_bottle_id,
      witness1_signature,
      witness2_signature,
      final_volume_ml,
    } = await request.json()

    if (!old_bottle_id || !new_bottle_id || typeof final_volume_ml !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!witness1_signature || !witness2_signature) {
      return NextResponse.json({ error: "Two-person witness required for bottle changeover" }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    const [{ data: oldBottle, error: oldBottleError }, { data: newBottle, error: newBottleError }] = await Promise.all([
      supabase
        .from("bottle")
        .select("id, lot_id, status, current_volume_ml")
        .eq("id", old_bottle_id)
        .single(),
      supabase
        .from("bottle")
        .select("id, lot_id, status, current_volume_ml, start_volume_ml")
        .eq("id", new_bottle_id)
        .single(),
    ])

    if (oldBottleError || !oldBottle) {
      console.error("[changeover] unable to load old bottle", oldBottleError)
      return NextResponse.json({ error: "Current bottle not found" }, { status: 404 })
    }

    if (newBottleError || !newBottle) {
      console.error("[changeover] unable to load new bottle", newBottleError)
      return NextResponse.json({ error: "Replacement bottle not found" }, { status: 404 })
    }

    if (oldBottle.status !== "active") {
      return NextResponse.json({ error: "Only active bottles can be changed" }, { status: 400 })
    }

    if (newBottle.status !== "reserved") {
      return NextResponse.json({ error: "Replacement bottle must be reserved" }, { status: 400 })
    }

    const variance_ml = Math.abs(Number(oldBottle.current_volume_ml ?? 0) - Number(final_volume_ml))

    const now = new Date().toISOString()

    const { error: closeOldError } = await supabase
      .from("bottle")
      .update({
        current_volume_ml: final_volume_ml,
        status: "closed",
        updated_at: now,
      })
      .eq("id", old_bottle_id)

    if (closeOldError) {
      console.error("[changeover] unable to close old bottle", closeOldError)
      return NextResponse.json({ error: "Failed to close current bottle" }, { status: 500 })
    }

    const { error: activateNewError } = await supabase
      .from("bottle")
      .update({
        status: "active",
        opened_at: now,
        updated_at: now,
        current_volume_ml: newBottle.current_volume_ml ?? newBottle.start_volume_ml ?? 0,
      })
      .eq("id", new_bottle_id)

    if (activateNewError) {
      console.error("[changeover] unable to activate new bottle", activateNewError)
      return NextResponse.json({ error: "Failed to activate replacement bottle" }, { status: 500 })
    }

    const adjustmentDelta = Number(final_volume_ml) - Number(oldBottle.current_volume_ml ?? 0)
    if (adjustmentDelta !== 0) {
      await supabase.from("inventory_txn").insert({
        bottle_id: old_bottle_id,
        type: "adjustment",
        qty_ml: adjustmentDelta,
        reason: "Bottle changeover final volume",
        by_user: witness1_signature,
        at_time: now,
      })
    }

    await supabase.from("inventory_txn").insert({
      bottle_id: new_bottle_id,
      type: "transfer",
      qty_ml: newBottle.start_volume_ml ?? newBottle.current_volume_ml ?? 0,
      reason: "Bottle changeover activation",
      by_user: witness2_signature,
      at_time: now,
    })

    const { data: changeEvent, error: eventError } = await supabase
      .from("device_event")
      .insert({
        device_id: null,
        event_type: "bottle_change",
        payload: {
          old_bottle_id,
          new_bottle_id,
          final_volume_ml,
          variance_ml,
          witnesses: [witness1_signature, witness2_signature],
        },
        at_time: now,
      })
      .select("id")
      .single()

    if (eventError) {
      console.error("[changeover] unable to log device event", eventError)
    }

    return NextResponse.json({
      changeover_id: changeEvent?.id ?? null,
      old_bottle_final_ml: final_volume_ml,
      new_bottle_active: true,
      variance_ml,
      witnesses: [
        { signature: witness1_signature, role: "nurse" },
        { signature: witness2_signature, role: "supervisor" },
      ],
    })
  } catch (error) {
    console.error("[changeover] Bottle changeover error", error)
    return NextResponse.json({ error: "Changeover failed" }, { status: 500 })
  }
}
