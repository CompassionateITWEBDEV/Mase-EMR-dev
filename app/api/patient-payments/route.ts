import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const body = await request.json()
    const {
      patient_id,
      amount_paid,
      payment_method,
      payment_reference,
      service_date,
      service_type,
      collected_by,
      notes,
    } = body

    // Insert payment transaction
    const { data: payment, error: paymentError } = await supabase
      .from("patient_payments")
      .insert({
        patient_id,
        amount_paid,
        payment_method,
        payment_reference,
        service_date,
        service_type,
        collected_by,
        notes,
        payment_date: new Date().toISOString(),
        status: "completed",
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Update patient balance
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("account_balance")
      .eq("id", patient_id)
      .single()

    if (!patientError && patient) {
      const currentBalance = patient.account_balance || 0
      const newBalance = currentBalance - amount_paid

      await supabase.from("patients").update({ account_balance: newBalance }).eq("id", patient_id)
    }

    return NextResponse.json({ success: true, payment })
  } catch (error: any) {
    console.error("[v0] Payment error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const { searchParams } = new URL(request.url)
    const patient_id = searchParams.get("patient_id")

    if (patient_id) {
      // Get patient balance and recent payments
      const { data: patient } = await supabase
        .from("patients")
        .select("account_balance, full_name")
        .eq("id", patient_id)
        .single()

      const { data: payments } = await supabase
        .from("patient_payments")
        .select("*")
        .eq("patient_id", patient_id)
        .order("payment_date", { ascending: false })
        .limit(10)

      return NextResponse.json({ patient, payments })
    }

    return NextResponse.json({ error: "Patient ID required" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Error fetching payments:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
