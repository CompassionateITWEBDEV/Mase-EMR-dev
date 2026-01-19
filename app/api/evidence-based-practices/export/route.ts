import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

// GET - Export EBPs to Excel or PDF
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "excel" // excel or pdf
    const ebpId = searchParams.get("ebp_id") // Optional: export single EBP with details

    if (ebpId) {
      // Export detailed report for a single EBP
      return await exportSingleEbpReport(supabase, ebpId, format)
    } else {
      // Export summary of all EBPs
      return await exportAllEbpsSummary(supabase, format)
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/evidence-based-practices/export:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

async function exportAllEbpsSummary(supabase: any, format: string) {
  // Fetch all EBPs
  const { data: ebps, error } = await supabase
    .from("evidence_based_practices")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Prepare data for export
  const exportData = (ebps || []).map((ebp: any) => ({
    Name: ebp.name,
    Category: ebp.category,
    Description: ebp.description || "",
    "Adoption Rate (%)": ebp.adoption_rate || 0,
    "Fidelity Score (%)": ebp.fidelity_score || 0,
    "Sustainability Score (%)": ebp.sustainability_score || 0,
    "Trained Staff": ebp.trained_staff || 0,
    "Total Staff": ebp.total_staff || 0,
    "Last Fidelity Review": ebp.last_fidelity_review || "N/A",
    "Outcomes Tracked": Array.isArray(ebp.outcomes_tracked)
      ? ebp.outcomes_tracked.join(", ")
      : ebp.outcomes_tracked || "",
    "Created At": ebp.created_at ? new Date(ebp.created_at).toLocaleDateString() : "",
  }))

  if (format === "excel") {
    // Create Excel workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    XLSX.utils.book_append_sheet(workbook, worksheet, "Evidence-Based Practices")

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ebp_summary_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } else {
    // For PDF, we'd need a PDF library like pdfkit or jsPDF
    // For now, return JSON that can be converted to PDF on the client
    return NextResponse.json({
      success: true,
      data: exportData,
      format: "json",
      message: "PDF export requires client-side conversion. Use Excel format or implement PDF generation.",
    })
  }
}

async function exportSingleEbpReport(supabase: any, ebpId: string, format: string) {
  // Fetch EBP details
  const { data: ebp, error: ebpError } = await supabase
    .from("evidence_based_practices")
    .select("*")
    .eq("id", ebpId)
    .single()

  if (ebpError || !ebp) {
    return NextResponse.json({ error: "EBP not found" }, { status: 404 })
  }

  // Fetch related data
  const [fidelityData, trainingData, deliveryData, outcomesData] = await Promise.all([
    supabase.from("ebp_fidelity_assessments").select("*").eq("ebp_id", ebpId).order("assessment_date", { ascending: false }),
    supabase.from("ebp_staff_assignments").select("*").eq("ebp_id", ebpId).order("assigned_at", { ascending: false }),
    supabase.from("ebp_patient_delivery").select("*").eq("ebp_id", ebpId).order("delivery_date", { ascending: false }),
    supabase.from("ebp_outcomes").select("*").eq("ebp_id", ebpId).order("measurement_date", { ascending: false }),
  ])

  // Prepare comprehensive report data
  const reportData = {
    Summary: [
      { Field: "Name", Value: ebp.name },
      { Field: "Category", Value: ebp.category },
      { Field: "Description", Value: ebp.description || "" },
      { Field: "Adoption Rate (%)", Value: ebp.adoption_rate || 0 },
      { Field: "Fidelity Score (%)", Value: ebp.fidelity_score || 0 },
      { Field: "Sustainability Score (%)", Value: ebp.sustainability_score || 0 },
      { Field: "Trained Staff", Value: ebp.trained_staff || 0 },
      { Field: "Total Staff", Value: ebp.total_staff || 0 },
      { Field: "Last Fidelity Review", Value: ebp.last_fidelity_review || "N/A" },
    ],
    "Fidelity Assessments": (fidelityData.data || []).map((f: any) => ({
      Date: f.assessment_date,
      Type: f.assessment_type,
      Score: f.fidelity_score,
      Assessor: f.assessor_id || "N/A",
      Notes: f.notes || "",
    })),
    "Training Records": (trainingData.data || []).map((t: any) => ({
      Staff: t.staff_id,
      Status: t.status,
      "Training Date": t.training_date || "N/A",
      "Certification Date": t.certification_date || "N/A",
      "Expires Date": t.certification_expires_date || "N/A",
    })),
    "Patient Deliveries": (deliveryData.data || []).map((d: any) => ({
      Patient: d.patient_id,
      Date: d.delivery_date,
      Type: d.delivery_type,
      Notes: d.notes || "",
    })),
    Outcomes: (outcomesData.data || []).map((o: any) => ({
      Patient: o.patient_id,
      Type: o.outcome_type,
      Value: o.outcome_value || "N/A",
      Unit: o.outcome_unit || "",
      Date: o.measurement_date,
      Notes: o.notes || "",
    })),
  }

  if (format === "excel") {
    // Create Excel workbook with multiple sheets
    const workbook = XLSX.utils.book_new()

    // Summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(reportData.Summary)
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary")

    // Fidelity Assessments sheet
    if (reportData["Fidelity Assessments"].length > 0) {
      const fidelitySheet = XLSX.utils.json_to_sheet(reportData["Fidelity Assessments"])
      XLSX.utils.book_append_sheet(workbook, fidelitySheet, "Fidelity")
    }

    // Training Records sheet
    if (reportData["Training Records"].length > 0) {
      const trainingSheet = XLSX.utils.json_to_sheet(reportData["Training Records"])
      XLSX.utils.book_append_sheet(workbook, trainingSheet, "Training")
    }

    // Patient Deliveries sheet
    if (reportData["Patient Deliveries"].length > 0) {
      const deliverySheet = XLSX.utils.json_to_sheet(reportData["Patient Deliveries"])
      XLSX.utils.book_append_sheet(workbook, deliverySheet, "Deliveries")
    }

    // Outcomes sheet
    if (reportData.Outcomes.length > 0) {
      const outcomesSheet = XLSX.utils.json_to_sheet(reportData.Outcomes)
      XLSX.utils.book_append_sheet(workbook, outcomesSheet, "Outcomes")
    }

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ebp_report_${ebp.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } else {
    return NextResponse.json({
      success: true,
      data: reportData,
      format: "json",
      message: "PDF export requires client-side conversion. Use Excel format.",
    })
  }
}

