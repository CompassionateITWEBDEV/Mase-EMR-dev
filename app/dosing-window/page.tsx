"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useProviders } from "@/hooks/use-providers"
import { useAuth } from "@/lib/auth/rbac-hooks"
import {
  Search,
  Fingerprint,
  Camera,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
  Pill,
  Syringe,
  Clock,
  FileText,
  Printer,
  PauseCircle,
  StopCircle,
  Send,
  AlertCircle,
  Shield,
  Activity,
  ChevronRight,
  ChevronDown,
  Scale,
  Loader2,
  Award as IdCard,
  Lock,
  History,
  Ban,
  RotateCcw,
  Play,
  Square,
} from "lucide-react"

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  client_number?: string
  phone?: string
  photo_url?: string
}

interface MedicationOrder {
  id: string
  patient_id: string
  medication: string
  daily_dose_mg: number
  max_takehome: number
  status: string
  start_date: string
  stop_date?: string
}

interface DosingHold {
  id: string
  patient_id: string
  hold_type: string
  reason: string
  severity: string
  status: string
  created_at: string
  created_by: string
  requires_clearance_from: string[]
  cleared_by: string[]
}

interface BiometricEnrollment {
  id: string
  patient_id: string
  facial_enrolled_at?: string
  fingerprint_enrolled_at?: string
  is_active: boolean
  total_verifications: number
  failed_verifications: number
}

interface DosingLog {
  id: string
  patient_id: string
  dose_date: string
  dose_time: string
  medication: string
  dose_amount: number
  dispensed_by: string
  witnessed_by?: string
  notes?: string
  patient_response?: string
  bottle_number?: string // Added for bottle tracking
}

interface TakeHomeBottle {
  id: string
  patient_id: string
  bottle_number: number
  total_bottles: number // Added this field
  medication_name: string
  dose_amount: number
  dose_unit: string // Added this field
  scheduled_consume_date: string
  dispense_date: string // Added this field
  dispensed_by: string // Added this field
  dispense_location_lat: number // Added this field
  dispense_location_lng: number // Added this field
  qr_code_data: string
  qr_code_image_url: string // Added this field
  status: string // Changed from "dispensed" to "label_printed" initially
  filled_at?: string // Added this field
  expiration_date: string // Added this field
}

interface VitalSigns {
  systolic_bp?: number
  diastolic_bp?: number
  heart_rate?: number
  temperature?: number
  oxygen_saturation?: number
  respiratory_rate?: number
}

