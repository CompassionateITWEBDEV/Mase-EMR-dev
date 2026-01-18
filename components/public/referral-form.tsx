"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, User, Users, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type ReferralType = "self" | "family" | "professional"

interface FormData {
  referralType: ReferralType | ""
  // Self/Family referral fields
  firstName: string
  lastName: string
  email: string
  phone: string
  preferredContact: string
  dateOfBirth: string
  // Professional referral fields
  orgName: string
  referrerName: string
  referrerTitle: string
  referrerEmail: string
  referrerPhone: string
  clientFirstName: string
  clientLastName: string
  clientDob: string
  clientPhone: string
  // Common fields
  insuranceType: string
  primaryConcerns: string[]
  additionalInfo: string
  urgency: string
  consentGiven: boolean
}

const initialFormData: FormData = {
  referralType: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  preferredContact: "",
  dateOfBirth: "",
  orgName: "",
  referrerName: "",
  referrerTitle: "",
  referrerEmail: "",
  referrerPhone: "",
  clientFirstName: "",
  clientLastName: "",
  clientDob: "",
  clientPhone: "",
  insuranceType: "",
  primaryConcerns: [],
  additionalInfo: "",
  urgency: "",
  consentGiven: false,
}

const concerns = [
  "Depression",
  "Anxiety",
  "Trauma / PTSD",
  "Substance Use",
  "Relationship Issues",
  "Grief / Loss",
  "Stress Management",
  "Anger Management",
  "Sleep Problems",
  "Eating Concerns",
  "Other",
]

