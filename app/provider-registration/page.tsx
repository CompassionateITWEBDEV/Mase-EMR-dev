"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle,
  Rocket,
  Shield,
  Users,
  FileText,
} from "lucide-react"

export default function ProviderRegistrationPage() {
  const [step, setStep] = useState<"basic" | "services" | "trial" | "complete">("basic")
  const [wantsTrial, setWantsTrial] = useState(false)

  // Basic Information
  const [basicInfo, setBasicInfo] = useState({
    organizationName: "",
    providerName: "",
    providerType: "",
    npiNumber: "",
    specialty: "",
    email: "",
    phone: "",
    fax: "",
    website: "",
    address: "",
    city: "",
    state: "MI",
    zipCode: "",
  })

  // Services Offered
  const [services, setServices] = useState<Array<{
    name: string
    category: string
    price: string
    pricingType: string
    insuranceAccepted: boolean
    medicaidAccepted: boolean
    acceptsUninsured: boolean
  }>>([])

  // Trial Application
  const [trialInfo, setTrialInfo] = useState({
    practiceSize: "",
    currentEmr: "",
    numProviders: "",
    numStaff: "",
    patientVolumeMonthly: "",
    featuresInterested: [] as string[],
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const addService = () => {
    setServices([
      ...services,
      {
        name: "",
        category: "",
        price: "",
        pricingType: "per_session",
        insuranceAccepted: false,
        medicaidAccepted: false,
        acceptsUninsured: false,
      },
    ])
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const updateService = (index: number, field: string, value: any) => {
    const updated = [...services]
    updated[index] = { ...updated[index], [field]: value }
    setServices(updated)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    console.log("[v0] Submitting provider registration:", {
      basicInfo,
      services,
      wantsTrial,
      trialInfo: wantsTrial ? trialInfo : null,
    })

    // Simulate API call
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      setStep("complete")
    }, 2000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
        <Card className="w-full max-w-2xl">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registration Submitted Successfully!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for registering with MASE. Our team will review your application and contact you within 1-2
              business days.
            </p>
            {wantsTrial && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <Rocket className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-blue-900">MASE EMR Trial Request Received</p>
                <p className="text-sm text-blue-700">
                  We'll set up your 30-day free trial and send login credentials to {basicInfo.email}
                </p>
              </div>
            )}
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Application ID:</strong> PROV-{Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
              <p>
                <strong>Email:</strong> {basicInfo.email}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Join MASE Provider Network</h1>
          <p className="text-lg text-muted-foreground">
            Connect with Michigan's integrated behavioral health platform
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step === "basic" ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "basic" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              1
            </div>
            <span className="font-medium">Basic Info</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300" />
          <div className={`flex items-center gap-2 ${step === "services" ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "services" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              2
            </div>
            <span className="font-medium">Services & Pricing</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300" />
          <div className={`flex items-center gap-2 ${step === "trial" ? "text-blue-600" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "trial" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              3
            </div>
            <span className="font-medium">MASE Trial</span>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === "basic" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Basic Provider Information
              </CardTitle>
              <CardDescription>Tell us about your organization and practice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Organization Name *</Label>
                  <Input
                    value={basicInfo.organizationName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, organizationName: e.target.value })}
                    placeholder="Community Health Center"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Provider/Contact Name *</Label>
                  <Input
                    value={basicInfo.providerName}
                    onChange={(e) => setBasicInfo({ ...basicInfo, providerName: e.target.value })}
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Provider Type *</Label>
                  <Select value={basicInfo.providerType} onValueChange={(v) => setBasicInfo({ ...basicInfo, providerType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcp">Primary Care Physician</SelectItem>
                      <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                      <SelectItem value="psychologist">Psychologist</SelectItem>
                      <SelectItem value="counselor">Counselor/Therapist</SelectItem>
                      <SelectItem value="social_worker">Social Worker</SelectItem>
                      <SelectItem value="case_manager">Case Manager</SelectItem>
                      <SelectItem value="hospital">Hospital/Medical Center</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="housing">Housing Services</SelectItem>
                      <SelectItem value="employment">Employment Services</SelectItem>
                      <SelectItem value="legal">Legal Services</SelectItem>
                      <SelectItem value="peer_support">Peer Support Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Input
                    value={basicInfo.specialty}
                    onChange={(e) => setBasicInfo({ ...basicInfo, specialty: e.target.value })}
                    placeholder="Addiction Medicine"
                  />
                </div>
                <div className="space-y-2">
                  <Label>NPI Number</Label>
                  <Input
                    value={basicInfo.npiNumber}
                    onChange={(e) => setBasicInfo({ ...basicInfo, npiNumber: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={basicInfo.email}
                    onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                    placeholder="contact@organization.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    value={basicInfo.phone}
                    onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fax</Label>
                  <Input
                    value={basicInfo.fax}
                    onChange={(e) => setBasicInfo({ ...basicInfo, fax: e.target.value })}
                    placeholder="(555) 123-4568"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={basicInfo.website}
                    onChange={(e) => setBasicInfo({ ...basicInfo, website: e.target.value })}
                    placeholder="https://www.yourpractice.com"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address *</Label>
                  <Input
                    value={basicInfo.address}
                    onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    value={basicInfo.city}
                    onChange={(e) => setBasicInfo({ ...basicInfo, city: e.target.value })}
                    placeholder="Detroit"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={basicInfo.state} disabled />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code *</Label>
                  <Input
                    value={basicInfo.zipCode}
                    onChange={(e) => setBasicInfo({ ...basicInfo, zipCode: e.target.value })}
                    placeholder="48201"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => setStep("services")}
                  disabled={
                    !basicInfo.organizationName ||
                    !basicInfo.providerName ||
                    !basicInfo.providerType ||
                    !basicInfo.email ||
                    !basicInfo.phone ||
                    !basicInfo.address ||
                    !basicInfo.city ||
                    !basicInfo.zipCode
                  }
                >
                  Continue to Services
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Services & Pricing */}
        {step === "services" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Services Offered & Pricing
              </CardTitle>
              <CardDescription>List the services you provide and pricing information (optional but recommended)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {services.map((service, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-semibold">Service #{index + 1}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeService(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Service Name</Label>
                      <Input
                        value={service.name}
                        onChange={(e) => updateService(index, "name", e.target.value)}
                        placeholder="Individual Therapy"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={service.category} onValueChange={(v) => updateService(index, "category", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="therapy">Therapy/Counseling</SelectItem>
                          <SelectItem value="medical">Medical Services</SelectItem>
                          <SelectItem value="case_management">Case Management</SelectItem>
                          <SelectItem value="peer_support">Peer Support</SelectItem>
                          <SelectItem value="housing">Housing Assistance</SelectItem>
                          <SelectItem value="employment">Employment Services</SelectItem>
                          <SelectItem value="legal">Legal Services</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        value={service.price}
                        onChange={(e) => updateService(index, "price", e.target.value)}
                        placeholder="75.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pricing Type</Label>
                      <Select value={service.pricingType} onValueChange={(v) => updateService(index, "pricingType", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_session">Per Session</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="sliding_scale">Sliding Scale</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Payment Options</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={service.insuranceAccepted}
                            onCheckedChange={(checked) => updateService(index, "insuranceAccepted", checked)}
                          />
                          <span className="text-sm">Private Insurance</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={service.medicaidAccepted}
                            onCheckedChange={(checked) => updateService(index, "medicaidAccepted", checked)}
                          />
                          <span className="text-sm">Medicaid</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={service.acceptsUninsured}
                            onCheckedChange={(checked) => updateService(index, "acceptsUninsured", checked)}
                          />
                          <span className="text-sm">Accepts Uninsured</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <Button variant="outline" onClick={addService} className="w-full bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep("basic")}>
                  Back
                </Button>
                <Button onClick={() => setStep("trial")}>Continue to MASE Trial</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: MASE EMR Trial */}
        {step === "trial" && (
          <div className="space-y-6">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-6 w-6 text-blue-600" />
                  Try MASE EMR Free for 30 Days
                </CardTitle>
                <CardDescription className="text-blue-900">
                  Experience Michigan's most comprehensive behavioral health EMR platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-3 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 mb-2" />
                    <p className="text-sm font-semibold">Full Platform Access</p>
                    <p className="text-xs text-muted-foreground">No feature limitations</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600 mb-2" />
                    <p className="text-sm font-semibold">Michigan Compliant</p>
                    <p className="text-xs text-muted-foreground">42 CFR Part 2, HIPAA</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600 mb-2" />
                    <p className="text-sm font-semibold">State Reporting</p>
                    <p className="text-xs text-muted-foreground">MiOFR, SUDORS, DOSE-SYS</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-lg">
                  <Checkbox checked={wantsTrial} onCheckedChange={(checked) => setWantsTrial(!!checked)} id="trial-opt-in" />
                  <Label htmlFor="trial-opt-in" className="text-base cursor-pointer">
                    Yes, I want to try MASE EMR free for 30 days
                  </Label>
                </div>

                {wantsTrial && (
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Practice Size</Label>
                          <Select value={trialInfo.practiceSize} onValueChange={(v) => setTrialInfo({ ...trialInfo, practiceSize: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solo">Solo Practice (1 provider)</SelectItem>
                              <SelectItem value="small_group">Small Group (2-10 providers)</SelectItem>
                              <SelectItem value="large_group">Large Group (11-50 providers)</SelectItem>
                              <SelectItem value="hospital">Hospital/Large System (50+ providers)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Current EMR System</Label>
                          <Input
                            value={trialInfo.currentEmr}
                            onChange={(e) => setTrialInfo({ ...trialInfo, currentEmr: e.target.value })}
                            placeholder="Epic, Cerner, None, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label># of Providers</Label>
                          <Input
                            type="number"
                            value={trialInfo.numProviders}
                            onChange={(e) => setTrialInfo({ ...trialInfo, numProviders: e.target.value })}
                            placeholder="5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label># of Staff</Label>
                          <Input
                            type="number"
                            value={trialInfo.numStaff}
                            onChange={(e) => setTrialInfo({ ...trialInfo, numStaff: e.target.value })}
                            placeholder="12"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Monthly Patient Volume</Label>
                          <Input
                            type="number"
                            value={trialInfo.patientVolumeMonthly}
                            onChange={(e) => setTrialInfo({ ...trialInfo, patientVolumeMonthly: e.target.value })}
                            placeholder="250"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Features You're Most Interested In</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            "Referral Management",
                            "Patient Portal",
                            "Michigan State Reporting",
                            "HR Management",
                            "Clinical Decision Support",
                            "Billing & Revenue Cycle",
                            "Telehealth",
                            "Off-Site Dosing",
                            "Diversion Control",
                            "Community Collaboration",
                          ].map((feature) => (
                            <div key={feature} className="flex items-center gap-2">
                              <Checkbox
                                checked={trialInfo.featuresInterested.includes(feature)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setTrialInfo({
                                      ...trialInfo,
                                      featuresInterested: [...trialInfo.featuresInterested, feature],
                                    })
                                  } else {
                                    setTrialInfo({
                                      ...trialInfo,
                                      featuresInterested: trialInfo.featuresInterested.filter((f) => f !== feature),
                                    })
                                  }
                                }}
                              />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep("services")}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Complete Registration"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
