"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import useSWR from "swr"
import {
  Heart,
  Calendar,
  MessageSquare,
  Phone,
  FileText,
  Send,
  AlertTriangle,
  Bell,
  DollarSign,
  CheckCircle2,
  CreditCard,
  Gamepad2,
  Users,
  Clipboard,
  BookOpen,
  Brain,
  Target,
  Clock,
  ExternalLink,
  Download,
  HandHeart,
  MapPin,
  Briefcase,
  Home,
  PhoneCall,
  Globe,
  Trophy,
  Zap,
  Puzzle,
  Syringe,
  QrCode,
  Dumbbell,
  Play,
  CheckCircle,
  TrendingUp,
  Activity,
  Shield,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PatientInfo {
  name: string
  id: string
  program: string
  dose: string
  nextAppointment: string
  counselor: string
  counselorPhone: string
  recoveryDays: number
}

// Brain Games Data
const brainGames = [
  {
    id: "breathing",
    name: "Mindful Breathing",
    description: "Practice deep breathing to reduce anxiety and cravings",
    icon: Brain,
    color: "#16a34a",
    duration: "5-10 min",
    category: "Mindfulness",
  },
  {
    id: "memory",
    name: "Memory Match",
    description: "Improve cognitive function with memory exercises",
    icon: Puzzle,
    color: "#0284c7",
    duration: "5-15 min",
    category: "Cognitive",
  },
  {
    id: "urge-surfing",
    name: "Urge Surfing",
    description: "Learn to ride out cravings without acting on them",
    icon: Zap,
    color: "#d97706",
    duration: "10 min",
    category: "Coping Skills",
  },
  {
    id: "gratitude",
    name: "Gratitude Journal",
    description: "Build positive thinking patterns through daily gratitude",
    icon: Heart,
    color: "#dc2626",
    duration: "5 min",
    category: "Wellness",
  },
  {
    id: "trigger-tracker",
    name: "Trigger Tracker",
    description: "Identify and plan for your personal triggers",
    icon: Target,
    color: "#7c3aed",
    duration: "10 min",
    category: "Self-Awareness",
  },
  {
    id: "daily-check",
    name: "Daily Check-In",
    description: "Track your mood and recovery progress daily",
    icon: Clipboard,
    color: "#0891b2",
    duration: "3 min",
    category: "Tracking",
  },
]

export default function PatientPortalPage() {
  const [activeTab, setActiveTab] = useState("home")
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [patientId, setPatientId] = useState<string | null>(null)

  // Game states
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [gameScore, setGameScore] = useState(0)
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale">("inhale")
  const [breathingCount, setBreathingCount] = useState(0)
  const [memoryCards, setMemoryCards] = useState<{ id: number; value: string; flipped: boolean; matched: boolean }[]>(
    [],
  )
  const [selectedCards, setSelectedCards] = useState<number[]>([])
  const [gratitudeEntry, setGratitudeEntry] = useState("")
  const [triggerEntry, setTriggerEntry] = useState({ trigger: "", response: "" })
  const [dailyMood, setDailyMood] = useState(5)
  const [dailyNotes, setDailyNotes] = useState("")

  // Referral dialog
  const [referralDialogOpen, setReferralDialogOpen] = useState(false)
  const [referralForm, setReferralForm] = useState({
    serviceType: "",
    reason: "",
    urgency: "normal",
    notes: "",
  })

  // Peer coach message
  const [peerCoachMessage, setPeerCoachMessage] = useState("")

  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      message: "Hello! I am your AI wellness assistant. How are you feeling today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [escalationRequested, setEscalationRequested] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "appointment",
      title: "Upcoming Appointment",
      message: "You have an appointment tomorrow at 10:00 AM with Dr. Smith.",
      date: "2025-01-17",
      read: false,
      actionRequired: true,
    },
    {
      id: "2",
      type: "general",
      title: "New Resources Available",
      message: "Check out our new meditation guides and coping strategies.",
      date: "2025-01-08",
      read: true,
      actionRequired: false,
    },
  ])

  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const [logExerciseDialog, setLogExerciseDialog] = useState(false)
  const [exerciseLog, setExerciseLog] = useState({
    exerciseId: "",
    sets: 0,
    reps: 0,
    painLevel: 0,
    difficulty: 3,
    notes: "",
  })

  // ADDED: Recipient rights complaint state
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false)
  const [complaintForm, setComplaintForm] = useState({
    incidentDate: "",
    incidentTime: "",
    incidentLocation: "",
    category: "",
    type: "",
    description: "",
    witnessNames: "",
    isAnonymous: false,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  })

  // Fetch patient data
  useEffect(() => {
    const loadPatientInfo = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/patient-portal/info")
        if (response.ok) {
          const data = await response.json()
          setPatientInfo(data)
          setPatientId(data.patientId)
        } else {
          // Fallback for demo
          setPatientInfo({
            name: "Sarah Johnson",
            id: "PT-2024-001",
            program: "Methadone Program",
            dose: "80mg",
            nextAppointment: "January 18, 2024 at 10:00 AM",
            counselor: "Dr. Smith",
            counselorPhone: "(555) 123-4567",
            recoveryDays: 127,
          })
          setPatientId("demo-patient-id")
        }
      } catch (err) {
        console.error("Error loading patient info:", err)
        setPatientInfo({
          name: "Sarah Johnson",
          id: "PT-2024-001",
          program: "Methadone Program",
          dose: "80mg",
          nextAppointment: "January 18, 2024 at 10:00 AM",
          counselor: "Dr. Smith",
          counselorPhone: "(555) 123-4567",
          recoveryDays: 127,
        })
        setPatientId("demo-patient-id")
      } finally {
        setLoading(false)
      }
    }
    loadPatientInfo()
  }, [])

  // Fetch documents
  const { data: documents } = useSWR(patientId ? `/api/patient-portal/documents?patientId=${patientId}` : null, fetcher)

  // Fetch resources
  const { data: resources } = useSWR("/api/patient-portal/resources", fetcher)

  // Fetch peer coach data
  const { data: peerCoachData, mutate: mutatePeerCoach } = useSWR(
    patientId ? `/api/patient-portal/peer-coach?patientId=${patientId}` : null,
    fetcher,
  )

  // Fetch referrals
  const { data: referralsData, mutate: mutateReferrals } = useSWR(
    patientId ? `/api/patient-portal/referrals?patientId=${patientId}` : null,
    fetcher,
  )

  const { data: hepPrograms, mutate: mutateHepPrograms } = useSWR(
    patientId ? `/api/patient-portal/hep-programs?patientId=${patientId}` : null,
    fetcher,
  )

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      message: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])

    setTimeout(() => {
      const lowerMessage = newMessage.toLowerCase()
      let response = {
        message:
          "Thank you for sharing. I am here to listen and support you. Is there anything specific you would like to talk about?",
        escalate: false,
      }

      if (lowerMessage.includes("anxious") || lowerMessage.includes("anxiety")) {
        response = {
          message:
            "I hear you are feeling anxious. That is a common experience in recovery. Would you like me to guide you through a quick breathing exercise? Try the Mindful Breathing game in the Recovery Games tab!",
          escalate: false,
        }
      } else if (lowerMessage.includes("craving") || lowerMessage.includes("urge")) {
        response = {
          message:
            "Thank you for sharing that you are experiencing cravings. Try the Urge Surfing exercise in our Recovery Games, or I can connect you with your counselor. Would you like me to help?",
          escalate: true,
        }
      } else if (lowerMessage.includes("support") || lowerMessage.includes("help")) {
        response = {
          message:
            "I am here to support you. You can also reach out to your Peer Recovery Coach in the Peer Coach tab, or explore our Resources section for community support.",
          escalate: false,
        }
      }

      const aiMessage = {
        id: messages.length + 2,
        type: "ai",
        message: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, aiMessage])

      if (response.escalate) {
        setEscalationRequested(true)
      }
    }, 1000)

    setNewMessage("")
  }

  const handleEscalateToCounselor = () => {
    const systemMessage = {
      id: messages.length + 1,
      type: "system",
      message:
        "Your counselor has been notified and will reach out to you shortly. If this is an emergency, please call 911 or the crisis line at 988.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, systemMessage])
    setEscalationRequested(false)
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  // Game handlers
  const startBreathingExercise = () => {
    setActiveGame("breathing")
    setBreathingCount(0)
    setBreathingPhase("inhale")

    let count = 0
    const interval = setInterval(() => {
      count++
      if (count % 12 <= 4) {
        setBreathingPhase("inhale")
      } else if (count % 12 <= 7) {
        setBreathingPhase("hold")
      } else {
        setBreathingPhase("exhale")
      }
      setBreathingCount(Math.floor(count / 12))

      if (count >= 60) {
        clearInterval(interval)
        setActiveGame(null)
        setGameScore((prev) => prev + 50)
        toast.success("Great job completing the breathing exercise! +50 points")
      }
    }, 1000)
  }

  const startMemoryGame = () => {
    setActiveGame("memory")
    const symbols = ["🌟", "💚", "🌈", "🦋", "🌸", "🌻", "🍀", "⭐"]
    const cards = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((value, id) => ({ id, value, flipped: false, matched: false }))
    setMemoryCards(cards)
    setSelectedCards([])
  }

  const handleCardClick = (cardId: number) => {
    if (selectedCards.length >= 2) return
    if (memoryCards[cardId].flipped || memoryCards[cardId].matched) return

    const newCards = [...memoryCards]
    newCards[cardId].flipped = true
    setMemoryCards(newCards)

    const newSelected = [...selectedCards, cardId]
    setSelectedCards(newSelected)

    if (newSelected.length === 2) {
      setTimeout(() => {
        const [first, second] = newSelected
        if (memoryCards[first].value === memoryCards[second].value) {
          const matchedCards = [...memoryCards]
          matchedCards[first].matched = true
          matchedCards[second].matched = true
          setMemoryCards(matchedCards)
          setGameScore((prev) => prev + 10)

          if (matchedCards.every((c) => c.matched)) {
            setActiveGame(null)
            setGameScore((prev) => prev + 50)
            toast.success("Congratulations! You completed the memory game! +50 bonus points")
          }
        } else {
          const resetCards = [...memoryCards]
          resetCards[first].flipped = false
          resetCards[second].flipped = false
          setMemoryCards(resetCards)
        }
        setSelectedCards([])
      }, 1000)
    }
  }

  const saveGratitudeEntry = () => {
    if (!gratitudeEntry.trim()) return
    setGameScore((prev) => prev + 25)
    toast.success("Gratitude entry saved! +25 points")
    setGratitudeEntry("")
    setActiveGame(null)
  }

  const saveTriggerEntry = () => {
    if (!triggerEntry.trigger.trim()) return
    setGameScore((prev) => prev + 30)
    toast.success("Trigger plan saved! +30 points")
    setTriggerEntry({ trigger: "", response: "" })
    setActiveGame(null)
  }

  const saveDailyCheckIn = () => {
    setGameScore((prev) => prev + 20)
    toast.success("Daily check-in complete! +20 points")
    setDailyMood(5)
    setDailyNotes("")
    setActiveGame(null)
  }

  const startUrgeSurfing = () => {
    setActiveGame("urge-surfing")
  }

  // Submit referral request
  const handleSubmitReferral = async () => {
    try {
      const response = await fetch("/api/patient-portal/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, ...referralForm }),
      })

      if (response.ok) {
        toast.success("Service referral request submitted successfully!")
        setReferralDialogOpen(false)
        setReferralForm({ serviceType: "", reason: "", urgency: "normal", notes: "" })
        mutateReferrals()
      } else {
        toast.error("Failed to submit referral request")
      }
    } catch (error) {
      toast.error("Failed to submit referral request")
    }
  }

  // Send peer coach message
  const handleSendPeerCoachMessage = async () => {
    if (!peerCoachMessage.trim()) return

    try {
      const response = await fetch("/api/patient-portal/peer-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, message: peerCoachMessage }),
      })

      if (response.ok) {
        toast.success("Message sent to your Peer Recovery Coach!")
        setPeerCoachMessage("")
        mutatePeerCoach()
      } else {
        toast.error("Failed to send message")
      }
    } catch (error) {
      toast.error("Failed to send message")
    }
  }

  const handleLogExercise = async () => {
    try {
      const response = await fetch("/api/patient-portal/hep-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          programId: selectedProgram,
          ...exerciseLog,
          logDate: new Date().toISOString().split("T")[0],
        }),
      })

      if (response.ok) {
        toast.success("Exercise logged successfully! Keep up the great work!")
        setLogExerciseDialog(false)
        setExerciseLog({ exerciseId: "", sets: 0, reps: 0, painLevel: 0, difficulty: 3, notes: "" })
        mutateHepPrograms()
      } else {
        toast.error("Failed to log exercise")
      }
    } catch (error) {
      toast.error("Failed to log exercise")
    }
  }

  // ADDED: Submit complaint handler
  const handleSubmitComplaint = async () => {
    try {
      const response = await fetch("/api/patient-portal/recipient-rights-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: complaintForm.isAnonymous ? null : patientId,
          ...complaintForm,
        }),
      })

      if (response.ok) {
        toast.success(
          "Your complaint has been submitted confidentially. A Recipient Rights Officer will contact you within 24 hours.",
        )
        setComplaintDialogOpen(false)
        setComplaintForm({
          incidentDate: "",
          incidentTime: "",
          incidentLocation: "",
          category: "",
          type: "",
          description: "",
          witnessNames: "",
          isAnonymous: false,
          contactName: "",
          contactPhone: "",
          contactEmail: "",
        })
      } else {
        toast.error("Failed to submit complaint")
      }
    } catch (error) {
      toast.error("Failed to submit complaint")
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f0fdf4" }}>
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: "#16a34a" }}
          ></div>
          <p style={{ color: "#64748b" }}>Loading your portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0fdf4" }}>
      {/* Header */}
      <header className="border-b p-4" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#16a34a" }}
            >
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold" style={{ color: "#1e293b" }}>
                Recovery Support Portal
              </h1>
              <p className="text-sm" style={{ color: "#64748b" }}>
                Welcome back, {patientInfo?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: "#fef3c7" }}>
              <Trophy className="h-4 w-4" style={{ color: "#d97706" }} />
              <span className="font-semibold" style={{ color: "#92400e" }}>
                {gameScore} pts
              </span>
            </div>
            <Button variant="ghost" size="icon" className="relative" onClick={() => setActiveTab("notifications")}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center text-white"
                  style={{ backgroundColor: "#dc2626" }}
                >
                  {unreadCount}
                </span>
              )}
            </Button>
            <Avatar>
              <AvatarFallback style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>
                {patientInfo?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="home">
              <Heart className="mr-1 h-4 w-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="hep">
              <Dumbbell className="mr-1 h-4 w-4" />
              My Exercises
            </TabsTrigger>
            <TabsTrigger value="takehome">
              <QrCode className="mr-1 h-4 w-4" />
              Take-Home
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="mr-1 h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="games">
              <Gamepad2 className="mr-1 h-4 w-4" />
              Games
            </TabsTrigger>
            <TabsTrigger value="peer-coach">
              <HandHeart className="mr-1 h-4 w-4" />
              Peer Coach
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <Clipboard className="mr-1 h-4 w-4" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="resources">
              <BookOpen className="mr-1 h-4 w-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="appointments">
              <Calendar className="mr-1 h-4 w-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="mr-1 h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="support">
              <MessageSquare className="mr-1 h-4 w-4" />
              Support
            </TabsTrigger>
            {/* ADDED: Health Records Tab */}
            <TabsTrigger value="health-records">
              <Heart className="mr-1 h-4 w-4" />
              Health Records
            </TabsTrigger>
            <TabsTrigger value="recipient-rights">
              <Shield className="mr-1 h-4 w-4" />
              Rights
            </TabsTrigger>
          </TabsList>

          {/* Home Tab */}
          <TabsContent value="home" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card style={{ backgroundColor: "#ffffff" }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold" style={{ color: "#16a34a" }}>
                      {patientInfo?.recoveryDays}
                    </div>
                    <p className="text-sm" style={{ color: "#64748b" }}>
                      Days in Recovery
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card style={{ backgroundColor: "#ffffff" }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold" style={{ color: "#0284c7" }}>
                      {patientInfo?.dose}
                    </div>
                    <p className="text-sm" style={{ color: "#64748b" }}>
                      Current Dose
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card style={{ backgroundColor: "#ffffff" }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Trophy className="h-8 w-8 mx-auto mb-2" style={{ color: "#d97706" }} />
                    <div className="text-2xl font-bold" style={{ color: "#92400e" }}>
                      {gameScore}
                    </div>
                    <p className="text-sm" style={{ color: "#64748b" }}>
                      Recovery Points
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card style={{ backgroundColor: "#ffffff" }}>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-transparent"
                    onClick={() => setActiveTab("games")}
                  >
                    <Gamepad2 className="h-6 w-6" />
                    <span>Recovery Games</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-transparent"
                    onClick={() => setActiveTab("peer-coach")}
                  >
                    <HandHeart className="h-6 w-6" />
                    <span>Peer Coach</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-transparent"
                    onClick={() => setActiveTab("documents")}
                  >
                    <FileText className="h-6 w-6" />
                    <span>My Documents</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-transparent"
                    onClick={() => setActiveTab("referrals")}
                  >
                    <Clipboard className="h-6 w-6" />
                    <span>Request Services</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: "#ffffff" }}>
              <CardHeader>
                <CardTitle>Your Care Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}>DS</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium" style={{ color: "#1e293b" }}>
                      {patientInfo?.counselor}
                    </p>
                    <p className="text-sm" style={{ color: "#64748b" }}>
                      Primary Counselor
                    </p>
                    <p className="text-sm" style={{ color: "#64748b" }}>
                      {patientInfo?.counselorPhone}
                    </p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Take-Home Dose Tab */}
          <TabsContent value="takehome" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Take-Home Dose Verification
                </CardTitle>
                <CardDescription>Scan your daily take-home dose QR code to confirm administration.</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div
                  className="mx-auto mb-6 flex items-center justify-center h-64 w-64 rounded-lg border-4 border-dashed p-5"
                  style={{ backgroundColor: "#f8fafc", borderColor: "#a0aec0" }}
                >
                  <div className="text-center">
                    <QrCode className="h-24 w-24 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-700">Scan QR Code</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Point your camera at the QR code provided by your clinic.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Once scanned, the system will confirm your daily take-home dose. Please ensure you are in a well-lit
                  area.
                </p>
                {/* You would typically integrate a QR code scanning library here */}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card style={{ backgroundColor: "#ffffff" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  My Documents
                </CardTitle>
                <CardDescription>Access your treatment plans, consent forms, and medical records</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="treatment-plans">
                  <TabsList className="mb-4">
                    <TabsTrigger value="treatment-plans">Treatment Plans</TabsTrigger>
                    <TabsTrigger value="consents">Consent Forms</TabsTrigger>
                    <TabsTrigger value="medications">Medications</TabsTrigger>
                    <TabsTrigger value="discharge">Discharge Summaries</TabsTrigger>
                  </TabsList>

                  <TabsContent value="treatment-plans">
                    <div className="space-y-4">
                      {documents?.treatmentPlans?.length > 0 ? (
                        documents.treatmentPlans.map((plan: any) => (
                          <Card key={plan.id} className="border">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">Treatment Plan</p>
                                  <p className="text-sm text-muted-foreground">
                                    Created: {new Date(plan.created_at).toLocaleDateString()}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Provider: {plan.provider?.first_name} {plan.provider?.last_name}
                                  </p>
                                  <Badge className="mt-2">{plan.status}</Badge>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Download className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                              </div>
                              {plan.goals && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium">Goals:</p>
                                  <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1">
                                    {plan.goals.slice(0, 3).map((goal: any, i: number) => (
                                      <li key={i}>{goal.description || goal}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No treatment plans available</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="consents">
                    <div className="space-y-4">
                      {documents?.consents?.length > 0 ? (
                        documents.consents.map((consent: any) => (
                          <Card key={consent.id} className="border">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{consent.form?.form_name || "Consent Form"}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Signed: {new Date(consent.completed_at || consent.created_at).toLocaleDateString()}
                                  </p>
                                  <Badge variant="outline" className="mt-2">
                                    {consent.form?.category || "General"}
                                  </Badge>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No consent forms on file</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="medications">
                    <div className="space-y-4">
                      {documents?.medications?.length > 0 ? (
                        documents.medications.map((med: any) => (
                          <Card key={med.id} className="border">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{med.medication_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Dosage: {med.dosage} - {med.frequency}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Started: {new Date(med.start_date).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>Active</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No active medications</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="discharge">
                    <div className="space-y-4">
                      {documents?.dischargeSummaries?.length > 0 ? (
                        documents.dischargeSummaries.map((summary: any) => (
                          <Card key={summary.id} className="border">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">Discharge Summary</p>
                                  <p className="text-sm text-muted-foreground">
                                    Date: {new Date(summary.discharge_date || summary.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Download className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No discharge summaries</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recovery Games Tab */}
          <TabsContent value="games" className="space-y-6">
            <Card style={{ backgroundColor: "#ffffff" }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5" />
                      Recovery Games & Exercises
                    </CardTitle>
                    <CardDescription>
                      Build coping skills and earn points while supporting your recovery
                    </CardDescription>
                  </div>
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ backgroundColor: "#fef3c7" }}
                  >
                    <Trophy className="h-5 w-5" style={{ color: "#d97706" }} />
                    <span className="font-bold text-lg" style={{ color: "#92400e" }}>
                      {gameScore} points
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeGame === null ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brainGames.map((game) => (
                      <Card
                        key={game.id}
                        className="border cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          if (game.id === "breathing") startBreathingExercise()
                          else if (game.id === "memory") startMemoryGame()
                          else if (game.id === "gratitude") setActiveGame("gratitude")
                          else if (game.id === "trigger-tracker") setActiveGame("trigger-tracker")
                          else if (game.id === "daily-check") setActiveGame("daily-check")
                          else if (game.id === "urge-surfing") startUrgeSurfing()
                        }}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div
                              className="h-12 w-12 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${game.color}20` }}
                            >
                              <game.icon className="h-6 w-6" style={{ color: game.color }} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{game.name}</h3>
                              <p className="text-sm text-muted-foreground">{game.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{game.category}</Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {game.duration}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : activeGame === "breathing" ? (
                  <div className="text-center py-8">
                    <div
                      className={`h-48 w-48 mx-auto rounded-full flex items-center justify-center transition-all duration-1000 ${
                        breathingPhase === "inhale"
                          ? "scale-110"
                          : breathingPhase === "hold"
                            ? "scale-110"
                            : "scale-100"
                      }`}
                      style={{
                        backgroundColor:
                          breathingPhase === "inhale" ? "#dcfce7" : breathingPhase === "hold" ? "#e0f2fe" : "#fef3c7",
                      }}
                    >
                      <div className="text-center">
                        <p
                          className="text-2xl font-bold"
                          style={{
                            color:
                              breathingPhase === "inhale"
                                ? "#16a34a"
                                : breathingPhase === "hold"
                                  ? "#0284c7"
                                  : "#d97706",
                          }}
                        >
                          {breathingPhase === "inhale"
                            ? "Breathe In"
                            : breathingPhase === "hold"
                              ? "Hold"
                              : "Breathe Out"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">Cycle {breathingCount + 1} of 5</p>
                      </div>
                    </div>
                    <Progress value={(breathingCount / 5) * 100} className="mt-6 max-w-md mx-auto" />
                    <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setActiveGame(null)}>
                      Exit Exercise
                    </Button>
                  </div>
                ) : activeGame === "memory" ? (
                  <div className="text-center">
                    <p className="mb-4 text-muted-foreground">Match the pairs to train your memory!</p>
                    <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                      {memoryCards.map((card) => (
                        <button
                          key={card.id}
                          className={`h-16 w-16 rounded-lg text-2xl flex items-center justify-center transition-all ${
                            card.flipped || card.matched ? "bg-green-100" : "bg-slate-200 hover:bg-slate-300"
                          }`}
                          onClick={() => handleCardClick(card.id)}
                          disabled={card.matched}
                        >
                          {card.flipped || card.matched ? card.value : "?"}
                        </button>
                      ))}
                    </div>
                    <Button variant="outline" className="mt-6 bg-transparent" onClick={() => setActiveGame(null)}>
                      Exit Game
                    </Button>
                  </div>
                ) : activeGame === "gratitude" ? (
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-semibold mb-4 text-center">Gratitude Journal</h3>
                    <p className="text-muted-foreground text-center mb-4">Write 3 things you are grateful for today</p>
                    <Textarea
                      placeholder="I am grateful for..."
                      value={gratitudeEntry}
                      onChange={(e) => setGratitudeEntry(e.target.value)}
                      rows={6}
                    />
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" onClick={() => setActiveGame(null)}>
                        Cancel
                      </Button>
                      <Button onClick={saveGratitudeEntry} style={{ backgroundColor: "#16a34a" }}>
                        Save Entry (+25 pts)
                      </Button>
                    </div>
                  </div>
                ) : activeGame === "trigger-tracker" ? (
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-semibold mb-4 text-center">Trigger Tracker</h3>
                    <p className="text-muted-foreground text-center mb-4">Identify a trigger and plan your response</p>
                    <div className="space-y-4">
                      <div>
                        <Label>What is your trigger?</Label>
                        <Input
                          placeholder="Describe the trigger..."
                          value={triggerEntry.trigger}
                          onChange={(e) => setTriggerEntry({ ...triggerEntry, trigger: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>How will you respond?</Label>
                        <Textarea
                          placeholder="My healthy response will be..."
                          value={triggerEntry.response}
                          onChange={(e) => setTriggerEntry({ ...triggerEntry, response: e.target.value })}
                          rows={4}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" onClick={() => setActiveGame(null)}>
                        Cancel
                      </Button>
                      <Button onClick={saveTriggerEntry} style={{ backgroundColor: "#7c3aed" }}>
                        Save Plan (+30 pts)
                      </Button>
                    </div>
                  </div>
                ) : activeGame === "daily-check" ? (
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-semibold mb-4 text-center">Daily Check-In</h3>
                    <div className="space-y-6">
                      <div>
                        <Label>How are you feeling today? (1-10)</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-2xl">😔</span>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={dailyMood}
                            onChange={(e) => setDailyMood(Number.parseInt(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-2xl">😊</span>
                        </div>
                        <p className="text-center text-lg font-semibold mt-2">{dailyMood}/10</p>
                      </div>
                      <div>
                        <Label>Any notes for today?</Label>
                        <Textarea
                          placeholder="How was your day..."
                          value={dailyNotes}
                          onChange={(e) => setDailyNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" onClick={() => setActiveGame(null)}>
                        Cancel
                      </Button>
                      <Button onClick={saveDailyCheckIn} style={{ backgroundColor: "#0891b2" }}>
                        Complete (+20 pts)
                      </Button>
                    </div>
                  </div>
                ) : activeGame === "urge-surfing" ? (
                  <div className="max-w-lg mx-auto text-center">
                    <h3 className="text-lg font-semibold mb-4">Urge Surfing</h3>
                    <div className="p-6 rounded-lg mb-6" style={{ backgroundColor: "#fef3c7" }}>
                      <p className="text-lg mb-4">Urges are like ocean waves - they rise, peak, and fall.</p>
                      <p className="text-muted-foreground">
                        Instead of fighting the urge, observe it without judgment. Notice where you feel it in your
                        body. Breathe through it. The wave will pass.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <p className="font-medium">Steps to Urge Surf:</p>
                      <ol className="text-left space-y-2 text-muted-foreground">
                        <li>1. Notice the urge without trying to change it</li>
                        <li>2. Focus on where you feel it in your body</li>
                        <li>3. Breathe deeply and observe the sensation</li>
                        <li>4. Remind yourself: This will pass</li>
                        <li>5. Stay present until the intensity decreases</li>
                      </ol>
                    </div>
                    <div className="flex gap-2 mt-6 justify-center">
                      <Button variant="outline" onClick={() => setActiveGame(null)}>
                        Exit
                      </Button>
                      <Button
                        onClick={() => {
                          setGameScore((prev) => prev + 40)
                          toast.success("Great job practicing urge surfing! +40 pts")
                          setActiveGame(null)
                        }}
                        style={{ backgroundColor: "#d97706" }}
                      >
                        I Completed This (+40 pts)
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Peer Recovery Coach Tab */}
          <TabsContent value="peer-coach" className="space-y-6">
            <Card style={{ backgroundColor: "#ffffff" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HandHeart className="h-5 w-5" />
                  Peer Recovery Coach
                </CardTitle>
                <CardDescription>Connect with someone who understands your journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Coach Info */}
                  <Card className="border">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Avatar className="h-20 w-20 mx-auto mb-4">
                          <AvatarFallback style={{ backgroundColor: "#dcfce7", color: "#16a34a", fontSize: "1.5rem" }}>
                            {peerCoachData?.peerCoach
                              ? `${peerCoachData.peerCoach.first_name?.[0]}${peerCoachData.peerCoach.last_name?.[0]}`
                              : "PC"}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-lg">
                          {peerCoachData?.peerCoach
                            ? `${peerCoachData.peerCoach.first_name} ${peerCoachData.peerCoach.last_name}`
                            : "Your Peer Coach"}
                        </h3>
                        <p className="text-sm text-muted-foreground">Peer Recovery Specialist</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {peerCoachData?.peerCoach?.specialization ||
                            "Certified Peer Support Specialist with lived recovery experience"}
                        </p>
                        <div className="flex gap-2 mt-4 justify-center">
                          <Button variant="outline" size="sm">
                            <Phone className="mr-2 h-4 w-4" />
                            Call
                          </Button>
                          <Button variant="outline" size="sm">
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Message Area */}
                  <div className="md:col-span-2">
                    <Card className="border h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Send a Message</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48 mb-4 border rounded-lg p-3">
                          {peerCoachData?.messages?.length > 0 ? (
                            peerCoachData.messages.map((msg: any) => (
                              <div key={msg.id} className="mb-3">
                                <p className="text-sm">{msg.message}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(msg.created_at).toLocaleString()}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No messages yet. Start a conversation!</p>
                            </div>
                          )}
                        </ScrollArea>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Write a message to your peer coach..."
                            value={peerCoachMessage}
                            onChange={(e) => setPeerCoachMessage(e.target.value)}
                            rows={2}
                            className="flex-1"
                          />
                          <Button onClick={handleSendPeerCoachMessage} style={{ backgroundColor: "#16a34a" }}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Peer Support Info */}
                <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: "#f0fdf4" }}>
                  <h4 className="font-semibold mb-2">What is a Peer Recovery Coach?</h4>
                  <p className="text-sm text-muted-foreground">
                    Peer Recovery Coaches are individuals with lived experience in recovery who provide support,
                    guidance, and hope to others on their recovery journey. They understand the challenges you face
                    because they have been there too.
                  </p>
                  <ul className="mt-3 text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Share their personal recovery experience</li>
                    <li>Help you develop and maintain your recovery plan</li>
                    <li>Connect you with community resources</li>
                    <li>Provide encouragement and accountability</li>
                    <li>Assist with navigating the recovery system</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals / Request Services Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <Card style={{ backgroundColor: "#ffffff" }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clipboard className="h-5 w-5" />
                      Service Referrals & Case Management
                    </CardTitle>
                    <CardDescription>Request additional services and track your referrals</CardDescription>
                  </div>
                  <Button onClick={() => setReferralDialogOpen(true)} style={{ backgroundColor: "#16a34a" }}>
                    Request Service
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Service Categories */}
                  <Card className="border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Available Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { name: "Housing Assistance", icon: Home, color: "#16a34a" },
                          { name: "Employment Services", icon: Briefcase, color: "#0284c7" },
                          { name: "Mental Health Counseling", icon: Brain, color: "#7c3aed" },
                          { name: "Transportation", icon: MapPin, color: "#d97706" },
                          { name: "Legal Aid", icon: FileText, color: "#dc2626" },
                          { name: "Family Services", icon: Users, color: "#0891b2" },
                        ].map((service) => (
                          <div
                            key={service.name}
                            className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer"
                            onClick={() => {
                              setReferralForm({ ...referralForm, serviceType: service.name })
                              setReferralDialogOpen(true)
                            }}
                          >
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${service.color}20` }}
                            >
                              <service.icon className="h-4 w-4" style={{ color: service.color }} />
                            </div>
                            <span className="text-sm">{service.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* My Referrals */}
                  <Card className="border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">My Referral Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {referralsData?.referrals?.length > 0 ? (
                        <div className="space-y-3">
                          {referralsData.referrals.map((referral: any) => (
                            <div key={referral.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">
                                  {referral.subject?.replace("Service Referral Request: ", "")}
                                </p>
                                <Badge variant={referral.priority === "urgent" ? "destructive" : "outline"}>
                                  {referral.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Requested: {new Date(referral.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clipboard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No referral requests yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* 42 CFR Information */}
                <Card className="border" style={{ backgroundColor: "#f0fdf4" }}>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      Your Privacy Rights (42 CFR Part 2)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Under federal law (42 CFR Part 2), your substance use disorder treatment records are protected
                      with special confidentiality protections. Your records cannot be disclosed without your written
                      consent, except in limited circumstances. This includes protection to employers, law enforcement,
                      and even other healthcare providers without your permission.
                    </p>
                    <Button variant="link" className="p-0 mt-2 h-auto">
                      Learn more about your rights
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <Card style={{ backgroundColor: "#ffffff" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Recovery Resources
                </CardTitle>
                <CardDescription>Community support, crisis lines, and helpful resources</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="crisis">
                  <TabsList className="mb-4">
                    <TabsTrigger value="crisis">Crisis Lines</TabsTrigger>
                    <TabsTrigger value="support">Support Groups</TabsTrigger>
                    <TabsTrigger value="michigan">Michigan Resources</TabsTrigger>
                    <TabsTrigger value="housing">Housing</TabsTrigger>
                    <TabsTrigger value="employment">Employment</TabsTrigger>
                  </TabsList>

                  <TabsContent value="crisis">
                    <div className="space-y-4">
                      {resources?.crisisLines?.map((line: any, i: number) => (
                        <Card key={i} className="border border-red-200" style={{ backgroundColor: "#fef3c7" }}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold" style={{ color: "#dc2626" }}>
                                  {line.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">{line.description}</p>
                                <p className="text-xs mt-1">Available: {line.available}</p>
                              </div>
                              <Button style={{ backgroundColor: "#dc2626" }}>
                                <PhoneCall className="mr-2 h-4 w-4" />
                                {line.phone}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="support">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {resources?.supportGroups?.map((group: any, i: number) => (
                        <Card key={i} className="border">
                          <CardContent className="pt-4">
                            <h4 className="font-semibold">{group.name}</h4>
                            <p className="text-sm text-muted-foreground">{group.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{group.type}</Badge>
                              {group.website && (
                                <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                                  <a href={group.website} target="_blank" rel="noopener noreferrer">
                                    <Globe className="mr-1 h-3 w-3" />
                                    Visit Website
                                  </a>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="michigan">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg" style={{ backgroundColor: "#e0f2fe" }}>
                        <h4 className="font-semibold" style={{ color: "#0284c7" }}>
                          State of Michigan Resources
                        </h4>
                        <p className="text-sm text-muted-foreground">Local resources specific to Michigan residents</p>
                      </div>
                      {resources?.michiganResources?.map((resource: any, i: number) => (
                        <Card key={i} className="border">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{resource.name}</h4>
                                <p className="text-sm text-muted-foreground">{resource.description}</p>
                              </div>
                              {resource.phone && (
                                <Button variant="outline">
                                  <Phone className="mr-2 h-4 w-4" />
                                  {resource.phone}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="housing">
                    <div className="space-y-4">
                      {resources?.housingAssistance?.map((housing: any, i: number) => (
                        <Card key={i} className="border">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{housing.name}</h4>
                                <p className="text-sm text-muted-foreground">{housing.description}</p>
                              </div>
                              {housing.website && (
                                <Button variant="outline" asChild>
                                  <a href={housing.website} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Website
                                  </a>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="employment">
                    <div className="space-y-4">
                      {resources?.employmentServices?.map((service: any, i: number) => (
                        <Card key={i} className="border">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{service.name}</h4>
                                <p className="text-sm text-muted-foreground">{service.description}</p>
                              </div>
                              {service.website && (
                                <Button variant="outline" asChild>
                                  <a href={service.website} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Website
                                  </a>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <Card style={{ backgroundColor: "#ffffff" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  My Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Card className="border border-green-200" style={{ backgroundColor: "#f0fdf4" }}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>Upcoming</Badge>
                          <h4 className="font-semibold mt-2">{patientInfo?.nextAppointment}</h4>
                          <p className="text-sm text-muted-foreground">{patientInfo?.counselor}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Reschedule
                          </Button>
                          <Button size="sm" style={{ backgroundColor: "#16a34a" }}>
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card style={{ backgroundColor: "#ffffff" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing & Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2" style={{ color: "#16a34a" }} />
                        <p className="text-2xl font-bold" style={{ color: "#16a34a" }}>
                          $0.00
                        </p>
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2" style={{ color: "#0284c7" }} />
                        <p className="text-sm font-medium">Insurance Status</p>
                        <Badge className="mt-2" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Button className="mt-4 w-full bg-transparent" variant="outline">
                  View Payment History
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <Card style={{ backgroundColor: "#ffffff" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Wellness Support
                </CardTitle>
                <CardDescription>Chat with our AI assistant for immediate support</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 border rounded-lg p-4 mb-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`mb-4 ${msg.type === "user" ? "text-right" : ""}`}>
                      <div
                        className={`inline-block p-3 rounded-lg max-w-[80%] ${
                          msg.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : msg.type === "system"
                              ? "bg-yellow-100 text-yellow-900"
                              : "bg-slate-100"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>

                {escalationRequested && (
                  <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: "#fef3c7" }}>
                    <p className="text-sm font-medium" style={{ color: "#92400e" }}>
                      Would you like to speak with your counselor?
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={handleEscalateToCounselor} style={{ backgroundColor: "#d97706" }}>
                        Yes, contact my counselor
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEscalationRequested(false)}>
                        No, continue chatting
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} style={{ backgroundColor: "#16a34a" }}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: "#fee2e2" }}>
                  <p className="text-sm" style={{ color: "#dc2626" }}>
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    If you are in crisis, call 988 (Suicide & Crisis Lifeline) or 911
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card style={{ backgroundColor: "#ffffff" }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNotifications(notifications.map((n) => ({ ...n, read: true })))}
                    >
                      Mark All as Read
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${!notification.read ? "border-l-4" : ""}`}
                      style={{
                        borderLeftColor: !notification.read ? "#16a34a" : undefined,
                        backgroundColor: notification.read ? "#f8fafc" : "#ffffff",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.date}</p>
                        </div>
                        {!notification.read && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(notification.id)}>
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Records Tab - ADDED */}
          <TabsContent value="health-records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Medical History</CardTitle>
                <CardDescription>Your complete health record</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Immunization Records section */}
                  <div>
                    <h3 className="font-medium text-sm mb-2">Immunization Records</h3>
                    <div className="space-y-2">
                      {[
                        { vaccine: "COVID-19 (Moderna)", date: "Mar 15, 2025", provider: "Dr. Smith" },
                        { vaccine: "Influenza (Quadrivalent)", date: "Oct 12, 2024", provider: "Dr. Johnson" },
                        { vaccine: "Tdap Booster", date: "Jan 8, 2024", provider: "Dr. Smith" },
                      ].map((vax, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Syringe className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium">{vax.vaccine}</p>
                              <p className="text-xs text-muted-foreground">{vax.provider}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{vax.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Example of existing medical history sections (if any) would go here */}
                  {/* For this merge, we are only adding the Immunization Records section */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADDED: Recipient Rights TabsContent */}
          <TabsContent value="recipient-rights" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "#dc2626" }}
                  >
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Recipient Rights</CardTitle>
                    <CardDescription>File a confidential complaint about your care or treatment</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Your Rights Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg" style={{ color: "#1e293b" }}>
                    Your Rights as a Patient
                  </h3>
                  <div className="grid gap-3">
                    {[
                      {
                        title: "Right to Informed Consent",
                        description: "You have the right to understand your treatment and give informed consent",
                      },
                      {
                        title: "Right to Dignity & Respect",
                        description:
                          "You have the right to be treated with dignity, respect, and without discrimination",
                      },
                      {
                        title: "Right to Privacy & Confidentiality",
                        description:
                          "Your medical information is confidential and protected under HIPAA and 42 CFR Part 2",
                      },
                      {
                        title: "Right to Refuse Treatment",
                        description:
                          "You have the right to refuse any treatment or medication after being informed of risks",
                      },
                      {
                        title: "Right to Safe Environment",
                        description: "You have the right to receive care in a safe, clean, and appropriate environment",
                      },
                      {
                        title: "Right to File Complaints",
                        description:
                          "You have the right to file complaints without fear of retaliation or discrimination",
                      },
                    ].map((right, idx) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-1" style={{ color: "#0f172a" }}>
                            {right.title}
                          </h4>
                          <p className="text-sm" style={{ color: "#64748b" }}>
                            {right.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* File Complaint Button */}
                <div className="pt-4 border-t" style={{ borderColor: "#e2e8f0" }}>
                  <div className="flex flex-col gap-4">
                    <div
                      className="p-4 rounded-lg border-2 border-dashed"
                      style={{ borderColor: "#dc2626", backgroundColor: "#fef2f2" }}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 mt-0.5" style={{ color: "#dc2626" }} />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1" style={{ color: "#991b1b" }}>
                            Need to File a Complaint?
                          </h4>
                          <p className="text-sm mb-3" style={{ color: "#7f1d1d" }}>
                            If you believe your rights have been violated or you have concerns about your care, please
                            file a confidential complaint. A Recipient Rights Officer will review your complaint and
                            contact you within 24 hours.
                          </p>
                          <div className="flex gap-2">
                            <Button onClick={() => setComplaintDialogOpen(true)} style={{ backgroundColor: "#dc2626" }}>
                              <Send className="mr-2 h-4 w-4" />
                              File Complaint
                            </Button>
                            <Button variant="outline" asChild>
                              <a href="tel:988">
                                <Phone className="mr-2 h-4 w-4" />
                                Crisis Line: 988
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Card>
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2" style={{ color: "#0f172a" }}>
                            Confidential Process
                          </h4>
                          <p className="text-sm" style={{ color: "#64748b" }}>
                            All complaints are handled confidentially and investigated by trained Recipient Rights
                            Officers. You can file anonymously if you prefer.
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2" style={{ color: "#0f172a" }}>
                            No Retaliation
                          </h4>
                          <p className="text-sm" style={{ color: "#64748b" }}>
                            You are protected from retaliation for filing a complaint. It is illegal for any staff to
                            retaliate against you for exercising your rights.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hep" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  My Home Exercise Programs
                </CardTitle>
                <CardDescription>
                  View your assigned exercises, log your progress, and track your recovery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!hepPrograms || hepPrograms.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No exercise programs assigned yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your therapist will assign exercises during your next appointment
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hepPrograms.map((program: any) => (
                      <Card key={program.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{program.program_name}</CardTitle>
                              <CardDescription>
                                Assigned by {program.therapist_name} • {program.frequency}
                              </CardDescription>
                            </div>
                            <Badge
                              variant={program.status === "active" ? "default" : "secondary"}
                              className="capitalize"
                            >
                              {program.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Progress Overview */}
                          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{program.compliance_rate}%</div>
                              <p className="text-xs text-muted-foreground">Compliance</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">{program.days_completed}</div>
                              <p className="text-xs text-muted-foreground">Days Completed</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">{program.streak}</div>
                              <p className="text-xs text-muted-foreground">Day Streak</p>
                            </div>
                          </div>

                          {/* Exercises */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Exercises</h4>
                            {program.exercises?.map((exercise: any, idx: number) => (
                              <div key={idx} className="flex items-start justify-between p-3 bg-background rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-medium">{exercise.exercise_name}</h5>
                                    {exercise.completed_today && (
                                      <Badge variant="secondary" className="text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Done Today
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{exercise.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>
                                      {exercise.sets} sets × {exercise.reps} reps
                                    </span>
                                    {exercise.hold_duration_seconds && (
                                      <span>Hold {exercise.hold_duration_seconds}s</span>
                                    )}
                                  </div>
                                  {exercise.video_url && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="p-0 h-auto mt-2"
                                      onClick={() => window.open(exercise.video_url, "_blank")}
                                    >
                                      <Play className="h-3 w-3 mr-1" />
                                      Watch Video
                                    </Button>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProgram(program.id)
                                    setExerciseLog({ ...exerciseLog, exerciseId: exercise.id })
                                    setLogExerciseDialog(true)
                                  }}
                                  disabled={exercise.completed_today}
                                >
                                  Log Exercise
                                </Button>
                              </div>
                            ))}
                          </div>

                          {/* Special Instructions */}
                          {program.special_instructions && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <h5 className="font-medium text-sm text-blue-900 mb-1">Special Instructions</h5>
                              <p className="text-sm text-blue-800">{program.special_instructions}</p>
                            </div>
                          )}

                          {/* Program Goals */}
                          {program.program_goals && (
                            <div className="p-3 bg-green-50 rounded-lg">
                              <h5 className="font-medium text-sm text-green-900 mb-1">
                                <Target className="h-4 w-4 inline mr-1" />
                                Program Goals
                              </h5>
                              <p className="text-sm text-green-800">{program.program_goals}</p>
                            </div>
                          )}

                          {/* Progress Chart */}
                          {program.weekly_progress && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Weekly Progress
                              </h5>
                              <div className="grid grid-cols-7 gap-2">
                                {program.weekly_progress.map((day: any, idx: number) => (
                                  <div key={idx} className="text-center">
                                    <div
                                      className={`h-12 rounded-lg flex items-center justify-center text-xs font-medium ${
                                        day.completed ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {day.completed ? <CheckCircle className="h-4 w-4" /> : day.day}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{day.day}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Request Dialog */}
          <Dialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Service Referral</DialogTitle>
                <DialogDescription>Submit a request for additional support services</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Service Type</Label>
                  <Select
                    value={referralForm.serviceType}
                    onValueChange={(v) => setReferralForm({ ...referralForm, serviceType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Housing Assistance">Housing Assistance</SelectItem>
                      <SelectItem value="Employment Services">Employment Services</SelectItem>
                      <SelectItem value="Mental Health Counseling">Mental Health Counseling</SelectItem>
                      <SelectItem value="Transportation">Transportation</SelectItem>
                      <SelectItem value="Legal Aid">Legal Aid</SelectItem>
                      <SelectItem value="Family Services">Family Services</SelectItem>
                      <SelectItem value="Medical Care">Medical Care</SelectItem>
                      <SelectItem value="Dental Care">Dental Care</SelectItem>
                      <SelectItem value="Food Assistance">Food Assistance</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reason for Request</Label>
                  <Textarea
                    placeholder="Please describe why you need this service..."
                    value={referralForm.reason}
                    onChange={(e) => setReferralForm({ ...referralForm, reason: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Urgency</Label>
                  <Select
                    value={referralForm.urgency}
                    onValueChange={(v) => setReferralForm({ ...referralForm, urgency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Within a month</SelectItem>
                      <SelectItem value="normal">Normal - Within 2 weeks</SelectItem>
                      <SelectItem value="high">High - Within a week</SelectItem>
                      <SelectItem value="urgent">Urgent - Immediate need</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Additional Notes (Optional)</Label>
                  <Textarea
                    placeholder="Any additional information..."
                    value={referralForm.notes}
                    onChange={(e) => setReferralForm({ ...referralForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReferralDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReferral}
                  disabled={!referralForm.serviceType || !referralForm.reason}
                  style={{ backgroundColor: "#16a34a" }}
                >
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={logExerciseDialog} onOpenChange={setLogExerciseDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Exercise</DialogTitle>
                <DialogDescription>Record your exercise completion and how you felt</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sets Completed</Label>
                    <Input
                      type="number"
                      min="0"
                      value={exerciseLog.sets}
                      onChange={(e) => setExerciseLog({ ...exerciseLog, sets: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reps per Set</Label>
                    <Input
                      type="number"
                      min="0"
                      value={exerciseLog.reps}
                      onChange={(e) => setExerciseLog({ ...exerciseLog, reps: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pain Level (0 = No Pain, 10 = Worst Pain)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="range"
                      min="0"
                      max="10"
                      value={exerciseLog.painLevel}
                      onChange={(e) => setExerciseLog({ ...exerciseLog, painLevel: Number.parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="w-8 text-center font-bold">{exerciseLog.painLevel}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty (1 = Too Easy, 5 = Too Hard)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="range"
                      min="1"
                      max="5"
                      value={exerciseLog.difficulty}
                      onChange={(e) => setExerciseLog({ ...exerciseLog, difficulty: Number.parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="w-8 text-center font-bold">{exerciseLog.difficulty}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Any pain, difficulty, or questions about the exercise?"
                    value={exerciseLog.notes}
                    onChange={(e) => setExerciseLog({ ...exerciseLog, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLogExerciseDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleLogExercise}>Log Exercise</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ADDED: Recipient Rights Complaint Dialog */}
          <Dialog open={complaintDialogOpen} onOpenChange={setComplaintDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" style={{ color: "#dc2626" }} />
                  File a Recipient Rights Complaint
                </DialogTitle>
                <DialogDescription>
                  Your complaint will be handled confidentially by a Recipient Rights Officer. You can file anonymously
                  if you prefer.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Anonymous Option */}
                <div
                  className="flex items-center space-x-2 p-3 border rounded-lg"
                  style={{ backgroundColor: "#f8fafc" }}
                >
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={complaintForm.isAnonymous}
                    onChange={(e) => setComplaintForm({ ...complaintForm, isAnonymous: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="anonymous" className="text-sm">
                    File this complaint anonymously (your identity will not be disclosed)
                  </Label>
                </div>

                {/* Incident Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="incidentDate">Incident Date *</Label>
                    <Input
                      id="incidentDate"
                      type="date"
                      value={complaintForm.incidentDate}
                      onChange={(e) => setComplaintForm({ ...complaintForm, incidentDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="incidentTime">Incident Time</Label>
                    <Input
                      id="incidentTime"
                      type="time"
                      value={complaintForm.incidentTime}
                      onChange={(e) => setComplaintForm({ ...complaintForm, incidentTime: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="incidentLocation">Incident Location</Label>
                  <Input
                    id="incidentLocation"
                    placeholder="e.g., Counseling Room 3, Waiting Area, Dispensing Window"
                    value={complaintForm.incidentLocation}
                    onChange={(e) => setComplaintForm({ ...complaintForm, incidentLocation: e.target.value })}
                  />
                </div>

                {/* Complaint Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Complaint Category *</Label>
                    <Select
                      value={complaintForm.category}
                      onValueChange={(val) => setComplaintForm({ ...complaintForm, category: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abuse">Abuse (Physical, Verbal, Emotional)</SelectItem>
                        <SelectItem value="neglect">Neglect or Abandonment</SelectItem>
                        <SelectItem value="rights_violation">Rights Violation</SelectItem>
                        <SelectItem value="quality_of_care">Quality of Care</SelectItem>
                        <SelectItem value="medication_error">Medication Error</SelectItem>
                        <SelectItem value="confidentiality">Confidentiality Breach</SelectItem>
                        <SelectItem value="discrimination">Discrimination</SelectItem>
                        <SelectItem value="financial">Financial Exploitation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Specific Type *</Label>
                    <Input
                      id="type"
                      placeholder="e.g., Verbal abuse, Denied access to records"
                      value={complaintForm.type}
                      onChange={(e) => setComplaintForm({ ...complaintForm, type: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Detailed Description of Incident *</Label>
                  <Textarea
                    id="description"
                    rows={6}
                    placeholder="Please describe what happened in as much detail as possible. Include who was involved, what was said or done, and any other relevant information..."
                    value={complaintForm.description}
                    onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                    required
                  />
                </div>

                {/* Witnesses */}
                <div>
                  <Label htmlFor="witnessNames">Witnesses (if any)</Label>
                  <Input
                    id="witnessNames"
                    placeholder="Names of any witnesses to the incident"
                    value={complaintForm.witnessNames}
                    onChange={(e) => setComplaintForm({ ...complaintForm, witnessNames: e.target.value })}
                  />
                </div>

                {/* Contact Information (if not anonymous) */}
                {!complaintForm.isAnonymous && (
                  <Card style={{ backgroundColor: "#f0fdf4", borderColor: "#10b981" }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Contact Information</CardTitle>
                      <CardDescription className="text-xs">
                        We will use this information to follow up with you about your complaint
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label htmlFor="contactName">Your Name</Label>
                        <Input
                          id="contactName"
                          value={complaintForm.contactName || patientInfo?.name}
                          onChange={(e) => setComplaintForm({ ...complaintForm, contactName: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="contactPhone">Phone Number</Label>
                          <Input
                            id="contactPhone"
                            type="tel"
                            value={complaintForm.contactPhone}
                            onChange={(e) => setComplaintForm({ ...complaintForm, contactPhone: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactEmail">Email Address</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            value={complaintForm.contactEmail}
                            onChange={(e) => setComplaintForm({ ...complaintForm, contactEmail: e.target.value })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Important Notice */}
                <Card style={{ backgroundColor: "#fef2f2", borderColor: "#dc2626" }}>
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: "#dc2626" }} />
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold" style={{ color: "#991b1b" }}>
                          Important Information About Your Rights
                        </p>
                        <ul className="space-y-1" style={{ color: "#7f1d1d" }}>
                          <li>• You have the right to file a complaint without fear of retaliation</li>
                          <li>• Your complaint will be investigated within 24 hours</li>
                          <li>• You will receive a response within 5 business days</li>
                          <li>• If immediate danger exists, please call 911 or our crisis line: 988</li>
                          <li>• You can request advocacy support from the Recipient Rights Officer</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setComplaintDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
                  onClick={handleSubmitComplaint}
                  disabled={
                    !complaintForm.incidentDate ||
                    !complaintForm.category ||
                    !complaintForm.type ||
                    !complaintForm.description
                  }
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Submit Complaint
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Tabs>
      </main>
    </div>
  )
}
