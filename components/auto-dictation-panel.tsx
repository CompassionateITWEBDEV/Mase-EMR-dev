"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic, Square, FileText, Brain, Check, Edit, Download, Settings } from "lucide-react"

export function AutoDictationPanel() {
  const [isListening, setIsListening] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [dictatedText, setDictatedText] = useState("")
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])

  const documentTemplates = [
    { value: "soap", label: "SOAP Note" },
    { value: "assessment", label: "Biopsychosocial Assessment" },
    { value: "treatment", label: "Treatment Plan" },
    { value: "progress", label: "Progress Note" },
    { value: "discharge", label: "Discharge Summary" },
    { value: "intake", label: "Intake Assessment" },
  ]

  const pendingReviews = [
    {
      id: "1",
      patient: "Sarah Johnson",
      type: "SOAP Note",
      date: "Today, 2:30 PM",
      provider: "Dr. Smith",
      status: "pending",
      confidence: 95,
    },
    {
      id: "2",
      patient: "Michael Chen",
      type: "Progress Note",
      date: "Today, 1:15 PM",
      provider: "Lisa Brown",
      status: "reviewed",
      confidence: 88,
    },
    {
      id: "3",
      patient: "Emma Davis",
      type: "Treatment Plan",
      date: "Today, 11:45 AM",
      provider: "Dr. Wilson",
      status: "approved",
      confidence: 92,
    },
  ]

  const toggleListening = () => {
    setIsListening(!isListening)
    if (!isListening) {
      // Simulate real-time dictation
      setTimeout(() => {
        setDictatedText(
          "Patient reports feeling significantly better since last session. Anxiety levels have decreased from 8/10 to 4/10. Patient has been compliant with medication regimen and attending therapy sessions regularly. Sleep patterns have improved...",
        )
        setAiSuggestions([
          "Consider adjusting medication dosage",
          "Schedule follow-up in 2 weeks",
          "Recommend continued therapy sessions",
          "Assess for side effects",
        ])
      }, 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Live Dictation Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="mr-2 h-5 w-5" />
            Live Auto-Dictation
          </CardTitle>
          <CardDescription>AI-powered real-time transcription and documentation for sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTemplates.map((template) => (
                  <SelectItem key={template.value} value={template.value}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={toggleListening}
              variant={isListening ? "destructive" : "default"}
              className="flex items-center"
            >
              {isListening ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Listening
                </>
              )}
            </Button>

            {isListening && (
              <Badge variant="destructive" className="animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                Recording
              </Badge>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Live Transcription</h4>
              <Textarea
                value={dictatedText}
                onChange={(e) => setDictatedText(e.target.value)}
                placeholder="Start speaking to see real-time transcription..."
                className="h-48"
              />
            </div>

            <div>
              <h4 className="font-medium mb-2">AI Suggestions</h4>
              <div className="space-y-2 h-48 overflow-y-auto">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{suggestion}</span>
                    <Button size="sm" variant="ghost">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {aiSuggestions.length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Brain className="mr-2 h-5 w-5" />
                    AI suggestions will appear here
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button className="flex-1">
              <FileText className="mr-2 h-4 w-4" />
              Generate Document
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews & Signatures</CardTitle>
          <CardDescription>AI-generated documents awaiting provider review and approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingReviews.map((review) => (
              <div key={review.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{review.patient}</p>
                    <p className="text-sm text-muted-foreground">
                      {review.type} • {review.date} • {review.provider}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge
                        variant={
                          review.status === "approved"
                            ? "default"
                            : review.status === "reviewed"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {review.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">AI Confidence: {review.confidence}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {review.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                      <Button size="sm">
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </>
                  )}
                  {review.status === "reviewed" && (
                    <Button size="sm">
                      <Check className="mr-2 h-4 w-4" />
                      Sign
                    </Button>
                  )}
                  {review.status === "approved" && (
                    <Button size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
