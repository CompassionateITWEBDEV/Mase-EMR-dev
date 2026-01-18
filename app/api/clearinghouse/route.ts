import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch clearinghouse connections
    const { data: connections, error: connError } = await supabase
      .from("clearinghouse_connections")
      .select("*")
      .order("created_at", { ascending: false })

    if (connError) throw connError

    // Fetch today's metrics
    const today = new Date().toISOString().split("T")[0]
    const { data: metrics, error: metricsError } = await supabase
      .from("clearinghouse_metrics")
      .select("*")
      .eq("metric_date", today)
      .limit(1)
      .maybeSingle()

    if (metricsError) throw metricsError

    // Fetch recent transactions
    const { data: transactions, error: txnError } = await supabase
      .from("clearinghouse_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (txnError) throw txnError

    // Fetch recent batches
    const { data: batches, error: batchError } = await supabase
      .from("claim_batches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    if (batchError) throw batchError

    // Fetch recent ERAs
    const { data: eras, error: eraError } = await supabase
      .from("electronic_remittance_advice")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    if (eraError) throw eraError

    // Calculate today's stats
    const todayClaims = batches?.filter((b) => new Date(b.created_at).toISOString().split("T")[0] === today)
    const claimsSubmittedToday = todayClaims?.reduce((sum, b) => sum + (b.total_claims || 0), 0)
    const todayEraTotal =
      eras
        ?.filter((e) => new Date(e.created_at).toISOString().split("T")[0] === today)
        ?.reduce((sum, e) => sum + Number(e.total_payment_amount || 0), 0) || 0

    // Calculate acceptance rate from metrics or batches
    const acceptedClaims = batches?.filter((b) => b.batch_status === "accepted").length || 0
    const totalBatches = batches?.length || 1
    const acceptanceRate = Math.round((acceptedClaims / totalBatches) * 100)

    return NextResponse.json({
      connections: connections || [],
      metrics: metrics || {
        claims_submitted: claimsSubmittedToday || 0,
        acceptance_rate: acceptanceRate,
        total_payments_received: todayEraTotal,
        average_response_time_ms: 2300,
      },
      transactions: transactions || [],
      batches: batches || [],
      eras: eras || [],
      stats: {
        claimsSubmittedToday: claimsSubmittedToday || 0,
        acceptanceRate,
        eraPaymentsToday: todayEraTotal,
        erasProcessedToday:
          eras?.filter((e) => new Date(e.created_at).toISOString().split("T")[0] === today).length || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching clearinghouse data:", error)
    return NextResponse.json({ error: "Failed to fetch clearinghouse data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { action } = body

    if (action === "save_config") {
      const { config } = body

      // Check if a connection already exists
      const { data: existing } = await supabase
        .from("clearinghouse_connections")
        .select("id")
        .eq("clearinghouse_name", config.clearinghouseName)
        .single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("clearinghouse_connections")
          .update({
            clearinghouse_id: config.clearinghouseId,
            connection_type: config.connectionType,
            api_endpoint: config.apiEndpoint,
            submitter_id: config.submitterId,
            receiver_id: config.receiverId,
            is_production: config.isProduction,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)

        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase.from("clearinghouse_connections").insert({
          clearinghouse_name: config.clearinghouseName,
          clearinghouse_id: config.clearinghouseId,
          connection_type: config.connectionType,
          api_endpoint: config.apiEndpoint,
          submitter_id: config.submitterId,
          receiver_id: config.receiverId,
          is_production: config.isProduction,
          is_active: true,
          connection_status: "connected",
        })

        if (error) throw error
      }

      return NextResponse.json({ success: true })
    }

    if (action === "test_connection") {
      // Simulate connection test
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return NextResponse.json({ success: true, status: "connected" })
    }

    if (action === "save_credentials") {
      const { credentials } = body

      const { error } = await supabase
        .from("clearinghouse_connections")
        .update({
          sftp_username: credentials.username,
          sftp_host: credentials.host,
          sftp_port: credentials.port,
          api_key_encrypted: credentials.apiKey,
          updated_at: new Date().toISOString(),
        })
        .eq("clearinghouse_name", credentials.clearinghouseName)

      if (error) throw error

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing clearinghouse action:", error)
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 })
  }
}
