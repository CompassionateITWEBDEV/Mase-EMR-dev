import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL as string)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    let query = `
      SELECT 
        id,
        item_name,
        category,
        quantity,
        unit_of_measure,
        reorder_level,
        expiration_date,
        lot_number,
        storage_location,
        notes,
        created_at,
        updated_at
      FROM facility_inventory
      WHERE 1=1
    `

    if (category && category !== "all") {
      query += ` AND category = '${category}'`
    }

    query += ` ORDER BY created_at DESC`

    const inventory = await sql(query)

    // Calculate low stock items
    const lowStockItems = inventory.filter((item: any) => item.quantity <= item.reorder_level)

    // Calculate expiring soon items (within 30 days)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringSoon = inventory.filter((item: any) => {
      if (!item.expiration_date) return false
      const expirationDate = new Date(item.expiration_date)
      return expirationDate <= thirtyDaysFromNow && expirationDate >= now
    })

    return NextResponse.json({
      inventory,
      stats: {
        totalItems: inventory.length,
        lowStockAlerts: lowStockItems.length,
        expiringSoon: expiringSoon.length,
        categories: 5,
        lowStockItems,
      },
    })
  } catch (error) {
    console.error("[v0] Facility inventory fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      itemName,
      category,
      quantity,
      unitOfMeasure,
      reorderLevel,
      expirationDate,
      lotNumber,
      storageLocation,
      notes,
    } = body

    console.log("[v0] Adding inventory item:", itemName)

    const result = await sql`
      INSERT INTO facility_inventory (
        item_name,
        category,
        quantity,
        unit_of_measure,
        reorder_level,
        expiration_date,
        lot_number,
        storage_location,
        notes
      ) VALUES (
        ${itemName},
        ${category},
        ${quantity},
        ${unitOfMeasure},
        ${reorderLevel},
        ${expirationDate || null},
        ${lotNumber || null},
        ${storageLocation || null},
        ${notes || null}
      )
      RETURNING *
    `

    console.log("[v0] Inventory item added successfully")

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Inventory add error:", error)
    return NextResponse.json({ error: "Failed to add inventory item" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, quantity, action } = body

    console.log(`[v0] Updating inventory item ${id}, action: ${action}`)

    if (action === "use") {
      // Decrease quantity by 1
      await sql`
        UPDATE facility_inventory
        SET 
          quantity = quantity - 1,
          updated_at = NOW()
        WHERE id = ${id}
      `
    } else if (action === "update") {
      // Update full item details
      const {
        itemName,
        category,
        quantity,
        unitOfMeasure,
        reorderLevel,
        expirationDate,
        lotNumber,
        storageLocation,
        notes,
      } = body

      await sql`
        UPDATE facility_inventory
        SET 
          item_name = ${itemName},
          category = ${category},
          quantity = ${quantity},
          unit_of_measure = ${unitOfMeasure},
          reorder_level = ${reorderLevel},
          expiration_date = ${expirationDate || null},
          lot_number = ${lotNumber || null},
          storage_location = ${storageLocation || null},
          notes = ${notes || null},
          updated_at = NOW()
        WHERE id = ${id}
      `
    }

    const updated = await sql`
      SELECT * FROM facility_inventory WHERE id = ${id}
    `

    console.log("[v0] Inventory item updated successfully")

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error("[v0] Inventory update error:", error)
    return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 })
  }
}
