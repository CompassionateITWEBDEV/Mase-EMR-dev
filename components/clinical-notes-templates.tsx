"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Baby, Brain, FileText, Heart, ScanFace, Stethoscope, Zap } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ClinicalNotesTemplates() {
  const { data, isLoading } = useSWR("/api/specialty-config", fetcher)
  const activeSpecialties = data?.specialties?.map((s: any) => s.specialty_id) || []

  const specialtyTemplates = [
    {
      id: "behavioral-health",
      name: "Behavioral Health",
      icon: Brain,
      color: "bg-purple-500",
      templates: ["SOAP Note", "Progress Note", "COWS Assessment", "CIWA Assessment"],
    },
    {
      id: "primary-care",
      name: "Primary Care",
      icon: Stethoscope,
      color: "bg-blue-500",
      templates: ["Annual Physical", "Sick Visit", "Chronic Care Management", "Preventive Care"],
    },
    {
      id: "podiatry",
      name: "Podiatry",
      icon: Activity,
      color: "bg-pink-500",
      templates: ["Diabetic Foot Exam", "Nail Procedure", "Biomechanical Assessment", "Wound Care"],
    },
    {
      id: "obgyn",
      name: "OB/GYN",
      icon: Heart,
      color: "bg-rose-500",
      templates: ["Prenatal Visit", "Annual GYN Exam", "Ultrasound Report", "Labor & Delivery"],
    },
    {
      id: "psychiatry",
      name: "Psychiatry",
      icon: Brain,
      color: "bg-indigo-500",
      templates: ["Psych Evaluation", "Medication Management", "PHQ-9/GAD-7", "Crisis Assessment"],
    },
    {
      id: "cardiology",
      name: "Cardiology",
      icon: Activity,
      color: "bg-red-500",
      templates: ["Cardiac Consult", "ECG Interpretation", "Echo Report", "Stress Test"],
    },
    {
      id: "dermatology",
      name: "Dermatology",
      icon: ScanFace,
      color: "bg-amber-500",
      templates: ["Skin Cancer Screening", "Biopsy Report", "Acne Treatment", "Phototherapy"],
    },
    {
      id: "pediatrics",
      name: "Pediatrics",
      icon: Baby,
      color: "bg-teal-500",
      templates: ["Well Child Visit", "Immunization Record", "Growth Assessment", "School Physical"],
    },
    {
      id: "urgent-care",
      name: "Urgent Care",
      icon: Zap,
      color: "bg-yellow-500",
      templates: ["Acute Illness", "Minor Injury", "Laceration Repair", "Work/School Note"],
    },
  ]

  const activeTemplates = specialtyTemplates.filter((s) => activeSpecialties.includes(s.id))

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading templates...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (activeTemplates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Specialties</CardTitle>
          <CardDescription>
            Configure your specialties in Subscription Settings to see specialty-specific templates
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Active Specialty Templates</h3>
        <p className="text-sm text-muted-foreground">
          Note templates configured for your {activeTemplates.length} active{" "}
          {activeTemplates.length === 1 ? "specialty" : "specialties"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeTemplates.map((specialty) => {
          const IconComponent = specialty.icon
          return (
            <Card key={specialty.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${specialty.color}`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-base">{specialty.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {specialty.templates.map((template, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{template}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-6">
          <p className="text-sm">
            <Badge variant="outline" className="mr-2">
              Tip
            </Badge>
            All specialty templates include ICD-10 code suggestions, vital signs trending, and AI-powered documentation
            assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
