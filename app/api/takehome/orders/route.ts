import { createServiceClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch take-home orders from medication_order table
    const { data: orders, error } = await supabase
      .from("medication_order")
      .select(`
        id,
        patient_id,
        daily_dose_mg,
        max_takehome,
        start_date,
        stop_date,
        status,
        created_at,
        prescriber_id
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching take-home orders:", error)
      return NextResponse.json({ orders: [] })
    }

    // Fetch patient names
    const { data: patients } = await supabase.from("patient_dispensing").select("id, name")

    const patientMap = new Map(patients?.map((p) => [p.id, p.name]) || [])

    const formattedOrders = (orders || []).map((order) => ({
      id: order.id,
      patient_id: order.patient_id,
      patient_name: patientMap.get(order.patient_id) || `Patient ${order.patient_id}`,
      days: order.max_takehome || 0,
      daily_dose_mg: order.daily_dose_mg,
      start_date: order.start_date,
      end_date: order.stop_date,
      risk_level:
        order.max_takehome && order.max_takehome > 7
          ? "low"
          : order.max_takehome && order.max_takehome > 3
            ? "standard"
            : "high",
      status: order.status || "pending",
      created_at: order.created_at,
    }))

    return NextResponse.json({ orders: formattedOrders })
  } catch (error) {
    console.error("[v0] Take-home orders error:", error)
    return NextResponse.json({ orders: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patient_id, days, risk_level, start_date } = body

    if (!patient_id || !days || !risk_level || !start_date) {
      return NextResponse.json({ error: "Missing take-home order fields" }, { status: 400 })
    }

    const supabase = createServiceClient()

    const validation = await validateTakehomeRules(supabase, patient_id, days, risk_level)
    if (!validation.eligible) {
      return NextResponse.json(
        { error: "Patient not eligible for take-home", reasons: validation.reasons },
        { status: 400 },
      )
    }

    const startDate = new Date(start_date)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + Number(days) - 1)

    const { data: prescriber } = await supabase
      .from("medication_order")
      .select("prescriber_id")
      .eq("patient_id", patient_id)
      .eq("status", "active")
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: order, error } = await supabase
      .from("takehome_orders")
      .insert({
        patient_id,
        days,
        start_date,
        end_date: endDate.toISOString().split("T")[0],
        prescriber_id: prescriber?.prescriber_id ?? "unknown",
        risk_level,
        status: "pending",
      })
      .select("*")
      .single()

    if (error) {
      console.error("[takehome] order insert failed", error)
      return NextResponse.json({ error: "Failed to create take-home order" }, { status: 500 })
    }

    await logAuditEntry(supabase, {
      action: "takehome_order_created",
      patient_id,
      details: { order_id: order.id, days, risk_level },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error("[takehome] order creation error", error)
    return NextResponse.json({ error: "Failed to create take-home order" }, { status: 500 })
  }
}

async function validateTakehomeRules(supabase: any, patientId: number, days: number, riskLevel: string) {
  const rules = await fetchRules(supabase, riskLevel)
  const maxDays = Number(rules.get("max_consecutive_days") ?? (riskLevel === "high" ? 3 : riskLevel === "low" ? 14 : 7))

  const reasons: string[] = []

  if (days > maxDays) {
    reasons.push(`Exceeds maximum ${maxDays} days for ${riskLevel} risk level`)
  }

  const hasActiveHold = await checkActiveHolds(supabase, patientId)
  if (hasActiveHold) {
    reasons.push("Patient has active compliance hold")
  }

  const positiveUdSRule = rules.get("positive_uds_auto_hold") === "true"
  if (positiveUdSRule) {
    const hasRecentPositiveUDS = await checkRecentUDS(supabase, patientId)
    if (hasRecentPositiveUDS) {
      reasons.push("Recent positive UDS result")
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  }
}

async function fetchRules(supabase: any, riskLevel: string) {
  const { data, error } = await supabase
    .from("takehome_rules")
    .select("rule_name, rule_value, risk_level")
    .in("risk_level", [riskLevel, "all"])

  if (error) {
    console.error("[takehome] rule fetch failed", error)
    return new Map<string, string>()
  }

  const rules = new Map<string, string>()
  for (const rule of data ?? []) {
    // Risk-specific overrides entries from the generic "all" rule
    if (!rules.has(rule.rule_name) || rule.risk_level === riskLevel) {
      rules.set(rule.rule_name, rule.rule_value)
    }
  }

  return rules
}

async function checkActiveHolds(supabase: any, patientId: number) {
  const { count, error } = await supabase
    .from("compliance_holds")
    .select("id", { head: true, count: "exact" })
    .eq("patient_id", patientId)
    .eq("status", "open")

  if (error) {
    console.error("[takehome] hold lookup failed", error)
    return false
  }

  return (count ?? 0) > 0
}

async function checkRecentUDS(supabase: any, patientId: number) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count, error } = await supabase
    .from("lab_results")
    .select("id", { head: true, count: "exact" })
    .eq("patient_id", patientId)
    .eq("test_type", "UDS")
    .eq("result", "positive")
    .gte("result_date", thirtyDaysAgo.toISOString())

  if (error) {
    console.warn("[takehome] UDS lookup failed", error)
    return false
  }

  return (count ?? 0) > 0
}

async function logAuditEntry(supabase: any, entry: { action: string; patient_id: number; details: any }) {
  await supabase.from("audit_trail").insert({
    user_id: null,
    patient_id: entry.patient_id,
    action: entry.action,
    table_name: "takehome_orders",
    record_id: entry.details.order_id,
    new_values: entry.details,
  })
}
