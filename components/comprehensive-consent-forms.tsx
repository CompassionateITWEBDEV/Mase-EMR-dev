"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Shield, Heart, Users, CheckCircle, Clock, Fingerprint, Lock, Save } from "lucide-react"

interface ComprehensiveConsentFormsProps {
  patient: any
  isOpen: boolean
  onClose: () => void
  onComplete: (data: any) => void
}

const allConsentForms = [
  // Privacy & Authorization
  {
    id: "release-of-information",
    title: "Release of Information",
    category: "privacy",
    required: true,
    content: "I authorize the release of my health information as necessary for treatment, payment, and operations.",
  },
  {
    id: "hipaa-privacy-notice",
    title: "HIPAA Privacy Notice & Authorization",
    category: "privacy",
    required: true,
    content:
      "I acknowledge receipt of the HIPAA Notice of Privacy Practices and authorize use of my health information.",
  },
  {
    id: "cfr-42-consent",
    title: "Consent for Release of Confidential Alcohol or Drug Treatment Information (42 CFR Part 2)",
    category: "privacy",
    required: true,
    content:
      "I consent to the disclosure of my substance abuse treatment records in accordance with 42 CFR Part 2 regulations.",
  },
  {
    id: "confidentiality-notice",
    title: "Client Notice of Confidentiality",
    category: "privacy",
    required: true,
    content: "I understand the confidentiality protections that apply to my substance abuse treatment records.",
  },
  {
    id: "recipient-rights",
    title: "Acknowledgement of Recipient Rights and Confidentiality",
    category: "privacy",
    required: true,
    content:
      "I acknowledge my rights as a recipient of behavioral health services and understand confidentiality rules.",
  },

  // Treatment Agreements
  {
    id: "behavior-health-contract",
    title: "Behavior Health Contract",
    category: "treatment",
    required: true,
    content: "I agree to participate in treatment and follow the program rules and expectations.",
  },
  {
    id: "consent-to-treatment",
    title: "Consent To Treatment",
    category: "treatment",
    required: true,
    content: "I consent to receive behavioral health treatment services at this facility.",
  },
  {
    id: "coordination-of-treatment",
    title: "Coordination of Treatment",
    category: "treatment",
    required: true,
    content: "I consent to coordination of my care with other healthcare providers as needed.",
  },
  {
    id: "clients-rights-limits",
    title: "Clients Rights and Limits of Confidentiality",
    category: "treatment",
    required: true,
    content: "I understand my rights as a client and the limits of confidentiality in treatment.",
  },
  {
    id: "client-responsibility",
    title: "Clients Responsibility",
    category: "treatment",
    required: true,
    content: "I understand my responsibilities as a client in treatment including attendance and participation.",
  },

  // Telehealth & Technology
  {
    id: "telehealth-consent",
    title: "Tele-Mental Health Informed Consent",
    category: "telehealth",
    required: false,
    content: "I consent to receive mental health services via telehealth technology.",
  },
  {
    id: "telehealth-welcoming",
    title: "Telemental Health Informed Consent - Welcoming Declaration",
    category: "telehealth",
    required: false,
    content: "I acknowledge the welcoming declaration for telemental health services.",
  },
  {
    id: "communication-reminders",
    title: "Consent to Email, Text or Telephone Appointment Reminders",
    category: "telehealth",
    required: false,
    content: "I consent to receive appointment reminders via email, text message, or telephone.",
  },

  // Advanced Directives
  {
    id: "advance-directive",
    title: "Advance Directive (Acceptance by Client's Advocate)",
    category: "legal",
    required: false,
    content: "I acknowledge my advance directive for medical and mental health care decisions.",
  },
  {
    id: "advance-directive-acknowledgement",
    title: "Acknowledgement of Notice of Advance Directive for Medical and Mental Health Care Choices",
    category: "legal",
    required: true,
    content: "I acknowledge receipt of information about advance directives for healthcare decisions.",
  },

  // Assessment Forms
  {
    id: "substance-abuse-history",
    title: "Substance Abuse Treatment History",
    category: "assessment",
    required: true,
    content: "Comprehensive history of substance use and previous treatment episodes.",
  },
  {
    id: "education-history",
    title: "Education History",
    category: "assessment",
    required: true,
    content: "Educational background and learning needs assessment.",
  },
  {
    id: "nutrition-wellness-history",
    title: "Nutrition & Wellness History",
    category: "assessment",
    required: true,
    content: "Assessment of nutritional status and wellness needs.",
  },
  {
    id: "mental-health-part1",
    title: "Mental Health Assessment Part 1",
    category: "assessment",
    required: true,
    content: "Comprehensive mental health history and current symptoms.",
  },
  {
    id: "mental-health-part2",
    title: "Mental Health Assessment Part 2",
    category: "assessment",
    required: true,
    content: "Continued mental health assessment including risk factors.",
  },
  {
    id: "drug-abuse-history",
    title: "Drug Abuse History",
    category: "assessment",
    required: true,
    content: "Detailed history of substance use patterns and consequences.",
  },

  // Clinical Assessments
  {
    id: "cows-part1",
    title: "Clinical Opiate Withdrawal Scale (COWS) Part 1",
    category: "clinical",
    required: false,
    content: "Assessment of opiate withdrawal symptoms - Part 1.",
  },
  {
    id: "cows-part2",
    title: "Clinical Opiate Withdrawal Scale (COWS) Part 2",
    category: "clinical",
    required: false,
    content: "Assessment of opiate withdrawal symptoms - Part 2.",
  },
  {
    id: "tb-testing",
    title: "TB Testing Consent",
    category: "clinical",
    required: true,
    content: "Consent for tuberculosis testing as required by health regulations.",
  },
  {
    id: "pain-risk-assessment",
    title: "Pain Risk Factors Assessment Form",
    category: "clinical",
    required: false,
    content: "Assessment of pain and risk factors for chronic pain management.",
  },
  {
    id: "clinical-nursing-assessment",
    title: "Clinical Nursing Assessment",
    category: "clinical",
    required: true,
    content: "Comprehensive nursing assessment and vital signs.",
  },

  // Mental Health Screenings
  {
    id: "phq9",
    title: "Patient Health Questionnaire (PHQ-9)",
    category: "mental-health",
    required: true,
    content: "Depression screening questionnaire.",
  },
  {
    id: "phq9-part1",
    title: "Patient Health Questionnaire (PHQ-9) Part 1",
    category: "mental-health",
    required: true,
    content: "Depression screening questionnaire - Part 1.",
  },
  {
    id: "suicide-risk-1",
    title: "Suicide Prevention Risk Assessment 1",
    category: "mental-health",
    required: true,
    content: "Initial suicide risk screening.",
  },
  {
    id: "suicide-risk-2",
    title: "Suicide Prevention Risk Assessment 2",
    category: "mental-health",
    required: true,
    content: "Detailed suicide risk assessment.",
  },
  {
    id: "suicide-risk-3",
    title: "Suicide Prevention Risk Assessment 3",
    category: "mental-health",
    required: true,
    content: "Comprehensive suicide risk evaluation.",
  },
  {
    id: "recovery-wellness-plan",
    title: "Recovery Wellness Plan",
    category: "mental-health",
    required: true,
    content: "Individualized plan for recovery and wellness.",
  },

  // Medical & Medication
  {
    id: "physician-request-form",
    title: "Physician Request Form",
    category: "medical",
    required: false,
    content: "Request for physician services or consultation.",
  },
  {
    id: "medication-dispensing",
    title: "Acknowledgement for Dispensing, Medication and Drug Screening Policies",
    category: "medical",
    required: true,
    content: "I understand the medication dispensing and drug screening policies.",
  },

  // Peer Support
  {
    id: "peer-recovery-services",
    title: "Peer Recovery Services Consent",
    category: "peer-support",
    required: false,
    content: "Consent for peer recovery support services.",
  },
  {
    id: "peer-support-note",
    title: "Peer Support Progress Note",
    category: "peer-support",
    required: false,
    content: "Documentation of peer support services received.",
  },

  // Rights & Complaints
  {
    id: "infractions-discharge",
    title: "Infractions That Can Lead to Discharge",
    category: "rights",
    required: true,
    content: "I understand the program rules and consequences including potential discharge.",
  },
  {
    id: "complaint-grievance",
    title: "Medicaid Recipient Substance Abuse Services Complaint/Grievance Rights Process",
    category: "rights",
    required: true,
    content: "I understand my rights to file complaints and grievances.",
  },
  {
    id: "hipaa-notice-acknowledgement",
    title: "HIPAA Notice of Privacy Practices Acknowledgement",
    category: "rights",
    required: true,
    content: "I acknowledge receipt of the HIPAA Notice of Privacy Practices.",
  },
]

