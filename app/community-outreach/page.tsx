"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Heart,
  Users,
  Stethoscope,
  UserCog,
  Shield,
  Phone,
  Lock,
  ArrowRight,
  CheckCircle,
  FileText,
  Calendar,
  MapPin,
  Search,
  Navigation,
  Home,
  Utensils,
  BedDouble,
  ExternalLink,
  UserPlus,
  Syringe,
  AlertCircle,
  Package,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { CrisisLifeline988 } from "@/components/crisis-lifeline-988"
import { LiveChatWidget } from "@/components/live-chat-widget"

export default function CommunityOutreachLanding() {
  const { toast } = useToast()
  const [loginType, setLoginType] = useState<"patient" | "provider" | "staff" | "public">("public")
  const [showPublicRegister, setShowPublicRegister] = useState(false)

  // Patient login state
  const [patientNumber, setPatientNumber] = useState("")
  const [patientDob, setPatientDob] = useState("")

  // Provider login state
  const [providerNpi, setProviderNpi] = useState("")
  const [providerEmail, setProviderEmail] = useState("")

  // Staff login state
  const [staffEmail, setStaffEmail] = useState("")
  const [staffPassword, setStaffPassword] = useState("")

  // Shelter locator state
  const [shelterSearch, setShelterSearch] = useState("")
  const [shelterType, setShelterType] = useState("all")
  const [selectedShelter, setSelectedShelter] = useState<string | null>(null)

  // Resource search state for findhelp.org integration
  const [resourceSearch, setResourceSearch] = useState("")
  const [resourceCategory, setResourceCategory] = useState("all")

  // Food bank locator state
  const [foodBankSearch, setFoodBankSearch] = useState("")
  const [foodBankType, setFoodBankType] = useState("all")
  const [selectedFoodBank, setSelectedFoodBank] = useState<string | null>(null)

  const [narcanSearch, setNarcanSearch] = useState("")
  const [narcanType, setNarcanType] = useState("all")
  const [selectedNarcanSite, setSelectedNarcanSite] = useState<string | null>(null)

  const [shelters, setShelters] = useState<any[]>([])
  const [foodBanks, setFoodBanks] = useState<any[]>([])
  const [loadingShelters, setLoadingShelters] = useState(false)
  const [loadingFoodBanks, setLoadingFoodBanks] = useState(false)

  const [publicRegisterForm, setPublicRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    zipCode: "",
    agreeToTerms: false,
  })

  // Fetch shelters from API
  const fetchShelters = async () => {
    setLoadingShelters(true)
    try {
      const params = new URLSearchParams()
      if (shelterSearch) params.append("search", shelterSearch)
      if (shelterType !== "all") params.append("type", shelterType)

      const response = await fetch(`/api/community-outreach/shelters?${params}`)
      const data = await response.json()

      if (data.shelters && data.shelters.length > 0) {
        setShelters(data.shelters)
      } else {
        // Fallback to mock data if no results
        setShelters(mockSheltersData)
      }
    } catch (error) {
      console.error("[v0] Error fetching shelters:", error)
      // Fallback to mock data on error
      setShelters(mockSheltersData)
    } finally {
      setLoadingShelters(false)
    }
  }

  // Fetch food banks from API
  const fetchFoodBanks = async () => {
    setLoadingFoodBanks(true)
    try {
      const params = new URLSearchParams()
      if (foodBankSearch) params.append("search", foodBankSearch)
      if (foodBankType !== "all") params.append("type", foodBankType)

      const response = await fetch(`/api/community-outreach/food-banks?${params}`)
      const data = await response.json()

      if (data.foodBanks && data.foodBanks.length > 0) {
        setFoodBanks(data.foodBanks)
      } else {
        // Fallback to mock data if no results
        setFoodBanks(mockFoodBanksData)
      }
    } catch (error) {
      console.error("[v0] Error fetching food banks:", error)
      // Fallback to mock data on error
      setFoodBanks(mockFoodBanksData)
    } finally {
      setLoadingFoodBanks(false)
    }
  }

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchShelters()
  }, [shelterSearch, shelterType])

  useEffect(() => {
    fetchFoodBanks()
  }, [foodBankSearch, foodBankType])

  const mockSheltersData = [
    {
      id: "1",
      name: "Hope Haven Emergency Shelter",
      type: "emergency",
      address: "123 Main St, Anytown, ST 12345",
      phone: "(555) 123-4567",
      email: "info@hopehaven.org",
      beds: 45,
      bedsAvailable: 12,
      amenities: ["meals", "medical", "mental_health", "substance_abuse", "transportation"],
      acceptsMen: true,
      acceptsWomen: true,
      acceptsFamilies: true,
      hours: "24/7",
      latitude: 40.7128,
      longitude: -74.006,
    },
    {
      id: "2",
      name: "New Beginnings Transitional Housing",
      type: "transitional",
      address: "456 Oak Ave, Anytown, ST 12345",
      phone: "(555) 234-5678",
      email: "contact@newbeginnings.org",
      beds: 30,
      bedsAvailable: 5,
      amenities: ["meals", "job_training", "childcare", "case_management"],
      acceptsMen: true,
      acceptsWomen: true,
      acceptsFamilies: true,
      hours: "Office: 9 AM - 5 PM",
      latitude: 40.7589,
      longitude: -73.9851,
    },
    {
      id: "3",
      name: "Safe Harbor Women's Shelter",
      type: "emergency",
      address: "789 Elm St, Anytown, ST 12345",
      phone: "(555) 345-6789",
      email: "support@safeharbor.org",
      beds: 25,
      bedsAvailable: 8,
      amenities: ["meals", "medical", "mental_health", "childcare", "legal_aid"],
      acceptsMen: false,
      acceptsWomen: true,
      acceptsFamilies: true,
      hours: "24/7",
      latitude: 40.7411,
      longitude: -73.9897,
    },
    {
      id: "4",
      name: "Veterans Bridge Home",
      type: "transitional",
      address: "321 Pine St, Anytown, ST 12345",
      phone: "(555) 456-7890",
      email: "info@veteransbridge.org",
      beds: 40,
      bedsAvailable: 15,
      amenities: ["meals", "medical", "mental_health", "substance_abuse", "job_training", "va_services"],
      acceptsMen: true,
      acceptsWomen: true,
      acceptsFamilies: false,
      hours: "24/7",
      latitude: 40.7306,
      longitude: -73.9352,
    },
  ]

  const mockFoodBanksData = [
    {
      id: "1",
      name: "Community Food Pantry",
      type: "pantry",
      address: "234 Market St, Anytown, ST 12345",
      phone: "(555) 234-5678",
      email: "info@communityfood.org",
      servesPerMonth: 500,
      hours: "Mon-Fri: 10 AM - 4 PM, Sat: 9 AM - 1 PM",
      services: ["emergency_food", "fresh_produce", "meal_assistance", "nutrition_education"],
      eligibility: "Income verification required",
      acceptsWalkIns: true,
      requiresRegistration: true,
      latitude: 40.7128,
      longitude: -74.006,
    },
    {
      id: "2",
      name: "Meals on Wheels - Central",
      type: "meal_delivery",
      address: "567 Oak Ave, Anytown, ST 12345",
      phone: "(555) 345-6789",
      email: "central@mealsonwheels.org",
      servesPerMonth: 200,
      hours: "Deliveries: Mon-Fri 11 AM - 1 PM",
      services: ["hot_meals", "home_delivery", "senior_services", "wellness_checks"],
      eligibility: "Seniors 60+ or homebound individuals",
      acceptsWalkIns: false,
      requiresRegistration: true,
      latitude: 40.7589,
      longitude: -73.9851,
    },
    {
      id: "3",
      name: "Fresh Harvest Food Bank",
      type: "food_bank",
      address: "890 Pine Rd, Anytown, ST 12345",
      phone: "(555) 456-7890",
      email: "contact@freshharvest.org",
      servesPerMonth: 1200,
      hours: "Mon, Wed, Fri: 9 AM - 5 PM",
      services: ["emergency_food", "fresh_produce", "meat_dairy", "canned_goods", "snap_assistance"],
      eligibility: "All community members welcome",
      acceptsWalkIns: true,
      requiresRegistration: false,
      latitude: 40.7411,
      longitude: -73.9897,
    },
    {
      id: "4",
      name: "Kids Lunch Program",
      type: "meal_program",
      address: "321 School Dr, Anytown, ST 12345",
      phone: "(555) 567-8901",
      email: "lunch@kidseatfree.org",
      servesPerMonth: 800,
      hours: "School days: 11:30 AM - 1 PM, Summer: Mon-Fri 12 PM - 1 PM",
      services: ["hot_meals", "breakfast", "lunch", "snacks", "nutrition_education"],
      eligibility: "Children 18 and under",
      acceptsWalkIns: true,
      requiresRegistration: false,
      latitude: 40.7306,
      longitude: -73.9352,
    },
    {
      id: "5",
      name: "Soup Kitchen at Grace Church",
      type: "soup_kitchen",
      address: "456 Faith Blvd, Anytown, ST 12345",
      phone: "(555) 678-9012",
      email: "kitchen@gracechurch.org",
      servesPerMonth: 900,
      hours: "Daily: 11:30 AM - 1:30 PM, Dinner: Mon/Wed/Fri 5 PM - 7 PM",
      services: ["hot_meals", "meal_assistance", "clothing", "hygiene_kits"],
      eligibility: "Open to all - no questions asked",
      acceptsWalkIns: true,
      requiresRegistration: false,
      latitude: 40.7482,
      longitude: -73.9845,
    },
  ]

  const mockNarcanSites = [
    {
      id: "1",
      name: "Alliance of Coalition - Main Distribution Center",
      type: "distribution_center",
      address: "123 Recovery Way, Anytown, ST 12345",
      phone: "(555) 800-9000",
      hours: "Mon-Fri: 8 AM - 6 PM, Sat: 10 AM - 4 PM",
      services: ["free_narcan", "training", "fentanyl_strips", "harm_reduction_supplies", "naloxone_training"],
      walkInsWelcome: true,
      appointmentRequired: false,
      latitude: 40.7128,
      longitude: -74.006,
    },
    {
      id: "2",
      name: "Community Health Pharmacy",
      type: "pharmacy",
      address: "456 Main St, Anytown, ST 12345",
      phone: "(555) 234-7890",
      hours: "Mon-Sat: 9 AM - 8 PM, Sun: 10 AM - 6 PM",
      services: ["free_narcan", "prescription_narcan", "consultation", "training"],
      walkInsWelcome: true,
      appointmentRequired: false,
      latitude: 40.7589,
      longitude: -73.9851,
    },
    {
      id: "3",
      name: "Hope Recovery Center",
      type: "treatment_center",
      address: "789 Treatment Ave, Anytown, ST 12345",
      phone: "(555) 345-6789",
      hours: "24/7 - Crisis services available",
      services: ["free_narcan", "training", "fentanyl_strips", "overdose_prevention", "peer_support"],
      walkInsWelcome: true,
      appointmentRequired: false,
      latitude: 40.7411,
      longitude: -73.9897,
    },
    {
      id: "4",
      name: "Public Library - Harm Reduction Station",
      type: "public_access",
      address: "234 Library Ln, Anytown, ST 12345",
      phone: "(555) 456-7890",
      hours: "Tue-Sat: 10 AM - 6 PM",
      services: ["free_narcan", "fentanyl_strips", "harm_reduction_info", "resource_referrals"],
      walkInsWelcome: true,
      appointmentRequired: false,
      latitude: 40.7306,
      longitude: -73.9352,
    },
    {
      id: "5",
      name: "Fire Department Station 12",
      type: "emergency_services",
      address: "567 Safety Blvd, Anytown, ST 12345",
      phone: "(555) 911-1234",
      hours: "24/7",
      services: ["free_narcan", "emergency_response", "training", "community_outreach"],
      walkInsWelcome: true,
      appointmentRequired: false,
      latitude: 40.7482,
      longitude: -73.9845,
    },
  ]

  const filteredShelters = shelters.filter((shelter) => {
    const matchesSearch =
      shelterSearch === "" ||
      shelter.name.toLowerCase().includes(shelterSearch.toLowerCase()) ||
      shelter.address.toLowerCase().includes(shelterSearch.toLowerCase())
    const matchesType = shelterType === "all" || shelter.type === shelterType
    return matchesSearch && matchesType
  })

  const getDirections = (address: string) => {
    const encodedAddress = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, "_blank")
  }

  const getAmenityLabel = (amenity: string) => {
    const labels: Record<string, string> = {
      meals: "Meals Provided",
      medical: "Medical Services",
      mental_health: "Mental Health Services",
      substance_abuse: "Substance Abuse Treatment",
      transportation: "Transportation",
      job_training: "Job Training",
      childcare: "Childcare",
      case_management: "Case Management",
      legal_aid: "Legal Aid",
      va_services: "VA Services",
    }
    return labels[amenity] || amenity
  }

  const resourceCategories = [
    { value: "all", label: "All Resources", icon: Search },
    { value: "food", label: "Food Assistance", icon: Utensils },
    { value: "shelter", label: "Housing & Shelter", icon: BedDouble },
    { value: "medical", label: "Medical Care", icon: Stethoscope },
    { value: "mental_health", label: "Mental Health", icon: Heart },
    { value: "substance_abuse", label: "Substance Use Treatment", icon: Shield },
    { value: "employment", label: "Employment Services", icon: Users },
    { value: "legal", label: "Legal Aid", icon: FileText },
    { value: "transportation", label: "Transportation", icon: Navigation },
  ]

  // Added Narcan locator state and helper functions
  const filteredNarcanSites = mockNarcanSites.filter((site) => {
    const matchesSearch =
      narcanSearch === "" ||
      site.name.toLowerCase().includes(narcanSearch.toLowerCase()) ||
      site.address.toLowerCase().includes(narcanSearch.toLowerCase())
    const matchesType = narcanType === "all" || site.type === narcanType
    return matchesSearch && matchesType
  })

  const getNarcanServiceLabel = (service: string) => {
    const labels: Record<string, string> = {
      free_narcan: "Free Narcan/Naloxone",
      training: "Training Available",
      fentanyl_strips: "Fentanyl Test Strips",
      harm_reduction_supplies: "Harm Reduction Supplies",
      naloxone_training: "Naloxone Administration Training",
      prescription_narcan: "Prescription Narcan",
      consultation: "Consultation",
      overdose_prevention: "Overdose Prevention Education",
      peer_support: "Peer Support",
      harm_reduction_info: "Harm Reduction Information",
      resource_referrals: "Resource Referrals",
      emergency_response: "Emergency Response",
      community_outreach: "Community Outreach",
    }
    return labels[service] || service
  }

  const features = [
    {
      icon: Syringe,
      title: "Narcan/Naloxone Locator",
      description: "Free naloxone distribution sites and overdose prevention resources",
      link: "#narcan",
    },
    {
      icon: Users,
      title: "Anonymous Screening",
      description: "Take confidential mental health assessments",
      link: "#screening",
    },
    {
      icon: Home,
      title: "Shelter Locator",
      description: "Find emergency housing and transitional shelters",
      link: "#shelters",
    },
    {
      icon: Utensils,
      title: "Food Bank Locator",
      description: "Find food pantries, meal programs, and nutrition assistance",
      link: "#food-banks",
    },
    {
      icon: Stethoscope,
      title: "Crisis Services (24/7)",
      description: "Immediate crisis intervention and stabilization",
      link: "#resources",
    },
    {
      icon: Heart,
      title: "Mental Health Services",
      description: "Assessment, diagnosis, and evidence-based treatment",
      link: "#resources",
    },
    {
      icon: Shield,
      title: "Substance Use Treatment",
      description: "Comprehensive SUD services including MAT",
      link: "#resources",
    },
    {
      icon: Users,
      title: "Case Management",
      description: "Care coordination and recovery support services",
      link: "#resources",
    },
    {
      icon: FileText,
      title: "Educational Resources",
      description: "Learn about treatment options and recovery",
      link: "#resources",
    },
    {
      icon: Heart,
      title: "Community Referrals",
      description: "Connect with care coordinators and support",
      link: "#resources",
    },
    {
      icon: CheckCircle,
      title: "No Wrong Door Policy",
      description: "Access regardless of ability to pay - all welcome",
      link: "#features",
    },
    {
      icon: Calendar,
      title: "Mobile Check-In",
      description: "Remote check-in and queue management",
      link: "#features",
    },
    {
      icon: Search,
      title: "Community Resources",
      description: "Search nationwide database of social services powered by findhelp.org",
      link: "#resources",
    },
  ]

  const handlePublicRegistration = async () => {
    if (!publicRegisterForm.firstName || !publicRegisterForm.lastName || !publicRegisterForm.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!publicRegisterForm.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and privacy policy",
        variant: "destructive",
      })
      return
    }

    try {
      // Store in localStorage for this demo
      const communityUser = {
        id: `public_${Date.now()}`,
        firstName: publicRegisterForm.firstName,
        lastName: publicRegisterForm.lastName,
        email: publicRegisterForm.email,
        phone: publicRegisterForm.phone,
        zipCode: publicRegisterForm.zipCode,
        registeredAt: new Date().toISOString(),
        userType: "community",
      }

      localStorage.setItem("community_user", JSON.stringify(communityUser))
      localStorage.setItem("community_authenticated", "true")

      toast({
        title: "Registration Successful!",
        description: "Welcome to MASE Community Resources. You now have full access to all resources.",
      })

      setShowPublicRegister(false)

      // Scroll to resources section
      document.getElementById("resources")?.scrollIntoView({ behavior: "smooth" })
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handlePatientLogin = () => {
    window.location.href = "/patient-mobile-checkin"
  }

  const handleProviderLogin = () => {
    window.location.href = "/external-transfer"
  }

  const handleStaffLogin = () => {
    window.location.href = "/outreach"
  }

  const searchFindhelp = () => {
    // findhelp.org uses a simple search interface at their main site
    if (resourceSearch) {
      // If user entered a location, go to main search page
      window.open(`https://www.findhelp.org/?location=${encodeURIComponent(resourceSearch)}`, "_blank")
    } else {
      // If no location, just open main site
      window.open("https://www.findhelp.org", "_blank")
    }
  }

  const filteredFoodBanks = foodBanks.filter((foodBank) => {
    const matchesSearch =
      foodBankSearch === "" ||
      foodBank.name.toLowerCase().includes(foodBankSearch.toLowerCase()) ||
      foodBank.address.toLowerCase().includes(foodBankSearch.toLowerCase())
    const matchesType = foodBankType === "all" || foodBank.type === foodBankType
    return matchesSearch && matchesType
  })

  const getFoodBankServiceLabel = (service: string) => {
    const labels: Record<string, string> = {
      emergency_food: "Emergency Food",
      fresh_produce: "Fresh Produce",
      meat_dairy: "Meat & Dairy",
      canned_goods: "Canned Goods",
      hot_meals: "Hot Meals",
      breakfast: "Breakfast",
      lunch: "Lunch",
      snacks: "Snacks",
      home_delivery: "Home Delivery",
      meal_assistance: "Meal Assistance",
      snap_assistance: "SNAP Assistance",
      nutrition_education: "Nutrition Education",
      senior_services: "Senior Services",
      wellness_checks: "Wellness Checks",
      clothing: "Clothing",
      hygiene_kits: "Hygiene Kits",
    }
    return labels[service] || service
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-violet-600" />
            <span className="text-2xl font-bold text-violet-900">MASE Access™</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#resources" className="text-sm text-muted-foreground hover:text-foreground">
              Resources
            </Link>
            <Link href="#shelters" className="text-sm text-muted-foreground hover:text-foreground">
              Shelters
            </Link>
            <Link href="#food-banks" className="text-sm text-muted-foreground hover:text-foreground">
              Food Banks
            </Link>
            <Link href="#narcan" className="text-sm text-muted-foreground hover:text-foreground">
              Narcan
            </Link>
            <Link href="#contact" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <CrisisLifeline988 variant="banner" />
        </div>

        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Community Outreach & Recovery Gateway
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Confidential access to behavioral health resources, education, and support services
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
            <Shield className="h-4 w-4 text-green-600" />
            <span>HIPAA Compliant</span>
            <span className="mx-2">•</span>
            <Shield className="h-4 w-4 text-green-600" />
            <span>42 CFR Part 2 Protected</span>
            <span className="mx-2">•</span>
            <Lock className="h-4 w-4 text-green-600" />
            <span>Confidential</span>
          </div>

          <Card className="border-2 border-violet-500 bg-violet-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <UserPlus className="h-8 w-8 text-violet-600" />
                <h2 className="text-2xl font-bold text-violet-900">Open to Everyone</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                You don't need to be a current patient to access our resources. Register for free to find shelters, food
                banks, treatment centers, and support services in your community.
              </p>
              <Button
                size="lg"
                className="bg-violet-600 hover:bg-violet-700"
                onClick={() => setShowPublicRegister(true)}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Register for Free Access
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                No medical records required • Anonymous screening available • All resources are free
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Features - Clickable Navigation */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-center mb-6">Quick Access to Services</h2>
          <p className="text-center text-muted-foreground mb-8">Click any service to jump directly to that section</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" id="features">
          {features.map((feature, index) => (
            <Link
              key={index}
              href={feature.link}
              className="block transition-transform hover:scale-105"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector(feature.link)?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              <Card className="text-center cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-violet-500">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3">
                    <feature.icon className="h-6 w-6 text-violet-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  <ArrowRight className="h-4 w-4 mx-auto mt-3 text-violet-600" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Narcan/Naloxone Section - TOP PRIORITY */}
        <div className="mt-16" id="narcan">
          <Card className="border-2 border-red-200">
            <CardHeader className="text-center border-b bg-red-50/50">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Syringe className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-3xl">Narcan/Naloxone Locator</CardTitle>
              <CardDescription className="text-base">
                Free naloxone distribution sites & overdose prevention resources powered by Alliance of Coalition
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Life-Saving Alert */}
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-6">
                <div className="flex gap-4">
                  <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-red-900 text-lg mb-2">Overdose Emergency?</h3>
                    <p className="text-red-800 mb-3">
                      <strong>Call 911 immediately.</strong> Naloxone (Narcan) can reverse opioid overdoses and save
                      lives. It's available for free at the locations below - no prescription needed.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        <Phone className="h-4 w-4 mr-2" />
                        Call 911
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.open("tel:1-800-662-4357", "_blank")}>
                        SAMHSA Hotline: 1-800-662-HELP
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alliance of Coalition Map Integration */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-4">
                  <MapPin className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">View Full Interactive Map</h3>
                    <p className="text-sm text-blue-800 mb-4">
                      The Alliance of Coalition provides a comprehensive map of all naloxone distribution sites, harm
                      reduction programs, and overdose prevention resources in your area.
                    </p>
                    <Button
                      onClick={() =>
                        window.open(
                          "https://app.mapline.com/map/map_331d3d5c/PzEUQBEUIg8Ufz8UPz8UP2sURz8Ub0k8VW4UP2cOPz8UPxozdT",
                          "_blank",
                        )
                      }
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Alliance of Coalition Map
                    </Button>
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="narcan-search">Search by name or location</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="narcan-search"
                        placeholder="Enter city, zip code, or site name..."
                        value={narcanSearch}
                        onChange={(e) => setNarcanSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-56">
                    <Label htmlFor="narcan-type">Site Type</Label>
                    <select
                      id="narcan-type"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                      value={narcanType}
                      onChange={(e) => setNarcanType(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="distribution_center">Distribution Centers</option>
                      <option value="pharmacy">Pharmacies</option>
                      <option value="treatment_center">Treatment Centers</option>
                      <option value="public_access">Public Access Points</option>
                      <option value="emergency_services">Emergency Services</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Narcan Sites Results */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {filteredNarcanSites.length} Distribution Site{filteredNarcanSites.length !== 1 ? "s" : ""} Found
                  </h3>
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Use My Location
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {filteredNarcanSites.map((site) => (
                    <Card
                      key={site.id}
                      className={`cursor-pointer transition-all ${
                        selectedNarcanSite === site.id ? "ring-2 ring-red-500" : ""
                      }`}
                      onClick={() => setSelectedNarcanSite(site.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-1">{site.name}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 capitalize">
                                {site.type.replace(/_/g, " ")}
                              </span>
                              {site.walkInsWelcome && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                  Walk-ins Welcome
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span>{site.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`tel:${site.phone}`}
                            className="text-violet-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {site.phone}
                          </a>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span>{site.hours}</span>
                        </div>

                        {/* Services */}
                        <div className="pt-2 border-t">
                          <p className="text-xs font-semibold mb-2 text-muted-foreground">Services Available:</p>
                          <div className="flex flex-wrap gap-1">
                            {site.services.slice(0, 3).map((service) => (
                              <span
                                key={service}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-red-50 text-red-700"
                              >
                                {service === "free_narcan" && <Package className="h-3 w-3 mr-1" />}
                                {getNarcanServiceLabel(service)}
                              </span>
                            ))}
                            {site.services.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                                +{site.services.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `tel:${site.phone}`
                            }}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call Now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation()
                              getDirections(site.address)
                            }}
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Directions
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Information Cards */}
              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-6">
                    <Package className="h-8 w-8 text-purple-600 mb-3" />
                    <h4 className="font-semibold mb-2 text-purple-900">What is Narcan?</h4>
                    <p className="text-sm text-purple-800">
                      Naloxone (Narcan) is a life-saving medication that rapidly reverses opioid overdoses. It's safe,
                      easy to use, and available for free at locations above.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="pt-6">
                    <AlertCircle className="h-8 w-8 text-orange-600 mb-3" />
                    <h4 className="font-semibold mb-2 text-orange-900">Signs of Overdose</h4>
                    <p className="text-sm text-orange-800">
                      Unresponsive, slow/no breathing, blue lips/nails, pale skin, pinpoint pupils. Call 911 immediately
                      and administer naloxone if available.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <CheckCircle className="h-8 w-8 text-green-600 mb-3" />
                    <h4 className="font-semibold mb-2 text-green-900">Good Samaritan Laws</h4>
                    <p className="text-sm text-green-800">
                      Most states have laws protecting people who seek emergency help for overdoses. You won't be
                      prosecuted for helping save a life.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Login Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Access Portal</CardTitle>
              <CardDescription>Select your access type to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={loginType} onValueChange={(value: any) => setLoginType(value)} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="public" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Public
                  </TabsTrigger>
                  <TabsTrigger value="patient" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Patient
                  </TabsTrigger>
                  <TabsTrigger value="provider" className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Provider
                  </TabsTrigger>
                  <TabsTrigger value="staff" className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Staff
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="public" className="space-y-4">
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-violet-900">
                      <CheckCircle className="h-4 w-4 inline mr-2" />
                      Free access for anyone seeking resources • No medical records required • Anonymous screenings
                      available
                    </p>
                  </div>
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Access shelter locator, food banks, treatment centers, crisis services, and more
                    </p>
                    <Button onClick={() => setShowPublicRegister(true)} className="w-full" size="lg">
                      Register for Free Access
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("shelters")?.scrollIntoView({ behavior: "smooth" })}
                      >
                        <BedDouble className="mr-2 h-4 w-4" />
                        Find Shelters
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("food-banks")?.scrollIntoView({ behavior: "smooth" })}
                      >
                        <Utensils className="mr-2 h-4 w-4" />
                        Find Food Banks
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Patient Login */}
                <TabsContent value="patient" className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-900">
                      <CheckCircle className="h-4 w-4 inline mr-2" />
                      Patient access for remote check-in, mobile verification, and educational resources
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patient-number">Patient Number</Label>
                    <Input
                      id="patient-number"
                      placeholder="Enter your patient number"
                      value={patientNumber}
                      onChange={(e) => setPatientNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patient-dob">Date of Birth</Label>
                    <Input
                      id="patient-dob"
                      type="date"
                      value={patientDob}
                      onChange={(e) => setPatientDob(e.target.value)}
                    />
                  </div>
                  <Button onClick={handlePatientLogin} className="w-full" size="lg">
                    Access Patient Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Need help? Call <Phone className="h-3 w-3 inline" /> (555) 123-4567
                  </p>
                </TabsContent>

                {/* Provider Login */}
                <TabsContent value="provider" className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-900">
                      <CheckCircle className="h-4 w-4 inline mr-2" />
                      External provider portal for submitting patient transfer documents and care coordination
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider-npi">NPI Number</Label>
                    <Input
                      id="provider-npi"
                      placeholder="Enter your NPI"
                      value={providerNpi}
                      onChange={(e) => setProviderNpi(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider-email">Email Address</Label>
                    <Input
                      id="provider-email"
                      type="email"
                      placeholder="provider@clinic.com"
                      value={providerEmail}
                      onChange={(e) => setProviderEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleProviderLogin} className="w-full" size="lg">
                    Access Provider Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    New provider?{" "}
                    <Link href="/provider-registration" className="text-primary hover:underline">
                      Register here
                    </Link>
                  </p>
                </TabsContent>

                {/* Staff Login */}
                <TabsContent value="staff" className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-purple-900">
                      <CheckCircle className="h-4 w-4 inline mr-2" />
                      Staff dashboard for managing outreach leads, referrals, and community engagement
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-email">Email Address</Label>
                    <Input
                      id="staff-email"
                      type="email"
                      placeholder="staff@clinic.com"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-password">Password</Label>
                    <Input
                      id="staff-password"
                      type="password"
                      placeholder="••••••••"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleStaffLogin} className="w-full" size="lg">
                    Access Staff Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    <Link href="/forgot-password" className="text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* findhelp.org Resource Search Section */}
        <div className="mt-16" id="resources">
          <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="text-center border-b bg-white/80">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-3xl">Nationwide Community Resources</CardTitle>
              <CardDescription className="text-base">
                Powered by{" "}
                <a
                  href="https://www.findhelp.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
                >
                  findhelp.org
                  <ExternalLink className="h-3 w-3" />
                </a>{" "}
                - Search millions of free and reduced-cost social services across the United States
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                <h3 className="font-semibold text-lg mb-4">Find Help Near You</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resource-search">Enter your location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="resource-search"
                        placeholder="City, state, or ZIP code..."
                        value={resourceSearch}
                        onChange={(e) => setResourceSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="resource-category">What do you need help with?</Label>
                    <select
                      id="resource-category"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                      value={resourceCategory}
                      onChange={(e) => setResourceCategory(e.target.value)}
                    >
                      {resourceCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button onClick={searchFindhelp} className="w-full" size="lg">
                    <Search className="mr-2 h-4 w-4" />
                    Search Community Resources
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <Utensils className="h-6 w-6 text-orange-600 mb-2" />
                    <CardTitle className="text-base">Food Assistance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Food banks, meal programs, SNAP benefits</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Stethoscope className="h-6 w-6 text-red-600 mb-2" />
                    <CardTitle className="text-base">Health Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Free clinics, medical care, prescriptions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Users className="h-6 w-6 text-green-600 mb-2" />
                    <CardTitle className="text-base">Employment Help</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Job training, resume help, career services</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  <strong>findhelp.org</strong> provides free access to millions of programs including food, housing,
                  financial assistance, health care, and more across all 50 states.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shelter Locator Section */}
        <div className="mt-16" id="shelters">
          <Card className="border-2">
            <CardHeader className="text-center border-b">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Home className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-3xl">Emergency Shelter Locator</CardTitle>
              <CardDescription>Find safe housing, meals, and support services in your area</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="shelter-search">Search by name or location</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="shelter-search"
                        placeholder="Enter city, zip code, or shelter name..."
                        value={shelterSearch}
                        onChange={(e) => setShelterSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-48">
                    <Label htmlFor="shelter-type">Shelter Type</Label>
                    <select
                      id="shelter-type"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                      value={shelterType}
                      onChange={(e) => setShelterType(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="emergency">Emergency</option>
                      <option value="transitional">Transitional</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <Phone className="h-4 w-4 inline mr-2" />
                    <strong>In immediate danger?</strong> Call 911 or the National Domestic Violence Hotline at
                    1-800-799-7233
                  </p>
                </div>
              </div>

              {/* Shelter Results */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {filteredShelters.length} Shelter{filteredShelters.length !== 1 ? "s" : ""} Found
                  </h3>
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Use My Location
                  </Button>
                </div>

                {filteredShelters.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No shelters found matching your criteria.</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredShelters.map((shelter) => (
                      <Card
                        key={shelter.id}
                        className={`cursor-pointer transition-all ${
                          selectedShelter === shelter.id ? "ring-2 ring-violet-500" : ""
                        }`}
                        onClick={() => setSelectedShelter(shelter.id)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-xl mb-1">{shelter.name}</CardTitle>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-violet-100 text-violet-700 capitalize">
                                  {shelter.type}
                                </span>
                                {shelter.bedsAvailable > 0 ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                    <BedDouble className="h-3 w-3 mr-1" />
                                    {shelter.bedsAvailable} beds available
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                                    Full
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span>{shelter.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`tel:${shelter.phone}`}
                              className="text-violet-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {shelter.phone}
                            </a>
                          </div>

                          {/* Amenities */}
                          <div className="pt-2 border-t">
                            <p className="text-xs font-semibold mb-2 text-muted-foreground">Services Available:</p>
                            <div className="flex flex-wrap gap-1">
                              {shelter.amenities.slice(0, 3).map((amenity) => (
                                <span
                                  key={amenity}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                                >
                                  {amenity === "meals" && <Utensils className="h-3 w-3 mr-1" />}
                                  {getAmenityLabel(amenity)}
                                </span>
                              ))}
                              {shelter.amenities.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                                  +{shelter.amenities.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Accepts */}
                          <div className="flex gap-2 text-xs pt-2">
                            {shelter.acceptsMen && <span className="text-muted-foreground">✓ Men</span>}
                            {shelter.acceptsWomen && <span className="text-muted-foreground">✓ Women</span>}
                            {shelter.acceptsFamilies && <span className="text-muted-foreground">✓ Families</span>}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.location.href = `tel:${shelter.phone}`
                              }}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call Now
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation()
                                getDirections(shelter.address)
                              }}
                            >
                              <Navigation className="h-4 w-4 mr-2" />
                              Directions
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Map Placeholder */}
              <div className="mt-6 bg-gray-100 rounded-lg p-8 text-center">
                <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Interactive Map View</p>
                <p className="text-sm text-gray-500">Click on a shelter above to see its location on the map</p>
              </div>

              {/* Additional Resources */}
              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2 text-blue-900">211 Help Line</h4>
                    <p className="text-sm text-blue-800 mb-2">
                      Dial 211 for free, confidential referrals to local resources
                    </p>
                    <Button size="sm" variant="outline" className="w-full bg-transparent">
                      Call 211
                    </Button>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2 text-green-900">Housing Assistance</h4>
                    <p className="text-sm text-green-800 mb-2">Apply for rental assistance and housing vouchers</p>
                    <Button size="sm" variant="outline" className="w-full bg-transparent">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2 text-purple-900">Food Banks</h4>
                    <p className="text-sm text-purple-800 mb-2">Find free meals and food pantries near you</p>
                    <Button size="sm" variant="outline" className="w-full bg-transparent">
                      Find Food
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Food Bank Locator Section */}
        <div className="mt-16" id="food-banks">
          <Card className="border-2 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardHeader className="text-center border-b bg-white/80">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <Utensils className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-3xl">Food Bank & Meal Program Locator</CardTitle>
              <CardDescription className="text-base">
                Find food pantries, soup kitchens, meal programs, and emergency food assistance in your area
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Search and Filters */}
              <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="food-bank-search">Search by location or name</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="food-bank-search"
                        placeholder="Enter city, ZIP, or food bank name..."
                        value={foodBankSearch}
                        onChange={(e) => setFoodBankSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="food-bank-type">Filter by type</Label>
                    <select
                      id="food-bank-type"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                      value={foodBankType}
                      onChange={(e) => setFoodBankType(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="food_bank">Food Bank</option>
                      <option value="pantry">Food Pantry</option>
                      <option value="soup_kitchen">Soup Kitchen</option>
                      <option value="meal_program">Meal Program</option>
                      <option value="meal_delivery">Meal Delivery</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>
                    Showing {filteredFoodBanks.length} food {filteredFoodBanks.length === 1 ? "bank" : "banks"} and meal
                    programs
                  </span>
                </div>
              </div>

              {/* Food Banks List */}
              <div className="space-y-4 mb-6">
                {filteredFoodBanks.map((foodBank) => (
                  <Card
                    key={foodBank.id}
                    className={`transition-all ${selectedFoodBank === foodBank.id ? "ring-2 ring-orange-500" : ""}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Utensils className="h-5 w-5 text-orange-600" />
                            {foodBank.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                              {foodBank.type.replace("_", " ").toUpperCase()}
                            </span>
                            <span className="ml-2 text-sm">{foodBank.servesPerMonth} people/month</span>
                          </CardDescription>
                        </div>
                        {selectedFoodBank === foodBank.id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFoodBank(null)}
                            className="text-muted-foreground"
                          >
                            Hide Details
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setSelectedFoodBank(foodBank.id)}>
                            View Details
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-sm">{foodBank.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${foodBank.phone}`} className="text-sm text-primary hover:underline">
                            {foodBank.phone}
                          </a>
                        </div>

                        {selectedFoodBank === foodBank.id && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Hours of Operation</h4>
                              <p className="text-sm text-muted-foreground">{foodBank.hours}</p>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm mb-2">Services Offered</h4>
                              <div className="flex flex-wrap gap-2">
                                {foodBank.services.map((service) => (
                                  <span
                                    key={service}
                                    className="inline-block bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded"
                                  >
                                    {getFoodBankServiceLabel(service)}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm mb-2">Eligibility</h4>
                              <p className="text-sm text-muted-foreground">{foodBank.eligibility}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircle
                                  className={`h-4 w-4 ${foodBank.acceptsWalkIns ? "text-green-600" : "text-gray-400"}`}
                                />
                                <span className={foodBank.acceptsWalkIns ? "text-foreground" : "text-muted-foreground"}>
                                  Walk-ins {foodBank.acceptsWalkIns ? "accepted" : "by appointment"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle
                                  className={`h-4 w-4 ${foodBank.requiresRegistration ? "text-amber-600" : "text-green-600"}`}
                                />
                                <span>
                                  {foodBank.requiresRegistration ? "Registration required" : "No registration"}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => window.open(`tel:${foodBank.phone}`, "_self")}
                                className="flex-1"
                              >
                                <Phone className="mr-2 h-4 w-4" />
                                Call Now
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => getDirections(foodBank.address)}
                                className="flex-1"
                              >
                                <Navigation className="mr-2 h-4 w-4" />
                                Get Directions
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Additional Resources */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-orange-50 border-orange-200">
                  <CardHeader>
                    <Phone className="h-6 w-6 text-orange-600 mb-2" />
                    <CardTitle className="text-base">SNAP Benefits (Food Stamps)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Check eligibility and apply for Supplemental Nutrition Assistance Program benefits.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open("https://www.fns.usda.gov/snap", "_blank")}
                    >
                      Learn More
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                  <CardHeader>
                    <Utensils className="h-6 w-6 text-orange-600 mb-2" />
                    <CardTitle className="text-base">Feeding America</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Find food banks and pantries in your area through the Feeding America network.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open("https://www.feedingamerica.org/find-your-local-foodbank", "_blank")}
                    >
                      Find Food Bank
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Crisis Support */}
        <div className="mt-12 max-w-2xl mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Need Immediate Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-red-900">
                <strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988 (available 24/7)
              </p>
              <p className="text-red-900">
                <strong>SAMHSA National Helpline:</strong> 1-800-662-HELP (4357)
              </p>
              <p className="text-red-900">
                <strong>Crisis Text Line:</strong> Text HOME to 741741
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 MASE Access™ Community Outreach Portal</p>
          <p className="mt-2">
            <Shield className="h-3 w-3 inline mr-1" />
            HIPAA Compliant • 42 CFR Part 2 • All information is confidential
          </p>
        </div>
      </footer>

      <Dialog open={showPublicRegister} onOpenChange={setShowPublicRegister}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-violet-600" />
              Register for Community Resources
            </DialogTitle>
            <DialogDescription>
              Create a free account to access shelters, food banks, treatment centers, and support services
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={publicRegisterForm.firstName}
                  onChange={(e) => setPublicRegisterForm({ ...publicRegisterForm, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={publicRegisterForm.lastName}
                  onChange={(e) => setPublicRegisterForm({ ...publicRegisterForm, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={publicRegisterForm.email}
                onChange={(e) => setPublicRegisterForm({ ...publicRegisterForm, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={publicRegisterForm.phone}
                onChange={(e) => setPublicRegisterForm({ ...publicRegisterForm, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code (Optional)</Label>
              <Input
                id="zipCode"
                value={publicRegisterForm.zipCode}
                onChange={(e) => setPublicRegisterForm({ ...publicRegisterForm, zipCode: e.target.value })}
                placeholder="12345"
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground">Helps us show you resources near you</p>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={publicRegisterForm.agreeToTerms}
                onCheckedChange={(checked) =>
                  setPublicRegisterForm({ ...publicRegisterForm, agreeToTerms: checked as boolean })
                }
              />
              <Label htmlFor="terms" className="text-xs leading-relaxed cursor-pointer">
                I agree to the{" "}
                <Link href="#" className="text-violet-600 underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-violet-600 underline">
                  Privacy Policy
                </Link>
                . I understand that this is a free public resource and I am not required to be a patient to access these
                services.
              </Label>
            </div>
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
              <p className="text-xs text-violet-900">
                <Shield className="h-3 w-3 inline mr-1" />
                Your information is confidential and protected under HIPAA and 42 CFR Part 2. We will never share your
                data without your consent.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowPublicRegister(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handlePublicRegistration} className="flex-1 bg-violet-600 hover:bg-violet-700">
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Chat Widget - Floating in bottom right corner */}
      <LiveChatWidget />
    </div>
  )
}
