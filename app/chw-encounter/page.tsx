"use client"

import { useState } from "react"
import useSWR from "swr"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  Plus,
  Users,
  ClipboardList,
  Heart,
  Home,
  Car,
  Utensils,
  Briefcase,
  Brain,
  Stethoscope,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Search,
  Calendar,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface EncounterFormData {
  patient_id: string
  chw_id: string
  encounter_date: string
  encounter_start_time: string
  site_name: string
  is_first_visit: boolean
  demographics: {
    gender: string
    age: number | null
    arab_ethnicity: boolean
    hispanic_ethnicity: boolean
    city: string
    zip_code: string
    country: string
  }
  housing: {
    living_situation: string
    lack_of_heat: boolean
    lead_paint_pipes: boolean
    mold: boolean
    oven_stove_not_working: boolean
    pest_issues: boolean
    smoke_detectors_missing: boolean
    water_leaks: boolean
    none_of_above: boolean
    prefer_not_answer: boolean
  }
  food_security: {
    food_worry_frequency: string
    food_not_last_frequency: string
  }
  transportation: {
    lack_transportation_impact: string
    transportation_notes: string
  }
  utilities: {
    utility_shutoff_threat: string
    affected_utilities: string
  }
  employment: {
    employment_help_needed: string
    employment_notes: string
  }
  family_support: {
    daily_living_support: string
    support_notes: string
  }
  mental_health: {
    loneliness_frequency: string
    little_interest_pleasure: string
    feeling_down_depressed: string
    phq2_score: number
  }
  healthcare_access: {
    has_regular_doctor: string
    health_insurance_coverage: string
    additional_challenges: string
  }
  health_education: {
    medication_management: boolean
    womens_health: boolean
    infant_maternal_health: boolean
    preventing_cancer: boolean
    preventing_cardiovascular: boolean
    reducing_blood_pressure: boolean
    managing_diabetes: boolean
    healthy_cholesterol: boolean
    covid_flu_prevention: boolean
    substance_use_addiction: boolean
    healthy_eating: boolean
    physical_activity: boolean
    healthy_sleep: boolean
    managing_stress: boolean
    oral_health: boolean
    lifestyle_modification: boolean
    none_needed: boolean
  }
  referrals: string[]
}

const initialFormData: EncounterFormData = {
  patient_id: "",
  chw_id: "",
  encounter_date: new Date().toISOString().split("T")[0],
  encounter_start_time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }),
  site_name: "",
  is_first_visit: false,
  demographics: {
    gender: "",
    age: null,
    arab_ethnicity: false,
    hispanic_ethnicity: false,
    city: "",
    zip_code: "",
    country: "USA",
  },
  housing: {
    living_situation: "",
    lack_of_heat: false,
    lead_paint_pipes: false,
    mold: false,
    oven_stove_not_working: false,
    pest_issues: false,
    smoke_detectors_missing: false,
    water_leaks: false,
    none_of_above: false,
    prefer_not_answer: false,
  },
  food_security: {
    food_worry_frequency: "",
    food_not_last_frequency: "",
  },
  transportation: {
    lack_transportation_impact: "",
    transportation_notes: "",
  },
  utilities: {
    utility_shutoff_threat: "",
    affected_utilities: "",
  },
  employment: {
    employment_help_needed: "",
    employment_notes: "",
  },
  family_support: {
    daily_living_support: "",
    support_notes: "",
  },
  mental_health: {
    loneliness_frequency: "",
    little_interest_pleasure: "",
    feeling_down_depressed: "",
    phq2_score: 0,
  },
  healthcare_access: {
    has_regular_doctor: "",
    health_insurance_coverage: "",
    additional_challenges: "",
  },
  health_education: {
    medication_management: false,
    womens_health: false,
    infant_maternal_health: false,
    preventing_cancer: false,
    preventing_cardiovascular: false,
    reducing_blood_pressure: false,
    managing_diabetes: false,
    healthy_cholesterol: false,
    covid_flu_prevention: false,
    substance_use_addiction: false,
    healthy_eating: false,
    physical_activity: false,
    healthy_sleep: false,
    managing_stress: false,
    oral_health: false,
    lifestyle_modification: false,
    none_needed: false,
  },
  referrals: [],
}

