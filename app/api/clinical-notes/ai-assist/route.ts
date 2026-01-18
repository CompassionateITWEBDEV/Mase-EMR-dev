import { streamText } from "ai"

export async function POST(request: Request) {
  try {
    const { noteContent, noteType, action } = await request.json()

    let systemPrompt = ""
    let userPrompt = ""

    switch (action) {
      case "enhance":
        systemPrompt = `You are an expert clinical documentation assistant specializing in behavioral health EMR documentation. 
Your role is to enhance clinical notes while maintaining medical accuracy and compliance with documentation standards.
Always use professional medical terminology and ensure notes are comprehensive yet concise.
Follow SOAP note format when applicable.`
        userPrompt = `Please enhance and improve the following clinical note, making it more comprehensive and professionally written while maintaining the original clinical observations:

Note Type: ${noteType || "Progress Note"}
Current Content:
${noteContent}

Provide an enhanced version that:
1. Uses appropriate medical terminology
2. Is well-structured and organized
3. Includes relevant clinical details
4. Maintains objectivity
5. Is compliant with documentation standards`
        break

      case "suggestions":
        systemPrompt = `You are an expert clinical documentation assistant. Provide helpful suggestions for completing clinical documentation.`
        userPrompt = `Based on this partial clinical note, provide 3-5 specific suggestions for what additional information should be documented:

Note Type: ${noteType || "Progress Note"}
Current Content:
${noteContent}

Provide actionable suggestions in bullet point format.`
        break

      case "soap":
        systemPrompt = `You are an expert clinical documentation assistant. Convert clinical observations into proper SOAP note format.`
        userPrompt = `Convert the following clinical observations into a properly formatted SOAP note:

${noteContent}

Format the response with clear sections:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:`
        break

      case "summarize":
        systemPrompt = `You are an expert clinical documentation assistant. Provide concise clinical summaries.`
        userPrompt = `Provide a brief clinical summary (2-3 sentences) of the following note:

${noteContent}`
        break

      default:
        systemPrompt = `You are an expert clinical documentation assistant for a behavioral health EMR system.`
        userPrompt = `Help me with the following clinical documentation task:

${noteContent}`
    }

    const result = streamText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: systemPrompt,
      prompt: userPrompt,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("AI assist error:", error)
    return new Response(JSON.stringify({ error: "AI assistance failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
