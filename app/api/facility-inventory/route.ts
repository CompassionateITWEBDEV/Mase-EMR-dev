import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    // Build query
    let query = supabase.from("facility_inventory").select("*").order("created_at", { ascending: false })

    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    const { data: inventory, error } = await query

    if (error) throw error

    // Calculate low stock items
    const lowStockItems = (inventory || []).filter((item: any) => item.quantity <= item.reorder_level)

    // Calculate expiring soon items (within 30 days)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringSoon = (inventory || []).filter((item: any) => {
      if (!item.expiration_date) return false
      const expirationDate = new Date(item.expiration_date)
      return expirationDate <= thirtyDaysFromNow && expirationDate >= now
    })

    // Get unique categories
    const categories = Array.from(new Set((inventory || []).map((item: any) => item.category)))

    return NextResponse.json({
      inventory: inventory || [],
      stats: {
        totalItems: inventory?.length || 0,
        lowStockAlerts: lowStockItems.length,
        expiringSoon: expiringSoon.length,
        categories: categories.length,
        lowStockItems,
      },
    })
  } catch (error: any) {
    console.error("[Facility Inventory] Error fetching inventory:", error)
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const {
      item_name,
      category,
      quantity,
      unit_of_measure,
      reorder_level,
      expiration_date,
      lot_number,
      storage_location,
      notes,
    } = body

    const { data: item, error } = await supabase
      .from("facility_inventory")
      .insert({
        item_name,
        category,
        quantity,
        unit_of_measure,
        reorder_level: reorder_level || 10,
        expiration_date: expiration_date || null,
        lot_number: lot_number || null,
        storage_location: storage_location || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(item)
  } catch (error: any) {
    console.error("[Facility Inventory] Error adding inventory item:", error)
    return NextResponse.json({ error: "Failed to add inventory item" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { id, quantity, action, item_name, category, unit_of_measure, reorder_level, expiration_date, lot_number, storage_location, notes } = body

    if (!id) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 })
    }

    if (action === "use") {
      // Get current quantity first
      const { data: currentItem, error: fetchError } = await supabase
        .from("facility_inventory")
        .select("quantity")
        .eq("id", id)
        .single()

      if (fetchError) throw fetchError

      // Decrease quantity by 1
      const { data: item, error } = await supabase
        .from("facility_inventory")
        .update({
          quantity: (currentItem?.quantity || 0) - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(item)
    } else {
      // Update full item details
      const { data: item, error } = await supabase
        .from("facility_inventory")
        .update({
          item_name,
          category,
          quantity,
          unit_of_measure,
          reorder_level,
          expiration_date: expiration_date || null,
          lot_number: lot_number || null,
          storage_location: storage_location || null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(item)
    }
  } catch (error: any) {
    console.error("[Facility Inventory] Error updating inventory item:", error)
    return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 })
  }
}
