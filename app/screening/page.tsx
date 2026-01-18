import Link from "next/link"
import { ArrowRight, Shield, Clock, FileText, Heart, Brain, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const screeningTools = [
  {
    id: "phq-9",
    title: "Depression Screening (PHQ-9)",
    description: "A 9-question assessment to evaluate symptoms of depression over the past two weeks.",
    duration: "2-3 minutes",
    icon: Heart,
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "gad-7",
    title: "Anxiety Screening (GAD-7)",
    description: "A 7-question assessment to measure the severity of generalized anxiety symptoms.",
    duration: "2-3 minutes",
    icon: Brain,
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    id: "general",
    title: "General Mental Health Check-In",
    description: "A comprehensive assessment covering mood, stress, sleep, and overall well-being.",
    duration: "5-7 minutes",
    icon: Users,
    color: "bg-teal-500/10 text-teal-600",
  },
]

export default function ScreeningPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-teal-50 to-background px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-2 text-sm font-medium text-teal-700">
            <Shield className="h-4 w-4" />
            100% Anonymous & Confidential
          </div>
          <h1 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Free Mental Health Screenings
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
            Take a confidential self-assessment to better understand your mental health. No account required, and your
            results are never stored.
          </p>
        </div>
      </section>

      {/* Privacy Notice */}
      <section className="border-b bg-muted/30 px-4 py-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 md:flex-row md:justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-teal-600" />
            <span>No personal information collected</span>
          </div>
          <div className="hidden h-4 w-px bg-border md:block" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-teal-600" />
            <span>Results shown immediately</span>
          </div>
          <div className="hidden h-4 w-px bg-border md:block" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 text-teal-600" />
            <span>Evidence-based assessments</span>
          </div>
        </div>
      </section>

      {/* Screening Tools */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-semibold text-foreground">Choose a Screening Tool</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {screeningTools.map((tool) => (
              <Card key={tool.id} className="group transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl ${tool.color}`}>
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{tool.duration}</span>
                  </div>
                  <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
                    <Link href={`/screening/${tool.id}`}>
                      Start Screening
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="bg-amber-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-amber-200 bg-white p-6">
            <h3 className="mb-3 font-semibold text-amber-800">Important Notice</h3>
            <p className="mb-4 text-sm text-amber-700">
              These screening tools are for educational purposes only and are not a substitute for professional
              diagnosis or treatment. If you are experiencing a mental health crisis, please seek immediate help.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="border-amber-300 text-amber-800 hover:bg-amber-100 bg-transparent"
                asChild
              >
                <a href="tel:988">Call 988 (Crisis Line)</a>
              </Button>
              <Button
                variant="outline"
                className="border-amber-300 text-amber-800 hover:bg-amber-100 bg-transparent"
                asChild
              >
                <a href="sms:741741">Text HOME to 741741</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">After Your Screening</h2>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
            Based on your results, we'll provide personalized resources and, if appropriate, guide you through the next
            steps to connect with care.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-3 text-3xl font-bold text-teal-600">1</div>
              <h3 className="mb-2 font-medium">Get Your Results</h3>
              <p className="text-sm text-muted-foreground">See your screening score and what it means right away.</p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-3 text-3xl font-bold text-teal-600">2</div>
              <h3 className="mb-2 font-medium">Review Resources</h3>
              <p className="text-sm text-muted-foreground">Access educational materials tailored to your results.</p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-3 text-3xl font-bold text-teal-600">3</div>
              <h3 className="mb-2 font-medium">Connect with Care</h3>
              <p className="text-sm text-muted-foreground">
                If recommended, start the intake process to speak with a provider.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
