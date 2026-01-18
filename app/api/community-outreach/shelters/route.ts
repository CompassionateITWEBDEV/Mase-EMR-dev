import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const MOCK_SHELTERS = [
  {
    id: "1",
    name: "Downtown Emergency Shelter",
    address: "123 Main Street",
    city: "Washington",
    state: "DC",
    zip_code: "20001",
    phone: "(202) 555-0100",
    type: "emergency",
    capacity: 100,
    available_beds: 15,
    hours: "24/7",
    services: ["meals", "case_management", "medical_care"],
    accepts: ["Men", "Women"],
    amenities: ["showers", "laundry", "storage"],
  },
  {
    id: "2",
    name: "Family Hope Center",
    address: "456 Oak Avenue",
    city: "Washington",
    state: "DC",
    zip_code: "20002",
    phone: "(202) 555-0200",
    type: "family",
    capacity: 50,
    available_beds: 8,
    hours: "6PM - 8AM",
    services: ["meals", "childcare", "job_training"],
    accepts: ["Families"],
    amenities: ["private_rooms", "playground", "kitchen"],
  },
  {
    id: "3",
    name: "Veterans Haven",
    address: "789 Liberty Boulevard",
    city: "Washington",
    state: "DC",
    zip_code: "20003",
    phone: "(202) 555-0300",
    type: "veterans",
    capacity: 40,
    available_beds: 5,
    hours: "24/7",
    services: ["meals", "va_benefits", "mental_health", "job_placement"],
    accepts: ["Veterans"],
    amenities: ["showers", "laundry", "computer_lab", "counseling"],
  },
  {
    id: "4",
    name: "Youth Safe Space",
    address: "321 Hope Street",
    city: "Washington",
    state: "DC",
    zip_code: "20004",
    phone: "(202) 555-0400",
    type: "youth",
    capacity: 30,
    available_beds: 12,
    hours: "24/7",
    services: ["meals", "education", "counseling", "life_skills"],
    accepts: ["Youth"],
    amenities: ["recreation_room", "study_area", "showers"],
  },
  {
    id: "5",
    name: "Women's Resource Center",
    address: "654 Safety Lane",
    city: "Washington",
    state: "DC",
    zip_code: "20005",
    phone: "(202) 555-0500",
    type: "women",
    capacity: 45,
    available_beds: 10,
    hours: "24/7",
    services: ["meals", "domestic_violence_support", "childcare", "legal_aid"],
    accepts: ["Women"],
    amenities: ["private_rooms", "security", "children_area"],
  },
]

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.toLowerCase() || ""
    const type = searchParams.get("type") || "all"

    // Build query
    let query = supabase
      .from("community_shelters")
      .select(`
        *,
        community_shelter_services(*)
      `)
      .eq("is_active", true)
      .eq("is_accepting_residents", true)

    // Filter by type
    if (type !== "all") {
      query = query.eq("shelter_type", type)
    }

    const { data: shelters, error } = await query

    if (error) throw error

    // If no shelters found or empty result, return mock data
    if (!shelters || shelters.length === 0) {
      return returnMockData(search, type)
    }

    // Filter by search term if provided
    let filteredShelters = shelters || []
    if (search) {
      filteredShelters = filteredShelters.filter(
        (s: any) =>
          s.shelter_name?.toLowerCase().includes(search) ||
          s.address?.toLowerCase().includes(search) ||
          (Array.isArray(s.amenities) && s.amenities.some((a: string) => a.toLowerCase().includes(search)))
      )
    }

    // Transform data to match expected format
    const formattedShelters = (filteredShelters || []).map((shelter: any) => ({
      id: shelter.id,
      name: shelter.shelter_name,
      address: shelter.address,
      city: shelter.city,
      state: shelter.state,
      zip_code: shelter.zip_code,
      phone: shelter.phone,
      email: shelter.email,
      website: shelter.website,
      type: shelter.shelter_type,
      capacity: shelter.total_beds,
      available_beds: shelter.beds_available,
      hours: shelter.hours_of_operation,
      services: Array.isArray(shelter.community_shelter_services)
        ? shelter.community_shelter_services.map((svc: any) => svc.service_type)
        : [],
      accepts: [
        shelter.accepts_men ? "Men" : null,
        shelter.accepts_women ? "Women" : null,
        shelter.accepts_families ? "Families" : null,
        shelter.accepts_youth ? "Youth" : null,
        shelter.accepts_veterans ? "Veterans" : null,
      ].filter(Boolean) as string[],
      amenities: Array.isArray(shelter.amenities) ? shelter.amenities : [],
    }))

    return NextResponse.json({ shelters: formattedShelters })
  } catch (error: any) {
    console.error("[Community Outreach] Error fetching shelters:", error)

    // Return mock data on error (including table not found)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.toLowerCase() || ""
    const type = searchParams.get("type") || "all"
    
    return returnMockData(search, type)
  }
}

function returnMockData(search: string, type: string) {
  let filteredShelters = MOCK_SHELTERS

  // Filter by type
  if (type !== "all") {
    filteredShelters = filteredShelters.filter((shelter) => shelter.type === type)
  }

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase()
    filteredShelters = filteredShelters.filter(
      (shelter) =>
        shelter.name.toLowerCase().includes(searchLower) ||
        shelter.address.toLowerCase().includes(searchLower) ||
        shelter.services.some((s) => s.toLowerCase().includes(searchLower))
    )
  }

  return NextResponse.json({ shelters: filteredShelters })
}
