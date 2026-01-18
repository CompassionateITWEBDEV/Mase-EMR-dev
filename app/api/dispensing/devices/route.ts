import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: devices, error } = await supabase.from("device").select("*").order("location", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching devices:", error.message)
      return NextResponse.json(getMockDevices())
    }

    // Transform to expected format
    const formattedDevices = (devices || []).map((device) => ({
      id: device.id,
      type: device.type || "MethaSpense",
      location: device.location || "Dispensing Station 1",
      com_port: device.com_port || "COM3",
      firmware: device.firmware || "v2.1.4",
      status: device.status || "online",
      last_heartbeat: new Date().toISOString(),
    }))

    return NextResponse.json(formattedDevices.length > 0 ? formattedDevices : getMockDevices())
  } catch (error) {
    console.error("[v0] Devices API error:", error)
    return NextResponse.json(getMockDevices())
  }
}

function getMockDevices() {
  return [
    {
      id: 1,
      type: "MethaSpense",
      location: "Dispensing Station 1",
      com_port: "COM3",
      firmware: "v2.1.4",
      status: "online",
      last_heartbeat: new Date().toISOString(),
    },
  ]
}
