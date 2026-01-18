/**
 * AI Assistant Chat API Route
 * Handles interactive chat between the provider and the AI assistant.
 * Uses patient context and conversation history to generate responses.
 */

import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getAuthenticatedUser } from "@/lib/auth/middleware";
import {
  aggregatePatientContext,
  formatPatientDataForPrompt,
} from "@/lib/services/patient-data-aggregator";
import { normalizeRole, getRoleSystemPromptAddition } from "@/lib/services/role-context";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  patientId: string;
  specialtyId?: string;
  messages: ChatMessage[];
}

/**
 * POST /api/ai-assistant/chat
 * Generates a chat response based on conversation history and patient context.
 */
export async function POST(request: Request) {
  // Authenticate user
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ChatRequestBody;
  const { patientId, specialtyId = "primary-care", messages } = body;
  if (!patientId || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "patientId and messages are required" },
      { status: 400 }
    );
  }

  try {
    // Aggregate patient data (without notes to reduce latency)
    const patientContext = await aggregatePatientContext(patientId, false, 0);
    const patientDataText = formatPatientDataForPrompt(patientContext);

    // Normalize user role for potential future role-based customization
    const userRole = (user as any)?.role || (user as any)?.staff?.role || null;
    const normalizedRole = normalizeRole(userRole);
    const rolePromptAddition = getRoleSystemPromptAddition(normalizedRole);

    // Build conversation transcript
    const convo = messages
      .map((m) => `${m.role === "assistant" ? "ASSISTANT" : "USER"}: ${m.content}`)
      .join("\n");

    // Construct system and user prompts
    const systemPrompt = `You are a helpful clinical assistant. Your role is to answer follow-up questions and provide additional information to healthcare providers based on the patient's context and prior analysis. The information you provide must be evidence-based, clinically relevant, and concise. ${rolePromptAddition}`;
    const userPrompt = `Patient Context:\n${patientDataText}\n\nConversation History:\n${convo}\n\nRespond to the user's last input with a clear, concise, and clinically appropriate answer. If the question is outside your scope or lacks sufficient context, politely ask for clarification.`;

    // Generate AI response
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.4,
    });

    // Return the assistant's response
    return NextResponse.json({ answer: text.trim() });
  } catch (error) {
    console.error("Error during chat response generation:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the chat response." },
      { status: 500 }
    );
  }
}