const categories = [
  { id: "privacy", name: "Privacy & Authorization", icon: Shield },
  { id: "treatment", name: "Treatment Agreements", icon: Heart },
  { id: "assessment", name: "Assessments", icon: FileText },
  { id: "clinical", name: "Clinical", icon: Heart },
  { id: "mental-health", name: "Mental Health", icon: Heart },
  { id: "medical", name: "Medical", icon: Heart },
  { id: "telehealth", name: "Telehealth", icon: Users },
  { id: "peer-support", name: "Peer Support", icon: Users },
  { id: "legal", name: "Legal", icon: Shield },
  { id: "rights", name: "Rights", icon: FileText },
]

export function ComprehensiveConsentForms({ patient, isOpen, onClose, onComplete }: ComprehensiveConsentFormsProps) {
  const [consentData, setConsentData] = useState<Record<string, any>>({})
  const [currentCategory, setCurrentCategory] = useState("privacy")
  const [verificationMethod, setVerificationMethod] = useState<"pin" | "fingerprint" | "facial">("pin")
  const [pin, setPin] = useState("")
  const [savedSignature, setSavedSignature] = useState("")
  const [signaturePin, setSignaturePin] = useState("")

  const handleVerification = (formId: string) => {
    if (verificationMethod === "pin") {
      if (pin.length !== 4) {
        alert("Please enter a 4-digit PIN")
        return false
      }
      // Verify PIN (in production, verify against stored PIN)
      return true
    } else if (verificationMethod === "fingerprint") {
      // Simulate fingerprint scan
      alert("Place finger on scanner...")
      return true
    } else if (verificationMethod === "facial") {
      // Simulate facial recognition
      alert("Position face in camera...")
      return true
    }
    return false
  }

  const handleSaveSignature = () => {
    if (signaturePin.length !== 4) {
      alert("Please set a 4-digit PIN for your signature")
      return
    }
    setSavedSignature(patient?.name || "")
    alert("Signature saved! You can now use your PIN to sign forms quickly.")
  }

  const handleApplySavedSignature = (formId: string) => {
    if (!savedSignature) {
      alert("No saved signature found. Please create one first.")
      return
    }
    if (pin.length !== 4 || pin !== signaturePin) {
      alert("Invalid PIN")
      return
    }
    handleFormComplete(formId, { signature: savedSignature, method: "saved-pin" })
  }

  const getFormsByCategory = (category: string) => {
    return allConsentForms.filter((form) => form.category === category)
  }

  const isFormCompleted = (formId: string) => {
    return consentData[formId]?.completed || false
  }

  const getCompletionStats = () => {
    const requiredForms = allConsentForms.filter((form) => form.required)
    const completedRequired = requiredForms.filter((form) => isFormCompleted(form.id))
    const totalCompleted = allConsentForms.filter((form) => isFormCompleted(form.id))

    return {
      requiredCompleted: completedRequired.length,
      totalRequired: requiredForms.length,
      totalCompleted: totalCompleted.length,
      totalForms: allConsentForms.length,
    }
  }

  const handleFormComplete = (formId: string, data: any) => {
    if (!handleVerification(formId)) {
      return
    }

    setConsentData((prev) => ({
      ...prev,
      [formId]: {
        ...data,
        completed: true,
        completedAt: new Date().toISOString(),
        verificationMethod,
        verifiedBy: patient?.name,
      },
    }))
  }

  const handleCompleteAll = () => {
    const stats = getCompletionStats()
    if (stats.requiredCompleted < stats.totalRequired) {
      alert(`Please complete all ${stats.totalRequired} required consent forms before proceeding.`)
      return
    }

    onComplete({
      consentForms: consentData,
      completionStats: stats,
      completedAt: new Date().toISOString(),
      savedSignature,
    })
    onClose()
  }

  const stats = getCompletionStats()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Comprehensive Consent Forms - {patient?.name}
          </DialogTitle>
          <DialogDescription>
            Complete all required consent forms. {stats.totalForms} total forms ({stats.totalRequired} required)
          </DialogDescription>
        </DialogHeader>

        {/* Progress Overview */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-medium">Form Completion Progress</h3>
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

        {/* Signature Management */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Signature Management</CardTitle>
            <CardDescription>Save your signature with a PIN for faster form completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Create/Update Saved Signature</Label>
                <div className="flex gap-2">
                  <Input placeholder="Enter full name" defaultValue={patient?.name} className="flex-1" disabled />
                  <Input
                    type="password"
                    placeholder="4-digit PIN"
                    maxLength={4}
                    value={signaturePin}
                    onChange={(e) => setSignaturePin(e.target.value.replace(/\D/g, ""))}
                    className="w-32"
                  />
                  <Button onClick={handleSaveSignature}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
                {savedSignature && (
                  <p className="text-xs text-green-600">✓ Signature saved. Use PIN to sign forms quickly.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Verification Method</Label>
                <div className="flex gap-2">
                  <Button
                    variant={verificationMethod === "pin" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVerificationMethod("pin")}
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    PIN
                  </Button>
                  <Button
                    variant={verificationMethod === "fingerprint" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVerificationMethod("fingerprint")}
                  >
                    <Fingerprint className="h-4 w-4 mr-1" />
                    Fingerprint
                  </Button>
                  <Button
                    variant={verificationMethod === "facial" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVerificationMethod("facial")}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Facial
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={currentCategory} onValueChange={setCurrentCategory} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
            {categories.map((category) => {
              const categoryForms = getFormsByCategory(category.id)
              const completedInCategory = categoryForms.filter((form) => isFormCompleted(form.id)).length
              const IconComponent = category.icon

              return (
                <TabsTrigger key={category.id} value={category.id} className="flex flex-col gap-1 text-xs">
                  <IconComponent className="h-3 w-3" />
                  <span className="text-[10px]">{category.name}</span>
                  <Badge variant="outline" className="text-[9px] px-1">
                    {completedInCategory}/{categoryForms.length}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-3">
              <div className="grid gap-3">
                {getFormsByCategory(category.id).map((form) => {
                  const IconComponent = category.icon
                  const isCompleted = isFormCompleted(form.id)

                  return (
                    <Card key={form.id} className={`${isCompleted ? "border-green-200 bg-green-50" : ""}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {form.title}
                            {form.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          {isCompleted ? (
                            <Badge variant="default" className="bg-green-500 text-xs">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Complete
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="p-3 bg-muted rounded text-xs">
                          <p>{form.content}</p>
                        </div>

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
                          <Label className="text-xs">I have read and agree to this consent</Label>
                        </div>

                        {!isCompleted && (
                          <div className="flex gap-2">
                            {verificationMethod === "pin" && (
                              <Input
                                type="password"
                                placeholder="Enter 4-digit PIN"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                                className="flex-1"
                              />
                            )}
                            <Button
                              size="sm"
                              disabled={!consentData[form.id]?.agreed}
                              onClick={() => handleFormComplete(form.id, consentData[form.id] || {})}
                            >
                              Sign with {verificationMethod}
                            </Button>
                            {savedSignature && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!consentData[form.id]?.agreed}
                                onClick={() => handleApplySavedSignature(form.id)}
                              >
                                Use Saved Signature
                              </Button>
                            )}
                          </div>
                        )}

                        {isCompleted && (
                          <div className="p-2 bg-green-100 border border-green-200 rounded text-xs">
                            <div className="flex items-center gap-2 text-green-800">
                              <CheckCircle className="h-3 w-3" />
                              <span className="font-medium">Signed</span>
                            </div>
                            <p className="text-green-700 mt-1">
                              {new Date(consentData[form.id]?.completedAt).toLocaleString()}
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

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCompleteAll} disabled={stats.requiredCompleted < stats.totalRequired} size="lg">
            Complete All Consent Forms
            {stats.requiredCompleted < stats.totalRequired && (
              <Badge variant="destructive" className="ml-2">
                {stats.totalRequired - stats.requiredCompleted} Required Remaining
              </Badge>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
