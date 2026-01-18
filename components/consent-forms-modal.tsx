"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Shield, Heart, Users, AlertTriangle, CheckCircle, Clock, Ligature as Signature } from "lucide-react"

interface ConsentFormsModalProps {
  patient: any
  isOpen: boolean
  onClose: () => void
  onComplete: (data: any) => void
}

const consentForms = [
  {
    id: "treatment-consent",
    title: "Treatment Consent",
    description: "Consent for opioid treatment program services",
    icon: Heart,
    required: true,
    category: "treatment",
  },
  {
    id: "medication-consent",
    title: "Medication Administration",
    description: "Consent for methadone/buprenorphine treatment",
    icon: Shield,
    required: true,
    category: "treatment",
  },
  {
    id: "hipaa-authorization",
    title: "HIPAA Authorization",
    description: "Privacy practices and information sharing",
    icon: Shield,
    required: true,
    category: "privacy",
  },
  {
    id: "drug-testing-consent",
    title: "Drug Testing Consent",
    description: "Consent for urine drug screening",
    icon: FileText,
    required: true,
    category: "testing",
  },
  {
    id: "pregnancy-testing",
    title: "Pregnancy Testing",
    description: "Consent for pregnancy testing (if applicable)",
    icon: Heart,
    required: false,
    category: "testing",
  },
  {
    id: "telehealth-consent",
    title: "Telehealth Services",
    description: "Consent for virtual treatment sessions",
    icon: Users,
    required: false,
    category: "services",
  },
  {
    id: "emergency-contact",
    title: "Emergency Contact Authorization",
    description: "Authorization to contact emergency contacts",
    icon: AlertTriangle,
    required: true,
    category: "emergency",
  },
  {
    id: "take-home-medication",
    title: "Take-Home Medication",
    description: "Consent and responsibility for take-home doses",
    icon: Shield,
    required: false,
    category: "treatment",
  },
  {
    id: "photography-consent",
    title: "Photography/Recording",
    description: "Consent for photos and recordings for treatment",
    icon: FileText,
    required: false,
    category: "services",
  },
  {
    id: "research-participation",
    title: "Research Participation",
    description: "Optional participation in treatment research",
    icon: Users,
    required: false,
    category: "research",
  },
]

