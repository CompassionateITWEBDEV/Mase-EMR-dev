"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Phone, BookOpen, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ScreeningData {
  title: string
  subtitle: string
  description: string
  questions: string[]
  options: { value: number; label: string }[]
  scoring: { min: number; max: number; severity: string; color: string; recommendation: string }[]
}

interface ScreeningAssessmentProps {
  type: string
  data: ScreeningData
}

export function ScreeningAssessment({ type, data }: ScreeningAssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)

  const totalQuestions = data.questions.length
  const progress = (Object.keys(answers).length / totalQuestions) * 100
  const currentAnswer = answers[currentQuestion]

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: Number.parseInt(value) }))
  }

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const calculateScore = () => {
    return Object.values(answers).reduce((sum, val) => sum + val, 0)
  }

  const getResult = () => {
    const score = calculateScore()
    return data.scoring.find((s) => score >= s.min && score <= s.max) || data.scoring[0]
  }

  const resetAssessment = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setShowResults(false)
  }

  if (showResults) {
    const result = getResult()
    const score = calculateScore()
    const maxScore = totalQuestions * 3

    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {result.color === "green" ? (
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "inline-flex h-16 w-16 items-center justify-center rounded-full",
                      result.color === "yellow" && "bg-yellow-100",
                      result.color === "orange" && "bg-orange-100",
                      result.color === "red" && "bg-red-100",
                    )}
                  >
                    <AlertTriangle
                      className={cn(
                        "h-8 w-8",
                        result.color === "yellow" && "text-yellow-600",
                        result.color === "orange" && "text-orange-600",
                        result.color === "red" && "text-red-600",
                      )}
                    />
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl">Your Results</CardTitle>
              <CardDescription>{data.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Display */}
              <div className="rounded-xl border bg-muted/30 p-6 text-center">
                <div className="mb-2 text-sm text-muted-foreground">Your Score</div>
                <div className="mb-2 text-4xl font-bold text-foreground">
                  {score} <span className="text-lg font-normal text-muted-foreground">/ {maxScore}</span>
                </div>
                <div
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-sm font-medium",
                    result.color === "green" && "bg-green-100 text-green-700",
                    result.color === "yellow" && "bg-yellow-100 text-yellow-700",
                    result.color === "orange" && "bg-orange-100 text-orange-700",
                    result.color === "red" && "bg-red-100 text-red-700",
                  )}
                >
                  {result.severity}
                </div>
              </div>

              {/* Recommendation */}
              <div className="rounded-xl border p-4">
                <h3 className="mb-2 font-semibold text-foreground">What This Means</h3>
                <p className="text-sm text-muted-foreground">{result.recommendation}</p>
              </div>

              {/* Crisis Warning for high scores */}
              {(result.color === "red" || result.color === "orange") && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <h4 className="mb-1 font-semibold text-red-800">Need immediate support?</h4>
                      <p className="mb-3 text-sm text-red-700">
                        If you're in crisis or having thoughts of self-harm, please reach out for help:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" className="bg-red-600 hover:bg-red-700" asChild>
                          <a href="tel:988">Call 988</a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 bg-transparent"
                          asChild
                        >
                          <a href="sms:741741">Text 741741</a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Recommended Next Steps</h3>
                <div className="grid gap-3">
                  <Link
                    href="/education"
                    className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                      <BookOpen className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="font-medium">Explore Resources</div>
                      <div className="text-sm text-muted-foreground">Learn more about mental health topics</div>
                    </div>
                  </Link>
                  {result.color !== "green" && (
                    <Link
                      href="/referral"
                      className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Connect with Care</div>
                        <div className="text-sm text-muted-foreground">Start the process to speak with a provider</div>
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={resetAssessment}>
                  Take Again
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent" asChild>
                  <Link href="/screening">Try Another Screening</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            This screening tool is for educational purposes only and does not constitute a medical diagnosis. Please
            consult a healthcare professional for proper evaluation and treatment.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link href="/screening">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Screenings
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{data.title}</h1>
          <p className="mt-2 text-muted-foreground">{data.description}</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Question {currentQuestion + 1} of {totalQuestions}
            </span>
            <span className="font-medium text-teal-600">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium leading-relaxed">
              {currentQuestion + 1}. {data.questions[currentQuestion]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={currentAnswer?.toString()} onValueChange={handleAnswer} className="space-y-3">
              {data.options.map((option) => (
                <div key={option.value} className="flex items-center">
                  <RadioGroupItem
                    value={option.value.toString()}
                    id={`option-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`option-${option.value}`}
                    className="flex w-full cursor-pointer items-center rounded-lg border p-4 transition-colors hover:bg-muted/50 peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:bg-teal-50"
                  >
                    <div className="mr-4 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:bg-teal-600">
                      {currentAnswer === option.value && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <span className="font-medium">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentAnswer === undefined}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {currentQuestion === totalQuestions - 1 ? "See Results" : "Next"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Answered Questions Indicator */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {data.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={cn(
                "h-3 w-3 rounded-full transition-colors",
                index === currentQuestion ? "bg-teal-600" : answers[index] !== undefined ? "bg-teal-300" : "bg-muted",
              )}
              aria-label={`Go to question ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
