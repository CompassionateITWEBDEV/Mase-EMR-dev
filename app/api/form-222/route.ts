import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      supplierName,
      supplierAddress,
      supplierDEA,
      registrantName,
      registrantDEA,
      signedByUserId,
      lineItems,
    } = body

    if (!supplierName || !supplierDEA || !registrantName || !registrantDEA || !signedByUserId) {
      return NextResponse.json({ error: "Missing required form data" }, { status: 400 })
    }

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json({ error: "Line items are required" }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    const isAuthorizedSigner = await validateAuthorizedSigner(supabase, signedByUserId)
    if (!isAuthorizedSigner) {
      return NextResponse.json(
        { error: "Only DEA registrant or POA-authorized personnel may sign Form 222" },
        { status: 403 },
      )
    }

    const duplicateItems = findDuplicateItems(lineItems)
    if (duplicateItems.length > 0) {
      return NextResponse.json(
        { error: "Only one item per numbered line allowed - same substance, form, strength" },
        { status: 400 },
      )
    }

    for (const item of lineItems) {
      if (!item.medication_id || !item.quantity_ordered) {
        return NextResponse.json({ error: "Each line item requires medication and quantity" }, { status: 400 })
      }
    }

    const formNumber = generateFormNumber()
    const executionDate = new Date()
    const expiresAt = new Date(executionDate.getTime() + 60 * 24 * 60 * 60 * 1000)

    const { data: form, error } = await supabase
      .from("dea_form_222")
      .insert({
        form_number: formNumber,
        supplier_name: supplierName,
        supplier_address: supplierAddress,
        supplier_dea_number: supplierDEA,
        registrant_name: registrantName,
        registrant_dea_number: registrantDEA,
        signed_by_user_id: signedByUserId,
        signed_at: executionDate.toISOString(),
        execution_date: executionDate.toISOString().split("T")[0],
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single()

    if (error || !form) {
      console.error("[form-222] insert failed", error)
      return NextResponse.json({ error: "Failed to execute Form 222" }, { status: 500 })
    }

    const linePayload = lineItems.map((item: any, index: number) => ({
      form_222_id: form.id,
      line_number: item.line_number ?? index + 1,
      medication_id: item.medication_id,
      quantity_ordered: item.quantity_ordered,
      unit: item.unit ?? "mL",
      status: "pending",
    }))

    const { error: lineError } = await supabase.from("dea_form_222_line").insert(linePayload)
    if (lineError) {
      console.error("[form-222] line insert failed", lineError)
      return NextResponse.json({ error: "Failed to save line items" }, { status: 500 })
    }

    await generatePurchaserCopy(supabase, form.id)

    return NextResponse.json({
      success: true,
      formNumber,
      expiresAt: expiresAt.toISOString(),
      message: "Form 222 executed successfully. Purchaser copy generated.",
    })
  } catch (error) {
    console.error("[form-222] creation error", error)
    return NextResponse.json({ error: "Failed to execute Form 222" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const expiringSoon = searchParams.get("expiring_soon") === "true"

    let query = supabase
      .from("dea_form_222")
      .select("*, line_items:dea_form_222_line(*)")
      .order("execution_date", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    if (expiringSoon) {
      const threshold = new Date()
      threshold.setDate(threshold.getDate() + 10)
      query = query.lte("expires_at", threshold.toISOString())
    }

    const { data: forms, error } = await query

    if (error) {
      console.error("[form-222] fetch error", error)
      return NextResponse.json({ error: "Failed to fetch Form 222 records" }, { status: 500 })
    }

    return NextResponse.json({ forms: forms ?? [] })
  } catch (error) {
    console.error("[form-222] fetch exception", error)
    return NextResponse.json({ error: "Failed to fetch Form 222 records" }, { status: 500 })
  }
}

async function validateAuthorizedSigner(supabase: any, userId: number): Promise<boolean> {
  const { count, error } = await supabase
    .from("dea_poa")
    .select("id", { head: true, count: "exact" })
    .eq("authorized_user_id", userId)
    .eq("status", "active")

  if (error) {
    console.error("[form-222] authorized signer validation failed", error)
    return false
  }

  return (count ?? 0) > 0
}

function findDuplicateItems(lineItems: any[]): any[] {
  const seen = new Set()
  const duplicates = []

  for (const item of lineItems) {
    const key = `${item.medication_id}-${item.strength ?? ""}-${item.form ?? ""}`
    if (seen.has(key)) {
      duplicates.push(item)
    }
    seen.add(key)
  }

  return duplicates
}

function generateFormNumber(): string {
  const year = new Date().getFullYear()
  const sequence = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `F222-${year}-${sequence}`
}

async function generatePurchaserCopy(supabase: any, formId: number) {
  await supabase.from("dea_form_222_documents").insert({
    form_222_id: formId,
    document_type: "purchaser_copy",
    storage_path: `/dea/forms/${formId}-purchaser.pdf`,
  }).catch((error: any) => {
    console.warn("[form-222] purchaser copy insert failed", error)
  })
}
