"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  MessageSquare,
  FileText,
  Maximize,
  Minimize,
  CreditCard as Record,
  Square,
} from "lucide-react"

interface TelehealthSessionProps {
  sessionId: string
  onClose: () => void
}

export function TelehealthSession({ sessionId, onClose }: TelehealthSessionProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [aiNotes, setAiNotes] = useState("")

  // Simulated real-time transcription
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        const sampleTranscripts = [
          "Patient reports feeling anxious about upcoming job interview...",
          "Counselor: Can you tell me more about what specifically makes you anxious?",
          "Patient: I worry that I will not be able to answer their questions properly...",
          "Counselor: That is a very common concern. Let us explore some coping strategies...",
          "Patient: I have been practicing deep breathing like we discussed last session...",
        ]

        setTranscript((prev) => {
          const newLine = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)]
          return prev + (prev ? "\n" : "") + `[${new Date().toLocaleTimeString()}] ${newLine}`
        })
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [isRecording])

  // AI-generated notes based on transcript
  useEffect(() => {
    if (transcript && isTranscribing) {
      const timer = setTimeout(() => {
        setAiNotes(`
SUBJECTIVE:
- Patient reports increased anxiety regarding job interview
- Utilizing previously learned coping strategies (deep breathing)
- Expressing concerns about performance and adequacy

OBJECTIVE:
- Patient appears alert and engaged
- Appropriate affect for discussion topic
- Demonstrates recall of previous session content

ASSESSMENT:
- Generalized anxiety disorder - stable
- Patient showing progress in implementing coping strategies
- Continued need for cognitive behavioral interventions

PLAN:
- Continue weekly therapy sessions
- Practice interview scenarios in next session
- Assign homework: daily anxiety log
- Follow up on medication compliance with prescriber
        `)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [transcript, isTranscribing])

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    setIsTranscribing(!isTranscribing)
  }

  return (
    <div className={`fixed inset-0 bg-background z-50 ${isFullscreen ? "" : "inset-4 border rounded-lg shadow-lg"}`}>
      <div className="h-full flex flex-col">
        {/* Session Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Live Session</span>
            </div>
            <Badge variant="outline">Patient: John Doe</Badge>
            <Badge variant="secondary">Dr. Smith (LMSW)</Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant={isRecording ? "destructive" : "default"} onClick={toggleRecording}>
              {isRecording ? <Square className="h-4 w-4" /> : <Record className="h-4 w-4" />}
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Video Area */}
          <div className="flex-1 bg-black relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Video Session Active</p>
                <p className="text-sm opacity-75">Patient and Provider Connected</p>
              </div>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <Button
                size="sm"
                variant={videoEnabled ? "default" : "destructive"}
                onClick={() => setVideoEnabled(!videoEnabled)}
              >
                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant={audioEnabled ? "default" : "destructive"}
                onClick={() => setAudioEnabled(!audioEnabled)}
              >
                {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* AI Documentation Panel */}
          <div className="w-96 border-l bg-muted/30 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                AI Documentation
              </h3>
              <p className="text-sm text-muted-foreground">Real-time transcription and notes</p>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Live Transcript */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Live Transcript</h4>
                  {isRecording && (
                    <Badge variant="destructive" className="text-xs">
                      <Record className="mr-1 h-3 w-3" />
                      Recording
                    </Badge>
                  )}
                </div>
                <div className="bg-background border rounded-lg p-3 h-32 overflow-y-auto text-sm">
                  {transcript || "Start recording to see live transcription..."}
                </div>
              </div>

              {/* AI-Generated Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">AI-Generated SOAP Note</h4>
                  {isTranscribing && (
                    <Badge variant="secondary" className="text-xs">
                      Processing...
                    </Badge>
                  )}
                </div>
                <Textarea
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="AI will generate SOAP notes based on conversation..."
                  className="h-48 text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button className="w-full" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button variant="outline" className="w-full bg-transparent" size="sm">
                  Send for Review
                </Button>
                <Button variant="ghost" className="w-full" size="sm">
                  Export Transcript
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
