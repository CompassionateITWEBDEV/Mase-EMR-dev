import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"

    // Fetch providers
    const { data: providers, error: providersError } = await supabase.from("providers").select("*").order("last_name")

    if (providersError) throw providersError

    // Fetch license verifications
    const { data: licenses, error: licensesError } = await supabase
      .from("provider_license_verification")
      .select(`
        *,
        providers (first_name, last_name)
      `)
      .order("expiration_date")

    if (licensesError) throw licensesError

    // Fetch NPI verifications
    const { data: npiRecords, error: npiError } = await supabase
      .from("provider_npi_verification")
      .select(`
        *,
        providers (first_name, last_name)
      `)
      .order("verification_date", { ascending: false })

    if (npiError) throw npiError

    // Calculate metrics
    const activeProviders = providers?.length || 0
    const verifiedNPI = npiRecords?.filter((n) => n.verification_status === "verified").length || 0
    const pendingNPI = npiRecords?.filter((n) => n.verification_status === "pending").length || 0

    const today = new Date()
    const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
    const expiringLicenses =
      licenses?.filter((l) => {
        if (!l.expiration_date) return false
        const expDate = new Date(l.expiration_date)
        return expDate > today && expDate <= ninetyDaysFromNow
      }).length || 0

    const verifiedLicenses = licenses?.filter((l) => l.verification_status === "verified").length || 0
    const totalLicenses = licenses?.length || 1
    const complianceScore = Math.round((verifiedLicenses / totalLicenses) * 100)

    return NextResponse.json({
      providers: providers || [],
      licenses:
        licenses?.map((l) => ({
          ...l,
          providerName: l.providers ? `${l.providers.first_name} ${l.providers.last_name}` : "Unknown",
        })) || [],
      npiRecords:
        npiRecords?.map((n) => ({
          ...n,
          providerName: n.providers ? `${n.providers.first_name} ${n.providers.last_name}` : "Unknown",
        })) || [],
      metrics: {
        activeProviders,
        verifiedNPI,
        pendingNPI,
        expiringLicenses,
        complianceScore,
      },
    })
  } catch (error) {
    console.error("Error fetching provider verification data:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { type, ...data } = body

    if (type === "license") {
      const { data: license, error } = await supabase
        .from("provider_license_verification")
        .insert({
          provider_id: data.providerId,
          license_number: data.licenseNumber,
          license_type: data.licenseType,
          issuing_state: data.issuingState,
          issue_date: data.issueDate || null,
          expiration_date: data.expirationDate,
          verification_status: "pending",
          verification_source: "Manual Entry",
          renewal_required_by: data.renewalRequiredBy || null,
          cme_requirements: data.cmeRequirements || null,
          auto_verify_enabled: data.autoVerifyEnabled,
          notes: data.notes || null,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(license)
    }

    if (type === "npi") {
      const { data: npi, error } = await supabase
        .from("provider_npi_verification")
        .insert({
          provider_id: data.providerId,
          npi_number: data.npiNumber,
          npi_type: data.npiType || 1,
          provider_name_on_npi: data.providerNameOnNpi,
          verification_status: "pending",
          verification_source: "Manual Entry",
          taxonomy_code: data.taxonomyCode || null,
          taxonomy_description: data.taxonomyDescription || null,
          practice_address: data.practiceAddress || null,
          phone_number: data.phoneNumber || null,
          notes: data.notes || null,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(npi)
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("Error creating verification record:", error)
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { type, id, action } = body

    if (action === "verify") {
      const table = type === "license" ? "provider_license_verification" : "provider_npi_verification"
      const today = new Date().toISOString().split("T")[0]
      const nextDue = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

      const { data, error } = await supabase
        .from(table)
        .update({
          verification_status: "verified",
          verification_date: today,
          last_verification_attempt: today,
          next_verification_due: nextDue,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating verification:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}
