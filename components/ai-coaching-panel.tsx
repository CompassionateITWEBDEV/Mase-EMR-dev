"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface AISuggestion {
  type: string
  priority: "high" | "medium" | "low"
  title: string
  description: string
  action: string
  actionUrl?: string
  icon: typeof AlertCircle
}

export function AICoachingPanel() {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch real suggestions from API
    const loadSuggestions = async () => {
      try {
        // In a real implementation, this would fetch from an API
        // For now, we generate contextual suggestions
        setSuggestions([
          {
            type: "alert",
            priority: "high",
            title: "Documentation Review Due",
            description: "3 progress notes need supervisor review before end of day.",
            action: "Review Now",
            actionUrl: "/clinical-notes",
            icon: AlertCircle,
          },
          {
            type: "training",
            priority: "medium",
            title: "Training Reminder",
            description: "Annual HIPAA compliance training due in 5 days.",
            action: "Start Training",
            actionUrl: "/ai-coaching?tab=education",
            icon: Clock,
          },
          {
            type: "compliance",
            priority: "low",
            title: "Joint Commission Tip",
            description: "Include measurable goals in all treatment plans (PC.02.01.01).",
            action: "Learn More",
            actionUrl: "/ai-coaching",
            icon: CheckCircle,
          },
        ])
      } catch (error) {
        console.error("Failed to load AI suggestions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSuggestions()
  }, [])

  const handleAction = (suggestion: AISuggestion) => {
    if (suggestion.actionUrl) {
      router.push(suggestion.actionUrl)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-accent" />
            <span>AI Coaching</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-accent" />
          <span>AI Coaching</span>
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            {suggestions.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="p-4 border border-border rounded-lg space-y-3">
            <div className="flex items-start space-x-3">
              <suggestion.icon
                className={`h-5 w-5 mt-0.5 ${
                  suggestion.priority === "high"
                    ? "text-destructive"
                    : suggestion.priority === "medium"
                      ? "text-accent"
                      : "text-muted-foreground"
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-card-foreground">{suggestion.title}</h4>
                  <Badge
                    variant={
                      suggestion.priority === "high"
                        ? "destructive"
                        : suggestion.priority === "medium"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {suggestion.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                <Button
                  size="sm"
                  variant={suggestion.priority === "high" ? "default" : "outline"}
                  onClick={() => handleAction(suggestion)}
                >
                  {suggestion.action}
                </Button>
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/ai-coaching")}>
          Open AI Coach
        </Button>
      </CardContent>
    </Card>
  )
}