export function ReferralForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const updateFormData = (field: keyof FormData, value: FormData[keyof FormData]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleConcern = (concern: string) => {
    setFormData((prev) => ({
      ...prev,
      primaryConcerns: prev.primaryConcerns.includes(concern)
        ? prev.primaryConcerns.filter((c) => c !== concern)
        : [...prev.primaryConcerns, concern],
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const totalSteps = formData.referralType === "professional" ? 4 : 3

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">Referral Submitted</h2>
          <p className="mx-auto mb-8 max-w-md text-muted-foreground">
            Thank you for reaching out. Our intake team will review your information and contact you within 24-48
            business hours.
          </p>
          <div className="mb-8 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              Reference Number:{" "}
              <span className="font-mono font-medium text-foreground">REF-{Date.now().toString().slice(-8)}</span>
            </p>
          </div>
          <Button onClick={() => router.push("/")} className="bg-teal-600 hover:bg-teal-700">
            Return to Home
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Referral Request</CardTitle>
          {formData.referralType && (
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
          )}
        </div>
        {formData.referralType && (
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < step ? "bg-teal-600" : "bg-muted")} />
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Step 1: Referral Type Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label className="mb-4 block text-base font-medium">Who is this referral for?</Label>
              <div className="grid gap-4">
                {[
                  { value: "self", label: "Myself", description: "I'm seeking services for myself", icon: User },
                  {
                    value: "family",
                    label: "Family Member",
                    description: "I'm helping a loved one find care",
                    icon: Users,
                  },
                  {
                    value: "professional",
                    label: "Professional Referral",
                    description: "I'm referring as a healthcare provider or community partner",
                    icon: Building2,
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      updateFormData("referralType", option.value as ReferralType)
                      setStep(2)
                    }}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50",
                      formData.referralType === option.value && "border-teal-600 bg-teal-50",
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                      <option.icon className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact Information */}
        {step === 2 && (formData.referralType === "self" || formData.referralType === "family") && (
          <div className="space-y-6">
            <CardDescription>
              {formData.referralType === "self"
                ? "Please provide your contact information."
                : "Please provide information about yourself and the person you're referring."}
            </CardDescription>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred Contact Method</Label>
              <RadioGroup
                value={formData.preferredContact}
                onValueChange={(value) => updateFormData("preferredContact", value)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="contact-email" />
                    <Label htmlFor="contact-email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="contact-phone" />
                    <Label htmlFor="contact-phone">Phone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="contact-text" />
                    <Label htmlFor="contact-text">Text</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 for Professional: Referrer Info */}
        {step === 2 && formData.referralType === "professional" && (
          <div className="space-y-6">
            <CardDescription>Please provide your professional information.</CardDescription>
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name *</Label>
              <Input
                id="orgName"
                value={formData.orgName}
                onChange={(e) => updateFormData("orgName", e.target.value)}
                placeholder="e.g., Community Health Center"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="referrerName">Your Name *</Label>
                <Input
                  id="referrerName"
                  value={formData.referrerName}
                  onChange={(e) => updateFormData("referrerName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referrerTitle">Title/Role *</Label>
                <Input
                  id="referrerTitle"
                  value={formData.referrerTitle}
                  onChange={(e) => updateFormData("referrerTitle", e.target.value)}
                  placeholder="e.g., Case Manager"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referrerEmail">Your Email *</Label>
              <Input
                id="referrerEmail"
                type="email"
                value={formData.referrerEmail}
                onChange={(e) => updateFormData("referrerEmail", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referrerPhone">Your Phone *</Label>
              <Input
                id="referrerPhone"
                type="tel"
                value={formData.referrerPhone}
                onChange={(e) => updateFormData("referrerPhone", e.target.value)}
                required
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!formData.orgName || !formData.referrerName || !formData.referrerEmail}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 for Professional: Client Info */}
        {step === 3 && formData.referralType === "professional" && (
          <div className="space-y-6">
            <CardDescription>Please provide information about the client being referred.</CardDescription>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clientFirstName">Client First Name *</Label>
                <Input
                  id="clientFirstName"
                  value={formData.clientFirstName}
                  onChange={(e) => updateFormData("clientFirstName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientLastName">Client Last Name *</Label>
                <Input
                  id="clientLastName"
                  value={formData.clientLastName}
                  onChange={(e) => updateFormData("clientLastName", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientDob">Client Date of Birth</Label>
              <Input
                id="clientDob"
                type="date"
                value={formData.clientDob}
                onChange={(e) => updateFormData("clientDob", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client Phone (if available)</Label>
              <Input
                id="clientPhone"
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => updateFormData("clientPhone", e.target.value)}
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!formData.clientFirstName || !formData.clientLastName}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Final Step: Concerns & Details */}
        {((step === 3 && formData.referralType !== "professional") ||
          (step === 4 && formData.referralType === "professional")) && (
          <div className="space-y-6">
            <CardDescription>Help us understand the reason for this referral.</CardDescription>

            <div className="space-y-2">
              <Label>Primary Concerns (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {concerns.map((concern) => (
                  <div key={concern} className="flex items-center space-x-2">
                    <Checkbox
                      id={concern}
                      checked={formData.primaryConcerns.includes(concern)}
                      onCheckedChange={() => toggleConcern(concern)}
                    />
                    <Label htmlFor={concern} className="text-sm font-normal">
                      {concern}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">How urgent is this request?</Label>
              <Select value={formData.urgency} onValueChange={(value) => updateFormData("urgency", value)}>
                <SelectTrigger id="urgency">
                  <SelectValue placeholder="Select urgency level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine - Within 1-2 weeks</SelectItem>
                  <SelectItem value="soon">Soon - Within a few days</SelectItem>
                  <SelectItem value="urgent">Urgent - As soon as possible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance">Insurance Status</Label>
              <Select value={formData.insuranceType} onValueChange={(value) => updateFormData("insuranceType", value)}>
                <SelectTrigger id="insurance">
                  <SelectValue placeholder="Select insurance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private Insurance</SelectItem>
                  <SelectItem value="medicaid">Medicaid</SelectItem>
                  <SelectItem value="medicare">Medicare</SelectItem>
                  <SelectItem value="uninsured">Uninsured / Self-Pay</SelectItem>
                  <SelectItem value="unknown">Not Sure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) => updateFormData("additionalInfo", e.target.value)}
                placeholder="Any additional context that would help us prepare for the intake..."
                rows={4}
              />
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent"
                  checked={formData.consentGiven}
                  onCheckedChange={(checked) => updateFormData("consentGiven", checked as boolean)}
                />
                <Label htmlFor="consent" className="text-sm font-normal leading-relaxed">
                  I understand that this is a request for services and not a guarantee of treatment. I consent to being
                  contacted by Serenity Health regarding this referral. Information shared will be handled in accordance
                  with HIPAA regulations.
                </Label>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(formData.referralType === "professional" ? 3 : 2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.consentGiven || formData.primaryConcerns.length === 0 || isSubmitting}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isSubmitting ? "Submitting..." : "Submit Referral"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
