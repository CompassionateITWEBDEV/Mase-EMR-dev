"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Phone, Video, Send, X, Minimize2, Maximize2, Mic, MicOff } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface Message {
  id: string
  sender_type: "visitor" | "specialist" | "system" | "ai_bot"
  sender_name: string
  message_text: string
  created_at: string
}

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [chatStarted, setChatStarted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [visitorName, setVisitorName] = useState("")
  const [visitorEmail, setVisitorEmail] = useState("")
  const [sessionType, setSessionType] = useState("general_inquiry")
  const [isOnCall, setIsOnCall] = useState(false)
  const [callType, setCallType] = useState<"audio" | "video" | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [waitingForSpecialist, setWaitingForSpecialist] = useState(false)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Subscribe to real-time messages
  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("[v0] New message received:", payload.new)
          setMessages((prev) => [...prev, payload.new as Message])
          
          // Check if specialist joined
          if (payload.new.sender_type === "specialist") {
            setWaitingForSpecialist(false)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase])

  const startChat = async () => {
    if (!visitorName) {
      alert("Please enter your name")
      return
    }

    console.log("[v0] Starting chat session...")
    
    // Create chat session
    const { data: session, error } = await supabase
      .from("live_chat_sessions")
      .insert({
        session_type: sessionType,
        visitor_name: visitorName,
        visitor_email: visitorEmail,
        status: "waiting",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating chat session:", error)
      alert("Failed to start chat. Please try again.")
      return
    }

    console.log("[v0] Chat session created:", session.id)
    setSessionId(session.id)
    setChatStarted(true)
    setWaitingForSpecialist(true)
    
    // Add system message
    setMessages([
      {
        id: "system-1",
        sender_type: "system",
        sender_name: "MASE Support",
        message_text: "Thank you for contacting MASE. A resource specialist will be with you shortly. Average wait time is less than 2 minutes.",
        created_at: new Date().toISOString(),
      },
    ])

    // Check queue position
    checkQueuePosition(session.id)
  }

  const checkQueuePosition = async (sid: string) => {
    const { data, error } = await supabase
      .from("live_chat_sessions")
      .select("queue_position")
      .eq("id", sid)
      .single()

    if (data) {
      setQueuePosition(data.queue_position)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !sessionId) return

    console.log("[v0] Sending message:", newMessage)

    const { error } = await supabase
      .from("live_chat_messages")
      .insert({
        session_id: sessionId,
        sender_type: "visitor",
        sender_name: visitorName,
        message_type: "text",
        message_text: newMessage,
      })

    if (error) {
      console.error("[v0] Error sending message:", error)
      return
    }

    setNewMessage("")
  }

  const startAudioCall = async () => {
    console.log("[v0] Starting audio call...")
    setIsOnCall(true)
    setCallType("audio")
    
    // Create call log
    await supabase.from("live_call_logs").insert({
      session_id: sessionId,
      call_type: "audio",
      call_status: "initiated",
      initiated_by: "visitor",
    })

    // Add system message
    await supabase.from("live_chat_messages").insert({
      session_id: sessionId,
      sender_type: "system",
      message_type: "call_start",
      message_text: "Audio call started. AI transcription is active.",
    })
  }

  const startVideoCall = async () => {
    console.log("[v0] Starting video call...")
    setIsOnCall(true)
    setCallType("video")
    
    await supabase.from("live_call_logs").insert({
      session_id: sessionId,
      call_type: "video",
      call_status: "initiated",
      initiated_by: "visitor",
    })

    await supabase.from("live_chat_messages").insert({
      session_id: sessionId,
      sender_type: "system",
      message_type: "call_start",
      message_text: "Video call started. AI transcription is active.",
    })
  }

  const endCall = async () => {
    console.log("[v0] Ending call...")
    setIsOnCall(false)
    setCallType(null)
    
    await supabase.from("live_chat_messages").insert({
      session_id: sessionId,
      sender_type: "system",
      message_type: "call_end",
      message_text: "Call ended. Transcription will be available shortly.",
    })
  }

  const endChat = async () => {
    if (sessionId) {
      await supabase
        .from("live_chat_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", sessionId)
    }
    setIsOpen(false)
    setChatStarted(false)
    setSessionId(null)
    setMessages([])
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-96 shadow-2xl z-50 ${isMinimized ? "h-16" : "h-[600px]"} flex flex-col`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
        <div>
          <CardTitle className="text-base">MASE Live Support</CardTitle>
          <CardDescription className="text-xs">
            {waitingForSpecialist ? (
              <Badge variant="secondary" className="text-xs">
                Waiting... {queuePosition ? `Position: ${queuePosition}` : ""}
              </Badge>
            ) : chatStarted ? (
              <Badge variant="default" className="text-xs bg-green-500">Connected</Badge>
            ) : (
              "Chat with a resource specialist"
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-1">
          {chatStarted && !isOnCall && (
            <>
              <Button size="icon" variant="ghost" onClick={startAudioCall}>
                <Phone className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={startVideoCall}>
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button size="icon" variant="ghost" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={endChat}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          {!chatStarted ? (
            <CardContent className="flex-1 p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Your Name *</label>
                <Input
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email (optional)</label>
                <Input
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">How can we help?</label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="w-full mt-1 p-2 border rounded"
                >
                  <option value="general_inquiry">General Inquiry</option>
                  <option value="provider_registration">Provider Registration</option>
                  <option value="patient_screening">Patient Screening</option>
                  <option value="referral_support">Referral Support</option>
                  <option value="crisis_support">Crisis Support</option>
                </select>
              </div>
              <Button onClick={startChat} className="w-full">
                Start Chat
              </Button>
            </CardContent>
          ) : (
            <>
              {isOnCall && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-3 border-b text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {callType === "audio" ? <Phone className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                      <span className="text-sm font-medium">
                        {callType === "audio" ? "Audio" : "Video"} Call Active
                      </span>
                      <Badge variant="secondary" className="text-xs bg-red-500 text-white">AI Recording</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant={isMuted ? "destructive" : "secondary"}
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={endCall}>
                        End Call
                      </Button>
                    </div>
                  </div>
                  
                  {callType === "video" && (
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden h-48">
                      {/* Specialist video (main) */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <div className="text-center">
                          <Video className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-400">Specialist Video</p>
                        </div>
                      </div>
                      
                      {/* Your video (picture-in-picture) */}
                      <div className="absolute bottom-2 right-2 w-24 h-32 bg-gray-700 rounded border-2 border-white shadow-lg">
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Video className="h-6 w-6 mx-auto text-gray-400" />
                            <p className="text-xs text-gray-400 mt-1">You</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Live transcription indicator */}
                      <div className="absolute top-2 left-2 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                        AI Transcribing
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === "visitor" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.sender_type === "visitor"
                          ? "bg-blue-500 text-white"
                          : msg.sender_type === "system"
                          ? "bg-gray-100 text-gray-600 text-sm italic"
                          : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      {msg.sender_type !== "visitor" && msg.sender_type !== "system" && (
                        <p className="text-xs font-semibold mb-1">{msg.sender_name}</p>
                      )}
                      <p className="text-sm">{msg.message_text}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your message..."
                    disabled={waitingForSpecialist}
                  />
                  <Button onClick={sendMessage} disabled={waitingForSpecialist}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  )
}
