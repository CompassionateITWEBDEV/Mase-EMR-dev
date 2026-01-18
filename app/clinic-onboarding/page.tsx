"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, FileText, Stethoscope, CheckCircle2, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ClinicOnboarding() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgId = searchParams?.get("org_id")

  const { data, mutate } = useSWR(orgId ? `/api/clinic-onboarding?org_id=${orgId}` : null, fetcher)

  const [currentStep, setCurrentStep] = useState(1)
  const [basicInfo, setBasicInfo] = useState({
    npi_number: "",
    tax_id: "",
    license_number: "",
    dea_number: "",
    facility_type: "",
  })

  const [selectedInsurance, setSelectedInsurance] = useState<string[]>([])
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

  useEffect(() => {
    if (data?.onboarding) {
      setCurrentStep(data.onboarding.current_step || 1)
    }
  }, [data])

  const steps = [
    { number: 1, title: "Basic Information", icon: Building2 },
    { number: 2, title: "Insurance Plans", icon: FileText },
    { number: 3, title: "Specialties", icon: Stethoscope },
    { number: 4, title: "Complete Setup", icon: CheckCircle2 },
  ]

  const insurancePlans = [
    "Blue Cross Blue Shield",
    "UnitedHealthcare",
    "Aetna",
    "Cigna",
    "Humana",
    "Medicare",
    "Medicaid",
    "Priority Health",
    "McLaren Health Plan",
    "HAP (Health Alliance Plan)",
  ]

  const specialties = [
    { code: "behavioral_health", name: "Behavioral Health / OTP / MAT" },
    { code: "primary_care", name: "Primary Care / Family Medicine" },
    { code: "psychiatry", name: "Psychiatry" },
    { code: "obgyn", name: "OB/GYN" },
    { code: "cardiology", name: "Cardiology" },
    { code: "dermatology", name: "Dermatology" },
    { code: "urgent_care", name: "Urgent Care" },
    { code: "pediatrics", name: "Pediatrics" },
    { code: "podiatry", name: "Podiatry" },
  ]

  const handleSaveStep = async () => {
    if (!orgId) return

    try {
      const payload: { organization_id: string; step: number; data: object } = {
        organization_id: orgId,
        step: currentStep,
        data: {},
      }

      if (currentStep === 1) {
        payload.data = { basicInfo }
      } else if (currentStep === 2) {
        payload.data = {
          insurancePlans: selectedInsurance.map((name) => ({
            custom_payer_name: name,
            network_status: "in-network",
            is_active: true,
          })),
        }
      } else if (currentStep === 3) {
        payload.data = {
          specialties: selectedSpecialties.map((code) => ({
            code,
            name: specialties.find((s) => s.code === code)?.name,
            isPrimary: selectedSpecialties.indexOf(code) === 0,
          })),
        }
      } else if (currentStep === 4) {
        payload.data = { complete: true }
      }

      await fetch("/api/clinic-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      mutate()

      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("[v0] Save onboarding error:", error)
    }
  }

  const progressPercentage = (currentStep / 4) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to MASE Health EMR</h1>
          <p className="text-muted-foreground">Let&apos;s get your clinic set up in just a few steps</p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      step.number <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${step.number < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-center text-sm text-muted-foreground mt-2">
              Step {currentStep} of 4: {steps[currentStep - 1]?.title}
            </p>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1]?.title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Enter your clinic's regulatory and billing information"}
              {currentStep === 2 && "Select which insurance plans your clinic accepts"}
              {currentStep === 3 && "Choose your clinic's medical specialties"}
              {currentStep === 4 && "Review and complete your setup"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>NPI Number *</Label>
                  <Input
                    value={basicInfo.npi_number}
                    onChange={(e) => setBasicInfo({ ...basicInfo, npi_number: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <Label>Tax ID / EIN *</Label>
                  <Input
                    value={basicInfo.tax_id}
                    onChange={(e) => setBasicInfo({ ...basicInfo, tax_id: e.target.value })}
                    placeholder="12-3456789"
                  />
                </div>
                <div>
                  <Label>State License Number</Label>
                  <Input
                    value={basicInfo.license_number}
                    onChange={(e) => setBasicInfo({ ...basicInfo, license_number: e.target.value })}
                    placeholder="MI123456"
                  />
                </div>
                <div>
                  <Label>DEA Number (if applicable)</Label>
                  <Input
                    value={basicInfo.dea_number}
                    onChange={(e) => setBasicInfo({ ...basicInfo, dea_number: e.target.value })}
                    placeholder="AB1234567"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Facility Type *</Label>
                  <Input
                    value={basicInfo.facility_type}
                    onChange={(e) => setBasicInfo({ ...basicInfo, facility_type: e.target.value })}
                    placeholder="Outpatient Clinic, OTP, Urgent Care, etc."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Insurance Plans */}
            {currentStep === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Select all insurance plans your clinic accepts:</p>
                {insurancePlans.map((plan) => (
                  <div key={plan} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                    <Checkbox
                      id={plan}
                      checked={selectedInsurance.includes(plan)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedInsurance([...selectedInsurance, plan])
                        } else {
                          setSelectedInsurance(selectedInsurance.filter((p) => p !== plan))
                        }
                      }}
                    />
                    <Label htmlFor={plan} className="flex-1 cursor-pointer">
                      {plan}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Specialties */}
            {currentStep === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Select your clinic&apos;s medical specialties:</p>
                {specialties.map((specialty) => (
                  <div
                    key={specialty.code}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent"
                  >
                    <Checkbox
                      id={specialty.code}
                      checked={selectedSpecialties.includes(specialty.code)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSpecialties([...selectedSpecialties, specialty.code])
                        } else {
                          setSelectedSpecialties(selectedSpecialties.filter((s) => s !== specialty.code))
                        }
                      }}
                    />
                    <Label htmlFor={specialty.code} className="flex-1 cursor-pointer">
                      {specialty.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && (
              <div className="text-center space-y-4 py-8">
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
                <h3 className="text-2xl font-bold">You&apos;re All Set!</h3>
                <p className="text-muted-foreground">
                  Your clinic has been configured successfully. Click below to access your EMR dashboard.
                </p>
                <div className="bg-accent p-4 rounded-lg text-left space-y-2">
                  <p className="text-sm font-medium">Setup Summary:</p>
                  <p className="text-sm">✓ Basic information configured</p>
                  <p className="text-sm">✓ {selectedInsurance.length} insurance plans added</p>
                  <p className="text-sm">✓ {selectedSpecialties.length} specialties selected</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              <Button onClick={handleSaveStep}>
                {currentStep === 4 ? "Go to Dashboard" : "Continue"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help? Contact support at support@mase-emr.com
        </p>
      </div>
    </div>
  )
}
