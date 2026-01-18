import { streamText } from "ai"
import { createServiceClient } from "@/lib/supabase/service-role"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const supabase = createServiceClient()

    // Fetch some context about current compliance status
    const { data: staff } = await supabase.from("staff").select("id").limit(1)
    const { data: notes } = await supabase.from("progress_notes").select("id").limit(1)

    const systemPrompt = `You are an AI Clinical Coach specialized in behavioral health EMR documentation and Joint Commission compliance. You help healthcare staff with:

1. **Documentation Excellence**: Review SOAP notes, treatment plans, and clinical documentation for quality and compliance.

2. **Staff Education**: Provide training guidance, answer questions about protocols, and help staff understand requirements.

3. **Joint Commission Standards**: Explain standards, check compliance, and provide recommendations for improvement.

4. **Quality Assurance**: Identify documentation gaps, suggest improvements, and ensure patient safety standards are met.

Key Joint Commission Standards to reference:
- PC.01.01.01: Patient Rights
- PC.02.01.21: Pain Assessment
- PC.03.05.01: Safe Medication Practices
- MM.06.01.01: Medication Storage
- HR.01.02.01: Staff Competency
- PI.01.01.01: Quality Program
- RI.01.01.01: Patient Safety

Current system has ${staff?.length || 0} staff members and ${notes?.length || 0} progress notes.

Always be helpful, professional, and provide specific, actionable guidance. When reviewing documentation, cite specific Joint Commission standards when relevant. Format your responses clearly with bullet points and sections when appropriate.`

    const result = await streamText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    })

    // Return as a proper streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            // Format as SSE with the expected "0:" prefix
            const data = JSON.stringify(chunk)
            controller.enqueue(encoder.encode(`0:${data}\n`))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("AI Coaching chat error:", error)
    return new Response(JSON.stringify({ error: "Failed to process chat" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
