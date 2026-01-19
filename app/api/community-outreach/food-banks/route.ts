import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const MOCK_FOOD_BANKS = [
  {
    id: "1",
    name: "Capital Area Food Bank",
    type: "food-bank",
    address: "4900 Puerto Rico Ave NE, Washington, DC 20017",
    phone: "(202) 644-9800",
    hours: "Mon-Fri 9:00 AM - 4:00 PM",
    services: "Emergency food, nutrition education, SNAP assistance",
    latitude: 38.9337,
    longitude: -76.9898,
  },
  {
    id: "2",
    name: "Martha's Table Food Pantry",
    type: "pantry",
    address: "2375 Elvans Rd SE, Washington, DC 20020",
    phone: "(202) 328-6608",
    hours: "Mon-Thu 10:00 AM - 2:00 PM",
    services: "Free groceries, hot meals, children's programs",
    latitude: 38.8545,
    longitude: -76.9792,
  },
  {
    id: "3",
    name: "DC Central Kitchen",
    type: "soup-kitchen",
    address: "425 2nd St NW, Washington, DC 20001",
    phone: "(202) 234-0707",
    hours: "Mon-Sat 11:00 AM - 1:00 PM",
    services: "Hot meals, culinary job training",
    latitude: 38.8982,
    longitude: -77.0134,
  },
  {
    id: "4",
    name: "Bread for the City",
    type: "pantry",
    address: "1640 Good Hope Rd SE, Washington, DC 20020",
    phone: "(202) 561-8587",
    hours: "Mon, Wed, Fri 9:00 AM - 12:00 PM",
    services: "Food pantry, medical care, legal services, clothing",
    latitude: 38.8567,
    longitude: -76.9845,
  },
  {
    id: "5",
    name: "So Others Might Eat (SOME)",
    type: "soup-kitchen",
    address: "71 O St NW, Washington, DC 20001",
    phone: "(202) 797-8806",
    hours: "Daily 6:00 AM - 8:00 AM, 11:30 AM - 1:00 PM, 5:30 PM - 7:00 PM",
    services: "Three meals daily, housing, healthcare",
    latitude: 38.9078,
    longitude: -77.0112,
  },
  {
    id: "6",
    name: "N Street Village Food Pantry",
    type: "pantry",
    address: "1333 N St NW, Washington, DC 20005",
    phone: "(202) 939-2060",
    hours: "Mon-Fri 8:00 AM - 4:00 PM",
    services: "Food assistance, women's shelter, supportive services",
    latitude: 38.9072,
    longitude: -77.0302,
  },
]

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || "all"

    // Build query
    let query = supabase
      .from("food_banks")
      .select("*")
      .eq("is_active", true)

    // Filter by type
    if (type !== "all") {
      query = query.eq("food_bank_type", type)
    }

    const { data: foodBanks, error } = await query

    if (error) throw error

    // If no food banks found or empty result, return mock data
    if (!foodBanks || foodBanks.length === 0) {
      return returnMockData(search, type)
    }

    // Filter by search term if provided
    let filteredFoodBanks = foodBanks || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredFoodBanks = filteredFoodBanks.filter(
        (fb: any) =>
          fb.organization_name?.toLowerCase().includes(searchLower) ||
          fb.address?.toLowerCase().includes(searchLower) ||
          (Array.isArray(fb.services) && fb.services.some((s: string) => s.toLowerCase().includes(searchLower)))
      )
    }

    return NextResponse.json({ foodBanks: filteredFoodBanks })
  } catch (error: any) {
    console.error("[Community Outreach] Error fetching food banks:", error)

    // Return mock data on error (including table not found)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || "all"

    return returnMockData(search, type)
  }
}

function returnMockData(search: string, type: string) {
  let filteredBanks = MOCK_FOOD_BANKS

  // Filter by type
  if (type !== "all") {
    filteredBanks = filteredBanks.filter((bank) => bank.type === type)
  }

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase()
    filteredBanks = filteredBanks.filter(
      (bank) =>
        bank.name.toLowerCase().includes(searchLower) ||
        bank.address.toLowerCase().includes(searchLower) ||
        bank.services.toLowerCase().includes(searchLower)
    )
  }

  return NextResponse.json({ foodBanks: filteredBanks })
}
