import { generateText } from "ai"
import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { documentType, documentContent, patientId } = await req.json()

    const supabase = createServiceClient()

    // Fetch patient context if provided
    let patientContext = ""
    if (patientId) {
      const { data: patient } = await supabase
        .from("patients")
        .select("first_name, last_name, diagnosis")
        .eq("id", patientId)
        .single()

      if (patient) {
        patientContext = `Patient: ${patient.first_name} ${patient.last_name}, Diagnosis: ${patient.diagnosis || "Not specified"}`
      }
    }

    const prompt = `You are a Joint Commission compliance expert reviewing clinical documentation for a behavioral health OTP (Opioid Treatment Program).

Document Type: ${documentType}
${patientContext ? `Context: ${patientContext}` : ""}

Document Content:
${documentContent || "No content provided - provide general guidance for this document type"}

Review this documentation against Joint Commission standards and provide a JSON response with:
1. overallScore: A number 0-100 representing compliance
2. complianceLevel: One of "excellent", "good", "needs_improvement", "critical"
3. findings: An array of strings describing issues found
4. recommendations: An array of strings with improvement suggestions
5. summary: A brief summary paragraph

Key standards to check:
- PC.01.01.01: Patient Rights
- PC.02.01.21: Pain Assessment  
- PC.03.05.01: Safe Medication Practices
- MM.06.01.01: Medication Storage
- HR.01.02.01: Staff Competency
- PI.01.01.01: Quality Program
- RI.01.01.01: Patient Safety

Respond ONLY with valid JSON, no markdown or explanation.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })

    // Parse the JSON response
    let result
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found")
      }
    } catch {
      // Fallback response if parsing fails
      result = {
        overallScore: 75,
        complianceLevel: "needs_improvement",
        findings: [
          "Unable to fully parse document - manual review recommended",
          "Ensure all required fields are completed",
          "Verify patient identifiers are present",
        ],
        recommendations: [
          "Review documentation against Joint Commission standards",
          "Ensure all signatures and dates are present",
          "Add clinical justification where required",
        ],
        summary: "Document requires manual review for full compliance assessment.",
      }
    }

    // Log the QA review to audit trail
    try {
      await supabase.from("audit_trail").insert({
        action_type: "documentation_qa_review",
        table_name: "progress_notes",
        record_id: patientId || "general",
        changes: {
          documentType,
          score: result.overallScore,
          complianceLevel: result.complianceLevel,
          findingsCount: result.findings?.length || 0,
        },
      })
    } catch (auditError) {
      console.error("Audit log error:", auditError)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("QA Review error:", error)
    // Return a fallback response instead of error
    return NextResponse.json({
      overallScore: 70,
      complianceLevel: "needs_improvement",
      findings: ["AI review service temporarily unavailable", "Please try again or perform manual review"],
      recommendations: [
        "Retry the QA review in a few moments",
        "Ensure document content is properly formatted",
        "Contact support if issue persists",
      ],
      summary: "Unable to complete automated review. Please try again.",
    })
  }
}
