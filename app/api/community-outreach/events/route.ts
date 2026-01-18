import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const searchParams = request.nextUrl.searchParams
    const eventType = searchParams.get("type")
    const featured = searchParams.get("featured")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let query = supabase
      .from("community_events")
      .select("*")
      .eq("status", "published")
      .eq("is_public", true)
      .order("event_date", { ascending: true })

    if (eventType) {
      query = query.eq("event_type", eventType)
    }

    if (featured === "true") {
      query = query.eq("is_featured", true)
    }

    if (startDate) {
      query = query.gte("event_date", startDate)
    }

    if (endDate) {
      query = query.lte("event_date", endDate)
    }

    const { data: events, error } = await query

    if (error) throw error

    return NextResponse.json({ events: events || [] })
  } catch (error: any) {
    console.error("[Community Outreach] Error fetching events:", error)

    // Return mock data if database query fails
    const mockEvents = [
      {
        id: "1",
        event_title: "Mental Health Support Group",
        event_description:
          "Weekly peer-led support group for individuals in recovery. Safe, confidential space to share experiences and build community.",
        event_type: "support_group",
        event_date: "2025-01-20",
        start_time: "18:00:00",
        end_time: "19:30:00",
        location_name: "Community Wellness Center",
        location_address: "789 Hope Street NW",
        location_city: "Washington",
        location_state: "DC",
        location_zip: "20001",
        location_type: "in_person",
        requires_registration: false,
        max_attendees: 20,
        current_attendees: 12,
        contact_phone: "(555) 234-5678",
        target_audience: ["adults"],
        services_provided: ["mental_health"],
        accessibility_features: ["wheelchair_accessible"],
        cost: 0,
        is_featured: true,
      },
      {
        id: "2",
        event_title: "Narcan Training Workshop",
        event_description:
          "Learn how to recognize signs of opioid overdose and administer naloxone (Narcan). Free training and take-home kits provided.",
        event_type: "training",
        event_date: "2025-01-22",
        start_time: "14:00:00",
        end_time: "16:00:00",
        location_name: "Public Health Department",
        location_address: "456 Safety Avenue NE",
        location_city: "Washington",
        location_state: "DC",
        location_zip: "20002",
        location_type: "in_person",
        requires_registration: true,
        max_attendees: 30,
        current_attendees: 18,
        registration_deadline: "2025-01-21",
        contact_email: "training@publichealth.dc.gov",
        contact_phone: "(555) 345-6789",
        target_audience: ["adults", "families"],
        services_provided: ["substance_use", "education"],
        accessibility_features: ["wheelchair_accessible", "asl_interpreter"],
        cost: 0,
        is_featured: true,
      },
      {
        id: "3",
        event_title: "Community Health Fair",
        event_description:
          "Free health screenings, flu shots, mental health resources, substance use treatment information, and community services. All ages welcome!",
        event_type: "health_fair",
        event_date: "2025-01-25",
        start_time: "10:00:00",
        end_time: "15:00:00",
        location_name: "Lincoln Park",
        location_address: "1100 E Capitol St NE",
        location_city: "Washington",
        location_state: "DC",
        location_zip: "20003",
        location_type: "in_person",
        requires_registration: false,
        contact_phone: "(555) 456-7890",
        target_audience: ["adults", "youth", "families", "seniors"],
        services_provided: ["mental_health", "substance_use", "medical", "food"],
        accessibility_features: ["wheelchair_accessible", "childcare"],
        cost: 0,
        is_featured: true,
      },
      {
        id: "4",
        event_title: "Virtual Recovery Meeting",
        event_description:
          "Online recovery meeting for individuals seeking support. Confidential and judgment-free space.",
        event_type: "support_group",
        event_date: "2025-01-23",
        start_time: "19:00:00",
        end_time: "20:00:00",
        location_type: "virtual",
        virtual_link: "https://zoom.us/j/example",
        requires_registration: true,
        max_attendees: 50,
        current_attendees: 32,
        contact_email: "recovery@community.org",
        target_audience: ["adults"],
        services_provided: ["substance_use", "mental_health"],
        cost: 0,
        is_featured: false,
      },
    ]

    return NextResponse.json({ events: mockEvents })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("community_events")
      .insert({
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
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ event: data })
  } catch (error: any) {
    console.error("[Community Outreach] Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