const referralOptions = [
  "Access to health care",
  "Blood pressure screening",
  "Cholesterol screening",
  "COVID-19 Testing or Vaccinations",
  "Diabetes screening",
  "Employment assistance",
  "Family and Community support",
  "Health Insurance assistance",
  "Healthy food access",
  "Home Utilities assistance",
  "Housing assistance",
  "Legal aid",
  "Mental health services",
  "Substance use treatment",
  "Transportation assistance",
  "Domestic violence resources",
  "Child care assistance",
  "Education/GED programs",
  "Immigration services",
  "Veterans services",
]

export default function CHWEncounterPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/chw-encounter", fetcher)
  const [isNewEncounterOpen, setIsNewEncounterOpen] = useState(false)
  const [formData, setFormData] = useState<EncounterFormData>(initialFormData)
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const steps = [
    { title: "Patient Info", icon: Users },
    { title: "Demographics", icon: FileText },
    { title: "Housing", icon: Home },
    { title: "Food Security", icon: Utensils },
    { title: "Transportation", icon: Car },
    { title: "Utilities & Employment", icon: Briefcase },
    { title: "Support & Mental Health", icon: Brain },
    { title: "Healthcare Access", icon: Stethoscope },
    { title: "Education & Referrals", icon: BookOpen },
  ]

  const patients = data?.patients || []
  const chwStaff = data?.chwStaff || []
  const encounters = data?.encounters || []
  const stats = data?.stats || { todayEncounters: 0, totalEncounters: 0, pendingReferrals: 0 }

  const calculatePHQ2Score = () => {
    let score = 0
    const interestMap: Record<string, number> = {
      not_at_all: 0,
      several_days: 1,
      more_than_half: 2,
      nearly_everyday: 3,
      everyday: 4,
    }
    const downMap: Record<string, number> = {
      several_days: 1,
      more_than_half: 2,
      nearly_everyday: 3,
      everyday: 4,
    }

    if (formData.mental_health.little_interest_pleasure in interestMap) {
      score += interestMap[formData.mental_health.little_interest_pleasure]
    }
    if (formData.mental_health.feeling_down_depressed in downMap) {
      score += downMap[formData.mental_health.feeling_down_depressed]
    }

    return score
  }

  const handleOpenNewEncounter = () => {
    setFormData(initialFormData)
    setCurrentStep(0)
    setIsNewEncounterOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.patient_id) {
      toast.error("Please select a patient")
      return
    }
    if (!formData.chw_id) {
      toast.error("Please select a CHW")
      return
    }

    setIsSubmitting(true)
    try {
      const submitData = {
        ...formData,
        mental_health: {
          ...formData.mental_health,
          phq2_score: calculatePHQ2Score(),
        },
      }

      const response = await fetch("/api/chw-encounter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.error || "Failed to save encounter")

      if (result.fallback) {
        toast.success("CHW encounter saved as progress note (tables not yet created)")
      } else {
        toast.success("CHW encounter saved successfully!")
      }

      setIsNewEncounterOpen(false)
      setFormData(initialFormData)
      setCurrentStep(0)
      mutate()
    } catch (error) {
      console.error("Error saving encounter:", error)
      toast.error("Failed to save encounter")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredEncounters = encounters.filter((enc: any) => {
    if (!searchTerm) return true
    const patientName = `${enc.patient?.first_name || ""} ${enc.patient?.last_name || ""}`.toLowerCase()
    return patientName.includes(searchTerm.toLowerCase())
  })

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">CHW Encounter</h1>
              <p className="text-muted-foreground">Community Health Worker - Social Determinants of Health Screening</p>
            </div>
            <Button size="lg" onClick={handleOpenNewEncounter}>
              <Plus className="mr-2 h-5 w-5" />
              New CHW Encounter
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{"Today's Encounters"}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayEncounters}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Encounters</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEncounters}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Referrals</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingReferrals}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patients.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Encounters */}
          <Card>
            <CardHeader>
              <CardTitle>Recent CHW Encounters</CardTitle>
              <CardDescription>SDOH screenings and community health assessments</CardDescription>
              <div className="flex items-center gap-2 pt-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredEncounters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No CHW encounters found</p>
                  <p className="text-sm">Click &quot;New CHW Encounter&quot; to create one</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEncounters.map((encounter: any) => (
                    <div
                      key={encounter.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {encounter.patient?.first_name} {encounter.patient?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {encounter.encounter_date} • {encounter.site_name || "No site"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={encounter.status === "completed" ? "default" : "secondary"}>
                          {encounter.status || "pending"}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          CHW: {encounter.chw?.first_name} {encounter.chw?.last_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* New Encounter Dialog */}
          <Dialog open={isNewEncounterOpen} onOpenChange={setIsNewEncounterOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>CHW Encounter - SDOH Screening</DialogTitle>
                <DialogDescription>
                  Complete the Social Determinants of Health screening for the patient
                </DialogDescription>
              </DialogHeader>

              {/* Progress Steps */}
              <div className="flex items-center justify-between px-2 py-4 border-b overflow-x-auto">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`flex flex-col items-center gap-1 min-w-[80px] transition-colors ${
                        index === currentStep
                          ? "text-primary"
                          : index < currentStep
                            ? "text-green-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === currentStep
                            ? "bg-primary text-primary-foreground"
                            : index < currentStep
                              ? "bg-green-100 text-green-600"
                              : "bg-muted"
                        }`}
                      >
                        {index < currentStep ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span className="text-xs font-medium text-center">{step.title}</span>
                    </button>
                  )
                })}
              </div>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6 py-4">
                  {/* Step 0: Patient Info */}
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Select Patient *</Label>
                          <Select
                            value={formData.patient_id}
                            onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                            <SelectContent>
                              {patients.length === 0 ? (
                                <SelectItem value="_none" disabled>
                                  No patients available
                                </SelectItem>
                              ) : (
                                patients.map((patient: any) => (
                                  <SelectItem key={patient.id} value={patient.id}>
                                    {patient.first_name} {patient.last_name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>CHW Assigned *</Label>
                          <Select
                            value={formData.chw_id}
                            onValueChange={(value) => setFormData({ ...formData, chw_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select CHW" />
                            </SelectTrigger>
                            <SelectContent>
                              {chwStaff.length === 0 ? (
                                <SelectItem value="_none" disabled>
                                  No staff available
                                </SelectItem>
                              ) : (
                                chwStaff.map((staff: any) => (
                                  <SelectItem key={staff.id} value={staff.id}>
                                    {staff.first_name} {staff.last_name}{" "}
                                    {staff.employee_id ? `(${staff.employee_id})` : ""}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Consultation Date *</Label>
                          <Input
                            type="date"
                            value={formData.encounter_date}
                            onChange={(e) => setFormData({ ...formData, encounter_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Consultation Start Time *</Label>
                          <Input
                            type="time"
                            value={formData.encounter_start_time}
                            onChange={(e) => setFormData({ ...formData, encounter_start_time: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Neighborhood Wellness Center Site Name *</Label>
                        <Input
                          value={formData.site_name}
                          onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                          placeholder="Enter site name"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="first-visit"
                          checked={formData.is_first_visit}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_first_visit: checked as boolean })
                          }
                        />
                        <Label htmlFor="first-visit">First time visit to Community Health Worker Services</Label>
                      </div>
                    </div>
                  )}

                  {/* Step 1: Demographics */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Gender *</Label>
                          <Select
                            value={formData.demographics.gender}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                demographics: { ...formData.demographics, gender: value },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer_not_say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Age *</Label>
                          <Input
                            type="number"
                            value={formData.demographics.age || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                demographics: {
                                  ...formData.demographics,
                                  age: Number.parseInt(e.target.value) || null,
                                },
                              })
                            }
                            placeholder="Enter age"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="arab-ethnicity"
                            checked={formData.demographics.arab_ethnicity}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                demographics: { ...formData.demographics, arab_ethnicity: checked as boolean },
                              })
                            }
                          />
                          <Label htmlFor="arab-ethnicity">Client Arab Ethnicity</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="hispanic-ethnicity"
                            checked={formData.demographics.hispanic_ethnicity}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                demographics: { ...formData.demographics, hispanic_ethnicity: checked as boolean },
                              })
                            }
                          />
                          <Label htmlFor="hispanic-ethnicity">Client Hispanic Ethnicity</Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>City *</Label>
                          <Input
                            value={formData.demographics.city}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                demographics: { ...formData.demographics, city: e.target.value },
                              })
                            }
                            placeholder="Enter city"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ZIP Code *</Label>
                          <Input
                            value={formData.demographics.zip_code}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                demographics: { ...formData.demographics, zip_code: e.target.value },
                              })
                            }
                            placeholder="Enter ZIP"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Country</Label>
                          <Input
                            value={formData.demographics.country}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                demographics: { ...formData.demographics, country: e.target.value },
                              })
                            }
                            placeholder="USA"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Housing */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>What is your living situation today? *</Label>
                        <Select
                          value={formData.housing.living_situation}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              housing: { ...formData.housing, living_situation: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select living situation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="own_home">I have a steady place to live</SelectItem>
                            <SelectItem value="renting">I have a place but worried about losing it</SelectItem>
                            <SelectItem value="staying_with_others">I am staying with others</SelectItem>
                            <SelectItem value="shelter">I am in a shelter</SelectItem>
                            <SelectItem value="homeless">I do not have housing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Housing Problems (check all that apply)</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: "lack_of_heat", label: "Lack of heat" },
                            { key: "lead_paint_pipes", label: "Lead paint or pipes" },
                            { key: "mold", label: "Mold" },
                            { key: "oven_stove_not_working", label: "Oven or stove not working" },
                            { key: "pest_issues", label: "Pests (bugs, mice)" },
                            { key: "smoke_detectors_missing", label: "Smoke detectors missing" },
                            { key: "water_leaks", label: "Water leaks" },
                            { key: "none_of_above", label: "None of the above" },
                          ].map((item) => (
                            <div key={item.key} className="flex items-center space-x-2">
                              <Checkbox
                                id={`housing-${item.key}`}
                                checked={formData.housing[item.key as keyof typeof formData.housing] as boolean}
                                onCheckedChange={(checked) =>
                                  setFormData({
                                    ...formData,
                                    housing: { ...formData.housing, [item.key]: checked as boolean },
                                  })
                                }
                              />
                              <Label htmlFor={`housing-${item.key}`}>{item.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Food Security */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Within the past 12 months, how often did you worry about food running out? *</Label>
                        <RadioGroup
                          value={formData.food_security.food_worry_frequency}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              food_security: { ...formData.food_security, food_worry_frequency: value },
                            })
                          }
                        >
                          {["Never", "Sometimes", "Often", "Prefer not to answer"].map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.toLowerCase().replace(/ /g, "_")} id={`worry-${option}`} />
                              <Label htmlFor={`worry-${option}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {
                            "Within the past 12 months, how often did your food not last and you didn't have money to get more? *"
                          }
                        </Label>
                        <RadioGroup
                          value={formData.food_security.food_not_last_frequency}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              food_security: { ...formData.food_security, food_not_last_frequency: value },
                            })
                          }
                        >
                          {["Never", "Sometimes", "Often", "Prefer not to answer"].map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.toLowerCase().replace(/ /g, "_")} id={`last-${option}`} />
                              <Label htmlFor={`last-${option}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Transportation */}
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>
                          Has lack of transportation kept you from medical appointments or getting medications? *
                        </Label>
                        <RadioGroup
                          value={formData.transportation.lack_transportation_impact}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              transportation: { ...formData.transportation, lack_transportation_impact: value },
                            })
                          }
                        >
                          {[
                            "Yes, it has kept me from medical appointments or getting medications",
                            "Yes, it has kept me from non-medical activities",
                            "No",
                            "Prefer not to answer",
                          ].map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <RadioGroupItem
                                value={option.toLowerCase().substring(0, 20).replace(/ /g, "_")}
                                id={`transport-${idx}`}
                              />
                              <Label htmlFor={`transport-${idx}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <div className="space-y-2">
                        <Label>Transportation Notes</Label>
                        <Textarea
                          value={formData.transportation.transportation_notes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              transportation: { ...formData.transportation, transportation_notes: e.target.value },
                            })
                          }
                          placeholder="Additional transportation notes..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 5: Utilities & Employment */}
                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Utilities</h3>
                        <div className="space-y-2">
                          <Label>
                            In the past 12 months, has the electric, gas, oil, or water company threatened to shut off
                            services? *
                          </Label>
                          <RadioGroup
                            value={formData.utilities.utility_shutoff_threat}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                utilities: { ...formData.utilities, utility_shutoff_threat: value },
                              })
                            }
                          >
                            {["Yes", "No", "Already shut off", "Prefer not to answer"].map((option) => (
                              <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={option.toLowerCase().replace(/ /g, "_")}
                                  id={`utility-${option}`}
                                />
                                <Label htmlFor={`utility-${option}`}>{option}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-semibold">Employment</h3>
                        <div className="space-y-2">
                          <Label>Do you want help finding or keeping work or a job? *</Label>
                          <RadioGroup
                            value={formData.employment.employment_help_needed}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                employment: { ...formData.employment, employment_help_needed: value },
                              })
                            }
                          >
                            {["Yes", "No", "Prefer not to answer"].map((option) => (
                              <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={option.toLowerCase().replace(/ /g, "_")}
                                  id={`employ-${option}`}
                                />
                                <Label htmlFor={`employ-${option}`}>{option}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Support & Mental Health */}
                  {currentStep === 6 && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Family & Community Support</h3>
                        <div className="space-y-2">
                          <Label>If you need help with daily activities, do you have support? *</Label>
                          <RadioGroup
                            value={formData.family_support.daily_living_support}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                family_support: { ...formData.family_support, daily_living_support: value },
                              })
                            }
                          >
                            {["Yes", "No", "I do not need help", "Prefer not to answer"].map((option) => (
                              <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={option.toLowerCase().replace(/ /g, "_")}
                                  id={`support-${option}`}
                                />
                                <Label htmlFor={`support-${option}`}>{option}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-semibold">Mental Health (PHQ-2)</h3>
                        <div className="space-y-2">
                          <Label>How often do you feel lonely or isolated from others? *</Label>
                          <RadioGroup
                            value={formData.mental_health.loneliness_frequency}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                mental_health: { ...formData.mental_health, loneliness_frequency: value },
                              })
                            }
                          >
                            {["Never", "Rarely", "Sometimes", "Often", "Always"].map((option) => (
                              <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.toLowerCase()} id={`lonely-${option}`} />
                                <Label htmlFor={`lonely-${option}`}>{option}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                        <div className="space-y-2">
                          <Label>
                            Over the past 2 weeks, how often have you had little interest or pleasure in doing things? *
                          </Label>
                          <RadioGroup
                            value={formData.mental_health.little_interest_pleasure}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                mental_health: { ...formData.mental_health, little_interest_pleasure: value },
                              })
                            }
                          >
                            {["Not at all", "Several days", "More than half the days", "Nearly every day"].map(
                              (option) => (
                                <div key={option} className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value={option.toLowerCase().replace(/ /g, "_")}
                                    id={`interest-${option}`}
                                  />
                                  <Label htmlFor={`interest-${option}`}>{option}</Label>
                                </div>
                              ),
                            )}
                          </RadioGroup>
                        </div>
                        <div className="space-y-2">
                          <Label>Over the past 2 weeks, how often have you felt down, depressed, or hopeless? *</Label>
                          <RadioGroup
                            value={formData.mental_health.feeling_down_depressed}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                mental_health: { ...formData.mental_health, feeling_down_depressed: value },
                              })
                            }
                          >
                            {["Not at all", "Several days", "More than half the days", "Nearly every day"].map(
                              (option) => (
                                <div key={option} className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value={option.toLowerCase().replace(/ /g, "_")}
                                    id={`depressed-${option}`}
                                  />
                                  <Label htmlFor={`depressed-${option}`}>{option}</Label>
                                </div>
                              ),
                            )}
                          </RadioGroup>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 7: Healthcare Access */}
                  {currentStep === 7 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Do you have a doctor or health care provider? *</Label>
                        <RadioGroup
                          value={formData.healthcare_access.has_regular_doctor}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              healthcare_access: { ...formData.healthcare_access, has_regular_doctor: value },
                            })
                          }
                        >
                          {["Yes", "No", "Prefer not to answer"].map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.toLowerCase().replace(/ /g, "_")} id={`doctor-${option}`} />
                              <Label htmlFor={`doctor-${option}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <div className="space-y-2">
                        <Label>What is your health insurance coverage? *</Label>
                        <Select
                          value={formData.healthcare_access.health_insurance_coverage}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              healthcare_access: { ...formData.healthcare_access, health_insurance_coverage: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select coverage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">Private Insurance</SelectItem>
                            <SelectItem value="medicaid">Medicaid</SelectItem>
                            <SelectItem value="medicare">Medicare</SelectItem>
                            <SelectItem value="dual">Medicare & Medicaid</SelectItem>
                            <SelectItem value="none">No Insurance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Additional Healthcare Challenges</Label>
                        <Textarea
                          value={formData.healthcare_access.additional_challenges}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              healthcare_access: {
                                ...formData.healthcare_access,
                                additional_challenges: e.target.value,
                              },
                            })
                          }
                          placeholder="Describe any additional challenges accessing healthcare..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 8: Education & Referrals */}
                  {currentStep === 8 && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Health Education Interests</h3>
                        <p className="text-sm text-muted-foreground">
                          Select topics the client is interested in learning about:
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: "medication_management", label: "Medication Management" },
                            { key: "womens_health", label: "Women's Health" },
                            { key: "infant_maternal_health", label: "Infant & Maternal Health" },
                            { key: "preventing_cancer", label: "Preventing Cancer" },
                            { key: "preventing_cardiovascular", label: "Cardiovascular Health" },
                            { key: "reducing_blood_pressure", label: "Reducing Blood Pressure" },
                            { key: "managing_diabetes", label: "Managing Diabetes" },
                            { key: "healthy_cholesterol", label: "Healthy Cholesterol" },
                            { key: "covid_flu_prevention", label: "COVID/Flu Prevention" },
                            { key: "substance_use_addiction", label: "Substance Use & Addiction" },
                            { key: "healthy_eating", label: "Healthy Eating" },
                            { key: "physical_activity", label: "Physical Activity" },
                            { key: "healthy_sleep", label: "Healthy Sleep" },
                            { key: "managing_stress", label: "Managing Stress" },
                            { key: "oral_health", label: "Oral Health" },
                            { key: "lifestyle_modification", label: "Lifestyle Modification" },
                          ].map((item) => (
                            <div key={item.key} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edu-${item.key}`}
                                checked={
                                  formData.health_education[
                                    item.key as keyof typeof formData.health_education
                                  ] as boolean
                                }
                                onCheckedChange={(checked) =>
                                  setFormData({
                                    ...formData,
                                    health_education: { ...formData.health_education, [item.key]: checked as boolean },
                                  })
                                }
                              />
                              <Label htmlFor={`edu-${item.key}`}>{item.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-semibold">Referrals</h3>
                        <p className="text-sm text-muted-foreground">Select services to refer the client to:</p>
                        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                          {referralOptions.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <Checkbox
                                id={`ref-${option}`}
                                checked={formData.referrals.includes(option)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      referrals: [...formData.referrals, option],
                                    })
                                  } else {
                                    setFormData({
                                      ...formData,
                                      referrals: formData.referrals.filter((r) => r !== option),
                                    })
                                  }
                                }}
                              />
                              <Label htmlFor={`ref-${option}`}>{option}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 0}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </span>
                {currentStep === steps.length - 1 ? (
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Complete Encounter"}
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleNextStep}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
