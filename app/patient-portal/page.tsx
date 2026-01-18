"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import useSWR from "swr";
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
  Camera,
  Upload,
  X,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface PatientInfo {
  name: string;
  id: string;
  program: string;
  dose: string;
  nextAppointment: string;
  counselor: string;
  counselorPhone: string;
  recoveryDays: number;
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
];

// Required Forms Mapping
const REQUIRED_FORMS_MAPPING: Record<string, string> = {
  consent_for_treatment: "Consent For Treatment",
  hipaa_authorization: "HIPAA Authorization",
  financial_agreement: "Financial Agreement",
  emergency_contact_form: "Emergency Contact Form",
  photo_id_verification: "Photo ID Verification",
  insurance_card_copy: "Insurance Card Copy",
  hhn_enrollment: "HHN Enrollment",
  patient_handbook_receipt: "Patient Handbook Receipt",
};

export default function PatientPortalPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);

  // Game states
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState<
    "inhale" | "hold" | "exhale"
  >("inhale");
  const [breathingCount, setBreathingCount] = useState(0);
  const [memoryCards, setMemoryCards] = useState<
    { id: number; value: string; flipped: boolean; matched: boolean }[]
  >([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [gratitudeEntry, setGratitudeEntry] = useState("");
  const [triggerEntry, setTriggerEntry] = useState({
    trigger: "",
    response: "",
  });
  const [dailyMood, setDailyMood] = useState(5);
  const [dailyNotes, setDailyNotes] = useState("");

  // Referral dialog
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [referralForm, setReferralForm] = useState({
    serviceType: "",
    reason: "",
    urgency: "normal",
    notes: "",
  });

  // Peer coach message
  const [peerCoachMessage, setPeerCoachMessage] = useState("");

  // Form modal state
  const [openFormModal, setOpenFormModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Photo ID state
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Insurance Card state
  const [insuranceCardFront, setInsuranceCardFront] = useState<string | null>(
    null
  );
  const [insuranceCardFrontFile, setInsuranceCardFrontFile] =
    useState<File | null>(null);
  const [insuranceCardBack, setInsuranceCardBack] = useState<string | null>(
    null
  );
  const [insuranceCardBackFile, setInsuranceCardBackFile] =
    useState<File | null>(null);
  const [isInsuranceCameraActive, setIsInsuranceCameraActive] = useState(false);
  const [insuranceCameraSide, setInsuranceCameraSide] = useState<
    "front" | "back" | null
  >(null);
  const insuranceVideoRef = useRef<HTMLVideoElement>(null);
  const insuranceCanvasRef = useRef<HTMLCanvasElement>(null);

  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      message:
        "Hello! I am your AI wellness assistant. How are you feeling today?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [escalationRequested, setEscalationRequested] = useState(false);

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
  ]);

  // Fetch patient data
  useEffect(() => {
    const loadPatientInfo = async () => {
      try {
        setLoading(true);
        // Check for patientId in URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const urlPatientId = urlParams.get("patientId");

        const apiUrl = urlPatientId
          ? `/api/patient-portal/info?patientId=${urlPatientId}`
          : "/api/patient-portal/info";

        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          console.log("[Patient Portal] Info API response:", data);
          setPatientInfo(data);
          // Use patientId from API, or URL param, or try to get first patient from DB
          if (data.patientId) {
            setPatientId(data.patientId);
          } else if (urlPatientId) {
            setPatientId(urlPatientId);
          } else {
            // Try to get a real patient ID for testing
            try {
              const patientsResponse = await fetch("/api/patients/list");
              if (patientsResponse.ok) {
                const patientsData = await patientsResponse.json();
                if (patientsData.patients && patientsData.patients.length > 0) {
                  const firstPatient = patientsData.patients[0];
                  console.log(
                    "[Patient Portal] Using first patient from DB:",
                    firstPatient.id
                  );
                  setPatientId(firstPatient.id);
                } else {
                  console.log("[Patient Portal] No patients in database");
                  setPatientId(null);
                }
              }
            } catch (e) {
              console.warn("[Patient Portal] Could not fetch patient list:", e);
              setPatientId(null);
            }
          }
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
          });
          // Try to get a real patient ID
          try {
            const patientsResponse = await fetch("/api/patients/list");
            if (patientsResponse.ok) {
              const patientsData = await patientsResponse.json();
              if (patientsData.patients && patientsData.patients.length > 0) {
                setPatientId(patientsData.patients[0].id);
              } else {
                setPatientId(null);
              }
            }
          } catch (e) {
            setPatientId(null);
          }
        }
      } catch (err) {
        console.error("Error loading patient info:", err);
        setPatientInfo({
          name: "Sarah Johnson",
          id: "PT-2024-001",
          program: "Methadone Program",
          dose: "80mg",
          nextAppointment: "January 18, 2024 at 10:00 AM",
          counselor: "Dr. Smith",
          counselorPhone: "(555) 123-4567",
          recoveryDays: 127,
        });
        // Try to get a real patient ID
        try {
          const patientsResponse = await fetch("/api/patients/list");
          if (patientsResponse.ok) {
            const patientsData = await patientsResponse.json();
            if (patientsData.patients && patientsData.patients.length > 0) {
              setPatientId(patientsData.patients[0].id);
            } else {
              setPatientId(null);
            }
          }
        } catch (e) {
          setPatientId(null);
        }
      } finally {
        setLoading(false);
      }
    };
    loadPatientInfo();
  }, []);

  // Fetch documents - API now returns forms even without patientId for demo purposes
  const {
    data: documents,
    mutate: mutateDocuments,
    error: documentsError,
  } = useSWR(
    `/api/patient-portal/documents${
      patientId ? `?patientId=${patientId}` : ""
    }`,
    fetcher
  );

  // Debug logging
  useEffect(() => {
    console.log("[Patient Portal] patientId:", patientId);
    console.log("[Patient Portal] documents:", documents);
    console.log("[Patient Portal] documentsError:", documentsError);
    console.log("[Patient Portal] requiredForms:", documents?.requiredForms);
  }, [patientId, documents, documentsError]);

  // Fetch resources
  const { data: resources } = useSWR("/api/patient-portal/resources", fetcher);

  // Fetch peer coach data
  const { data: peerCoachData, mutate: mutatePeerCoach } = useSWR(
    patientId ? `/api/patient-portal/peer-coach?patientId=${patientId}` : null,
    fetcher
  );

  // Fetch referrals
  const { data: referralsData, mutate: mutateReferrals } = useSWR(
    patientId ? `/api/patient-portal/referrals?patientId=${patientId}` : null,
    fetcher
  );

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      message: newMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const lowerMessage = newMessage.toLowerCase();
      let response = {
        message:
          "Thank you for sharing. I am here to listen and support you. Is there anything specific you would like to talk about?",
        escalate: false,
      };

      if (
        lowerMessage.includes("anxious") ||
        lowerMessage.includes("anxiety")
      ) {
        response = {
          message:
            "I hear you are feeling anxious. That is a common experience in recovery. Would you like me to guide you through a quick breathing exercise? Try the Mindful Breathing game in the Recovery Games tab!",
          escalate: false,
        };
      } else if (
        lowerMessage.includes("craving") ||
        lowerMessage.includes("urge")
      ) {
        response = {
          message:
            "Thank you for sharing that you are experiencing cravings. Try the Urge Surfing exercise in our Recovery Games, or I can connect you with your counselor. Would you like me to help?",
          escalate: true,
        };
      } else if (
        lowerMessage.includes("support") ||
        lowerMessage.includes("help")
      ) {
        response = {
          message:
            "I am here to support you. You can also reach out to your Peer Recovery Coach in the Peer Coach tab, or explore our Resources section for community support.",
          escalate: false,
        };
      }

      const aiMessage = {
        id: messages.length + 2,
        type: "ai",
        message: response.message,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (response.escalate) {
        setEscalationRequested(true);
      }
    }, 1000);

    setNewMessage("");
  };

  const handleEscalateToCounselor = () => {
    const systemMessage = {
      id: messages.length + 1,
      type: "system",
      message:
        "Your counselor has been notified and will reach out to you shortly. If this is an emergency, please call 911 or the crisis line at 988.",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, systemMessage]);
    setEscalationRequested(false);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Game handlers
  const startBreathingExercise = () => {
    setActiveGame("breathing");
    setBreathingCount(0);
    setBreathingPhase("inhale");

    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count % 12 <= 4) {
        setBreathingPhase("inhale");
      } else if (count % 12 <= 7) {
        setBreathingPhase("hold");
      } else {
        setBreathingPhase("exhale");
      }
      setBreathingCount(Math.floor(count / 12));

      if (count >= 60) {
        clearInterval(interval);
        setActiveGame(null);
        setGameScore((prev) => prev + 50);
        toast.success(
          "Great job completing the breathing exercise! +50 points"
        );
      }
    }, 1000);
  };

  const startMemoryGame = () => {
    setActiveGame("memory");
    const symbols = ["🌟", "💚", "🌈", "🦋", "🌸", "🌻", "🍀", "⭐"];
    const cards = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((value, id) => ({ id, value, flipped: false, matched: false }));
    setMemoryCards(cards);
    setSelectedCards([]);
  };

  const handleCardClick = (cardId: number) => {
    if (selectedCards.length >= 2) return;
    if (memoryCards[cardId].flipped || memoryCards[cardId].matched) return;

    const newCards = [...memoryCards];
    newCards[cardId].flipped = true;
    setMemoryCards(newCards);

    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setTimeout(() => {
        const [first, second] = newSelected;
        if (memoryCards[first].value === memoryCards[second].value) {
          const matchedCards = [...memoryCards];
          matchedCards[first].matched = true;
          matchedCards[second].matched = true;
          setMemoryCards(matchedCards);
          setGameScore((prev) => prev + 10);

          if (matchedCards.every((c) => c.matched)) {
            setActiveGame(null);
            setGameScore((prev) => prev + 50);
            toast.success(
              "Congratulations! You completed the memory game! +50 bonus points"
            );
          }
        } else {
          const resetCards = [...memoryCards];
          resetCards[first].flipped = false;
          resetCards[second].flipped = false;
          setMemoryCards(resetCards);
        }
        setSelectedCards([]);
      }, 1000);
    }
  };

  const saveGratitudeEntry = () => {
    if (!gratitudeEntry.trim()) return;
    setGameScore((prev) => prev + 25);
    toast.success("Gratitude entry saved! +25 points");
    setGratitudeEntry("");
    setActiveGame(null);
  };

  const saveTriggerEntry = () => {
    if (!triggerEntry.trigger.trim()) return;
    setGameScore((prev) => prev + 30);
    toast.success("Trigger plan saved! +30 points");
    setTriggerEntry({ trigger: "", response: "" });
    setActiveGame(null);
  };

  const saveDailyCheckIn = () => {
    setGameScore((prev) => prev + 20);
    toast.success("Daily check-in complete! +20 points");
    setDailyMood(5);
    setDailyNotes("");
    setActiveGame(null);
  };

  const startUrgeSurfing = () => {
    setActiveGame("urge-surfing");
  };

  // Submit referral request
  const handleSubmitReferral = async () => {
    try {
      const response = await fetch("/api/patient-portal/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, ...referralForm }),
      });

      if (response.ok) {
        toast.success("Service referral request submitted successfully!");
        setReferralDialogOpen(false);
        setReferralForm({
          serviceType: "",
          reason: "",
          urgency: "normal",
          notes: "",
        });
        mutateReferrals();
      } else {
        toast.error("Failed to submit referral request");
      }
    } catch (error) {
      toast.error("Failed to submit referral request");
    }
  };

  // Send peer coach message
  const handleSendPeerCoachMessage = async () => {
    if (!peerCoachMessage.trim()) return;

    try {
      const response = await fetch("/api/patient-portal/peer-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, message: peerCoachMessage }),
      });

      if (response.ok) {
        toast.success("Message sent to your Peer Recovery Coach!");
        setPeerCoachMessage("");
        mutatePeerCoach();
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  // Handle form submission
  const handleSubmitForm = async () => {
    if (!openFormModal || !patientId) return;

    try {
      setFormSubmitting(true);

      // For forms with file uploads, use FormData
      if (
        (openFormModal === "photo_id_verification" && idPhotoFile) ||
        (openFormModal === "insurance_card_copy" &&
          (insuranceCardFrontFile || insuranceCardBackFile))
      ) {
        const formDataToSend = new FormData();
        formDataToSend.append("patientId", patientId);
        formDataToSend.append("formKey", openFormModal);
        formDataToSend.append("formData", JSON.stringify(formData));

        if (openFormModal === "photo_id_verification" && idPhotoFile) {
          formDataToSend.append("idPhoto", idPhotoFile);
        }

        if (openFormModal === "insurance_card_copy") {
          if (insuranceCardFrontFile) {
            formDataToSend.append("insuranceCardFront", insuranceCardFrontFile);
          }
          if (insuranceCardBackFile) {
            formDataToSend.append("insuranceCardBack", insuranceCardBackFile);
          }
        }

        const response = await fetch("/api/patient-portal/forms", {
          method: "POST",
          body: formDataToSend,
        });

        if (response.ok) {
          toast.success("Form submitted successfully!");
          setOpenFormModal(null);
          setFormData({});
          setIdPhoto(null);
          setIdPhotoFile(null);
          setInsuranceCardFront(null);
          setInsuranceCardFrontFile(null);
          setInsuranceCardBack(null);
          setInsuranceCardBackFile(null);
          mutateDocuments();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Failed to submit form");
        }
      } else {
        // For other forms, use JSON
        const response = await fetch("/api/patient-portal/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId,
            formKey: openFormModal,
            formData,
          }),
        });

        if (response.ok) {
          toast.success("Form submitted successfully!");
          setOpenFormModal(null);
          setFormData({});
          setIdPhoto(null);
          setIdPhotoFile(null);
          mutateDocuments();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Failed to submit form");
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit form");
    } finally {
      setFormSubmitting(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f0fdf4" }}>
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: "#16a34a" }}></div>
          <p style={{ color: "#64748b" }}>Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0fdf4" }}>
      {/* Header */}
      <header
        className="border-b p-4"
        style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#16a34a" }}>
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
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full"
              style={{ backgroundColor: "#fef3c7" }}>
              <Trophy className="h-4 w-4" style={{ color: "#d97706" }} />
              <span className="font-semibold" style={{ color: "#92400e" }}>
                {gameScore} pts
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setActiveTab("notifications")}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center text-white"
                  style={{ backgroundColor: "#dc2626" }}>
                  {unreadCount}
                </span>
              )}
            </Button>
            <Avatar>
              <AvatarFallback
                style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>
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
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6">
          {/* Responsive scrollable tabs for mobile */}
          <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-thin scrollbar-thumb-gray-300">
            <TabsList className="inline-flex w-max min-w-full lg:w-full lg:grid lg:grid-cols-10 gap-1">
              <TabsTrigger value="home" className="flex items-center gap-1 whitespace-nowrap">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </TabsTrigger>
              <TabsTrigger value="takehome" className="flex items-center gap-1 whitespace-nowrap">
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Take-Home</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1 whitespace-nowrap">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="games" className="flex items-center gap-1 whitespace-nowrap">
                <Gamepad2 className="h-4 w-4" />
                <span className="hidden sm:inline">Games</span>
              </TabsTrigger>
              <TabsTrigger value="peer-coach" className="flex items-center gap-1 whitespace-nowrap">
                <HandHeart className="h-4 w-4" />
                <span className="hidden sm:inline">Peer Coach</span>
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex items-center gap-1 whitespace-nowrap">
                <Clipboard className="h-4 w-4" />
                <span className="hidden sm:inline">Referrals</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-1 whitespace-nowrap">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Resources</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="flex items-center gap-1 whitespace-nowrap">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Appointments</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-1 whitespace-nowrap">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Billing</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-1 whitespace-nowrap">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Support</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Home Tab */}
          <TabsContent value="home" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card style={{ backgroundColor: "#ffffff" }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div
                      className="text-4xl font-bold"
                      style={{ color: "#16a34a" }}>
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
                    <div
                      className="text-4xl font-bold"
                      style={{ color: "#0284c7" }}>
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
                    <Trophy
                      className="h-8 w-8 mx-auto mb-2"
                      style={{ color: "#d97706" }}
                    />
                    <div
                      className="text-2xl font-bold"
                      style={{ color: "#92400e" }}>
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
                    onClick={() => setActiveTab("games")}>
                    <Gamepad2 className="h-6 w-6" />
                    <span>Recovery Games</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-transparent"
                    onClick={() => setActiveTab("peer-coach")}>
                    <HandHeart className="h-6 w-6" />
                    <span>Peer Coach</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-transparent"
                    onClick={() => setActiveTab("documents")}>
                    <FileText className="h-6 w-6" />
                    <span>My Documents</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-transparent"
                    onClick={() => setActiveTab("referrals")}>
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
                    <AvatarFallback
                      style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}>
                      DS
                    </AvatarFallback>
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
                <CardDescription>
                  Scan your daily take-home dose QR code to confirm
                  administration.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div
                  className="mx-auto mb-6 flex items-center justify-center h-64 w-64 rounded-lg border-4 border-dashed p-5"
                  style={{
                    backgroundColor: "#f8fafc",
                    borderColor: "#a0aec0",
                  }}>
                  <div className="text-center">
                    <QrCode className="h-24 w-24 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-700">
                      Scan QR Code
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Point your camera at the QR code provided by your clinic.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Once scanned, the system will confirm your daily take-home
                  dose. Please ensure you are in a well-lit area.
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
                <CardDescription>
                  Access your treatment plans, consent forms, and medical
                  records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="treatment-plans">
                  <TabsList className="mb-4">
                    <TabsTrigger value="treatment-plans">
                      Treatment Plans
                    </TabsTrigger>
                    <TabsTrigger value="consents">Consent Forms</TabsTrigger>
                    <TabsTrigger value="medications">Medications</TabsTrigger>
                    <TabsTrigger value="discharge">
                      Discharge Summaries
                    </TabsTrigger>
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
                                    Created:{" "}
                                    {new Date(
                                      plan.created_at
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Provider: {plan.provider?.first_name}{" "}
                                    {plan.provider?.last_name}
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
                                    {plan.goals
                                      .slice(0, 3)
                                      .map((goal: any, i: number) => (
                                        <li key={i}>
                                          {goal.description || goal}
                                        </li>
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
                      {/* Required Forms Section */}
                      {documents?.requiredForms &&
                        documents.requiredForms.length > 0 && (
                          <div className="mb-6">
                            <h3
                              className="text-sm font-semibold mb-3"
                              style={{ color: "#1e293b" }}>
                              Required Documentation
                            </h3>
                            <div className="space-y-2">
                              {documents.requiredForms.map((form: any) => (
                                <Card key={form.formKey} className="border">
                                  <CardContent className="pt-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium">
                                          {form.displayName}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Badge
                                          variant={
                                            form.status === "completed"
                                              ? "default"
                                              : form.status === "na"
                                              ? "outline"
                                              : "secondary"
                                          }
                                          className={
                                            form.status === "completed"
                                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                                              : ""
                                          }>
                                          {form.status === "completed"
                                            ? "Completed"
                                            : form.status === "na"
                                            ? "N/A"
                                            : "Pending"}
                                        </Badge>
                                        {form.status !== "completed" && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setOpenFormModal(form.formKey)
                                            }>
                                            Fill Up
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Existing Consent Forms Section */}
                      {documents?.consents && documents.consents.length > 0 && (
                        <div>
                          <h3
                            className="text-sm font-semibold mb-3"
                            style={{ color: "#1e293b" }}>
                            Completed Consent Forms
                          </h3>
                          <div className="space-y-4">
                            {documents.consents.map((consent: any) => (
                              <Card key={consent.id} className="border">
                                <CardContent className="pt-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">
                                        {consent.form?.form_name ||
                                          "Consent Form"}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Signed:{" "}
                                        {new Date(
                                          consent.completed_at ||
                                            consent.created_at
                                        ).toLocaleDateString()}
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
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Show error if documents failed to load */}
                      {documentsError && (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Error loading documents. Please try again.</p>
                          <p className="text-xs mt-2">
                            {documentsError.message || "Unknown error"}
                          </p>
                        </div>
                      )}

                      {/* Show loading state */}
                      {!documents && !documentsError && patientId && (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
                          <p>Loading documents...</p>
                        </div>
                      )}

                      {/* Empty State - only show if no required forms AND no consents AND not loading */}
                      {!documentsError &&
                        documents &&
                        (!documents?.requiredForms ||
                          documents.requiredForms.length === 0) &&
                        (!documents?.consents ||
                          documents.consents.length === 0) && (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No consent forms on file</p>
                            {!patientId && (
                              <p className="text-xs mt-2">
                                Patient ID not available. Forms will appear once
                                patient is identified.
                              </p>
                            )}
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
                                  <p className="font-medium">
                                    {med.medication_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Dosage: {med.dosage} - {med.frequency}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Started:{" "}
                                    {new Date(
                                      med.start_date
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge
                                  style={{
                                    backgroundColor: "#dcfce7",
                                    color: "#16a34a",
                                  }}>
                                  Active
                                </Badge>
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
                                  <p className="font-medium">
                                    Discharge Summary
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Date:{" "}
                                    {new Date(
                                      summary.discharge_date ||
                                        summary.created_at
                                    ).toLocaleDateString()}
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
                      Build coping skills and earn points while supporting your
                      recovery
                    </CardDescription>
                  </div>
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ backgroundColor: "#fef3c7" }}>
                    <Trophy className="h-5 w-5" style={{ color: "#d97706" }} />
                    <span
                      className="font-bold text-lg"
                      style={{ color: "#92400e" }}>
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
                          if (game.id === "breathing") startBreathingExercise();
                          else if (game.id === "memory") startMemoryGame();
                          else if (game.id === "gratitude")
                            setActiveGame("gratitude");
                          else if (game.id === "trigger-tracker")
                            setActiveGame("trigger-tracker");
                          else if (game.id === "daily-check")
                            setActiveGame("daily-check");
                          else if (game.id === "urge-surfing")
                            startUrgeSurfing();
                        }}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div
                              className="h-12 w-12 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${game.color}20` }}>
                              <game.icon
                                className="h-6 w-6"
                                style={{ color: game.color }}
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{game.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {game.description}
                              </p>
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
                          breathingPhase === "inhale"
                            ? "#dcfce7"
                            : breathingPhase === "hold"
                            ? "#e0f2fe"
                            : "#fef3c7",
                      }}>
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
                          }}>
                          {breathingPhase === "inhale"
                            ? "Breathe In"
                            : breathingPhase === "hold"
                            ? "Hold"
                            : "Breathe Out"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Cycle {breathingCount + 1} of 5
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={(breathingCount / 5) * 100}
                      className="mt-6 max-w-md mx-auto"
                    />
                    <Button
                      variant="outline"
                      className="mt-4 bg-transparent"
                      onClick={() => setActiveGame(null)}>
                      Exit Exercise
                    </Button>
                  </div>
                ) : activeGame === "memory" ? (
                  <div className="text-center">
                    <p className="mb-4 text-muted-foreground">
                      Match the pairs to train your memory!
                    </p>
                    <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                      {memoryCards.map((card) => (
                        <button
                          key={card.id}
                          className={`h-16 w-16 rounded-lg text-2xl flex items-center justify-center transition-all ${
                            card.flipped || card.matched
                              ? "bg-green-100"
                              : "bg-slate-200 hover:bg-slate-300"
                          }`}
                          onClick={() => handleCardClick(card.id)}
                          disabled={card.matched}>
                          {card.flipped || card.matched ? card.value : "?"}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="mt-6 bg-transparent"
                      onClick={() => setActiveGame(null)}>
                      Exit Game
                    </Button>
                  </div>
                ) : activeGame === "gratitude" ? (
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-semibold mb-4 text-center">
                      Gratitude Journal
                    </h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Write 3 things you are grateful for today
                    </p>
                    <Textarea
                      placeholder="I am grateful for..."
                      value={gratitudeEntry}
                      onChange={(e) => setGratitudeEntry(e.target.value)}
                      rows={6}
                    />
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setActiveGame(null)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={saveGratitudeEntry}
                        style={{ backgroundColor: "#16a34a" }}>
                        Save Entry (+25 pts)
                      </Button>
                    </div>
                  </div>
                ) : activeGame === "trigger-tracker" ? (
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-semibold mb-4 text-center">
                      Trigger Tracker
                    </h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Identify a trigger and plan your response
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label>What is your trigger?</Label>
                        <Input
                          placeholder="Describe the trigger..."
                          value={triggerEntry.trigger}
                          onChange={(e) =>
                            setTriggerEntry({
                              ...triggerEntry,
                              trigger: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>How will you respond?</Label>
                        <Textarea
                          placeholder="My healthy response will be..."
                          value={triggerEntry.response}
                          onChange={(e) =>
                            setTriggerEntry({
                              ...triggerEntry,
                              response: e.target.value,
                            })
                          }
                          rows={4}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setActiveGame(null)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={saveTriggerEntry}
                        style={{ backgroundColor: "#7c3aed" }}>
                        Save Plan (+30 pts)
                      </Button>
                    </div>
                  </div>
                ) : activeGame === "daily-check" ? (
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-semibold mb-4 text-center">
                      Daily Check-In
                    </h3>
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
                            onChange={(e) =>
                              setDailyMood(Number.parseInt(e.target.value))
                            }
                            className="flex-1"
                          />
                          <span className="text-2xl">😊</span>
                        </div>
                        <p className="text-center text-lg font-semibold mt-2">
                          {dailyMood}/10
                        </p>
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
                      <Button
                        variant="outline"
                        onClick={() => setActiveGame(null)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={saveDailyCheckIn}
                        style={{ backgroundColor: "#0891b2" }}>
                        Complete (+20 pts)
                      </Button>
                    </div>
                  </div>
                ) : activeGame === "urge-surfing" ? (
                  <div className="max-w-lg mx-auto text-center">
                    <h3 className="text-lg font-semibold mb-4">Urge Surfing</h3>
                    <div
                      className="p-6 rounded-lg mb-6"
                      style={{ backgroundColor: "#fef3c7" }}>
                      <p className="text-lg mb-4">
                        Urges are like ocean waves - they rise, peak, and fall.
                      </p>
                      <p className="text-muted-foreground">
                        Instead of fighting the urge, observe it without
                        judgment. Notice where you feel it in your body. Breathe
                        through it. The wave will pass.
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
                      <Button
                        variant="outline"
                        onClick={() => setActiveGame(null)}>
                        Exit
                      </Button>
                      <Button
                        onClick={() => {
                          setGameScore((prev) => prev + 40);
                          toast.success(
                            "Great job practicing urge surfing! +40 pts"
                          );
                          setActiveGame(null);
                        }}
                        style={{ backgroundColor: "#d97706" }}>
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
                <CardDescription>
                  Connect with someone who understands your journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Coach Info */}
                  <Card className="border">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Avatar className="h-20 w-20 mx-auto mb-4">
                          <AvatarFallback
                            style={{
                              backgroundColor: "#dcfce7",
                              color: "#16a34a",
                              fontSize: "1.5rem",
                            }}>
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
                        <p className="text-sm text-muted-foreground">
                          Peer Recovery Specialist
                        </p>
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
                        <CardTitle className="text-sm">
                          Send a Message
                        </CardTitle>
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
                              <p className="text-sm">
                                No messages yet. Start a conversation!
                              </p>
                            </div>
                          )}
                        </ScrollArea>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Write a message to your peer coach..."
                            value={peerCoachMessage}
                            onChange={(e) =>
                              setPeerCoachMessage(e.target.value)
                            }
                            rows={2}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleSendPeerCoachMessage}
                            style={{ backgroundColor: "#16a34a" }}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Peer Support Info */}
                <div
                  className="mt-6 p-4 rounded-lg"
                  style={{ backgroundColor: "#f0fdf4" }}>
                  <h4 className="font-semibold mb-2">
                    What is a Peer Recovery Coach?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Peer Recovery Coaches are individuals with lived experience
                    in recovery who provide support, guidance, and hope to
                    others on their recovery journey. They understand the
                    challenges you face because they have been there too.
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
                    <CardDescription>
                      Request additional services and track your referrals
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setReferralDialogOpen(true)}
                    style={{ backgroundColor: "#16a34a" }}>
                    Request Service
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Service Categories */}
                  <Card className="border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Available Services
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          {
                            name: "Housing Assistance",
                            icon: Home,
                            color: "#16a34a",
                          },
                          {
                            name: "Employment Services",
                            icon: Briefcase,
                            color: "#0284c7",
                          },
                          {
                            name: "Mental Health Counseling",
                            icon: Brain,
                            color: "#7c3aed",
                          },
                          {
                            name: "Transportation",
                            icon: MapPin,
                            color: "#d97706",
                          },
                          {
                            name: "Legal Aid",
                            icon: FileText,
                            color: "#dc2626",
                          },
                          {
                            name: "Family Services",
                            icon: Users,
                            color: "#0891b2",
                          },
                        ].map((service) => (
                          <div
                            key={service.name}
                            className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer"
                            onClick={() => {
                              setReferralForm({
                                ...referralForm,
                                serviceType: service.name,
                              });
                              setReferralDialogOpen(true);
                            }}>
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${service.color}20` }}>
                              <service.icon
                                className="h-4 w-4"
                                style={{ color: service.color }}
                              />
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
                      <CardTitle className="text-sm">
                        My Referral Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {referralsData?.referrals?.length > 0 ? (
                        <div className="space-y-3">
                          {referralsData.referrals.map((referral: any) => (
                            <div
                              key={referral.id}
                              className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">
                                  {referral.subject?.replace(
                                    "Service Referral Request: ",
                                    ""
                                  )}
                                </p>
                                <Badge
                                  variant={
                                    referral.priority === "urgent"
                                      ? "destructive"
                                      : "outline"
                                  }>
                                  {referral.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Requested:{" "}
                                {new Date(
                                  referral.created_at
                                ).toLocaleDateString()}
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
                      Under federal law (42 CFR Part 2), your substance use
                      disorder treatment records are protected with special
                      confidentiality protections. Your records cannot be
                      disclosed without your written consent, except in limited
                      circumstances. This includes protection from disclosure to
                      employers, law enforcement, and even other healthcare
                      providers without your permission.
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
                <CardDescription>
                  Community support, crisis lines, and helpful resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="crisis">
                  <TabsList className="mb-4">
                    <TabsTrigger value="crisis">Crisis Lines</TabsTrigger>
                    <TabsTrigger value="support">Support Groups</TabsTrigger>
                    <TabsTrigger value="michigan">
                      Michigan Resources
                    </TabsTrigger>
                    <TabsTrigger value="housing">Housing</TabsTrigger>
                    <TabsTrigger value="employment">Employment</TabsTrigger>
                  </TabsList>

                  <TabsContent value="crisis">
                    <div className="space-y-4">
                      {resources?.crisisLines?.map((line: any, i: number) => (
                        <Card
                          key={i}
                          className="border border-red-200"
                          style={{ backgroundColor: "#fef3c7" }}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4
                                  className="font-semibold"
                                  style={{ color: "#dc2626" }}>
                                  {line.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {line.description}
                                </p>
                                <p className="text-xs mt-1">
                                  Available: {line.available}
                                </p>
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
                      {resources?.supportGroups?.map(
                        (group: any, i: number) => (
                          <Card key={i} className="border">
                            <CardContent className="pt-4">
                              <h4 className="font-semibold">{group.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {group.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{group.type}</Badge>
                                {group.website && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 h-auto"
                                    asChild>
                                    <a
                                      href={group.website}
                                      target="_blank"
                                      rel="noopener noreferrer">
                                      <Globe className="mr-1 h-3 w-3" />
                                      Visit Website
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="michigan">
                    <div className="space-y-4">
                      <div
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: "#e0f2fe" }}>
                        <h4
                          className="font-semibold"
                          style={{ color: "#0284c7" }}>
                          State of Michigan Resources
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Local resources specific to Michigan residents
                        </p>
                      </div>
                      {resources?.michiganResources?.map(
                        (resource: any, i: number) => (
                          <Card key={i} className="border">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">
                                    {resource.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {resource.description}
                                  </p>
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
                        )
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="housing">
                    <div className="space-y-4">
                      {resources?.housingAssistance?.map(
                        (housing: any, i: number) => (
                          <Card key={i} className="border">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">
                                    {housing.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {housing.description}
                                  </p>
                                </div>
                                {housing.website && (
                                  <Button variant="outline" asChild>
                                    <a
                                      href={housing.website}
                                      target="_blank"
                                      rel="noopener noreferrer">
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Website
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="employment">
                    <div className="space-y-4">
                      {resources?.employmentServices?.map(
                        (service: any, i: number) => (
                          <Card key={i} className="border">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">
                                    {service.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {service.description}
                                  </p>
                                </div>
                                {service.website && (
                                  <Button variant="outline" asChild>
                                    <a
                                      href={service.website}
                                      target="_blank"
                                      rel="noopener noreferrer">
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Website
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )}
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
                  <Card
                    className="border border-green-200"
                    style={{ backgroundColor: "#f0fdf4" }}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge
                            style={{
                              backgroundColor: "#dcfce7",
                              color: "#16a34a",
                            }}>
                            Upcoming
                          </Badge>
                          <h4 className="font-semibold mt-2">
                            {patientInfo?.nextAppointment}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {patientInfo?.counselor}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Reschedule
                          </Button>
                          <Button
                            size="sm"
                            style={{ backgroundColor: "#16a34a" }}>
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
                        <DollarSign
                          className="h-8 w-8 mx-auto mb-2"
                          style={{ color: "#16a34a" }}
                        />
                        <p
                          className="text-2xl font-bold"
                          style={{ color: "#16a34a" }}>
                          $0.00
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Current Balance
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <CheckCircle2
                          className="h-8 w-8 mx-auto mb-2"
                          style={{ color: "#0284c7" }}
                        />
                        <p className="text-sm font-medium">Insurance Status</p>
                        <Badge
                          className="mt-2"
                          style={{
                            backgroundColor: "#dcfce7",
                            color: "#16a34a",
                          }}>
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Button
                  className="mt-4 w-full bg-transparent"
                  variant="outline">
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
                <CardDescription>
                  Chat with our AI assistant for immediate support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 border rounded-lg p-4 mb-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-4 ${
                        msg.type === "user" ? "text-right" : ""
                      }`}>
                      <div
                        className={`inline-block p-3 rounded-lg max-w-[80%] ${
                          msg.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : msg.type === "system"
                            ? "bg-yellow-100 text-yellow-900"
                            : "bg-slate-100"
                        }`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>

                {escalationRequested && (
                  <div
                    className="mb-4 p-3 rounded-lg"
                    style={{ backgroundColor: "#fef3c7" }}>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#92400e" }}>
                      Would you like to speak with your counselor?
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={handleEscalateToCounselor}
                        style={{ backgroundColor: "#d97706" }}>
                        Yes, contact my counselor
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEscalationRequested(false)}>
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
                  <Button
                    onClick={handleSendMessage}
                    style={{ backgroundColor: "#16a34a" }}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div
                  className="mt-4 p-3 rounded-lg"
                  style={{ backgroundColor: "#fee2e2" }}>
                  <p className="text-sm" style={{ color: "#dc2626" }}>
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    If you are in crisis, call 988 (Suicide & Crisis Lifeline)
                    or 911
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
                      onClick={() =>
                        setNotifications(
                          notifications.map((n) => ({ ...n, read: true }))
                        )
                      }>
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
                      className={`p-4 rounded-lg border ${
                        !notification.read ? "border-l-4" : ""
                      }`}
                      style={{
                        borderLeftColor: !notification.read
                          ? "#16a34a"
                          : undefined,
                        backgroundColor: notification.read
                          ? "#f8fafc"
                          : "#ffffff",
                      }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.date}
                          </p>
                        </div>
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsRead(notification.id)}>
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
                    <h3 className="font-medium text-sm mb-2">
                      Immunization Records
                    </h3>
                    <div className="space-y-2">
                      {[
                        {
                          vaccine: "COVID-19 (Moderna)",
                          date: "Mar 15, 2025",
                          provider: "Dr. Smith",
                        },
                        {
                          vaccine: "Influenza (Quadrivalent)",
                          date: "Oct 12, 2024",
                          provider: "Dr. Johnson",
                        },
                        {
                          vaccine: "Tdap Booster",
                          date: "Jan 8, 2024",
                          provider: "Dr. Smith",
                        },
                      ].map((vax, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Syringe className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium">
                                {vax.vaccine}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {vax.provider}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {vax.date}
                          </span>
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
        </Tabs>
      </main>

      {/* Referral Request Dialog */}
      <Dialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Service Referral</DialogTitle>
            <DialogDescription>
              Submit a request for additional support services
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Service Type</Label>
              <Select
                value={referralForm.serviceType}
                onValueChange={(v) =>
                  setReferralForm({ ...referralForm, serviceType: v })
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Housing Assistance">
                    Housing Assistance
                  </SelectItem>
                  <SelectItem value="Employment Services">
                    Employment Services
                  </SelectItem>
                  <SelectItem value="Mental Health Counseling">
                    Mental Health Counseling
                  </SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Legal Aid">Legal Aid</SelectItem>
                  <SelectItem value="Family Services">
                    Family Services
                  </SelectItem>
                  <SelectItem value="Medical Care">Medical Care</SelectItem>
                  <SelectItem value="Dental Care">Dental Care</SelectItem>
                  <SelectItem value="Food Assistance">
                    Food Assistance
                  </SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason for Request</Label>
              <Textarea
                placeholder="Please describe why you need this service..."
                value={referralForm.reason}
                onChange={(e) =>
                  setReferralForm({ ...referralForm, reason: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Urgency</Label>
              <Select
                value={referralForm.urgency}
                onValueChange={(v) =>
                  setReferralForm({ ...referralForm, urgency: v })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Within a month</SelectItem>
                  <SelectItem value="normal">
                    Normal - Within 2 weeks
                  </SelectItem>
                  <SelectItem value="high">High - Within a week</SelectItem>
                  <SelectItem value="urgent">
                    Urgent - Immediate need
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                placeholder="Any additional information..."
                value={referralForm.notes}
                onChange={(e) =>
                  setReferralForm({ ...referralForm, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReferralDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReferral}
              disabled={!referralForm.serviceType || !referralForm.reason}
              style={{ backgroundColor: "#16a34a" }}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Fill Up Modal */}
      <Dialog
        open={openFormModal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOpenFormModal(null);
            setFormData({});
            setIdPhoto(null);
            setIdPhotoFile(null);
            setIsCameraActive(false);
            setInsuranceCardFront(null);
            setInsuranceCardFrontFile(null);
            setInsuranceCardBack(null);
            setInsuranceCardBackFile(null);
            setIsInsuranceCameraActive(false);
            setInsuranceCameraSide(null);
            // Stop camera if active
            if (videoRef.current?.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach((track) => track.stop());
            }
            if (insuranceVideoRef.current?.srcObject) {
              const stream = insuranceVideoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach((track) => track.stop());
            }
          }
        }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {openFormModal
                ? REQUIRED_FORMS_MAPPING[openFormModal] || "Fill Form"
                : "Fill Form"}
            </DialogTitle>
            <DialogDescription>
              Please read and complete the form below
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {openFormModal === "consent_for_treatment" ? (
                <>
                  {/* Consent to Treatment Form */}
                  <div className="space-y-6">
                    {/* Header Fields */}
                    <div className="grid grid-cols-2 gap-4 border-b pb-4">
                      <div>
                        <Label htmlFor="site-phone">Site Phone</Label>
                        <Input
                          id="site-phone"
                          name="site_phone"
                          placeholder="Site phone number"
                          value={formData.site_phone || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              site_phone: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="form-date-header">Date</Label>
                        <Input
                          id="form-date-header"
                          name="form_date"
                          type="date"
                          value={
                            formData.form_date ||
                            new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              form_date: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="patient-name">Patient Name</Label>
                        <Input
                          id="patient-name"
                          name="patient_name"
                          placeholder="Patient full name"
                          value={
                            formData.patient_name || patientInfo?.name || ""
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              patient_name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="patient-id">Patient ID</Label>
                        <Input
                          id="patient-id"
                          name="patient_id"
                          placeholder="Patient ID"
                          value={formData.patient_id || patientInfo?.id || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              patient_id: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Consent Text Content */}
                    <div className="space-y-4 text-sm">
                      <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                        <h3 className="font-semibold mb-2">
                          Consent to Treatment
                        </h3>
                      </div>

                      <div className="space-y-3 text-sm leading-relaxed">
                        <p>
                          <strong>1. Authorization for Treatment:</strong> I
                          hereby authorize and voluntarily consent to the
                          Program Medical Director or designee to administer or
                          prescribe Methadone/Buprenorphine for narcotic drug
                          dependence.
                        </p>

                        <p>
                          <strong>2. Treatment Procedures:</strong> I
                          acknowledge that I understand the treatment
                          procedures, including taking a prescribed narcotic
                          drug on a schedule determined by the Medical Director
                          to control dependence.
                        </p>

                        <p>
                          <strong>3. Medication Risks and Alternatives:</strong>{" "}
                          I understand that Methadone is a narcotic drug,
                          harmful without supervision, causes physical
                          dependence, and may produce adverse results. I
                          acknowledge understanding of alternative treatments,
                          risks, and complications, but still wish to receive
                          Methadone/Buprenorphine due to the risk of returning
                          to illicit opioids.
                        </p>

                        <p>
                          <strong>4. Opioid Treatment Goals:</strong> The goal
                          is total rehabilitation, with eventual cessation of
                          opioids and other drugs within one month of starting
                          Methadone/Buprenorphine. If I am on buprenorphine and
                          continue to use illicit drugs, I will likely be
                          switched to Methadone. Opioid treatment can be
                          long-term, with periodic consideration for decreasing
                          or discontinuing Methadone.
                        </p>

                        <p>
                          <strong>
                            5. Overdose and Medication Interactions:
                          </strong>{" "}
                          I understand the risk of overdose, including death,
                          when using other opioids with Methadone or
                          buprenorphine, especially during dose changes. I agree
                          not to use other opioids besides
                          Methadone/Buprenorphine. For Methadone, I must bring
                          pharmacy paperwork to the nurse. For buprenorphine,
                          other opioids cannot be prescribed due to adverse
                          reactions and severe withdrawal symptoms.
                        </p>

                        <p>
                          <strong>6. Additional Procedures:</strong> I
                          understand that additional or different procedures may
                          be necessary during treatment, based on the
                          professional judgment of the Medical Director or
                          designee.
                        </p>

                        <p>
                          <strong>
                            7. Informing Other Doctors and Benzodiazepine Risks:
                          </strong>{" "}
                          I agree to inform all treating doctors about my
                          enrollment in an opioid treatment program on
                          Methadone/Buprenorphine, as mixing these with other
                          medications can cause harm (overdose, death) or severe
                          withdrawal. I specifically understand the danger of
                          Benzodiazepines (e.g., Valium®, Klonopin®, Xanax®) and
                          note that deaths have occurred when Methadone or
                          buprenorphine were mixed with benzodiazepines,
                          especially if taken outside physician care, via
                          non-sublingual routes, or in higher than recommended
                          doses.
                        </p>

                        <p>
                          <strong>8. Opioid Treatment Consent:</strong> I
                          certify that no guarantees have been made regarding
                          treatment results and provide consent for
                          Methadone/Buprenorphine treatment, acknowledging
                          dependence on opioids.
                        </p>

                        <p>
                          <strong>9. Withdrawal Policy:</strong> I understand I
                          can withdraw from the program and discontinue
                          medication, with medical supervision for tapering.
                        </p>

                        <p>
                          <strong>10. Buprenorphine Take-Home Policy:</strong>{" "}
                          If I have 13 take-home buprenorphine bottles, I agree
                          to reduce to 6 for a minimum of one week to ensure
                          stability.
                        </p>

                        <div className="border-t pt-4 mt-4">
                          <p className="font-semibold mb-3">
                            Female Patients - Pregnancy Status:
                          </p>
                          <div className="space-y-2">
                            <Label
                              htmlFor="pregnancy-status-am"
                              className="flex items-center gap-2 cursor-pointer">
                              <input
                                id="pregnancy-status-am"
                                name="pregnancy_status"
                                type="radio"
                                value="pregnant"
                                checked={
                                  formData.pregnancy_status === "pregnant"
                                }
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    pregnancy_status: e.target.value,
                                  })
                                }
                                className="w-4 h-4"
                              />
                              I am pregnant at this time
                            </Label>
                            <Label
                              htmlFor="pregnancy-status-not"
                              className="flex items-center gap-2 cursor-pointer">
                              <input
                                id="pregnancy-status-not"
                                name="pregnancy_status"
                                type="radio"
                                value="not_pregnant"
                                checked={
                                  formData.pregnancy_status === "not_pregnant"
                                }
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    pregnancy_status: e.target.value,
                                  })
                                }
                                className="w-4 h-4"
                              />
                              I am not pregnant at this time
                            </Label>
                          </div>
                        </div>

                        <p>
                          <strong>11. Buprenorphine Pregnancy Tests:</strong> I
                          consent to monthly pregnancy tests for buprenorphine
                          treatment.
                        </p>

                        <p>
                          <strong>12. Long-Term Medication Risks:</strong> I
                          understand that current medical research cannot
                          guarantee the absence of serious side effects from
                          long-term Methadone/Buprenorphine use, especially for
                          pregnant women and their unborn children.
                        </p>

                        <p>
                          <strong>13. Methadone and Unborn Child:</strong> I
                          understand that Methadone is transmitted to the unborn
                          child, causing physical dependence. If pregnant,
                          sudden cessation of methadone can cause withdrawal
                          symptoms in me or the unborn child. I agree not to use
                          other drugs without Medical Director approval and to
                          inform any physician about my participation in the
                          narcotic treatment program during pregnancy or for the
                          child's care after birth.
                        </p>

                        <p>
                          <strong>14. Post-Birth Care:</strong> After birth, I
                          should discuss nursing with my OB/GYN and the Clinic
                          Medical Director. The child may show temporary
                          irritability or other ill effects due to methadone
                          use, and the child's physician must be informed of my
                          participation in the narcotic treatment program.
                        </p>

                        <p>
                          <strong>15. Final Acknowledgment:</strong> I
                          acknowledge that the possible effects of
                          Methadone/Buprenorphine have been explained, and I
                          consent to its use, agreeing to inform the Medical
                          Director or designee if I become pregnant.
                        </p>
                      </div>
                    </div>

                    {/* Signature and Acknowledgment Section */}
                    <div className="border-t pt-4 space-y-4">
                      <div>
                        <Label htmlFor="form-signature">
                          Patient Signature *
                        </Label>
                        <Input
                          id="form-signature"
                          name="signature"
                          placeholder="Enter your full name as signature"
                          value={formData.signature || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              signature: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="form-date-signature">
                          Date Signed *
                        </Label>
                        <Input
                          id="form-date-signature"
                          name="date"
                          type="date"
                          value={
                            formData.date ||
                            new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-start gap-2 cursor-pointer">
                          <input
                            id="form-acknowledgment"
                            name="acknowledgment"
                            type="checkbox"
                            checked={formData.acknowledgment || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                acknowledgment: e.target.checked,
                              })
                            }
                            className="mt-1 w-4 h-4"
                            required
                          />
                          <span>
                            I acknowledge that I have read and understand all
                            the information in this consent form, including the
                            risks, benefits, and alternatives to treatment. I
                            voluntarily consent to participate in this treatment
                            program.
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </>
              ) : openFormModal === "hipaa_authorization" ? (
                <>
                  {/* HIPAA Authorization Form */}
                  <div className="space-y-6">
                    {/* HIPAA Notice of Privacy Practices Section */}
                    <div className="space-y-4 text-sm">
                      <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                        <h3 className="font-semibold mb-2 text-base">
                          HIPAA Notice of Privacy Practices
                        </h3>
                      </div>

                      <div className="space-y-3 text-sm leading-relaxed">
                        <p>
                          This notice describes how medical information about
                          you may be used and disclosed and how you can get
                          access to this information. Please review it
                          carefully.
                        </p>

                        <div>
                          <p className="font-semibold mb-2">
                            Understanding Your Protected Health Information
                            (PHI):
                          </p>
                          <p>
                            A record is created for each patient, containing
                            symptoms, examinations, test results, diagnoses, and
                            treatment plans. While the record is the physical
                            property of the healthcare provider, the information
                            within it belongs to you. Our objective is to follow
                            HIPAA Privacy Standards and state law when using and
                            disclosing PHI.
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold mb-2">
                            Your Mental Health and/or Medical Record Serves as:
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>A basis for planning care and treatment</li>
                            <li>
                              A means of communication among health
                              professionals
                            </li>
                            <li>A legal document of received care</li>
                            <li>A means for verifying billed services</li>
                            <li>
                              A source of information for public health
                              officials
                            </li>
                            <li>
                              A source of data for facility planning and
                              marketing
                            </li>
                            <li>
                              A tool for assessing and improving care and
                              outcomes
                            </li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-semibold mb-2">
                            Responsibilities of (agency name):
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>
                              Maintain PHI privacy and provide notice of legal
                              duties
                            </li>
                            <li>
                              Abide by the current notice's terms, with the
                              right to change it and apply new provisions to all
                              PHI
                            </li>
                            <li>
                              Notify patients if a requested restriction cannot
                              be agreed upon
                            </li>
                            <li>
                              Use or disclose health information only with
                              patient authorization, except as specified in the
                              notice
                            </li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-semibold mb-2">
                            Your Protected Health Information (PHI) Rights:
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>
                              To review and obtain a paper copy of the notice
                              and your health information (with potential
                              exceptions and copy charges)
                            </li>
                            <li>
                              To request and provide written authorization to
                              release PHI for outside treatment and healthcare,
                              excluding psychotherapy notes and training
                              audio/video tapes
                            </li>
                            <li>
                              To revoke authorization in writing at any time,
                              except for actions already taken
                            </li>
                            <li>
                              To request a restriction on uses and disclosures
                              of PHI (clinic is not obligated to agree)
                            </li>
                            <li>
                              To request to amend health information (clinic is
                              not required to agree)
                            </li>
                            <li>
                              To obtain an accounting of disclosures for
                              purposes other than treatment, payment, health
                              care operations for the past six years
                            </li>
                            <li>
                              To request confidential communications by
                              alternative means or at alternative locations
                            </li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-semibold mb-2">
                            Disclosures for Treatment, Payment, and Health
                            Operations:
                          </p>
                          <p className="mb-2">
                            <strong>Treatment:</strong> Information from health
                            care team members (nurse, physician,
                            psychologist/counselor, dentist, etc.) is recorded
                            and used for treatment management and coordination.
                          </p>
                          <p className="mb-2">
                            <strong>
                              Disclosure to others outside of the agency:
                            </strong>{" "}
                            With written authorization, you can revoke consent
                            (not affecting prior disclosures). PHI is not
                            disclosed without authorization, except for serious
                            threats to a child's or vulnerable adult's health or
                            safety.
                          </p>
                          <p className="mb-2">
                            <strong>For payment, if applicable:</strong> Bills
                            sent to you or insurance carrier may include
                            identifying information and diagnosis for
                            reimbursement or eligibility determination.
                          </p>
                          <p className="mb-2">
                            <strong>For health care operations:</strong> Mental
                            health staff or quality improvement teams may use
                            health record information to assess and improve the
                            quality and effectiveness of services.
                          </p>
                          <p>
                            <strong>Situations without authorization:</strong>{" "}
                            PHI may be used or disclosed without your
                            authorization as required by law, for public health
                            issues, communicable diseases, health oversight,
                            abuse/neglect, Food and Drug Administration
                            requirements, legal proceedings, law enforcement,
                            coroners and organ donation, research, or workers'
                            compensation. Disclosures are also mandatory when
                            required by the Secretary of the U.S. Department of
                            Health and Human Services for investigations or
                            compliance.
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold mb-2">
                            For More Information or to Report a Problem:
                          </p>
                          <p>
                            If you have questions or need additional
                            information, contact your clinician, who can provide
                            information or connect you with the designated
                            Privacy Officer. If you are concerned about violated
                            privacy rights or disagree with an access decision,
                            contact the Privacy Officer. The clinic respects
                            your privacy rights and assures no retaliation for
                            filing a complaint with the Privacy Officer or the
                            U.S. Department of Health and Human Services.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* HIPAA Authorization Form Section */}
                    <div className="border-t pt-6 space-y-6">
                      <div className="border-2 border-gray-800 p-4 bg-gray-50">
                        <h3 className="font-bold text-center text-lg mb-4">
                          HIPAA Privacy Authorization for Use and Disclosure of
                          Personal Health Information
                        </h3>

                        <div className="space-y-4 text-sm">
                          <p>
                            <strong>Authorization Statement:</strong> This
                            authorization is prepared pursuant to the
                            requirements of the Health Insurance Portability and
                            Accountability Act of 1996 (HIPAA) and its
                            implementing regulations as amended from time to
                            time. You may refuse to sign this authorization.
                          </p>

                          <p>
                            <strong>Acknowledgment Statement:</strong> By my
                            signature below, I acknowledge that I have received
                            and read the Notice of Health Information Privacy
                            Practices. I have been provided a copy of, read and
                            understand (agency name) HIPAA Privacy Notice
                            containing a complete description of my rights, and
                            the permitted uses and disclosures of my protected
                            health information under HIPAA. Further, I
                            acknowledge that any information used or disclosed
                            pursuant to this authorization could be at risk for
                            re-disclosure by the recipient and is no longer
                            protected under HIPAA.
                          </p>
                        </div>
                      </div>

                      {/* Patient Information Section */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-base">
                          Patient Information
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="hipaa-name-last">Last Name *</Label>
                            <Input
                              id="hipaa-name-last"
                              name="name_last"
                              placeholder="Last"
                              value={formData.name_last || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  name_last: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="hipaa-name-first">
                              First Name *
                            </Label>
                            <Input
                              id="hipaa-name-first"
                              name="name_first"
                              placeholder="First"
                              value={formData.name_first || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  name_first: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="hipaa-name-mi">MI</Label>
                            <Input
                              id="hipaa-name-mi"
                              name="name_mi"
                              placeholder="MI"
                              maxLength={1}
                              value={formData.name_mi || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  name_mi: e.target.value.toUpperCase(),
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="hipaa-address-street">
                              Street Address *
                            </Label>
                            <Input
                              id="hipaa-address-street"
                              name="address_street"
                              placeholder="Street"
                              value={formData.address_street || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  address_street: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="hipaa-address-city">City *</Label>
                            <Input
                              id="hipaa-address-city"
                              name="address_city"
                              placeholder="City"
                              value={formData.address_city || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  address_city: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="hipaa-address-state">State *</Label>
                            <Input
                              id="hipaa-address-state"
                              name="address_state"
                              placeholder="State"
                              maxLength={2}
                              value={formData.address_state || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  address_state: e.target.value.toUpperCase(),
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="hipaa-address-zip">
                              Zip Code *
                            </Label>
                            <Input
                              id="hipaa-address-zip"
                              name="address_zip"
                              placeholder="Zip"
                              value={formData.address_zip || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  address_zip: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="hipaa-dob">Date of Birth *</Label>
                            <Input
                              id="hipaa-dob"
                              name="date_of_birth"
                              type="date"
                              value={formData.date_of_birth || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  date_of_birth: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="hipaa-today-date">
                              Today's Date *
                            </Label>
                            <Input
                              id="hipaa-today-date"
                              name="today_date"
                              type="date"
                              value={
                                formData.today_date ||
                                new Date().toISOString().split("T")[0]
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  today_date: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Signature and Acknowledgment Section */}
                      <div className="border-t pt-4 space-y-4">
                        <div>
                          <Label htmlFor="hipaa-signature">
                            Patient Signature *
                          </Label>
                          <Input
                            id="hipaa-signature"
                            name="signature"
                            placeholder="Enter your full name as signature"
                            value={formData.signature || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                signature: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="hipaa-date-signed">
                            Date Signed *
                          </Label>
                          <Input
                            id="hipaa-date-signed"
                            name="date"
                            type="date"
                            value={
                              formData.date ||
                              new Date().toISOString().split("T")[0]
                            }
                            onChange={(e) =>
                              setFormData({ ...formData, date: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-start gap-2 cursor-pointer">
                            <input
                              id="hipaa-acknowledgment"
                              name="acknowledgment"
                              type="checkbox"
                              checked={formData.acknowledgment || false}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  acknowledgment: e.target.checked,
                                })
                              }
                              className="mt-1 w-4 h-4"
                              required
                            />
                            <span>
                              I acknowledge that I have received and read the
                              Notice of Health Information Privacy Practices. I
                              have been provided a copy of, read and understand
                              the HIPAA Privacy Notice containing a complete
                              description of my rights, and the permitted uses
                              and disclosures of my protected health information
                              under HIPAA. I understand that any information
                              used or disclosed pursuant to this authorization
                              could be at risk for re-disclosure by the
                              recipient and is no longer protected under HIPAA.
                            </span>
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : openFormModal === "financial_agreement" ? (
                <>
                  {/* Financial Agreement Form */}
                  <div className="space-y-6">
                    {/* Financial Agreement Header */}
                    <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                      <h3 className="font-semibold mb-2 text-base">
                        Financial Agreement
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        This form is used to collect financial information and
                        establish payment arrangements for treatment services.
                        The information you provide is confidential and will be
                        treated accordingly.
                      </p>
                    </div>

                    {/* Patient Information Section */}
                    <div className="space-y-4">
                      <div className="bg-pink-50 p-3 rounded">
                        <h4 className="font-semibold text-base">
                          CLIENT INFORMATION
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="financial-name">Name *</Label>
                          <Input
                            id="financial-name"
                            name="patient_name"
                            placeholder="Full name"
                            value={
                              formData.patient_name || patientInfo?.name || ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                patient_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="financial-dob">Date of Birth *</Label>
                          <Input
                            id="financial-dob"
                            name="date_of_birth"
                            type="date"
                            value={formData.date_of_birth || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                date_of_birth: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="financial-ssn">
                            Social Security Number
                          </Label>
                          <Input
                            id="financial-ssn"
                            name="ssn"
                            placeholder="XXX-XX-XXXX"
                            maxLength={11}
                            value={formData.ssn || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              const formatted =
                                value.length > 3
                                  ? value.length > 5
                                    ? `${value.slice(0, 3)}-${value.slice(
                                        3,
                                        5
                                      )}-${value.slice(5, 9)}`
                                    : `${value.slice(0, 3)}-${value.slice(3)}`
                                  : value;
                              setFormData({
                                ...formData,
                                ssn: formatted,
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label>U.S. Citizen *</Label>
                          <div className="flex gap-4 mt-2">
                            <Label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="us_citizen"
                                value="yes"
                                checked={formData.us_citizen === "yes"}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    us_citizen: e.target.value,
                                  })
                                }
                                className="w-4 h-4"
                                required
                              />
                              Yes
                            </Label>
                            <Label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="us_citizen"
                                value="no"
                                checked={formData.us_citizen === "no"}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    us_citizen: e.target.value,
                                  })
                                }
                                className="w-4 h-4"
                                required
                              />
                              No
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="financial-street">
                            Street Address *
                          </Label>
                          <Input
                            id="financial-street"
                            name="street_address"
                            placeholder="Street address"
                            value={formData.street_address || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                street_address: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="financial-city">City *</Label>
                          <Input
                            id="financial-city"
                            name="city"
                            placeholder="City"
                            value={formData.city || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                city: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="financial-state">State *</Label>
                          <Input
                            id="financial-state"
                            name="state"
                            placeholder="State"
                            maxLength={2}
                            value={formData.state || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                state: e.target.value.toUpperCase(),
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="financial-zip">ZIP Code *</Label>
                          <Input
                            id="financial-zip"
                            name="zip_code"
                            placeholder="ZIP Code"
                            value={formData.zip_code || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                zip_code: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="financial-home-phone">
                            Home Phone
                          </Label>
                          <Input
                            id="financial-home-phone"
                            name="home_phone"
                            placeholder="(XXX) XXX-XXXX"
                            value={formData.home_phone || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                home_phone: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="financial-mobile-phone">
                            Mobile Phone *
                          </Label>
                          <Input
                            id="financial-mobile-phone"
                            name="mobile_phone"
                            placeholder="(XXX) XXX-XXXX"
                            value={formData.mobile_phone || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                mobile_phone: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="financial-email">E-Mail *</Label>
                          <Input
                            id="financial-email"
                            name="email"
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="financial-fax">Fax</Label>
                          <Input
                            id="financial-fax"
                            name="fax"
                            placeholder="(XXX) XXX-XXXX"
                            value={formData.fax || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                fax: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Preferred Method of Contact *</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name="contact_method"
                              value="home_phone"
                              checked={
                                formData.contact_method?.includes(
                                  "home_phone"
                                ) || false
                              }
                              onChange={(e) => {
                                const methods = formData.contact_method || [];
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    contact_method: [...methods, "home_phone"],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    contact_method: methods.filter(
                                      (m: string) => m !== "home_phone"
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4"
                            />
                            Home Phone
                          </Label>
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name="contact_method"
                              value="mobile_phone"
                              checked={
                                formData.contact_method?.includes(
                                  "mobile_phone"
                                ) || false
                              }
                              onChange={(e) => {
                                const methods = formData.contact_method || [];
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    contact_method: [
                                      ...methods,
                                      "mobile_phone",
                                    ],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    contact_method: methods.filter(
                                      (m: string) => m !== "mobile_phone"
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4"
                            />
                            Mobile Phone
                          </Label>
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name="contact_method"
                              value="email"
                              checked={
                                formData.contact_method?.includes("email") ||
                                false
                              }
                              onChange={(e) => {
                                const methods = formData.contact_method || [];
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    contact_method: [...methods, "email"],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    contact_method: methods.filter(
                                      (m: string) => m !== "email"
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4"
                            />
                            E-Mail
                          </Label>
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name="contact_method"
                              value="fax"
                              checked={
                                formData.contact_method?.includes("fax") ||
                                false
                              }
                              onChange={(e) => {
                                const methods = formData.contact_method || [];
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    contact_method: [...methods, "fax"],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    contact_method: methods.filter(
                                      (m: string) => m !== "fax"
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4"
                            />
                            Fax
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label>Marital Status *</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {["Single", "Married", "Widowed", "Divorced"].map(
                            (status) => (
                              <Label
                                key={status}
                                className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="marital_status"
                                  value={status.toLowerCase()}
                                  checked={
                                    formData.marital_status ===
                                    status.toLowerCase()
                                  }
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      marital_status: e.target.value,
                                    })
                                  }
                                  className="w-4 h-4"
                                  required
                                />
                                {status}
                              </Label>
                            )
                          )}
                        </div>
                      </div>

                      {formData.marital_status === "married" && (
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                          <div>
                            <Label htmlFor="financial-years-married">
                              How many years have you been married?
                            </Label>
                            <Input
                              id="financial-years-married"
                              name="years_married"
                              type="number"
                              placeholder="Years"
                              value={formData.years_married || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  years_married: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Is this your first marriage? *</Label>
                            <div className="flex gap-4 mt-2">
                              <Label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="first_marriage"
                                  value="yes"
                                  checked={formData.first_marriage === "yes"}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      first_marriage: e.target.value,
                                    })
                                  }
                                  className="w-4 h-4"
                                />
                                Yes
                              </Label>
                              <Label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="first_marriage"
                                  value="no"
                                  checked={formData.first_marriage === "no"}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      first_marriage: e.target.value,
                                    })
                                  }
                                  className="w-4 h-4"
                                />
                                No
                              </Label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Insurance Information Section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="bg-pink-50 p-3 rounded">
                        <h4 className="font-semibold text-base">
                          INSURANCE INFORMATION
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="financial-insurance-provider">
                            Insurance Provider
                          </Label>
                          <Input
                            id="financial-insurance-provider"
                            name="insurance_provider"
                            placeholder="Insurance company name"
                            value={formData.insurance_provider || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                insurance_provider: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="financial-insurance-id">
                            Insurance ID / Policy Number
                          </Label>
                          <Input
                            id="financial-insurance-id"
                            name="insurance_id"
                            placeholder="Policy number"
                            value={formData.insurance_id || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                insurance_id: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="financial-group-number">
                            Group Number
                          </Label>
                          <Input
                            id="financial-group-number"
                            name="group_number"
                            placeholder="Group number"
                            value={formData.group_number || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                group_number: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="financial-subscriber-name">
                            Subscriber Name
                          </Label>
                          <Input
                            id="financial-subscriber-name"
                            name="subscriber_name"
                            placeholder="Name on insurance card"
                            value={formData.subscriber_name || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                subscriber_name: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Financial Agreement Terms */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="bg-blue-50 p-4 rounded">
                        <h4 className="font-semibold text-base mb-3">
                          Financial Agreement Terms
                        </h4>
                        <div className="space-y-2 text-sm leading-relaxed">
                          <p>
                            <strong>1. Payment Responsibility:</strong> I
                            understand that I am financially responsible for all
                            charges for services rendered, regardless of
                            insurance coverage. I agree to pay all charges not
                            covered by insurance, including deductibles,
                            co-payments, and co-insurance.
                          </p>
                          <p>
                            <strong>2. Insurance Verification:</strong> I
                            authorize the release of medical information
                            necessary to process insurance claims. I understand
                            that insurance coverage is not a guarantee of
                            payment.
                          </p>
                          <p>
                            <strong>3. Payment Arrangements:</strong> I agree to
                            make payment arrangements for any outstanding
                            balance. Payment is due at the time of service
                            unless other arrangements have been made in advance.
                          </p>
                          <p>
                            <strong>4. Late Payments:</strong> I understand that
                            accounts with balances over 30 days may be subject
                            to late fees and collection procedures.
                          </p>
                          <p>
                            <strong>5. Returned Checks:</strong> I understand
                            that a fee will be charged for any returned checks
                            or failed payment transactions.
                          </p>
                          <p>
                            <strong>6. Collection Costs:</strong> I agree to pay
                            all reasonable collection costs, including attorney
                            fees, if my account is referred to a collection
                            agency.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Signature Section */}
                    <div className="border-t pt-4 space-y-4">
                      <div>
                        <Label htmlFor="financial-signature">
                          Patient Signature *
                        </Label>
                        <Input
                          id="financial-signature"
                          name="signature"
                          placeholder="Enter your full name as signature"
                          value={formData.signature || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              signature: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="financial-date-signed">
                          Date Signed *
                        </Label>
                        <Input
                          id="financial-date-signed"
                          name="date"
                          type="date"
                          value={
                            formData.date ||
                            new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-start gap-2 cursor-pointer">
                          <input
                            id="financial-acknowledgment"
                            name="acknowledgment"
                            type="checkbox"
                            checked={formData.acknowledgment || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                acknowledgment: e.target.checked,
                              })
                            }
                            className="mt-1 w-4 h-4"
                            required
                          />
                          <span>
                            I acknowledge that I have read and understand the
                            financial agreement terms. I agree to be financially
                            responsible for all charges for services rendered
                            and to make payment arrangements as outlined above.
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </>
              ) : openFormModal === "emergency_contact_form" ? (
                <>
                  {/* Emergency Contact Form */}
                  <div className="space-y-6">
                    {/* Form Header */}
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-gray-800">
                        Emergency Contact Form
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Please fill out the form correctly
                      </p>
                    </div>

                    {/* Name Section */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Name *</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Input
                            id="emergency-first-name"
                            name="first_name"
                            placeholder="First Name"
                            value={formData.first_name || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                first_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Input
                            id="emergency-last-name"
                            name="last_name"
                            placeholder="Last Name"
                            value={formData.last_name || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                last_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="emergency-email">E-mail *</Label>
                          <Input
                            id="emergency-email"
                            name="email"
                            type="email"
                            placeholder="ex: myname@example.com"
                            value={formData.email || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            example@example.com
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="emergency-phone">
                            Phone Number *
                          </Label>
                          <Input
                            id="emergency-phone"
                            name="phone"
                            type="tel"
                            placeholder="(000) 000-0000"
                            value={formData.phone || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              const formatted =
                                value.length > 6
                                  ? `(${value.slice(0, 3)}) ${value.slice(
                                      3,
                                      6
                                    )}-${value.slice(6, 10)}`
                                  : value.length > 3
                                  ? `(${value.slice(0, 3)}) ${value.slice(3)}`
                                  : value;
                              setFormData({
                                ...formData,
                                phone: formatted,
                              });
                            }}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Relationship with Patient Section */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">
                        Relationship with Patient *
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {["Parent", "Friend", "Child", "Sibling", "Other"].map(
                          (relationship) => (
                            <Label
                              key={relationship}
                              className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50">
                              <input
                                type="radio"
                                name="relationship"
                                value={relationship.toLowerCase()}
                                checked={
                                  formData.relationship ===
                                  relationship.toLowerCase()
                                }
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    relationship: e.target.value,
                                  })
                                }
                                className="w-4 h-4"
                                required
                              />
                              <span>{relationship}</span>
                            </Label>
                          )
                        )}
                      </div>
                      {formData.relationship === "other" && (
                        <div className="mt-2">
                          <Input
                            id="emergency-relationship-other"
                            name="relationship_other"
                            placeholder="Please specify relationship"
                            value={formData.relationship_other || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                relationship_other: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* Address Section */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">
                        Address *
                      </Label>
                      <div className="space-y-4">
                        <div>
                          <Input
                            id="emergency-street-address"
                            name="street_address"
                            placeholder="Street Address"
                            value={formData.street_address || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                street_address: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Input
                            id="emergency-street-address-2"
                            name="street_address_2"
                            placeholder="Street Address Line 2"
                            value={formData.street_address_2 || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                street_address_2: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Input
                              id="emergency-city"
                              name="city"
                              placeholder="City"
                              value={formData.city || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  city: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Input
                              id="emergency-state"
                              name="state"
                              placeholder="State / Province"
                              value={formData.state || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  state: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Input
                            id="emergency-postal-code"
                            name="postal_code"
                            placeholder="Postal / Zip Code"
                            value={formData.postal_code || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                postal_code: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Signature Section */}
                    <div className="border-t pt-4 space-y-4">
                      <div>
                        <Label htmlFor="emergency-signature">
                          Patient Signature *
                        </Label>
                        <Input
                          id="emergency-signature"
                          name="signature"
                          placeholder="Enter your full name as signature"
                          value={formData.signature || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              signature: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergency-date-signed">
                          Date Signed *
                        </Label>
                        <Input
                          id="emergency-date-signed"
                          name="date"
                          type="date"
                          value={
                            formData.date ||
                            new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-start gap-2 cursor-pointer">
                          <input
                            id="emergency-acknowledgment"
                            name="acknowledgment"
                            type="checkbox"
                            checked={formData.acknowledgment || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                acknowledgment: e.target.checked,
                              })
                            }
                            className="mt-1 w-4 h-4"
                            required
                          />
                          <span>
                            I acknowledge that I have read and understand this
                            emergency contact form. I agree to be contacted in
                            case of an emergency regarding the patient.
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </>
              ) : openFormModal === "photo_id_verification" ? (
                <>
                  {/* Photo ID Verification Form */}
                  <div className="space-y-6">
                    {/* Form Header */}
                    <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                      <h3 className="font-semibold mb-2 text-base">
                        Photo ID Verification Form
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        This form is used to verify the identity of the
                        applicant/client by reviewing a government-issued
                        identification document.
                      </p>
                    </div>

                    {/* Client/Applicant Information Section */}
                    <div className="space-y-4">
                      <div className="bg-pink-50 p-3 rounded">
                        <h4 className="font-semibold text-base">
                          CLIENT/APPLICANT INFORMATION
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="photo-id-full-name">
                            Full Legal Name *
                          </Label>
                          <Input
                            id="photo-id-full-name"
                            name="full_legal_name"
                            placeholder="Full legal name as it appears on ID"
                            value={
                              formData.full_legal_name ||
                              patientInfo?.name ||
                              ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                full_legal_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="photo-id-dob">Date of Birth *</Label>
                          <Input
                            id="photo-id-dob"
                            name="date_of_birth"
                            type="date"
                            value={formData.date_of_birth || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                date_of_birth: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="photo-id-address">
                            Current Address *
                          </Label>
                          <Input
                            id="photo-id-address"
                            name="current_address"
                            placeholder="Current address"
                            value={formData.current_address || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                current_address: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="photo-id-phone">Phone Number *</Label>
                          <Input
                            id="photo-id-phone"
                            name="phone_number"
                            type="tel"
                            placeholder="(XXX) XXX-XXXX"
                            value={formData.phone_number || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              const formatted =
                                value.length > 6
                                  ? `(${value.slice(0, 3)}) ${value.slice(
                                      3,
                                      6
                                    )}-${value.slice(6, 10)}`
                                  : value.length > 3
                                  ? `(${value.slice(0, 3)}) ${value.slice(3)}`
                                  : value;
                              setFormData({
                                ...formData,
                                phone_number: formatted,
                              });
                            }}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Identification Document Details Section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="bg-pink-50 p-3 rounded">
                        <h4 className="font-semibold text-base">
                          IDENTIFICATION DOCUMENT DETAILS
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          This section is for the staff member or notary to
                          complete upon review of the document.
                        </p>
                      </div>

                      <div>
                        <Label className="text-base font-semibold mb-3 block">
                          Type of ID Presented (Check one) *
                        </Label>
                        <div className="space-y-2">
                          {[
                            "Current State Driver's License/ID Card",
                            "U.S. Passport Book or Card",
                            "U.S. Military ID Card",
                            "U.S. Permanent Resident Card (Green Card)",
                            "Other",
                          ].map((idType) => (
                            <Label
                              key={idType}
                              className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50">
                              <input
                                type="radio"
                                name="id_type"
                                value={idType
                                  .toLowerCase()
                                  .replace(/\s+/g, "_")}
                                checked={
                                  formData.id_type ===
                                  idType.toLowerCase().replace(/\s+/g, "_")
                                }
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    id_type: e.target.value,
                                  })
                                }
                                className="w-4 h-4"
                                required
                              />
                              <span>{idType}</span>
                            </Label>
                          ))}
                        </div>
                        {formData.id_type === "other" && (
                          <div className="mt-3">
                            <Input
                              id="photo-id-type-other"
                              name="id_type_other"
                              placeholder="Please specify type of ID"
                              value={formData.id_type_other || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  id_type_other: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="photo-id-number">ID Number *</Label>
                          <Input
                            id="photo-id-number"
                            name="id_number"
                            placeholder="ID number from document"
                            value={formData.id_number || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                id_number: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="photo-id-issuing-state">
                            Issuing State/Country *
                          </Label>
                          <Input
                            id="photo-id-issuing-state"
                            name="issuing_state"
                            placeholder="State or Country"
                            value={formData.issuing_state || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                issuing_state: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="photo-id-expiration">
                            Expiration Date *
                          </Label>
                          <Input
                            id="photo-id-expiration"
                            name="expiration_date"
                            type="date"
                            value={formData.expiration_date || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                expiration_date: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Photo Upload/Capture Section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="bg-pink-50 p-3 rounded">
                        <h4 className="font-semibold text-base">
                          PHOTO ID UPLOAD/CAPTURE
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload a photo of your ID or capture one using your
                          device camera. This is recommended for verification
                          purposes.
                        </p>
                        <p className="text-xs text-amber-600 mt-1 font-medium">
                          Note: A photocopy of your ID may be made and attached
                          to this form for record-keeping purposes.
                        </p>
                      </div>

                      {!idPhoto ? (
                        <div className="space-y-4">
                          {/* Upload Option */}
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                            <Label
                              htmlFor="id-photo-upload"
                              className="cursor-pointer">
                              <span className="text-sm font-medium text-gray-700 block mb-2">
                                Upload Photo of ID
                              </span>
                              <span className="text-xs text-gray-500">
                                Click to select or drag and drop
                              </span>
                              <Input
                                id="id-photo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setIdPhotoFile(file);
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setIdPhoto(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </Label>
                          </div>

                          {/* Camera Capture Option */}
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Camera className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Capture Photo with Camera
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const stream =
                                    await navigator.mediaDevices.getUserMedia({
                                      video: { facingMode: "environment" },
                                    });
                                  if (videoRef.current) {
                                    videoRef.current.srcObject = stream;
                                    setIsCameraActive(true);
                                  }
                                } catch (error) {
                                  toast.error(
                                    "Unable to access camera. Please check permissions."
                                  );
                                  console.error("Camera error:", error);
                                }
                              }}>
                              <Camera className="h-4 w-4 mr-2" />
                              Start Camera
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Photo Preview */}
                          <div className="relative border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-sm font-semibold">
                                ID Photo Preview
                              </Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setIdPhoto(null);
                                  setIdPhotoFile(null);
                                  if (videoRef.current?.srcObject) {
                                    const stream = videoRef.current
                                      .srcObject as MediaStream;
                                    stream
                                      .getTracks()
                                      .forEach((track) => track.stop());
                                  }
                                  setIsCameraActive(false);
                                }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="relative">
                              <img
                                src={idPhoto}
                                alt="ID Preview"
                                className="max-w-full h-auto rounded border"
                                style={{ maxHeight: "400px" }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Camera Video Feed */}
                      {isCameraActive && (
                        <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                          <div className="relative">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full rounded border"
                              style={{ maxHeight: "400px" }}
                            />
                            <canvas
                              ref={canvasRef}
                              className="hidden"
                              width={640}
                              height={480}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (videoRef.current && canvasRef.current) {
                                  const ctx =
                                    canvasRef.current.getContext("2d");
                                  if (ctx && videoRef.current) {
                                    ctx.drawImage(
                                      videoRef.current,
                                      0,
                                      0,
                                      640,
                                      480
                                    );
                                    const dataUrl =
                                      canvasRef.current.toDataURL("image/jpeg");
                                    setIdPhoto(dataUrl);
                                    // Convert to blob/file
                                    canvasRef.current.toBlob((blob) => {
                                      if (blob) {
                                        const file = new File(
                                          [blob],
                                          `id-photo-${Date.now()}.jpg`,
                                          { type: "image/jpeg" }
                                        );
                                        setIdPhotoFile(file);
                                      }
                                    }, "image/jpeg");
                                  }
                                }
                                // Stop camera
                                if (videoRef.current?.srcObject) {
                                  const stream = videoRef.current
                                    .srcObject as MediaStream;
                                  stream
                                    .getTracks()
                                    .forEach((track) => track.stop());
                                }
                                setIsCameraActive(false);
                              }}>
                              <Camera className="h-4 w-4 mr-2" />
                              Capture Photo
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                if (videoRef.current?.srcObject) {
                                  const stream = videoRef.current
                                    .srcObject as MediaStream;
                                  stream
                                    .getTracks()
                                    .forEach((track) => track.stop());
                                }
                                setIsCameraActive(false);
                              }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Verification and Attestation Section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="bg-blue-50 p-4 rounded">
                        <h4 className="font-semibold text-base mb-3">
                          Verification and Attestation
                        </h4>
                        <div className="space-y-2 text-sm leading-relaxed">
                          <p>
                            <strong>Applicant Attestation:</strong> I attest
                            that the identification document provided is valid
                            and belongs to me. The information provided is
                            accurate to the best of my knowledge.
                          </p>
                          <p>
                            <strong>Verifier Confirmation:</strong> I confirm
                            that I have reviewed the identification document and
                            that the photo matches the individual presenting the
                            document.
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            <strong>Note:</strong> It is standard practice to
                            make and attach a photocopy of the ID. Ensure
                            compliance with data privacy laws when handling
                            personal information and ID copies.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="photo-id-applicant-signature">
                            Signature of Applicant *
                          </Label>
                          <Input
                            id="photo-id-applicant-signature"
                            name="applicant_signature"
                            placeholder="Enter your full name as signature"
                            value={formData.applicant_signature || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                applicant_signature: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="photo-id-applicant-date">
                            Date (Applicant) *
                          </Label>
                          <Input
                            id="photo-id-applicant-date"
                            name="applicant_date"
                            type="date"
                            value={
                              formData.applicant_date ||
                              new Date().toISOString().split("T")[0]
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                applicant_date: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="photo-id-verifier-name">
                            Printed Name of Verifier *
                          </Label>
                          <Input
                            id="photo-id-verifier-name"
                            name="verifier_name"
                            placeholder="Full name of staff member/notary"
                            value={formData.verifier_name || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                verifier_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="photo-id-verifier-signature">
                            Signature of Verifier *
                          </Label>
                          <Input
                            id="photo-id-verifier-signature"
                            name="verifier_signature"
                            placeholder="Enter verifier's full name as signature"
                            value={formData.verifier_signature || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                verifier_signature: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="photo-id-verifier-date">
                            Date (Verifier) *
                          </Label>
                          <Input
                            id="photo-id-verifier-date"
                            name="verifier_date"
                            type="date"
                            value={
                              formData.verifier_date ||
                              new Date().toISOString().split("T")[0]
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                verifier_date: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Acknowledgment Section */}
                    <div className="border-t pt-4 space-y-2">
                      <Label className="flex items-start gap-2 cursor-pointer">
                        <input
                          id="photo-id-acknowledgment"
                          name="acknowledgment"
                          type="checkbox"
                          checked={formData.acknowledgment || false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              acknowledgment: e.target.checked,
                            })
                          }
                          className="mt-1 w-4 h-4"
                          required
                        />
                        <span>
                          I acknowledge that I have read and understand this
                          Photo ID Verification form. I understand that a
                          photocopy of my ID may be made and attached to this
                          form for record-keeping purposes.
                        </span>
                      </Label>
                    </div>
                  </div>
                </>
              ) : openFormModal === "insurance_card_copy" ? (
                <>
                  {/* Insurance Card Copy Form */}
                  <div className="space-y-6">
                    {/* Form Header */}
                    <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                      <h3 className="font-semibold mb-2 text-base">
                        Insurance Card Copy Form
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Please provide your insurance information and upload
                        copies of your insurance card(s).
                      </p>
                    </div>

                    {/* Insurance Information Section */}
                    <div className="space-y-4">
                      <div className="bg-pink-50 p-3 rounded">
                        <h4 className="font-semibold text-base">
                          INSURANCE INFORMATION
                        </h4>
                      </div>

                      <div>
                        <Label className="text-base font-semibold mb-3 block">
                          Do you have insurance? *
                        </Label>
                        <div className="flex gap-4">
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="has_insurance"
                              value="yes"
                              checked={formData.has_insurance === "yes"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  has_insurance: e.target.value,
                                })
                              }
                              className="w-4 h-4"
                              required
                            />
                            Yes
                          </Label>
                          <Label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="has_insurance"
                              value="no"
                              checked={formData.has_insurance === "no"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  has_insurance: e.target.value,
                                })
                              }
                              className="w-4 h-4"
                              required
                            />
                            No
                          </Label>
                        </div>
                        {formData.has_insurance === "yes" && (
                          <p className="text-sm text-muted-foreground mt-2">
                            If yes, please complete the following section and
                            attach a copy (front and back) of your insurance
                            card(s).
                          </p>
                        )}
                      </div>

                      {/* Primary Insurance Section */}
                      {formData.has_insurance === "yes" && (
                        <div className="space-y-4 border-t pt-4">
                          <h4 className="font-semibold text-base">
                            Primary Insurance
                          </h4>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="primary-insurance-company">
                                Insurance Company Name *
                              </Label>
                              <Input
                                id="primary-insurance-company"
                                name="primary_insurance_company"
                                placeholder="Insurance company name"
                                value={formData.primary_insurance_company || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    primary_insurance_company: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="primary-member-id">
                                Member/Policy ID Number *
                              </Label>
                              <Input
                                id="primary-member-id"
                                name="primary_member_id"
                                placeholder="Member/Policy ID"
                                value={formData.primary_member_id || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    primary_member_id: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="primary-group-number">
                                Group Number (if applicable)
                              </Label>
                              <Input
                                id="primary-group-number"
                                name="primary_group_number"
                                placeholder="Group number"
                                value={formData.primary_group_number || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    primary_group_number: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="primary-insurance-phone">
                                Insurance Company Phone Number *
                              </Label>
                              <Input
                                id="primary-insurance-phone"
                                name="primary_insurance_phone"
                                type="tel"
                                placeholder="(XXX) XXX-XXXX"
                                value={formData.primary_insurance_phone || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  const formatted =
                                    value.length > 6
                                      ? `(${value.slice(0, 3)}) ${value.slice(
                                          3,
                                          6
                                        )}-${value.slice(6, 10)}`
                                      : value.length > 3
                                      ? `(${value.slice(0, 3)}) ${value.slice(
                                          3
                                        )}`
                                      : value;
                                  setFormData({
                                    ...formData,
                                    primary_insurance_phone: formatted,
                                  });
                                }}
                                required
                              />
                            </div>
                          </div>

                          {/* Policy Holder Information */}
                          <div className="border-t pt-4 space-y-4">
                            <h5 className="font-semibold text-sm">
                              Policy Holder Information (If different from the
                              client/patient)
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="primary-policy-holder-name">
                                  Policy Holder's Full Name
                                </Label>
                                <Input
                                  id="primary-policy-holder-name"
                                  name="primary_policy_holder_name"
                                  placeholder="Full name"
                                  value={
                                    formData.primary_policy_holder_name || ""
                                  }
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      primary_policy_holder_name:
                                        e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Relationship to Client</Label>
                                <div className="flex gap-4 mt-2">
                                  {["Spouse", "Parent", "Other"].map((rel) => (
                                    <Label
                                      key={rel}
                                      className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name="primary_relationship"
                                        value={rel.toLowerCase()}
                                        checked={
                                          formData.primary_relationship ===
                                          rel.toLowerCase()
                                        }
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            primary_relationship:
                                              e.target.value,
                                          })
                                        }
                                        className="w-4 h-4"
                                      />
                                      {rel}
                                    </Label>
                                  ))}
                                </div>
                                {formData.primary_relationship === "other" && (
                                  <Input
                                    className="mt-2"
                                    placeholder="Please specify"
                                    value={
                                      formData.primary_relationship_other || ""
                                    }
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        primary_relationship_other:
                                          e.target.value,
                                      })
                                    }
                                  />
                                )}
                              </div>
                              <div>
                                <Label htmlFor="primary-policy-holder-dob">
                                  Policy Holder's Date of Birth
                                </Label>
                                <Input
                                  id="primary-policy-holder-dob"
                                  name="primary_policy_holder_dob"
                                  type="date"
                                  value={
                                    formData.primary_policy_holder_dob || ""
                                  }
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      primary_policy_holder_dob: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="primary-policy-holder-address">
                                  Policy Holder's Address
                                </Label>
                                <Input
                                  id="primary-policy-holder-address"
                                  name="primary_policy_holder_address"
                                  placeholder="Address"
                                  value={
                                    formData.primary_policy_holder_address || ""
                                  }
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      primary_policy_holder_address:
                                        e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="col-span-2">
                                <Label htmlFor="primary-policy-holder-city-state">
                                  City, State, Zip
                                </Label>
                                <Input
                                  id="primary-policy-holder-city-state"
                                  name="primary_policy_holder_city_state"
                                  placeholder="City, State, Zip"
                                  value={
                                    formData.primary_policy_holder_city_state ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      primary_policy_holder_city_state:
                                        e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Secondary Insurance Section */}
                      {formData.has_insurance === "yes" && (
                        <div className="space-y-4 border-t pt-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-base">
                              Secondary Insurance (If applicable)
                            </h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  has_secondary_insurance:
                                    !formData.has_secondary_insurance,
                                })
                              }>
                              {formData.has_secondary_insurance
                                ? "Remove"
                                : "Add Secondary Insurance"}
                            </Button>
                          </div>

                          {formData.has_secondary_insurance && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="secondary-insurance-company">
                                  Insurance Company Name
                                </Label>
                                <Input
                                  id="secondary-insurance-company"
                                  name="secondary_insurance_company"
                                  placeholder="Insurance company name"
                                  value={
                                    formData.secondary_insurance_company || ""
                                  }
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      secondary_insurance_company:
                                        e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="secondary-member-id">
                                  Member/Policy ID Number
                                </Label>
                                <Input
                                  id="secondary-member-id"
                                  name="secondary_member_id"
                                  placeholder="Member/Policy ID"
                                  value={formData.secondary_member_id || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      secondary_member_id: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="secondary-group-number">
                                  Group Number (if applicable)
                                </Label>
                                <Input
                                  id="secondary-group-number"
                                  name="secondary_group_number"
                                  placeholder="Group number"
                                  value={formData.secondary_group_number || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      secondary_group_number: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="secondary-policy-holder-name">
                                  Policy Holder's Full Name (if different)
                                </Label>
                                <Input
                                  id="secondary-policy-holder-name"
                                  name="secondary_policy_holder_name"
                                  placeholder="Full name"
                                  value={
                                    formData.secondary_policy_holder_name || ""
                                  }
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      secondary_policy_holder_name:
                                        e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Copy/Upload Section */}
                    {formData.has_insurance === "yes" && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="bg-pink-50 p-3 rounded">
                          <h4 className="font-semibold text-base">
                            CARD COPY/UPLOAD SECTION
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Please upload images of the front and back of your
                            insurance card(s) directly to this form.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Front of Card */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">
                              Upload Front of Card *
                            </Label>
                            {!insuranceCardFront ? (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                <Label
                                  htmlFor="insurance-card-front-upload"
                                  className="cursor-pointer">
                                  <span className="text-xs text-gray-700 block mb-1">
                                    Click to upload
                                  </span>
                                  <Input
                                    id="insurance-card-front-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setInsuranceCardFrontFile(file);
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setInsuranceCardFront(
                                            reader.result as string
                                          );
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={async () => {
                                    try {
                                      const stream =
                                        await navigator.mediaDevices.getUserMedia(
                                          {
                                            video: {
                                              facingMode: "environment",
                                            },
                                          }
                                        );
                                      if (insuranceVideoRef.current) {
                                        insuranceVideoRef.current.srcObject =
                                          stream;
                                        setIsInsuranceCameraActive(true);
                                        setInsuranceCameraSide("front");
                                      }
                                    } catch (error) {
                                      toast.error(
                                        "Unable to access camera. Please check permissions."
                                      );
                                    }
                                  }}>
                                  <Camera className="h-3 w-3 mr-1" />
                                  Use Camera
                                </Button>
                              </div>
                            ) : (
                              <div className="relative border rounded-lg p-2 bg-gray-50">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute top-1 right-1"
                                  onClick={() => {
                                    setInsuranceCardFront(null);
                                    setInsuranceCardFrontFile(null);
                                  }}>
                                  <X className="h-3 w-3" />
                                </Button>
                                <img
                                  src={insuranceCardFront}
                                  alt="Insurance Card Front"
                                  className="w-full h-auto rounded"
                                  style={{ maxHeight: "200px" }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Back of Card */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">
                              Upload Back of Card *
                            </Label>
                            {!insuranceCardBack ? (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                <Label
                                  htmlFor="insurance-card-back-upload"
                                  className="cursor-pointer">
                                  <span className="text-xs text-gray-700 block mb-1">
                                    Click to upload
                                  </span>
                                  <Input
                                    id="insurance-card-back-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setInsuranceCardBackFile(file);
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setInsuranceCardBack(
                                            reader.result as string
                                          );
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={async () => {
                                    try {
                                      const stream =
                                        await navigator.mediaDevices.getUserMedia(
                                          {
                                            video: {
                                              facingMode: "environment",
                                            },
                                          }
                                        );
                                      if (insuranceVideoRef.current) {
                                        insuranceVideoRef.current.srcObject =
                                          stream;
                                        setIsInsuranceCameraActive(true);
                                        setInsuranceCameraSide("back");
                                      }
                                    } catch (error) {
                                      toast.error(
                                        "Unable to access camera. Please check permissions."
                                      );
                                    }
                                  }}>
                                  <Camera className="h-3 w-3 mr-1" />
                                  Use Camera
                                </Button>
                              </div>
                            ) : (
                              <div className="relative border rounded-lg p-2 bg-gray-50">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute top-1 right-1"
                                  onClick={() => {
                                    setInsuranceCardBack(null);
                                    setInsuranceCardBackFile(null);
                                  }}>
                                  <X className="h-3 w-3" />
                                </Button>
                                <img
                                  src={insuranceCardBack}
                                  alt="Insurance Card Back"
                                  className="w-full h-auto rounded"
                                  style={{ maxHeight: "200px" }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Camera Feed for Insurance Cards */}
                        {isInsuranceCameraActive && (
                          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                            <p className="text-sm font-medium">
                              Capturing {insuranceCameraSide} of insurance card
                            </p>
                            <div className="relative">
                              <video
                                ref={insuranceVideoRef}
                                autoPlay
                                playsInline
                                className="w-full rounded border"
                                style={{ maxHeight: "300px" }}
                              />
                              <canvas
                                ref={insuranceCanvasRef}
                                className="hidden"
                                width={640}
                                height={480}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  if (
                                    insuranceVideoRef.current &&
                                    insuranceCanvasRef.current
                                  ) {
                                    const ctx =
                                      insuranceCanvasRef.current.getContext(
                                        "2d"
                                      );
                                    if (ctx && insuranceVideoRef.current) {
                                      ctx.drawImage(
                                        insuranceVideoRef.current,
                                        0,
                                        0,
                                        640,
                                        480
                                      );
                                      const dataUrl =
                                        insuranceCanvasRef.current.toDataURL(
                                          "image/jpeg"
                                        );
                                      if (insuranceCameraSide === "front") {
                                        setInsuranceCardFront(dataUrl);
                                      } else {
                                        setInsuranceCardBack(dataUrl);
                                      }
                                      // Convert to blob/file
                                      insuranceCanvasRef.current.toBlob(
                                        (blob) => {
                                          if (blob) {
                                            const file = new File(
                                              [blob],
                                              `insurance-card-${insuranceCameraSide}-${Date.now()}.jpg`,
                                              { type: "image/jpeg" }
                                            );
                                            if (
                                              insuranceCameraSide === "front"
                                            ) {
                                              setInsuranceCardFrontFile(file);
                                            } else {
                                              setInsuranceCardBackFile(file);
                                            }
                                          }
                                        },
                                        "image/jpeg"
                                      );
                                    }
                                  }
                                  // Stop camera
                                  if (insuranceVideoRef.current?.srcObject) {
                                    const stream = insuranceVideoRef.current
                                      .srcObject as MediaStream;
                                    stream
                                      .getTracks()
                                      .forEach((track) => track.stop());
                                  }
                                  setIsInsuranceCameraActive(false);
                                  setInsuranceCameraSide(null);
                                }}>
                                <Camera className="h-4 w-4 mr-2" />
                                Capture Photo
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  if (insuranceVideoRef.current?.srcObject) {
                                    const stream = insuranceVideoRef.current
                                      .srcObject as MediaStream;
                                    stream
                                      .getTracks()
                                      .forEach((track) => track.stop());
                                  }
                                  setIsInsuranceCameraActive(false);
                                  setInsuranceCameraSide(null);
                                }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Financial Responsibility Statement */}
                    {formData.has_insurance === "yes" && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="bg-blue-50 p-4 rounded">
                          <h4 className="font-semibold text-base mb-3">
                            Financial Responsibility Statement
                          </h4>
                          <p className="text-sm leading-relaxed">
                            "I understand that I am financially responsible for
                            all charges for services rendered, regardless of my
                            insurance coverage. I agree to pay any co-pays,
                            deductibles, or non-covered services at the time of
                            the visit."
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Signature Section */}
                    <div className="border-t pt-4 space-y-4">
                      <div>
                        <Label htmlFor="insurance-signature">Signature *</Label>
                        <Input
                          id="insurance-signature"
                          name="signature"
                          placeholder="Enter your full name as signature"
                          value={formData.signature || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              signature: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="insurance-date-signed">Date *</Label>
                        <Input
                          id="insurance-date-signed"
                          name="date"
                          type="date"
                          value={
                            formData.date ||
                            new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-start gap-2 cursor-pointer">
                          <input
                            id="insurance-acknowledgment"
                            name="acknowledgment"
                            type="checkbox"
                            checked={formData.acknowledgment || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                acknowledgment: e.target.checked,
                              })
                            }
                            className="mt-1 w-4 h-4"
                            required
                          />
                          <span>
                            I acknowledge that I have read and understand the
                            Financial Responsibility Statement and agree to its
                            terms.
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </>
              ) : openFormModal === "hhn_enrollment" ? (
                <>
                  {/* HHN Enrollment Form */}
                  <div className="space-y-6">
                    {/* Form Header */}
                    <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                      <h3 className="font-semibold mb-2 text-base">
                        Home Health Nursing (HHN) Enrollment Form
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Please provide comprehensive information to determine
                        the appropriate level of care and for billing purposes.
                      </p>
                    </div>

                    {/* Client Information Section */}
                    <div className="space-y-4">
                      <div className="bg-pink-50 p-3 rounded">
                        <h4 className="font-semibold text-base">
                          CLIENT INFORMATION
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hhn-full-name">Full Name *</Label>
                          <Input
                            id="hhn-full-name"
                            name="full_name"
                            placeholder="Full legal name"
                            value={
                              formData.full_name || patientInfo?.name || ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                full_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="hhn-dob">Date of Birth *</Label>
                          <Input
                            id="hhn-dob"
                            name="date_of_birth"
                            type="date"
                            value={formData.date_of_birth || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                date_of_birth: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="hhn-address">Address *</Label>
                          <Input
                            id="hhn-address"
                            name="address"
                            placeholder="Street address"
                            value={formData.address || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="hhn-city-state-zip">
                            City, State, Zip *
                          </Label>
                          <Input
                            id="hhn-city-state-zip"
                            name="city_state_zip"
                            placeholder="City, State, Zip"
                            value={formData.city_state_zip || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                city_state_zip: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="hhn-phone">Phone Number *</Label>
                          <Input
                            id="hhn-phone"
                            name="phone_number"
                            type="tel"
                            placeholder="(XXX) XXX-XXXX"
                            value={formData.phone_number || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              const formatted =
                                value.length > 6
                                  ? `(${value.slice(0, 3)}) ${value.slice(
                                      3,
                                      6
                                    )}-${value.slice(6, 10)}`
                                  : value.length > 3
                                  ? `(${value.slice(0, 3)}) ${value.slice(3)}`
                                  : value;
                              setFormData({
                                ...formData,
                                phone_number: formatted,
                              });
                            }}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="hhn-email">Email *</Label>
                          <Input
                            id="hhn-email"
                            name="email"
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact Section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="bg-pink-50 p-3 rounded">
                        <h4 className="font-semibold text-base">
                          EMERGENCY CONTACT
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hhn-emergency-name">
                            Emergency Contact Name *
                          </Label>
                          <Input
                            id="hhn-emergency-name"
                            name="emergency_contact_name"
                            placeholder="Full name"
                            value={formData.emergency_contact_name || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                emergency_contact_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="hhn-emergency-phone">
                            Emergency Contact Phone Number *
                          </Label>
                          <Input
                            id="hhn-emergency-phone"
                            name="emergency_contact_phone"
                            type="tel"
                            placeholder="(XXX) XXX-XXXX"
                            value={formData.emergency_contact_phone || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              const formatted =
                                value.length > 6
                                  ? `(${value.slice(0, 3)}) ${value.slice(
                                      3,
                                      6
                                    )}-${value.slice(6, 10)}`
                                  : value.length > 3
                                  ? `(${value.slice(0, 3)}) ${value.slice(3)}`
                                  : value;
                              setFormData({
                                ...formData,
                                emergency_contact_phone: formatted,
                              });
                            }}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Medical History Section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="bg-pink-50 p-3 rounded">
                        <h4 className="font-semibold text-base">
                          MEDICAL HISTORY
                        </h4>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="hhn-medical-conditions">
                            Current Medical Conditions *
                          </Label>
                          <Textarea
                            id="hhn-medical-conditions"
                            name="medical_conditions"
                            placeholder="List all current medical conditions, diagnoses, or health issues"
                            value={formData.medical_conditions || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                medical_conditions: e.target.value,
                              })
                            }
                            rows={3}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="hhn-hospitalizations">
                            Recent Hospitalizations (within last 2 years)
                          </Label>
                          <Textarea
                            id="hhn-hospitalizations"
                            name="hospitalizations"
                            placeholder="List any hospitalizations, dates, and reasons"
                            value={formData.hospitalizations || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                hospitalizations: e.target.value,
                              })
                            }
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="hhn-allergies">Allergies *</Label>
                          <Textarea
                            id="hhn-allergies"
                            name="allergies"
                            placeholder="List all known allergies (medications, food, environmental, etc.). If none, please write 'None'."
                            value={formData.allergies || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                allergies: e.target.value,
                              })
                            }
                            rows={2}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="hhn-medications">
                            Current Medications *
                          </Label>
                          <Textarea
                            id="hhn-medications"
                            name="medications"
                            placeholder="List all current medications including: medication name, dosage, frequency, and prescribing doctor name. If none, please write 'None'."
                            value={formData.medications || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                medications: e.target.value,
                              })
                            }
                            rows={4}
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Format: Medication Name - Dosage - Frequency -
                            Prescribing Doctor
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Physical Health Self-Assessment Section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="bg-pink-50 p-3 rounded">
                        <h4 className="font-semibold text-base">
                          PHYSICAL HEALTH SELF-ASSESSMENT
                        </h4>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="hhn-diet">Diet and Nutrition *</Label>
                          <Textarea
                            id="hhn-diet"
                            name="diet"
                            placeholder="Describe your typical diet, eating patterns, and any dietary restrictions or preferences"
                            value={formData.diet || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                diet: e.target.value,
                              })
                            }
                            rows={3}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="hhn-sleep">Sleep Patterns *</Label>
                          <Textarea
                            id="hhn-sleep"
                            name="sleep_patterns"
                            placeholder="Describe your typical sleep patterns, hours of sleep per night, and any sleep issues"
                            value={formData.sleep_patterns || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                sleep_patterns: e.target.value,
                              })
                            }
                            rows={3}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="hhn-physical-activity">
                            Physical Activity *
                          </Label>
                          <Textarea
                            id="hhn-physical-activity"
                            name="physical_activity"
                            placeholder="Describe your level of physical activity, exercise routine, and any limitations"
                            value={formData.physical_activity || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                physical_activity: e.target.value,
                              })
                            }
                            rows={3}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="hhn-mobility">Mobility *</Label>
                          <Textarea
                            id="hhn-mobility"
                            name="mobility"
                            placeholder="Describe your mobility level, use of assistive devices (walker, cane, wheelchair, etc.), and any mobility limitations"
                            value={formData.mobility || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                mobility: e.target.value,
                              })
                            }
                            rows={3}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Insurance Details Section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="bg-pink-50 p-3 rounded">
                        <h4 className="font-semibold text-base">
                          INSURANCE DETAILS
                        </h4>
                      </div>

                      {/* Primary Insurance */}
                      <div className="space-y-4">
                        <h5 className="font-semibold text-sm">
                          Primary Insurance
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="hhn-primary-insurance-provider">
                              Insurance Provider Name *
                            </Label>
                            <Input
                              id="hhn-primary-insurance-provider"
                              name="primary_insurance_provider"
                              placeholder="Insurance company name"
                              value={formData.primary_insurance_provider || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  primary_insurance_provider: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="hhn-primary-policy-id">
                              Policy ID Number *
                            </Label>
                            <Input
                              id="hhn-primary-policy-id"
                              name="primary_policy_id"
                              placeholder="Policy ID number"
                              value={formData.primary_policy_id || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  primary_policy_id: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="hhn-primary-group-number">
                              Group Number (if applicable)
                            </Label>
                            <Input
                              id="hhn-primary-group-number"
                              name="primary_group_number"
                              placeholder="Group number"
                              value={formData.primary_group_number || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  primary_group_number: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="hhn-primary-policy-holder">
                              Policy Holder Name (if different)
                            </Label>
                            <Input
                              id="hhn-primary-policy-holder"
                              name="primary_policy_holder"
                              placeholder="Policy holder name"
                              value={formData.primary_policy_holder || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  primary_policy_holder: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Secondary Insurance */}
                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-sm">
                            Secondary Insurance (if applicable)
                          </h5>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                has_secondary_insurance:
                                  !formData.has_secondary_insurance,
                              })
                            }>
                            {formData.has_secondary_insurance
                              ? "Remove"
                              : "Add Secondary Insurance"}
                          </Button>
                        </div>

                        {formData.has_secondary_insurance && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="hhn-secondary-insurance-provider">
                                Insurance Provider Name
                              </Label>
                              <Input
                                id="hhn-secondary-insurance-provider"
                                name="secondary_insurance_provider"
                                placeholder="Insurance company name"
                                value={
                                  formData.secondary_insurance_provider || ""
                                }
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    secondary_insurance_provider:
                                      e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="hhn-secondary-policy-id">
                                Policy ID Number
                              </Label>
                              <Input
                                id="hhn-secondary-policy-id"
                                name="secondary_policy_id"
                                placeholder="Policy ID number"
                                value={formData.secondary_policy_id || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    secondary_policy_id: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="hhn-secondary-group-number">
                                Group Number (if applicable)
                              </Label>
                              <Input
                                id="hhn-secondary-group-number"
                                name="secondary_group_number"
                                placeholder="Group number"
                                value={formData.secondary_group_number || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    secondary_group_number: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="hhn-secondary-policy-holder">
                                Policy Holder Name (if different)
                              </Label>
                              <Input
                                id="hhn-secondary-policy-holder"
                                name="secondary_policy_holder"
                                placeholder="Policy holder name"
                                value={formData.secondary_policy_holder || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    secondary_policy_holder: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Consent and Authorization Section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="bg-blue-50 p-4 rounded">
                        <h4 className="font-semibold text-base mb-3">
                          Consent and Authorization
                        </h4>
                        <div className="space-y-2 text-sm leading-relaxed">
                          <p>
                            I confirm that the information provided in this form
                            is accurate to the best of my knowledge. I authorize
                            the provider to:
                          </p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Bill my insurance for services rendered</li>
                            <li>
                              Release medical information as required for
                              treatment or payment purposes
                            </li>
                            <li>
                              Coordinate care with other healthcare providers as
                              necessary
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="hhn-signature">Signature *</Label>
                          <Input
                            id="hhn-signature"
                            name="signature"
                            placeholder="Enter your full name as signature"
                            value={formData.signature || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                signature: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="hhn-date-signed">Date *</Label>
                          <Input
                            id="hhn-date-signed"
                            name="date"
                            type="date"
                            value={
                              formData.date ||
                              new Date().toISOString().split("T")[0]
                            }
                            onChange={(e) =>
                              setFormData({ ...formData, date: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-start gap-2 cursor-pointer">
                            <input
                              id="hhn-acknowledgment"
                              name="acknowledgment"
                              type="checkbox"
                              checked={formData.acknowledgment || false}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  acknowledgment: e.target.checked,
                                })
                              }
                              className="mt-1 w-4 h-4"
                              required
                            />
                            <span>
                              I acknowledge that I have read and understand the
                              Consent and Authorization section. I confirm the
                              accuracy of the information provided and authorize
                              the provider as stated above.
                            </span>
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : openFormModal === "patient_handbook_receipt" ? (
                <>
                  {/* Patient Handbook Receipt Form */}
                  <div className="space-y-6">
                    {/* Form Header */}
                    <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                      <h3 className="font-semibold mb-2 text-base">
                        Acknowledgment of Receipt of Patient Handbook
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Please read and complete this form to acknowledge
                        receipt of the Patient Handbook.
                      </p>
                    </div>

                    {/* Acknowledgment Statement */}
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded">
                        <p className="text-sm leading-relaxed">
                          I, the undersigned patient or legally authorized
                          representative, hereby acknowledge that I have been
                          provided with access to, or have received a copy of,
                          the <strong>MASE Behavioral Health EMR</strong>{" "}
                          Patient Handbook.
                        </p>
                        <p className="text-sm leading-relaxed mt-3">
                          I understand that the Handbook provides detailed
                          information regarding the clinic's:
                        </p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-sm">
                          <li>Patient Rights and Responsibilities</li>
                          <li>Notice of Privacy Practices (HIPAA)</li>
                          <li>Financial Policies and Billing Procedures</li>
                          <li>Cancellation and No-Show Policies</li>
                          <li>Complaint and Grievance Procedures</li>
                        </ul>
                      </div>
                    </div>

                    {/* Receipt Method Checkboxes */}
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-base font-semibold block mb-3">
                        Please check all that apply: *
                      </Label>
                      <div className="space-y-3">
                        <Label className="flex items-start gap-2 cursor-pointer p-3 border rounded hover:bg-gray-50">
                          <input
                            type="checkbox"
                            name="received_physical_copy"
                            checked={formData.received_physical_copy || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                received_physical_copy: e.target.checked,
                              })
                            }
                            className="mt-1 w-4 h-4"
                          />
                          <span>
                            I have received a physical copy of the Patient
                            Handbook.
                          </span>
                        </Label>
                        <Label className="flex items-start gap-2 cursor-pointer p-3 border rounded hover:bg-gray-50">
                          <input
                            type="checkbox"
                            name="provided_digital_link"
                            checked={formData.provided_digital_link || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                provided_digital_link: e.target.checked,
                              })
                            }
                            className="mt-1 w-4 h-4"
                          />
                          <span>
                            I was provided a link to the digital Patient
                            Handbook (e.g., Practice Website Link).
                          </span>
                        </Label>
                        <Label className="flex items-start gap-2 cursor-pointer p-3 border rounded hover:bg-gray-50">
                          <input
                            type="checkbox"
                            name="questions_answered"
                            checked={formData.questions_answered || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                questions_answered: e.target.checked,
                              })
                            }
                            className="mt-1 w-4 h-4"
                          />
                          <span>
                            I was given the opportunity to ask questions
                            regarding the contents of the Handbook and the
                            associated policies and my questions were answered
                            to my satisfaction.
                          </span>
                        </Label>
                      </div>
                      {!formData.received_physical_copy &&
                        !formData.provided_digital_link &&
                        !formData.questions_answered && (
                          <p className="text-xs text-amber-600 mt-2">
                            Please select at least one option above.
                          </p>
                        )}
                    </div>

                    {/* Confirmation Statement */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="bg-blue-50 p-4 rounded">
                        <p className="text-sm leading-relaxed">
                          By signing below, I confirm that I have read (or had
                          explained to me) the information in the Handbook and
                          agree to abide by the policies and procedures outlined
                          within it. I understand that these policies may be
                          updated periodically.
                        </p>
                      </div>
                    </div>

                    {/* Signature Section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="handbook-signature">
                            Signature of Patient/Legal Representative *
                          </Label>
                          <Input
                            id="handbook-signature"
                            name="signature"
                            placeholder="Enter your full name as signature"
                            value={formData.signature || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                signature: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="handbook-date">Date *</Label>
                          <Input
                            id="handbook-date"
                            name="date"
                            type="date"
                            value={
                              formData.date ||
                              new Date().toISOString().split("T")[0]
                            }
                            onChange={(e) =>
                              setFormData({ ...formData, date: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="handbook-printed-name">
                            Printed Name of Patient/Representative *
                          </Label>
                          <Input
                            id="handbook-printed-name"
                            name="printed_name"
                            placeholder="Full printed name"
                            value={formData.printed_name || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                printed_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="handbook-relationship">
                            Relationship to Patient (if applicable)
                          </Label>
                          <Input
                            id="handbook-relationship"
                            name="relationship_to_patient"
                            placeholder="Self, Parent, Guardian, etc."
                            value={formData.relationship_to_patient || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                relationship_to_patient: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Optional Witness Section */}
                      <div className="border-t pt-4">
                        <h5 className="font-semibold text-sm mb-3">
                          Office Staff Witness (Optional but Recommended)
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="handbook-witness-name">
                              Witness Name
                            </Label>
                            <Input
                              id="handbook-witness-name"
                              name="witness_name"
                              placeholder="Staff member name"
                              value={formData.witness_name || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  witness_name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="handbook-witness-date">
                              Witness Date
                            </Label>
                            <Input
                              id="handbook-witness-date"
                              name="witness_date"
                              type="date"
                              value={formData.witness_date || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  witness_date: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Acknowledgment Checkbox */}
                      <div className="space-y-2 border-t pt-4">
                        <Label className="flex items-start gap-2 cursor-pointer">
                          <input
                            id="handbook-acknowledgment"
                            name="acknowledgment"
                            type="checkbox"
                            checked={formData.acknowledgment || false}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                acknowledgment: e.target.checked,
                              })
                            }
                            className="mt-1 w-4 h-4"
                            required
                          />
                          <span>
                            I acknowledge that I have read and understand this
                            Acknowledgment of Receipt of Patient Handbook form.
                            I confirm that I have received or been provided
                            access to the Patient Handbook and agree to abide by
                            the policies and procedures outlined within it.
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Generic form for other form types */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="form-signature">Signature *</Label>
                      <Input
                        id="form-signature"
                        name="signature"
                        placeholder="Enter your full name"
                        value={formData.signature || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            signature: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="form-date">Date *</Label>
                      <Input
                        id="form-date"
                        name="date"
                        type="date"
                        value={
                          formData.date ||
                          new Date().toISOString().split("T")[0]
                        }
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="form-acknowledgment"
                        className="flex items-start gap-2 cursor-pointer">
                        <input
                          id="form-acknowledgment"
                          name="acknowledgment"
                          type="checkbox"
                          checked={formData.acknowledgment || false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              acknowledgment: e.target.checked,
                            })
                          }
                          className="mt-1 w-4 h-4"
                          required
                        />
                        <span>
                          I acknowledge that I have read and understand this
                          form
                        </span>
                      </Label>
                    </div>
                    <div>
                      <Label htmlFor="form-notes">
                        Additional Notes (Optional)
                      </Label>
                      <Textarea
                        id="form-notes"
                        name="notes"
                        placeholder="Any additional information..."
                        value={formData.notes || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenFormModal(null);
                setFormData({});
              }}
              disabled={formSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitForm}
              disabled={
                formSubmitting ||
                !formData.signature ||
                !formData.date ||
                !formData.acknowledgment ||
                (openFormModal === "insurance_card_copy" &&
                  formData.has_insurance === "yes" &&
                  (!insuranceCardFrontFile || !insuranceCardBackFile)) ||
                (openFormModal === "patient_handbook_receipt" &&
                  !formData.printed_name &&
                  !formData.received_physical_copy &&
                  !formData.provided_digital_link &&
                  !formData.questions_answered)
              }
              style={{ backgroundColor: "#16a34a" }}>
              {formSubmitting ? "Submitting..." : "Submit Form"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
