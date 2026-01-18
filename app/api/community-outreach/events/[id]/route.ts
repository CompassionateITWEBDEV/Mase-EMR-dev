import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    const result = await sql`
      SELECT * FROM community_events
      WHERE id = ${params.id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event: result[0] })
  } catch (error) {
    console.error("[v0] Error fetching event:", error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const sql = neon(process.env.NEON_DATABASE_URL!)

    const result = await sql`
      UPDATE community_events
      SET
        event_title = ${body.event_title},
        event_description = ${body.event_description},
        event_type = ${body.event_type},
        event_date = ${body.event_date},
        start_time = ${body.start_time},
        end_time = ${body.end_time},
        location_name = ${body.location_name},
        location_address = ${body.location_address},
        location_city = ${body.location_city},
        location_state = ${body.location_state},
        location_zip = ${body.location_zip},
        location_type = ${body.location_type},
        virtual_link = ${body.virtual_link},
        requires_registration = ${body.requires_registration || false},
        max_attendees = ${body.max_attendees},
        contact_email = ${body.contact_email},
        contact_phone = ${body.contact_phone},
        target_audience = ${JSON.stringify(body.target_audience || [])},
        services_provided = ${JSON.stringify(body.services_provided || [])},
        accessibility_features = ${JSON.stringify(body.accessibility_features || [])},
        cost = ${body.cost || 0},
        is_public = ${body.is_public !== false},
        is_featured = ${body.is_featured || false},
        status = ${body.status || "published"},
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event: result[0] })
  } catch (error) {
    console.error("[v0] Error updating event:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    await sql`
      DELETE FROM community_events
      WHERE id = ${params.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
