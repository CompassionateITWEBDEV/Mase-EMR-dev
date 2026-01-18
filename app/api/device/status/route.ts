import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient()

    const { data: device, error: deviceError } = await supabase
      .from("device")
      .select("id, status, com_port, firmware, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (deviceError || !device) {
      return NextResponse.json(
        {
          status: "offline",
          error: "No dispensing device configured",
        },
        { status: 503 },
      )
    }

    const { data: activeBottle } = await supabase
      .from("bottle")
      .select("id, current_volume_ml")
      .eq("status", "active")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: totalDispensedData } = await supabase
      .from("dose_event")
      .select("sum(dispensed_ml)")
      .eq("device_id", device.id)
      .gte("time", todayStart.toISOString())
      .single()

    const { count: pumpCycles } = await supabase
      .from("dose_event")
      .select("id", { count: "exact", head: true })
      .eq("device_id", device.id)
      .gte("time", todayStart.toISOString())

    const totalDispensedToday = Number(totalDispensedData?.sum ?? 0)

    const { data: lastAlarm } = await supabase
      .from("device_event")
      .select("event_type, payload, at_time")
      .eq("device_id", device.id)
      .eq("event_type", "alarm")
      .order("at_time", { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      device_id: device.id,
      status: device.status === "online" ? "ready" : device.status,
      bottle_id: activeBottle?.id ?? null,
      est_remaining_ml: activeBottle?.current_volume_ml ?? null,
      last_alarm: lastAlarm ?? null,
      firmware_version: device.firmware,
      serial_port: device.com_port,
      last_communication: device.updated_at,
      pump_cycles: pumpCycles ?? 0,
      total_dispensed_today: totalDispensedToday,
    })
  } catch (error) {
    console.error("[device] status error", error)
    return NextResponse.json({ error: "Device status query failed", status: "offline" }, { status: 500 })
  }
}