export function ConsentFormsModal({ patient, isOpen, onClose, onComplete }: ConsentFormsModalProps) {
  const [consentData, setConsentData] = useState<Record<string, any>>({})
  const [currentCategory, setCurrentCategory] = useState("treatment")
  const [signatures, setSignatures] = useState<Record<string, string>>({})

  const categories = [
    { id: "treatment", name: "Treatment", icon: Heart },
    { id: "privacy", name: "Privacy", icon: Shield },
    { id: "testing", name: "Testing", icon: FileText },
    { id: "services", name: "Services", icon: Users },
    { id: "emergency", name: "Emergency", icon: AlertTriangle },
    { id: "research", name: "Research", icon: Users },
  ]

  const getFormsByCategory = (category: string) => {
    return consentForms.filter((form) => form.category === category)
  }

  const isFormCompleted = (formId: string) => {
    return consentData[formId]?.completed || false
  }

  const getCompletionStats = () => {
    const requiredForms = consentForms.filter((form) => form.required)
    const completedRequired = requiredForms.filter((form) => isFormCompleted(form.id))
    const totalCompleted = consentForms.filter((form) => isFormCompleted(form.id))

    return {
      requiredCompleted: completedRequired.length,
      totalRequired: requiredForms.length,
      totalCompleted: totalCompleted.length,
      totalForms: consentForms.length,
    }
  }

  const handleFormComplete = (formId: string, data: any) => {
    setConsentData((prev) => ({
      ...prev,
      [formId]: {
        ...data,
        completed: true,
        completedAt: new Date().toISOString(),
        patientSignature: signatures[formId] || "",
      },
    }))
  }

  const handleComplete = () => {
    const stats = getCompletionStats()
    if (stats.requiredCompleted < stats.totalRequired) {
      alert("Please complete all required consent forms before proceeding.")
      return
    }

    onComplete({
      consentForms: consentData,
      completionStats: stats,
      completedAt: new Date().toISOString(),
    })
    onClose()
  }

  const stats = getCompletionStats()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Consent Forms - {patient?.name}
          </DialogTitle>
          <DialogDescription>Complete required consent and authorization forms for treatment</DialogDescription>
        </DialogHeader>

        {/* Progress Overview */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Consent Form Progress</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.requiredCompleted} of {stats.totalRequired} required forms completed
                </p>
              </div>
              <Badge variant={stats.requiredCompleted === stats.totalRequired ? "default" : "secondary"}>
                {stats.totalCompleted} / {stats.totalForms} Total
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(stats.requiredCompleted / stats.totalRequired) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs value={currentCategory} onValueChange={setCurrentCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            {categories.map((category) => {
              const categoryForms = getFormsByCategory(category.id)
              const completedInCategory = categoryForms.filter((form) => isFormCompleted(form.id)).length
              const IconComponent = category.icon

              return (
                <TabsTrigger key={category.id} value={category.id} className="flex flex-col gap-1">
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xs">{category.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {completedInCategory}/{categoryForms.length}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              <div className="grid gap-4">
                {getFormsByCategory(category.id).map((form) => {
                  const IconComponent = form.icon
                  const isCompleted = isFormCompleted(form.id)

                  return (
                    <Card key={form.id} className={`${isCompleted ? "border-green-200 bg-green-50" : ""}`}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-5 w-5" />
                            {form.title}
                            {form.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          {isCompleted ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Complete
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{form.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Form Content */}
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium mb-2">Consent Statement</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            {form.id === "treatment-consent" &&
                              "I consent to receive treatment services at this opioid treatment program. I understand the risks, benefits, and alternatives to treatment."}
                            {form.id === "medication-consent" &&
                              "I consent to receive medication-assisted treatment including methadone or buprenorphine as prescribed by the medical staff."}
                            {form.id === "hipaa-authorization" &&
                              "I authorize the use and disclosure of my protected health information for treatment, payment, and healthcare operations."}
                            {form.id === "drug-testing-consent" &&
                              "I consent to provide urine samples for drug testing as required by the treatment program."}
                            {form.id === "pregnancy-testing" &&
                              "I consent to pregnancy testing as medically necessary for safe treatment."}
                            {form.id === "telehealth-consent" &&
                              "I consent to receive treatment services via telehealth technology including video conferencing."}
                            {form.id === "emergency-contact" &&
                              "I authorize staff to contact my emergency contacts in case of medical emergency or treatment concerns."}
                            {form.id === "take-home-medication" &&
                              "I understand my responsibilities for safely storing and taking home medication doses."}
                            {form.id === "photography-consent" &&
                              "I consent to photography or recording for treatment documentation purposes only."}
                            {form.id === "research-participation" &&
                              "I consent to participate in approved research studies related to addiction treatment."}
                          </p>
                        </div>

                        {/* Patient Agreement */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={consentData[form.id]?.agreed || false}
                              onCheckedChange={(checked) => {
                                setConsentData((prev) => ({
                                  ...prev,
                                  [form.id]: {
                                    ...prev[form.id],
                                    agreed: !!checked,
                                  },
                                }))
                              }}
                            />
                            <Label className="text-sm">I have read and understand this consent form</Label>
                          </div>
                        </div>

                        {/* Digital Signature */}
                        <div className="space-y-2">
                          <Label>Patient Signature</Label>
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Type full name as digital signature"
                              value={signatures[form.id] || ""}
                              onChange={(e) =>
                                setSignatures((prev) => ({
                                  ...prev,
                                  [form.id]: e.target.value,
                                }))
                              }
                              className="flex-1"
                              rows={2}
                            />
                            <Button
                              size="sm"
                              disabled={!consentData[form.id]?.agreed || !signatures[form.id]}
                              onClick={() => handleFormComplete(form.id, consentData[form.id] || {})}
                            >
                              <Signature className="mr-2 h-4 w-4" />
                              Sign
                            </Button>
                          </div>
                        </div>

                        {isCompleted && (
                          <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-medium">Form Completed</span>
                            </div>
                            <p className="text-sm text-green-700 mt-1">
                              Signed on {new Date(consentData[form.id]?.completedAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={stats.requiredCompleted < stats.totalRequired}>
            Complete Consent Process
            {stats.requiredCompleted < stats.totalRequired && (
              <Badge variant="destructive" className="ml-2">
                {stats.totalRequired - stats.requiredCompleted} Required
              </Badge>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