export default function DosingWindowPage() {
  const { toast } = useToast()
  const supabase = createClient()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Auth and providers hooks
  const { user } = useAuth()
  const { data: providersData, isLoading: providersLoading } = useProviders({ active: true })
  const providers = providersData?.providers || []

  // States
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [medicationOrder, setMedicationOrder] = useState<MedicationOrder | null>(null)
  const [dosingHolds, setDosingHolds] = useState<DosingHold[]>([])
  const [biometricEnrollment, setBiometricEnrollment] = useState<BiometricEnrollment | null>(null)
  const [recentDoses, setRecentDoses] = useState<DosingLog[]>([])
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [dispensing, setDispensing] = useState(false)

  // Verification states
  const [verificationMethod, setVerificationMethod] = useState<"pin" | "fingerprint" | "facial">("pin")
  const [pinInput, setPinInput] = useState("")
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "failed">("idle")

  // Dosing form states
  const [selectedMedication, setSelectedMedication] = useState<"methadone" | "suboxone" | "vivitrol" | "sublocade">(
    "methadone",
  )
  const [doseAmount, setDoseAmount] = useState("")
  const [dosingNotes, setDosingNotes] = useState("")
  const [behaviorNotes, setBehaviorNotes] = useState("")
  const [patientVitals, setPatientVitals] = useState<VitalSigns>({})

  // Dialog states
  const [showHoldDialog, setShowHoldDialog] = useState(false)
  const [showOrderRequestDialog, setShowOrderRequestDialog] = useState(false)
  const [showResetPinDialog, setShowResetPinDialog] = useState(false)
  const [showResetBiometricDialog, setShowResetBiometricDialog] = useState(false)
  const [showPrintIdDialog, setShowPrintIdDialog] = useState(false)
  const [showStopDoseDialog, setShowStopDoseDialog] = useState(false)
  const [showPumpCalibrationDialog, setShowPumpCalibrationDialog] = useState(false) // Added pump calibration dialog state

  // Hold/Order form states
  const [holdType, setHoldType] = useState<"clinical" | "behavioral" | "uds" | "missing_counseling" | "administrative">(
    "clinical",
  )
  const [holdReason, setHoldReason] = useState("")
  const [orderRequestType, setOrderRequestType] = useState<"increase" | "decrease" | "hold" | "taper" | "split">(
    "increase",
  )
  const [orderRequestNotes, setOrderRequestNotes] = useState("")
  const [newPinValue, setNewPinValue] = useState("")
  const [confirmPinValue, setConfirmPinValue] = useState("")

  // Pump states (added)
  const [pumpStatus, setPumpStatus] = useState<{
    status: "idle" | "calibrating" | "dispensing" | "cleaning" | "ready_for_fill"
    bottleSerial: string
    currentVolume: string
    lastCalibrationDate: string | null
  }>({
    status: "idle",
    bottleSerial: "",
    currentVolume: "",
    lastCalibrationDate: null,
  })
  const [bottleSerial, setBottleSerial] = useState("")
  const [bottleStartVolume, setBottleStartVolume] = useState("")
  const [bottleCurrentVolume, setBottleCurrentVolume] = useState("")
  const [lastCalibrationDate, setLastCalibrationDate] = useState<string | null>(null)

  const [showTakeHomeDialog, setShowTakeHomeDialog] = useState(false)
  const [takeHomeDoses, setTakeHomeDoses] = useState(3)
  const [takeHomeStartDate, setTakeHomeStartDate] = useState(new Date().toISOString().split("T")[0])
  const [takeHomeBottles, setTakeHomeBottles] = useState<TakeHomeBottle[]>([])
  const [generatingTakeHome, setGeneratingTakeHome] = useState(false)

  // Order management state (added)
  const [orderPhysician, setOrderPhysician] = useState("")
  const [nurseSignature, setNurseSignature] = useState("")
  const [orderRequestDetails, setOrderRequestDetails] = useState({
    currentDose: "",
    requestedDose: "",
    justification: "",
  })
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [orderValidationErrors, setOrderValidationErrors] = useState<Record<string, string>>({})

  const [showBottleFillingDialog, setShowBottleFillingDialog] = useState(false)
  const [bottleFillProgress, setBottleFillProgress] = useState<number[]>([])
  const [combinedDosing, setCombinedDosing] = useState(false)
  const [observedDoseAmount, setObservedDoseAmount] = useState(0)

  // Search patients
  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.patients || [])
      }
    } catch (error) {
      console.error("Error searching patients:", error)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchPatients])

  // Load patient data when selected
  const loadPatientData = async (patient: Patient) => {
    setSelectedPatient(patient)
    setLoading(true)
    setVerificationStatus("idle")
    setPinInput("")
    setSearchQuery("")
    setSearchResults([])

    try {
      // Fetch medication order
      const { data: orderData } = await supabase
        .from("medication_order")
        .select("*")
        .eq("patient_id", patient.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)

      if (orderData && orderData.length > 0) {
        setMedicationOrder(orderData[0])
        setDoseAmount(orderData[0].daily_dose_mg?.toString() || "")
        setOrderRequestDetails((prev) => ({ ...prev, currentDose: orderData[0].daily_dose_mg?.toString() || "0" }))
        // Set medication type based on order
        if (orderData[0].medication?.toLowerCase().includes("methadone")) {
          setSelectedMedication("methadone")
        } else if (
          orderData[0].medication?.toLowerCase().includes("suboxone") ||
          orderData[0].medication?.toLowerCase().includes("buprenorphine")
        ) {
          setSelectedMedication("suboxone")
        } else if (orderData[0].medication?.toLowerCase().includes("vivitrol")) {
          setSelectedMedication("vivitrol")
        } else if (orderData[0].medication?.toLowerCase().includes("sublocade")) {
          setSelectedMedication("sublocade")
        }
      } else {
        setMedicationOrder(null) // Clear if no active order
        setDoseAmount("")
        setOrderRequestDetails((prev) => ({ ...prev, currentDose: "0" }))
      }

      // Fetch dosing holds
      const { data: holdsData } = await supabase
        .from("dosing_holds")
        .select("*")
        .eq("patient_id", patient.id)
        .eq("status", "active")

      setDosingHolds(holdsData || [])

      // Fetch biometric enrollment
      const { data: biometricData } = await supabase
        .from("patient_biometric_enrollment")
        .select("*")
        .eq("patient_id", patient.id)
        .eq("is_active", true)
        .limit(1)

      if (biometricData && biometricData.length > 0) {
        setBiometricEnrollment(biometricData[0])
      } else {
        setBiometricEnrollment(null)
      }

      // Fetch recent doses
      const { data: dosesData } = await supabase
        .from("dosing_log")
        .select("*")
        .eq("patient_id", patient.id)
        .order("dose_date", { ascending: false })
        .order("dose_time", { ascending: false })
        .limit(7)

      setRecentDoses(dosesData || [])
    } catch (error) {
      console.error("Error loading patient data:", error)
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Verify patient identity
  const verifyPatient = async () => {
    if (!selectedPatient) return

    setVerifying(true)
    setVerificationStatus("verifying")

    try {
      // Simulate verification delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (verificationMethod === "pin") {
        // In production, this would verify against stored PIN hash
        // Replace with actual PIN verification logic
        if (pinInput === "1234") {
          // Example placeholder PIN
          setVerificationStatus("success")
          toast({
            title: "Verification Successful",
            description: `${selectedPatient.first_name} ${selectedPatient.last_name} identity verified via PIN`,
          })
        } else {
          setVerificationStatus("failed")
          toast({
            title: "Verification Failed",
            description: "Invalid PIN entered",
            variant: "destructive",
          })
        }
      } else if (verificationMethod === "fingerprint") {
        // Simulate fingerprint verification
        setVerificationStatus("success")
        toast({
          title: "Fingerprint Verified",
          description: `${selectedPatient.first_name} ${selectedPatient.last_name} identity confirmed`,
        })
      } else if (verificationMethod === "facial") {
        // Simulate facial recognition
        setVerificationStatus("success")
        toast({
          title: "Facial Recognition Verified",
          description: `${selectedPatient.first_name} ${selectedPatient.last_name} identity confirmed`,
        })
      }
    } catch (error) {
      setVerificationStatus("failed")
      toast({
        title: "Verification Error",
        description: "An error occurred during verification",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  // Calibrate pump function (added)
  const calibratePump = async () => {
    if (!bottleSerial || !bottleStartVolume) {
      toast({
        title: "Missing Information",
        description: "Please enter bottle serial and start volume",
        variant: "destructive",
      })
      return
    }

    setPumpStatus((prev) => ({ ...prev, status: "calibrating" }))

    try {
      // Simulate calibration
      await new Promise((resolve) => setTimeout(resolve, 3000))

      setBottleCurrentVolume(bottleStartVolume)
      setLastCalibrationDate(new Date().toISOString())
      setPumpStatus({
        status: "idle",
        bottleSerial: "", // Clear serial after calibration
        currentVolume: bottleStartVolume,
        lastCalibrationDate: new Date().toISOString(),
      })
      setBottleSerial("") // Clear serial input field
      setBottleStartVolume("") // Clear start volume input field

      toast({
        title: "Pump Calibrated",
        description: `Methadone pump calibrated with bottle ${bottleSerial}`,
      })

      setShowPumpCalibrationDialog(false)
    } catch (error) {
      setPumpStatus((prev) => ({ ...prev, status: "idle" }))
      toast({
        title: "Calibration Error",
        description: "Failed to calibrate pump",
        variant: "destructive",
      })
    }
  }

  // Dispense Methadone (extracted for combined dosing)
  const dispenseMethadone = async () => {
    if (!selectedPatient || verificationStatus !== "success") {
      toast({
        title: "Cannot Dispense",
        description: "Patient must be verified before dispensing",
        variant: "destructive",
      })
      return false // Indicate failure
    }

    if (dosingHolds.length > 0) {
      toast({
        title: "Dosing Hold Active",
        description: "Patient has active holds that must be cleared before dosing",
        variant: "destructive",
      })
      return false // Indicate failure
    }

    setPumpStatus((prev) => ({ ...prev, status: "dispensing" })) // Set pump status to dispensing
    setDispensing(true)

    try {
      const doseAmountNum = Number.parseFloat(doseAmount)
      const currentVol = Number.parseFloat(bottleCurrentVolume)

      if (currentVol < doseAmountNum) {
        toast({
          title: "Insufficient Volume",
          description: "Not enough medication in bottle. Please change bottle.",
          variant: "destructive",
        })
        setPumpStatus((prev) => ({ ...prev, status: "idle" })) // Reset pump status
        setDispensing(false)
        return false // Indicate failure
      }

      const doseLog = {
        patient_id: selectedPatient.id,
        dose_date: new Date().toISOString().split("T")[0],
        dose_time: new Date().toTimeString().split(" ")[0],
        medication: selectedMedication,
        dose_amount: doseAmountNum,
        dispensed_by: null, // TODO: Get from auth context when staff authentication is implemented
        notes: dosingNotes || null,
        patient_response: behaviorNotes || null,
        bottle_number: bottleSerial, // Added bottle tracking
      }

      const { error } = await supabase.from("dosing_log").insert(doseLog)

      if (error) throw error

      // Update bottle volume
      const newVolume = currentVol - doseAmountNum
      setBottleCurrentVolume(newVolume.toString())
      setPumpStatus((prev) => ({ ...prev, currentVolume: newVolume.toString() }))

      toast({
        title: "Dose Dispensed Successfully",
        description: `${doseAmount}mg ${selectedMedication} dispensed to ${selectedPatient.first_name} ${selectedPatient.last_name}`,
      })

      // Reset form elements related to this dose
      setDosingNotes("")
      setBehaviorNotes("")
      setVerificationStatus("idle")
      setPinInput("")
      setPumpStatus((prev) => ({ ...prev, status: "idle" })) // Reset pump status

      // Reload recent doses
      const { data: dosesData } = await supabase
        .from("dosing_log")
        .select("*")
        .eq("patient_id", selectedPatient.id)
        .order("dose_date", { ascending: false })
        .order("dose_time", { ascending: false })
        .limit(7)

      setRecentDoses(dosesData || [])
      return true // Indicate success
    } catch (error: any) {
      console.error("Error dispensing medication:", error)
      toast({
        title: "Dispensing Error",
        description: error?.message || "Failed to record dose. Please try again.",
        variant: "destructive",
      })
      setPumpStatus((prev) => ({ ...prev, status: "idle" })) // Reset pump status
      setDispensing(false)
      return false // Indicate failure
    } finally {
      setDispensing(false)
    }
  }

  const dispenseTakeHome = async () => {
    if (!selectedPatient || verificationStatus !== "success") {
      toast({
        title: "Cannot Dispense",
        description: "Patient must be verified before dispensing take-home",
        variant: "destructive",
      })
      return
    }

    if (!medicationOrder) {
      toast({
        title: "No Active Order",
        description: "Patient must have an active medication order",
        variant: "destructive",
      })
      return
    }

    if (takeHomeDoses > medicationOrder.max_takehome) {
      toast({
        title: "Exceeds Maximum",
        description: `Patient is only authorized for ${medicationOrder.max_takehome} take-home doses`,
        variant: "destructive",
      })
      return
    }

    setGeneratingTakeHome(true)

    try {
      const bottles: TakeHomeBottle[] = []
      const startDate = new Date(takeHomeStartDate)

      for (let i = 0; i < takeHomeDoses; i++) {
        const consumeDate = new Date(startDate)
        consumeDate.setDate(consumeDate.getDate() + i)

        const qrCodeData = `MASE-TH-${selectedPatient.id}-${Date.now()}-${i + 1}`

        const bottleData = {
          patient_id: selectedPatient.id,
          bottle_number: i + 1,
          total_bottles: takeHomeDoses,
          medication_name: medicationOrder.medication,
          dose_amount: medicationOrder.daily_dose_mg,
          dose_unit: "mg",
          scheduled_consume_date: consumeDate.toISOString().split("T")[0],
          dispense_date: new Date().toISOString().split("T")[0],
          dispensed_by: "current_nurse_id",
          dispense_location_lat: 0,
          dispense_location_lng: 0,
          qr_code_data: qrCodeData,
          qr_code_image_url: "",
          status: "label_printed", // Changed from "dispensed" to "label_printed" - bottles not filled yet
          expiration_date: new Date(consumeDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        }

        const { data, error } = await supabase.from("takehome_bottle_qr_codes").insert(bottleData).select().single()

        if (error) throw error

        bottles.push(data)
      }

      setTakeHomeBottles(bottles)
      setBottleFillProgress([]) // Reset fill progress
      setTakeHomeStartDate(new Date().toISOString().split("T")[0]) // Reset start date

      toast({
        title: "QR Codes Generated",
        description: `${takeHomeDoses} bottle labels generated. Now fill the bottles.`,
      })

      setShowBottleFillingDialog(true)
      setShowTakeHomeDialog(false)
    } catch (error) {
      console.error("Error generating take-home bottles:", error)
      toast({
        title: "Error",
        description: "Failed to generate take-home bottles",
        variant: "destructive",
      })
    } finally {
      setGeneratingTakeHome(false)
    }
  }

  const markBottleFilled = async (bottleIndex: number) => {
    const bottle = takeHomeBottles[bottleIndex]

    try {
      const { error } = await supabase
        .from("takehome_bottle_qr_codes")
        .update({ status: "dispensed", filled_at: new Date().toISOString() })
        .eq("id", bottle.id)

      if (error) throw error

      setBottleFillProgress((prev) => [...prev, bottleIndex])

      toast({
        title: "Bottle Filled",
        description: `Bottle ${bottle.bottle_number} of ${takeHomeBottles.length} recorded`,
      })

      if (bottleFillProgress.length + 1 === takeHomeBottles.length) {
        setTimeout(() => {
          setShowBottleFillingDialog(false)
          toast({
            title: "All Bottles Dispensed",
            description: `Successfully dispensed ${takeHomeBottles.length} take-home bottles`,
          })
        }, 1000)
      }
    } catch (error) {
      console.error("Error marking bottle filled:", error)
      toast({
        title: "Error",
        description: "Failed to record bottle as filled",
        variant: "destructive",
      })
    }
  }

  const dispenseCombined = async () => {
    if (!selectedPatient || verificationStatus !== "success") {
      toast({
        title: "Cannot Dispense",
        description: "Patient must be verified before dispensing",
        variant: "destructive",
      })
      return
    }

    // Ensure pump is ready and bottle has volume for observed dose
    if (
      pumpStatus.status !== "idle" ||
      !bottleCurrentVolume ||
      Number.parseFloat(bottleCurrentVolume) < Number.parseFloat(doseAmount)
    ) {
      toast({
        title: "Pump/Bottle Issue",
        description: "Please ensure pump is idle and bottle has sufficient volume for the observed dose.",
        variant: "destructive",
      })
      return
    }

    try {
      // First dispense observed dose
      const observedDispensed = await dispenseMethadone()
      if (!observedDispensed) return // Stop if observed dose failed

      // Then generate take-home bottles
      await dispenseTakeHome()

      toast({
        title: "Combined Dosing Complete",
        description: `Observed dose dispensed + ${takeHomeDoses} take-home bottles generated.`,
      })
      setCombinedDosing(false) // Reset combined dosing flag
      setTakeHomeDoses(3) // Reset take home dose count
      setVerificationStatus("idle") // Reset verification status
      setPinInput("") // Clear pin input
    } catch (error) {
      console.error("Error in combined dosing:", error)
      toast({
        title: "Error",
        description: "Failed to complete combined dosing",
        variant: "destructive",
      })
    }
  }

  const printTakeHomeLabels = () => {
    if (takeHomeBottles.length === 0) return

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const labelsHtml = takeHomeBottles
        .map(
          (bottle) => `
        <div class="label">
          <div class="label-header">
            <div class="clinic-name">MASE OTP CLINIC</div>
            <div class="take-home-badge">TAKE-HOME MEDICATION</div>
          </div>
          <div class="patient-info">
            <div class="patient-name">${selectedPatient?.first_name} ${selectedPatient?.last_name}</div>
            <div class="client-number">Client #: ${selectedPatient?.client_number || "N/A"}</div>
          </div>
          <div class="medication-info">
            <div class="med-name">${bottle.medication_name}</div>
            <div class="dose">${bottle.dose_amount}${bottle.dose_unit}</div>
          </div>
          <div class="bottle-info">
            <div>Bottle ${bottle.bottle_number} of ${bottle.total_bottles}</div>
            <div>Scheduled: ${new Date(bottle.scheduled_consume_date).toLocaleDateString()}</div>
          </div>
          <div class="qr-code">
            <div class="qr-placeholder">
              <svg viewBox="0 0 100 100" width="120" height="120">
                <rect width="100" height="100" fill="white"/>
                <text x="50" y="50" textAnchor="middle" dy=".3em" fontSize="8" fill="black">QR CODE</text>
                <text x="50" y="60" textAnchor="middle" dy=".3em" fontSize="4" fill="gray">${bottle.qr_code_data.slice(0, 20)}...</text>
              </svg>
            </div>
          </div>
          <div class="instructions">
            <div class="instruction-title">INSTRUCTIONS:</div>
            <div class="instruction-text">
              1. Scan QR code at scheduled time<br/>
              2. Take photo of seal before opening<br/>
              3. Consume immediately at home<br/>
              4. GPS location will be verified
            </div>
          </div>
          <div class="footer">
            Dispensed: ${new Date().toLocaleDateString()} | Expires: ${new Date(bottle.expiration_date).toLocaleDateString()}
          </div>
        </div>
      `,
        )
        .join("")

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Take-Home Medication Labels</title>
          <style>
            @media print {
              @page { margin: 0.5in; }
              .label { page-break-after: always; }
              .label:last-child { page-break-after: auto; }
            }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .label {
              border: 3px solid #000;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto 30px;
              background: white;
            }
            .label-header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .clinic-name { font-size: 24px; font-weight: bold; color: #0891b2; }
            .take-home-badge {
              background: #f59e0b;
              color: white;
              padding: 5px 10px;
              border-radius: 4px;
              display: inline-block;
              font-size: 12px;
              font-weight: bold;
              margin-top: 5px;
            }
            .patient-info {
              background: #f3f4f6;
              padding: 10px;
              border-radius: 6px;
              margin: 10px 0;
            }
            .patient-name { font-size: 20px; font-weight: bold; }
            .client-number { color: #6b7280; font-size: 14px; }
            .medication-info {
              text-align: center;
              padding: 15px;
              background: #dbeafe;
              border-radius: 6px;
              margin: 15px 0;
            }
            .med-name { font-size: 18px; font-weight: bold; color: #1e40af; }
            .dose { font-size: 32px; font-weight: bold; color: #0891b2; margin-top: 5px; }
            .bottle-info {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              font-weight: 600;
              margin: 10px 0;
              padding: 8px;
              background: #fef3c7;
              border-radius: 4px;
            }
            .qr-code { text-align: center; margin: 20px 0; }
            .qr-placeholder {
              display: inline-block;
              border: 2px dashed #9ca3af;
              padding: 10px;
            }
            .instructions {
              background: #fef2f2;
              border-left: 4px solid #dc2626;
              padding: 12px;
              margin: 15px 0;
            }
            .instruction-title {
              font-weight: bold;
              font-size: 12px;
              color: #dc2626;
              margin-bottom: 5px;
            }
            .instruction-text { font-size: 11px; line-height: 1.6; }
            .footer {
              text-align: center;
              font-size: 10px;
              color: #6b7280;
              border-top: 1px solid #d1d5db;
              padding-top: 10px;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `)
      printWindow.document.close()
    }

    toast({
      title: "Printing Labels",
      description: `Printing ${takeHomeBottles.length} bottle labels`,
    })
  }

  // Place hold on patient
  const placeHold = async () => {
    if (!selectedPatient || !holdReason) {
      toast({
        title: "Missing Information",
        description: "Please provide a reason for the hold",
        variant: "destructive",
      })
      return
    }

    try {
      const holdData = {
        patient_id: selectedPatient.id,
        hold_type: holdType,
        reason: holdReason,
        severity: holdType === "uds" || holdType === "clinical" ? "high" : "medium",
        status: "active",
        created_by: "current_nurse_id",
        created_by_role: "nurse",
        requires_clearance_from: holdType === "clinical" ? ["physician"] : ["counselor", "nurse"],
        cleared_by: [],
      }

      const { error } = await supabase.from("dosing_holds").insert(holdData)

      if (error) throw error

      toast({
        title: "Hold Placed",
        description: `${holdType} hold placed on ${selectedPatient.first_name} ${selectedPatient.last_name}`,
      })

      setShowHoldDialog(false)
      setHoldReason("")
      setHoldType("clinical") // Reset hold type

      // Reload holds
      const { data: holdsData } = await supabase
        .from("dosing_holds")
        .select("*")
        .eq("patient_id", selectedPatient.id)
        .eq("status", "active")

      setDosingHolds(holdsData || [])
    } catch (error) {
      console.error("Error placing hold:", error)
      toast({
        title: "Error",
        description: "Failed to place hold",
        variant: "destructive",
      })
    }
  }

  // Validate order request
  const validateOrderRequest = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {}

    if (!selectedPatient) {
      errors.patient = "Patient must be selected"
    }

    if (!orderPhysician) {
      errors.physician = "Physician must be selected"
    }

    if (!orderRequestNotes || orderRequestNotes.trim().length === 0) {
      errors.justification = "Clinical justification is required"
    }

    if (!nurseSignature || nurseSignature.trim().length === 0) {
      errors.signature = "Nurse signature (PIN) is required"
    } else if (nurseSignature.length !== 4 || !/^\d+$/.test(nurseSignature)) {
      errors.signature = "Nurse signature must be a 4-digit PIN"
    }

    const currentDose = medicationOrder?.daily_dose_mg || 0
    const requestedDose = parseFloat(orderRequestDetails.requestedDose)

    if (orderRequestType === "increase" || orderRequestType === "decrease" || orderRequestType === "taper" || orderRequestType === "split") {
      if (!orderRequestDetails.requestedDose || isNaN(requestedDose) || requestedDose <= 0) {
        errors.requestedDose = "Valid requested dose (mg) is required"
      } else {
        if (orderRequestType === "increase" && requestedDose <= currentDose) {
          errors.requestedDose = `Requested dose must be greater than current dose (${currentDose}mg)`
        }
        if (orderRequestType === "decrease" && requestedDose >= currentDose) {
          errors.requestedDose = `Requested dose must be less than current dose (${currentDose}mg)`
        }
        if (orderRequestType === "taper" && requestedDose >= currentDose) {
          errors.requestedDose = `Target dose must be less than current dose (${currentDose}mg) for taper`
        }
        if (orderRequestType === "split" && requestedDose !== currentDose) {
          errors.requestedDose = `Total split dose must equal current dose (${currentDose}mg)`
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  // Submit order request to physician
  const submitOrderRequest = async () => {
    // Clear previous errors
    setOrderValidationErrors({})

    // Validate
    const validation = validateOrderRequest()
    if (!validation.isValid) {
      setOrderValidationErrors(validation.errors)
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setSubmittingOrder(true)

    try {
      const response = await fetch("/api/medication-order-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: selectedPatient!.id,
          order_type: orderRequestType,
          current_dose_mg: medicationOrder?.daily_dose_mg || 0,
          requested_dose_mg: parseFloat(orderRequestDetails.requestedDose),
          clinical_justification: orderRequestNotes.trim(),
          physician_id: orderPhysician,
          nurse_signature: nurseSignature,
          nurse_id: user?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit order request")
      }

      toast({
        title: "Order Request Submitted",
        description: `${orderRequestType.charAt(0).toUpperCase() + orderRequestType.slice(1)} order sent to physician for review`,
      })

      // Reset form
      setShowOrderRequestDialog(false)
      setOrderRequestNotes("")
      setOrderPhysician("")
      setNurseSignature("")
      setOrderRequestDetails({ currentDose: "", requestedDose: "", justification: "" })
      setOrderRequestType("increase")
      setOrderValidationErrors({})
    } catch (error: any) {
      console.error("Error submitting order request:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit order request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingOrder(false)
    }
  }

  // Pre-populate order request dialog when opened
  useEffect(() => {
    if (showOrderRequestDialog && medicationOrder) {
      setOrderRequestDetails({
        currentDose: medicationOrder.daily_dose_mg.toString(),
        requestedDose: "",
        justification: "",
      })
      setOrderValidationErrors({})
    }
  }, [showOrderRequestDialog, medicationOrder])

  // Reset patient PIN
  const resetPatientPin = async () => {
    if (!selectedPatient || newPinValue !== confirmPinValue || newPinValue.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PINs must match and be 4 digits",
        variant: "destructive",
      })
      return
    }

    try {
      // In production, this would hash and store the new PIN
      // For simulation, just show toast and reset state
      toast({
        title: "PIN Reset Successfully",
        description: `PIN has been reset for ${selectedPatient.first_name} ${selectedPatient.last_name}`,
      })

      setShowResetPinDialog(false)
      setNewPinValue("")
      setConfirmPinValue("")
    } catch (error) {
      console.error("Error resetting PIN:", error)
      toast({
        title: "Error",
        description: "Failed to reset PIN",
        variant: "destructive",
      })
    }
  }

  // Reset biometrics
  const resetBiometrics = async () => {
    if (!selectedPatient) return

    try {
      // In production, this would clear biometric templates and require re-enrollment
      const { error } = await supabase
        .from("patient_biometric_enrollment")
        .update({
          // Assuming these fields exist for template storage
          facial_template_encrypted: null,
          facial_enrolled_at: null,
          fingerprint_template_encrypted: null,
          fingerprint_enrolled_at: null,
          is_active: false,
        })
        .eq("patient_id", selectedPatient.id)

      if (error) throw error

      toast({
        title: "Biometrics Reset",
        description: `Biometric data cleared for ${selectedPatient.first_name} ${selectedPatient.last_name}. Re-enrollment required.`,
      })

      setShowResetBiometricDialog(false)
      setBiometricEnrollment(null)
    } catch (error) {
      console.error("Error resetting biometrics:", error)
      toast({
        title: "Error",
        description: "Failed to reset biometrics",
        variant: "destructive",
      })
    }
  }

  // Print patient ID card
  const printIdCard = () => {
    if (!selectedPatient) return

    // Generate printable ID card
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Patient ID Card - ${selectedPatient.first_name} ${selectedPatient.last_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .card { border: 2px solid #000; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
            .logo { font-size: 24px; font-weight: bold; color: #0891b2; }
            .patient-name { font-size: 20px; font-weight: bold; margin: 10px 0; }
            .info { margin: 5px 0; }
            .barcode { text-align: center; margin-top: 15px; font-family: monospace; font-size: 14px; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">MASE OTP CLINIC</div>
              <div>Patient Identification Card</div>
            </div>
            <div class="patient-name">${selectedPatient.first_name} ${selectedPatient.last_name}</div>
            <div class="info"><strong>Client #:</strong> ${selectedPatient.client_number || "N/A"}</div>
            <div class="info"><strong>DOB:</strong> ${selectedPatient.date_of_birth || "N/A"}</div>
            <div class="info"><strong>ID:</strong> ${selectedPatient.id.slice(0, 8).toUpperCase()}</div>
            <div class="barcode">*${selectedPatient.id.slice(0, 12).toUpperCase()}*</div>
            <div class="footer">
              This card is for identification purposes only.<br/>
              If found, please return to MASE OTP Clinic.
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `)
      printWindow.document.close()
    }

    setShowPrintIdDialog(false)
  }

  // Clear hold
  const clearHold = async (holdId: string) => {
    try {
      const { error } = await supabase
        .from("dosing_holds")
        .update({
          status: "cleared",
          cleared_at: new Date().toISOString(),
        })
        .eq("id", holdId)

      if (error) throw error

      toast({
        title: "Hold Cleared",
        description: "The dosing hold has been cleared",
      })

      // Reload holds
      if (selectedPatient) {
        const { data: holdsData } = await supabase
          .from("dosing_holds")
          .select("*")
          .eq("patient_id", selectedPatient.id)
          .eq("status", "active")

        setDosingHolds(holdsData || [])
      }
    } catch (error) {
      console.error("Error clearing hold:", error)
      toast({
        title: "Error",
        description: "Failed to clear hold",
        variant: "destructive",
      })
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Simulate pump start and stop for bottle filling
  const startPump = () => {
    if (pumpStatus.status === "dispensing" || !selectedPatient) return
    setPumpStatus((prev) => ({
      ...prev,
      status: "dispensing",
      bottleSerial: bottleSerial || prev.bottleSerial, // Use current input or previous if available
      currentVolume: bottleCurrentVolume || prev.currentVolume, // Update current volume display
    }))
    toast({ title: "Pump started", description: "Pump is now active." })
  }

  const stopPump = () => {
    if (pumpStatus.status !== "dispensing") return
    setPumpStatus((prev) => ({ ...prev, status: "ready_for_fill" }))
    toast({ title: "Pump stopped", description: "Pump is ready for next step." })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <DashboardHeader title="Dosing Window" />

      <main className="pl-64 pt-16">
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">OTP Dosing Window</h1>
            <p className="text-gray-600">Dispense medications with PIN or biometric verification</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Patient Search & Selection */}
            <div className="lg:col-span-1 space-y-6">
              {/* Search Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-cyan-600" />
                    Patient Lookup
                  </CardTitle>
                  <CardDescription>Search by name, client number, or scan ID</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search patient..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-3 border rounded-lg divide-y max-h-64 overflow-y-auto">
                      {searchResults.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => loadPatientData(patient)}
                          className="w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-cyan-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {patient.client_number || `ID: ${patient.id.slice(0, 8)}`}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Patient Info */}
              {selectedPatient && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Patient Information</CardTitle>
                      <Badge variant="outline" className="text-cyan-600 border-cyan-600">
                        {selectedPatient.client_number || `#${selectedPatient.id.slice(0, 6)}`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                        {selectedPatient.first_name[0]}
                        {selectedPatient.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {selectedPatient.first_name} {selectedPatient.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          DOB: {selectedPatient.date_of_birth ? formatDate(selectedPatient.date_of_birth) : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Active Holds Warning */}
                    {dosingHolds.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Active Holds ({dosingHolds.length})</AlertTitle>
                        <AlertDescription>
                          {dosingHolds.map((hold) => (
                            <div key={hold.id} className="flex items-center justify-between mt-2">
                              <span className="text-sm">
                                {hold.hold_type}: {hold.reason}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => clearHold(hold.id)}
                                className="h-7 text-xs"
                              >
                                Clear
                              </Button>
                            </div>
                          ))}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Current Order Info */}
                    {medicationOrder && (
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Current Order</span>
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Pill className="h-5 w-5 text-cyan-600" />
                          <span className="font-semibold">{medicationOrder.medication || "Methadone"}</span>
                        </div>
                        <div className="text-2xl font-bold text-cyan-700">{medicationOrder.daily_dose_mg}mg</div>
                        <div className="text-xs text-gray-500">Max Take-Home: {medicationOrder.max_takehome} doses</div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPrintIdDialog(true)}
                        className="text-xs"
                      >
                        <IdCard className="h-4 w-4 mr-1" />
                        Print ID
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowResetPinDialog(true)}
                        className="text-xs"
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        Reset PIN
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowResetBiometricDialog(true)}
                        className="text-xs"
                      >
                        <Fingerprint className="h-4 w-4 mr-1" />
                        Reset Biometrics
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHoldDialog(true)}
                        className="text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <PauseCircle className="h-4 w-4 mr-1" />
                        Place Hold
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Dosing History */}
              {selectedPatient && recentDoses.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="h-5 w-5 text-cyan-600" />
                      Recent Doses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentDoses.slice(0, 5).map((dose) => (
                        <div key={dose.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{formatDate(dose.dose_date)}</p>
                            <p className="text-xs text-gray-500">{dose.dose_time?.slice(0, 5)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{dose.dose_amount}mg</p>
                            <p className="text-xs text-gray-500">{dose.medication}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Dosing Interface */}
            <div className="lg:col-span-2 space-y-6">
              {!selectedPatient ? (
                <Card className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Patient Selected</h3>
                    <p className="text-gray-500">Search and select a patient to begin dosing</p>
                  </div>
                </Card>
              ) : loading ? (
                <Card className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 text-cyan-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading patient data...</p>
                  </div>
                </Card>
              ) : (
                <Tabs defaultValue="dispense" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dispense">Dispense Medication</TabsTrigger>
                    {/* Added Take-Home Tab Trigger */}
                    <TabsTrigger value="takehome">Take-Home</TabsTrigger>
                    <TabsTrigger value="orders">Order Requests</TabsTrigger>
                    <TabsTrigger value="notes">Notes & Behavior</TabsTrigger>
                  </TabsList>

                  {/* Dispense Tab */}
                  <TabsContent value="dispense" className="space-y-4">
                    {/* Verification Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-cyan-600" />
                          Patient Verification
                        </CardTitle>
                        <CardDescription>Verify patient identity before dispensing</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Verification Method Selection */}
                        <div className="grid grid-cols-3 gap-3">
                          <Button
                            variant={verificationMethod === "pin" ? "default" : "outline"}
                            onClick={() => setVerificationMethod("pin")}
                            className={verificationMethod === "pin" ? "bg-cyan-600" : ""}
                          >
                            <KeyRound className="h-4 w-4 mr-2" />
                            PIN
                          </Button>
                          <Button
                            variant={verificationMethod === "fingerprint" ? "default" : "outline"}
                            onClick={() => setVerificationMethod("fingerprint")}
                            className={verificationMethod === "fingerprint" ? "bg-cyan-600" : ""}
                            disabled={!biometricEnrollment?.fingerprint_enrolled_at}
                          >
                            <Fingerprint className="h-4 w-4 mr-2" />
                            Fingerprint
                          </Button>
                          <Button
                            variant={verificationMethod === "facial" ? "default" : "outline"}
                            onClick={() => setVerificationMethod("facial")}
                            className={verificationMethod === "facial" ? "bg-cyan-600" : ""}
                            disabled={!biometricEnrollment?.facial_enrolled_at}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Facial
                          </Button>
                        </div>

                        {/* PIN Entry */}
                        {verificationMethod === "pin" && (
                          <div className="space-y-3">
                            <Label>Enter 4-Digit PIN</Label>
                            <div className="flex gap-3">
                              <Input
                                type="password"
                                maxLength={4}
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                                placeholder="****"
                                className="text-center text-2xl tracking-widest w-40"
                              />
                              <Button
                                onClick={verifyPatient}
                                disabled={pinInput.length !== 4 || verifying}
                                className="bg-cyan-600 hover:bg-cyan-700"
                              >
                                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Fingerprint Scan */}
                        {verificationMethod === "fingerprint" && (
                          <div className="text-center py-6">
                            <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                              <Fingerprint className="h-12 w-12 text-gray-400" />
                            </div>
                            <p className="text-gray-600 mb-4">Place finger on scanner</p>
                            <Button
                              onClick={verifyPatient}
                              disabled={verifying}
                              className="bg-cyan-600 hover:bg-cyan-700"
                            >
                              {verifying ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Fingerprint className="h-4 w-4 mr-2" />
                              )}
                              Scan Fingerprint
                            </Button>
                          </div>
                        )}

                        {/* Facial Recognition */}
                        {verificationMethod === "facial" && (
                          <div className="text-center py-6">
                            <div className="w-32 h-32 mx-auto rounded-lg bg-gray-900 flex items-center justify-center mb-4">
                              <Camera className="h-12 w-12 text-gray-400" />
                            </div>
                            <p className="text-gray-600 mb-4">Position face in camera view</p>
                            <Button
                              onClick={verifyPatient}
                              disabled={verifying}
                              className="bg-cyan-600 hover:bg-cyan-700"
                            >
                              {verifying ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Camera className="h-4 w-4 mr-2" />
                              )}
                              Capture & Verify
                            </Button>
                          </div>
                        )}

                        {/* Verification Status */}
                        {verificationStatus !== "idle" && (
                          <div
                            className={`flex items-center gap-3 p-3 rounded-lg ${
                              verificationStatus === "success"
                                ? "bg-green-50 text-green-700"
                                : verificationStatus === "failed"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {verificationStatus === "success" ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : verificationStatus === "failed" ? (
                              <XCircle className="h-5 w-5" />
                            ) : (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            )}
                            <span className="font-medium">
                              {verificationStatus === "success"
                                ? "Identity Verified"
                                : verificationStatus === "failed"
                                  ? "Verification Failed"
                                  : "Verifying..."}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Medication Dispensing Section */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                          <Syringe className="h-5 w-5 text-cyan-600" />
                          Dispense Medication
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div>
                            <Label className="text-sm font-semibold text-blue-900">Combined Dosing</Label>
                            <p className="text-xs text-blue-700">Dispense observed dose + take-home bottles</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={combinedDosing}
                              onChange={(e) => setCombinedDosing(e.target.checked)}
                              className="h-4 w-4"
                            />
                            {combinedDosing && (
                              <Input
                                type="number"
                                min="1"
                                max={medicationOrder?.max_takehome || 27}
                                value={takeHomeDoses}
                                onChange={(e) => setTakeHomeDoses(Number.parseInt(e.target.value) || 1)}
                                className="w-20 h-8 text-center"
                                placeholder="# bottles"
                              />
                            )}
                          </div>
                        </div>

                        {/* Medication Type Selection */}
                        <div className="space-y-2">
                          <Label>Medication Type</Label>
                          <div className="grid grid-cols-4 gap-2">
                            <Button
                              variant={selectedMedication === "methadone" ? "default" : "outline"}
                              onClick={() => setSelectedMedication("methadone")}
                              className={selectedMedication === "methadone" ? "bg-cyan-600" : ""}
                              disabled={pumpStatus.status !== "idle"} // Disable if pump is busy
                            >
                              Methadone
                            </Button>
                            <Button
                              variant={selectedMedication === "suboxone" ? "default" : "outline"}
                              onClick={() => setSelectedMedication("suboxone")}
                              className={selectedMedication === "suboxone" ? "bg-orange-600" : ""}
                              disabled={pumpStatus.status !== "idle"} // Disable if pump is busy
                            >
                              Suboxone
                            </Button>
                            <Button
                              variant={selectedMedication === "vivitrol" ? "default" : "outline"}
                              onClick={() => setSelectedMedication("vivitrol")}
                              className={selectedMedication === "vivitrol" ? "bg-purple-600" : ""}
                              disabled={pumpStatus.status !== "idle"} // Disable if pump is busy
                            >
                              Vivitrol
                            </Button>
                            <Button
                              variant={selectedMedication === "sublocade" ? "default" : "outline"}
                              onClick={() => setSelectedMedication("sublocade")}
                              className={selectedMedication === "sublocade" ? "bg-blue-600" : ""}
                              disabled={pumpStatus.status !== "idle"} // Disable if pump is busy
                            >
                              Sublocade
                            </Button>
                          </div>
                        </div>

                        {/* Dose Amount */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Dose Amount (mg)</Label>
                            <Input
                              type="number"
                              value={doseAmount}
                              onChange={(e) => setDoseAmount(e.target.value)}
                              placeholder="Enter dose"
                              className="text-xl font-semibold"
                              disabled={pumpStatus.status !== "idle"} // Disable if pump is busy
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Current Time</Label>
                            <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-gray-50">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-lg font-medium">
                                {new Date().toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Dosing Notes */}
                        <div className="space-y-2">
                          <Label>Dosing Notes (Optional)</Label>
                          <Textarea
                            value={dosingNotes}
                            onChange={(e) => setDosingNotes(e.target.value)}
                            placeholder="Add any notes about this dose..."
                            rows={2}
                            disabled={pumpStatus.status !== "idle"} // Disable if pump is busy
                          />
                        </div>

                        {/* Pump Status Display (added) */}
                        {pumpStatus.status !== "idle" && (
                          <div className="text-center py-3 border rounded-md bg-gray-100">
                            <p className="font-medium">
                              {pumpStatus.status === "calibrating" && "Calibrating Pump..."}
                              {pumpStatus.status === "dispensing" && "Dispensing Dose..."}
                              {pumpStatus.status === "cleaning" && "Pump Cleaning..."}
                              {pumpStatus.status === "ready_for_fill" && "Pump Ready for Fill"}
                            </p>
                            {pumpStatus.status === "calibrating" || pumpStatus.status === "dispensing" ? (
                              <Loader2 className="h-6 w-6 animate-spin mx-auto mt-2 text-cyan-600" />
                            ) : null}
                          </div>
                        )}

                        {/* Bottle Information (added) */}
                        <div className="grid grid-cols-3 gap-3 items-center">
                          <div className="space-y-2">
                            <Label>Bottle Serial</Label>
                            <Input
                              value={bottleSerial}
                              onChange={(e) => {
                                setBottleSerial(e.target.value)
                                setPumpStatus((prev) => ({ ...prev, bottleSerial: e.target.value }))
                              }}
                              placeholder="Serial #"
                              disabled={pumpStatus.status !== "idle"}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Bottle Start Volume (mL)</Label>
                            <Input
                              type="number"
                              value={bottleStartVolume}
                              onChange={(e) => {
                                setBottleStartVolume(e.target.value)
                                setBottleCurrentVolume(e.target.value) // Initialize current volume
                                setPumpStatus((prev) => ({ ...prev, currentVolume: e.target.value }))
                              }}
                              placeholder="e.g., 1000"
                              disabled={pumpStatus.status !== "idle"}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Current Volume (mL)</Label>
                            <Input value={bottleCurrentVolume || "N/A"} readOnly className="bg-gray-50" />
                          </div>
                        </div>

                        {/* Calibration and Dispense Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            onClick={() => setShowPumpCalibrationDialog(true)}
                            disabled={pumpStatus.status !== "idle"}
                            variant="outline"
                            className="h-14 text-lg border-cyan-300 text-cyan-600 hover:bg-cyan-50"
                          >
                            <Loader2 className="h-5 w-5 mr-2" />
                            Calibrate Pump
                          </Button>
                          <Button
                            onClick={() => {
                              if (combinedDosing) {
                                dispenseCombined()
                              } else {
                                dispenseMethadone()
                              }
                            }}
                            disabled={
                              verificationStatus !== "success" ||
                              !doseAmount ||
                              dosingHolds.length > 0 ||
                              dispensing ||
                              !bottleSerial || // Require bottle serial for dispensing
                              !bottleCurrentVolume || // Require current volume
                              pumpStatus.status !== "idle" || // Disable if pump is busy with other actions
                              Number.parseFloat(bottleCurrentVolume) < Number.parseFloat(doseAmount) // Check for sufficient volume
                            }
                            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
                          >
                            {dispensing ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                Dispensing...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-5 w-5 mr-2" />
                                {combinedDosing
                                  ? "Dispense & Generate Take-Home"
                                  : `Dispense ${doseAmount}mg ${selectedMedication.charAt(0).toUpperCase() + selectedMedication.slice(1)}`}
                              </>
                            )}
                          </Button>
                        </div>

                        {verificationStatus !== "success" && (
                          <p className="text-center text-sm text-orange-600">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            Patient must be verified before dispensing
                          </p>
                        )}
                        {Number.parseFloat(bottleCurrentVolume) < Number.parseFloat(doseAmount) &&
                          verificationStatus === "success" && (
                            <p className="text-center text-sm text-red-600">
                              <AlertCircle className="h-4 w-4 inline mr-1" />
                              Insufficient volume in bottle for the selected dose.
                            </p>
                          )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Added Take-Home Tab Content */}
                  <TabsContent value="takehome" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Pill className="h-5 w-5 text-orange-600" />
                          Dispense Take-Home Medication
                        </CardTitle>
                        <CardDescription>Generate QR-coded bottles for GPS-tracked take-home dosing</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Quick Presets */}
                        <div className="space-y-2">
                          <Label>Quick Presets</Label>
                          <div className="grid grid-cols-3 gap-3">
                            <Button
                              variant="outline"
                              onClick={() => setTakeHomeDoses(3)}
                              className={takeHomeDoses === 3 ? "border-cyan-600 bg-cyan-50" : ""}
                            >
                              3 Days
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setTakeHomeDoses(6)}
                              className={takeHomeDoses === 6 ? "border-cyan-600 bg-cyan-50" : ""}
                            >
                              6 Days
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setTakeHomeDoses(13)}
                              className={takeHomeDoses === 13 ? "border-cyan-600 bg-cyan-50" : ""}
                            >
                              13 Days
                            </Button>
                          </div>
                        </div>

                        {/* Number of Doses */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Number of Take-Home Doses</Label>
                            <Input
                              type="number"
                              min="1"
                              max={medicationOrder?.max_takehome || 27}
                              value={takeHomeDoses}
                              onChange={(e) => setTakeHomeDoses(Number.parseInt(e.target.value) || 1)}
                              className="text-xl font-semibold"
                            />
                            <p className="text-xs text-gray-500">
                              Maximum authorized: {medicationOrder?.max_takehome || 0} doses
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                              type="date"
                              value={takeHomeStartDate}
                              onChange={(e) => setTakeHomeStartDate(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                        </div>

                        {/* Bottle Summary */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">Bottle Summary</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-blue-700">Total Bottles:</span>{" "}
                              <span className="font-bold">{takeHomeDoses}</span>
                            </div>
                            <div>
                              <span className="text-blue-700">Dose per Bottle:</span>{" "}
                              <span className="font-bold">{medicationOrder?.daily_dose_mg || 0}mg</span>
                            </div>
                            <div>
                              <span className="text-blue-700">End Date:</span>{" "}
                              <span className="font-bold">
                                {new Date(
                                  new Date(takeHomeStartDate).getTime() + (takeHomeDoses - 1) * 24 * 60 * 60 * 1000,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-700">QR Tracking:</span>{" "}
                              <span className="font-bold">Enabled</span>
                            </div>
                          </div>
                        </div>

                        {/* Generate Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            onClick={dispenseTakeHome}
                            disabled={
                              verificationStatus !== "success" ||
                              generatingTakeHome ||
                              !takeHomeDoses ||
                              takeHomeDoses > (medicationOrder?.max_takehome || 0)
                            }
                            className="h-14 bg-orange-600 hover:bg-orange-700"
                          >
                            {generatingTakeHome ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-5 w-5 mr-2" />
                                Generate {takeHomeDoses} Bottles
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={printTakeHomeLabels}
                            disabled={takeHomeBottles.length === 0}
                            variant="outline"
                            className="h-14 border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent"
                          >
                            <Printer className="h-5 w-5 mr-2" />
                            Print Labels ({takeHomeBottles.length})
                          </Button>
                        </div>

                        {/* Recently Generated Bottles */}
                        {takeHomeBottles.length > 0 && (
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-3">Recently Generated Bottles</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {takeHomeBottles.map((bottle, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="text-sm">
                                    <span className="font-medium">Bottle {bottle.bottle_number}</span>
                                    <span className="text-gray-500 ml-2">
                                      {new Date(bottle.scheduled_consume_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    QR Generated
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Orders Tab */}
                  <TabsContent value="orders" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Dose Order Requests</CardTitle>
                        <CardDescription>Submit requests to the physician for dose changes</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            className="h-20 flex-col gap-2 bg-transparent"
                            onClick={() => {
                              setOrderRequestType("increase")
                              setShowOrderRequestDialog(true)
                            }}
                          >
                            <ChevronDown className="h-6 w-6 rotate-180 text-green-600" />
                            <span>Request Increase</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-20 flex-col gap-2 bg-transparent"
                            onClick={() => {
                              setOrderRequestType("decrease")
                              setShowOrderRequestDialog(true)
                            }}
                          >
                            <ChevronDown className="h-6 w-6 text-orange-600" />
                            <span>Request Decrease</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-20 flex-col gap-2 bg-transparent"
                            onClick={() => {
                              setOrderRequestType("taper")
                              setShowOrderRequestDialog(true)
                            }}
                          >
                            <Activity className="h-6 w-6 text-blue-600" />
                            <span>Start Taper</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-20 flex-col gap-2 bg-transparent"
                            onClick={() => {
                              setOrderRequestType("split")
                              setShowOrderRequestDialog(true)
                            }}
                          >
                            <Scale className="h-6 w-6 text-purple-600" />
                            <span>Split Dose</span>
                          </Button>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3">Hold & Stop Actions</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <Button
                              variant="outline"
                              className="border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent"
                              onClick={() => setShowHoldDialog(true)}
                            >
                              <PauseCircle className="h-4 w-4 mr-2" />
                              Place Hold
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                              onClick={() => setShowStopDoseDialog(true)}
                            >
                              <StopCircle className="h-4 w-4 mr-2" />
                              Stop Dosing
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Notes Tab */}
                  <TabsContent value="notes" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Patient Behavior & Notes</CardTitle>
                        <CardDescription>
                          Document patient behavior and clinical observations at the dosing window
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Behavior at Window</Label>
                          <Select value={behaviorNotes} onValueChange={setBehaviorNotes}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select behavior observation" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cooperative">Cooperative & Appropriate</SelectItem>
                              <SelectItem value="anxious">Anxious/Nervous</SelectItem>
                              <SelectItem value="irritable">Irritable/Agitated</SelectItem>
                              <SelectItem value="drowsy">Drowsy/Sedated</SelectItem>
                              <SelectItem value="intoxicated">Appears Intoxicated</SelectItem>
                              <SelectItem value="withdrawal">Signs of Withdrawal</SelectItem>
                              <SelectItem value="confrontational">Confrontational</SelectItem>
                              <SelectItem value="other">Other - See Notes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Clinical Observations</Label>
                          <Textarea
                            placeholder="Document any clinical observations, concerns, or notable behavior..."
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Quick Observations</Label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "Steady gait",
                              "Slurred speech",
                              "Constricted pupils",
                              "Dilated pupils",
                              "Sweating",
                              "Tremors",
                              "Track marks noted",
                              "Weight loss",
                              "Good hygiene",
                              "Poor hygiene",
                            ].map((obs) => (
                              <Badge key={obs} variant="outline" className="cursor-pointer hover:bg-cyan-50">
                                {obs}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                          <FileText className="h-4 w-4 mr-2" />
                          Save Observations
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Hold Dialog */}
      <Dialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Dosing Hold</DialogTitle>
            <DialogDescription>This will prevent medication dispensing until the hold is cleared</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Hold Type</Label>
              <Select value={holdType} onValueChange={(v: any) => setHoldType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinical">Clinical Hold</SelectItem>
                  <SelectItem value="behavioral">Behavioral Hold</SelectItem>
                  <SelectItem value="uds">UDS Hold</SelectItem>
                  <SelectItem value="missing_counseling">Missing Counseling</SelectItem>
                  <SelectItem value="administrative">Administrative Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="Enter reason for hold..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHoldDialog(false)}>
              Cancel
            </Button>
            <Button onClick={placeHold} className="bg-orange-600 hover:bg-orange-700">
              Place Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Request Dialog */}
      <Dialog open={showOrderRequestDialog} onOpenChange={setShowOrderRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Medication Order Request - {orderRequestType.charAt(0).toUpperCase() + orderRequestType.slice(1)}
            </DialogTitle>
            <DialogDescription>Complete the order request for physician review and signature</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Order Type Help Text */}
            {orderRequestType === "increase" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Requested dose must be greater than current dose. Document patient response, withdrawal symptoms, or clinical rationale.
                </AlertDescription>
              </Alert>
            )}
            {orderRequestType === "decrease" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Requested dose must be less than current dose. Document stabilization, side effects, or taper rationale.
                </AlertDescription>
              </Alert>
            )}
            {orderRequestType === "taper" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Enter target dose (must be less than current). Document taper schedule and patient readiness in justification.
                </AlertDescription>
              </Alert>
            )}
            {orderRequestType === "split" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Enter total daily dose (must equal current dose). Document split ratio and dosing schedule in justification.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Current Dose</p>
                <p className="text-2xl font-bold text-cyan-700">{medicationOrder?.daily_dose_mg || 0}mg</p>
                <p className="text-xs text-gray-500 mt-1">{medicationOrder?.medication || "Methadone"}</p>
              </div>
              <div className="space-y-2">
                <Label>Requested Dose (mg) {orderRequestType === "split" && "(Total Daily)"}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={orderRequestDetails.requestedDose}
                  onChange={(e) => {
                    setOrderRequestDetails({ ...orderRequestDetails, requestedDose: e.target.value })
                    // Clear error when user types
                    if (orderValidationErrors.requestedDose) {
                      setOrderValidationErrors({ ...orderValidationErrors, requestedDose: "" })
                    }
                  }}
                  placeholder="Enter new dose amount"
                  className={orderValidationErrors.requestedDose ? "border-red-500" : ""}
                />
                {orderValidationErrors.requestedDose && (
                  <p className="text-sm text-red-600">{orderValidationErrors.requestedDose}</p>
                )}
                {orderRequestType === "increase" && orderRequestDetails.requestedDose && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <ChevronDown className="h-3 w-3 rotate-180" />
                    <span>Increase from {medicationOrder?.daily_dose_mg || 0}mg</span>
                  </div>
                )}
                {orderRequestType === "decrease" && orderRequestDetails.requestedDose && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <ChevronDown className="h-3 w-3" />
                    <span>Decrease from {medicationOrder?.daily_dose_mg || 0}mg</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Physician</Label>
              <Select
                value={orderPhysician}
                onValueChange={(value) => {
                  setOrderPhysician(value)
                  if (orderValidationErrors.physician) {
                    setOrderValidationErrors({ ...orderValidationErrors, physician: "" })
                  }
                }}
                disabled={providersLoading}
              >
                <SelectTrigger className={orderValidationErrors.physician ? "border-red-500" : ""}>
                  <SelectValue placeholder={providersLoading ? "Loading physicians..." : "Choose physician to review order"} />
                </SelectTrigger>
                <SelectContent>
                  {providers.length === 0 && !providersLoading ? (
                    <>
                      <SelectItem value="sample-physician-001">
                        Dr. Sample Physician - Medical Director (Sample)
                      </SelectItem>
                      <div className="px-2 py-1.5 text-xs text-gray-400 border-t mt-1">
                        Using sample physician for testing
                      </div>
                    </>
                  ) : (
                    providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.first_name} {provider.last_name}
                        {provider.specialization && ` - ${provider.specialization}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {orderValidationErrors.physician && (
                <p className="text-sm text-red-600">{orderValidationErrors.physician}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Clinical Justification</Label>
              <Textarea
                value={orderRequestNotes}
                onChange={(e) => {
                  setOrderRequestNotes(e.target.value)
                  if (orderValidationErrors.justification) {
                    setOrderValidationErrors({ ...orderValidationErrors, justification: "" })
                  }
                }}
                placeholder="Document clinical rationale for dose change, patient response, withdrawal symptoms, etc..."
                rows={4}
                className={orderValidationErrors.justification ? "border-red-500" : ""}
              />
              {orderValidationErrors.justification && (
                <p className="text-sm text-red-600">{orderValidationErrors.justification}</p>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium">Nurse Signature</h4>
              <div className="space-y-2">
                <Label>Sign Order (Enter PIN or use Biometric)</Label>
                <Input
                  type="password"
                  value={nurseSignature}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                    setNurseSignature(value)
                    if (orderValidationErrors.signature) {
                      setOrderValidationErrors({ ...orderValidationErrors, signature: "" })
                    }
                  }}
                  placeholder="Enter 4-digit PIN"
                  maxLength={4}
                  className={orderValidationErrors.signature ? "border-red-500" : ""}
                />
                {orderValidationErrors.signature && (
                  <p className="text-sm text-red-600">{orderValidationErrors.signature}</p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" disabled>
                    <Fingerprint className="h-4 w-4 mr-2" />
                    Use Fingerprint
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" disabled>
                    <Camera className="h-4 w-4 mr-2" />
                    Use Face ID
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowOrderRequestDialog(false)
                setOrderValidationErrors({})
              }}
              disabled={submittingOrder}
            >
              Cancel
            </Button>
            <Button
              onClick={submitOrderRequest}
              className="bg-cyan-600 hover:bg-cyan-700"
              disabled={submittingOrder}
            >
              {submittingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit to Physician
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset PIN Dialog */}
      <Dialog open={showResetPinDialog} onOpenChange={setShowResetPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Patient PIN</DialogTitle>
            <DialogDescription>
              Enter a new 4-digit PIN for {selectedPatient?.first_name} {selectedPatient?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New PIN</Label>
              <Input
                type="password"
                maxLength={4}
                value={newPinValue}
                onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ""))}
                placeholder="****"
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm PIN</Label>
              <Input
                type="password"
                maxLength={4}
                value={confirmPinValue}
                onChange={(e) => setConfirmPinValue(e.target.value.replace(/\D/g, ""))}
                placeholder="****"
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={resetPatientPin} className="bg-cyan-600 hover:bg-cyan-700">
              <Lock className="h-4 w-4 mr-2" />
              Reset PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Biometrics Dialog */}
      <Dialog open={showResetBiometricDialog} onOpenChange={setShowResetBiometricDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Biometrics</DialogTitle>
            <DialogDescription>
              This will clear all biometric data for {selectedPatient?.first_name} {selectedPatient?.last_name}. They
              will need to re-enroll.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This action cannot be undone. The patient will need to complete biometric enrollment again.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetBiometricDialog(false)}>
              Cancel
            </Button>
            <Button onClick={resetBiometrics} variant="destructive">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Biometrics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print ID Dialog */}
      <Dialog open={showPrintIdDialog} onOpenChange={setShowPrintIdDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Patient ID Card</DialogTitle>
            <DialogDescription>
              Generate a printable ID card for {selectedPatient?.first_name} {selectedPatient?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <IdCard className="h-12 w-12 text-cyan-600 mx-auto mb-3" />
              <p className="font-medium">
                {selectedPatient?.first_name} {selectedPatient?.last_name}
              </p>
              <p className="text-sm text-gray-500">
                Client #: {selectedPatient?.client_number || `#${selectedPatient?.id.slice(0, 6)}`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintIdDialog(false)}>
              Cancel
            </Button>
            <Button onClick={printIdCard} className="bg-cyan-600 hover:bg-cyan-700">
              <Printer className="h-4 w-4 mr-2" />
              Print ID Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stop Dosing Dialog */}
      <Dialog open={showStopDoseDialog} onOpenChange={setShowStopDoseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Dosing</DialogTitle>
            <DialogDescription>
              This will end the current medication order for {selectedPatient?.first_name} {selectedPatient?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical Action</AlertTitle>
              <AlertDescription>
                Stopping dosing requires physician approval. A request will be sent for review.
              </AlertDescription>
            </Alert>
            <div className="mt-4 space-y-2">
              <Label>Reason for Stopping</Label>
              <Textarea placeholder="Enter reason..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStopDoseDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast({
                  title: "Stop Request Submitted",
                  description: "Request sent to physician for approval",
                })
                setShowStopDoseDialog(false)
              }}
            >
              <Ban className="h-4 w-4 mr-2" />
              Submit Stop Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pump Calibration Dialog (added) */}
      <Dialog open={showPumpCalibrationDialog} onOpenChange={setShowPumpCalibrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calibrate Pump</DialogTitle>
            <DialogDescription>Enter bottle details for calibration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bottle Serial Number</Label>
              <Input
                value={bottleSerial}
                onChange={(e) => setBottleSerial(e.target.value)}
                placeholder="Enter serial number"
              />
            </div>
            <div className="space-y-2">
              <Label>Bottle Start Volume (mL)</Label>
              <Input
                type="number"
                value={bottleStartVolume}
                onChange={(e) => setBottleStartVolume(e.target.value)}
                placeholder="e.g., 1000"
              />
            </div>
            {lastCalibrationDate && (
              <div className="text-sm text-gray-500">Last Calibration: {formatDate(lastCalibrationDate)}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPumpCalibrationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={calibratePump} className="bg-cyan-600 hover:bg-cyan-700">
              {pumpStatus.status === "calibrating" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Loader2 className="h-4 w-4 mr-2" />
              )}
              Calibrate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBottleFillingDialog} onOpenChange={setShowBottleFillingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-orange-600" />
              Fill Take-Home Bottles
            </DialogTitle>
            <DialogDescription>Labels have been printed. Now fill each bottle and scan to confirm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Pump Control for Bottle Filling */}
            <Card className="bg-cyan-50 border-cyan-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Methaspen Pump Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Bottle Serial:</span>
                    <span className="font-mono font-bold ml-1">{pumpStatus.bottleSerial || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Vol:</span>
                    <span className="font-bold ml-1">{pumpStatus.currentVolume || 0}mL</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dose Amount:</span>
                    <span className="font-bold ml-1">{medicationOrder?.daily_dose_mg || 0}mg</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={startPump}
                    disabled={pumpStatus.status === "dispensing"}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start Pump
                  </Button>
                  <Button
                    onClick={stopPump}
                    disabled={pumpStatus.status !== "dispensing"}
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Stop Pump
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bottle Checklist */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {takeHomeBottles.map((bottle, idx) => {
                const isFilled = bottleFillProgress.includes(idx)
                return (
                  <Card key={idx} className={isFilled ? "bg-green-50 border-green-300" : "bg-white"}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={isFilled ? "default" : "outline"}
                              className={isFilled ? "bg-green-600" : ""}
                            >
                              Bottle {bottle.bottle_number} of {bottle.total_bottles}
                            </Badge>
                            {isFilled && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Medication:</span>
                              <span className="font-semibold ml-1">{bottle.medication_name}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Dose:</span>
                              <span className="font-bold ml-1">
                                {bottle.dose_amount}
                                {bottle.dose_unit}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">For:</span>
                              <span className="ml-1">
                                {new Date(bottle.scheduled_consume_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600 font-mono bg-gray-100 p-1 rounded">
                            QR: {bottle.qr_code_data}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button
                            onClick={() => markBottleFilled(idx)}
                            disabled={isFilled}
                            size="sm"
                            variant={isFilled ? "outline" : "default"}
                            className={isFilled ? "" : "bg-orange-600 hover:bg-orange-700"}
                          >
                            {isFilled ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Filled
                              </>
                            ) : (
                              <>
                                <Pill className="h-4 w-4 mr-1" />
                                Mark Filled
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Progress Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-blue-900">Filling Progress</span>
                  <p className="text-xs text-blue-700">
                    {bottleFillProgress.length} of {takeHomeBottles.length} bottles filled
                  </p>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {takeHomeBottles.length > 0
                    ? Math.round((bottleFillProgress.length / takeHomeBottles.length) * 100)
                    : 0}
                  %
                </div>
              </div>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      takeHomeBottles.length > 0 ? (bottleFillProgress.length / takeHomeBottles.length) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
