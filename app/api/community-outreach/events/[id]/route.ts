import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("community_events")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event: data })
  } catch (error) {
    console.error("[Community Outreach] Error fetching event:", error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("community_events")
      .update({
        event_title: body.event_title,
        event_description: body.event_description,
        event_type: body.event_type,
        event_date: body.event_date,
        start_time: body.start_time,
        end_time: body.end_time,
        location_name: body.location_name,
        location_address: body.location_address,
        location_city: body.location_city,
        location_state: body.location_state,
        location_zip: body.location_zip,
        location_type: body.location_type,
        virtual_link: body.virtual_link,
        requires_registration: body.requires_registration || false,
        max_attendees: body.max_attendees,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        target_audience: body.target_audience || [],
        services_provided: body.services_provided || [],
        accessibility_features: body.accessibility_features || [],
        cost: body.cost || 0,
        is_public: body.is_public !== false,
        is_featured: body.is_featured || false,
        status: body.status || "published",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event: data })
  } catch (error) {
    console.error("[Community Outreach] Error updating event:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    const { error } = await supabase
      .from("community_events")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Community Outreach] Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
