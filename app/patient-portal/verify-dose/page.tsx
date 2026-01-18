"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  QrCode,
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Pill,
  User,
  ScanLine,
} from "lucide-react"
import Link from "next/link"

// Verification states
type VerificationStep = "scan" | "location" | "biometric" | "success" | "failed"

export default function PatientVerifyDosePage() {
  const [step, setStep] = useState<VerificationStep>("scan")
  const [isScanning, setIsScanning] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [locationStatus, setLocationStatus] = useState<"pending" | "success" | "error">("pending")
  const [bottleData, setBottleData] = useState<any>(null)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [timeRemaining, setTimeRemaining] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Calculate time remaining in dosing window
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date()
      const endWindow = new Date()
      endWindow.setHours(11, 0, 0, 0) // 11:00 AM

      if (now > endWindow) {
        setTimeRemaining("Window Closed")
      } else {
        const diff = endWindow.getTime() - now.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeRemaining(`${hours}h ${minutes}m remaining`)
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 60000)
    return () => clearInterval(interval)
  }, [])

  // Check if within dosing window
  const isWithinDosingWindow = () => {
    const now = new Date()
    const hour = now.getHours()
    return hour >= 6 && hour < 11
  }

  // Simulate QR code scan
  const handleScan = async () => {
    setIsScanning(true)

    // Simulate scanning delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock bottle data
    setBottleData({
      bottle_id: "BTL-2025-001234",
      bottle_number: 3,
      total_bottles: 7,
      medication: "Methadone",
      dose: "80mg",
      patient_name: "John Doe",
      dispense_date: "2025-01-25",
      expected_consumption_date: "2025-01-28",
    })

    setIsScanning(false)
    setStep("location")

    // Request GPS location
    requestLocation()
  }

  // Request GPS location
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationStatus("success")
          // Auto-advance to biometric after location success
          setTimeout(() => setStep("biometric"), 1500)
        },
        (error) => {
          setLocationStatus("error")
          setErrorMessage("Unable to verify location. Please enable GPS and try again.")
        },
        { enableHighAccuracy: true, timeout: 10000 },
      )
    } else {
      setLocationStatus("error")
      setErrorMessage("GPS not supported on this device.")
    }
  }

  // Start camera for facial biometric
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setErrorMessage("Unable to access camera. Please grant camera permissions.")
    }
  }

  // Capture facial biometric
  const captureBiometric = async () => {
    setIsCapturing(true)

    // Capture frame from video
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 480)
      }
    }

    // Simulate biometric verification
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Stop camera
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }

    // Check if within dosing window
    if (!isWithinDosingWindow()) {
      setStep("failed")
      setErrorMessage("Dosing window has closed. Please contact your clinic immediately.")
      return
    }

    setIsCapturing(false)
    setStep("success")

    // Submit verification to server
    submitVerification()
  }

  // Submit verification to server
  const submitVerification = async () => {
    try {
      await fetch("/api/takehome-diversion/verify-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bottle_id: bottleData?.bottle_id,
          gps_latitude: gpsCoords?.lat,
          gps_longitude: gpsCoords?.lng,
          biometric_captured: true,
          scan_timestamp: new Date().toISOString(),
        }),
      })
    } catch (error) {
      console.error("Failed to submit verification:", error)
    }
  }

  // Start camera when entering biometric step
  useEffect(() => {
    if (step === "biometric") {
      startCamera()
    }
  }, [step])

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f172a" }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: "#334155" }}>
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link href="/patient-portal" className="text-white flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            Back
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">MASE EMR</h1>
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              Take-Home Dose Verification
            </p>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Dosing Window Alert */}
        {!isWithinDosingWindow() ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Dosing Window Closed</AlertTitle>
            <AlertDescription>
              The dosing window (6:00 AM - 11:00 AM) has passed. Please contact your clinic immediately.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert style={{ backgroundColor: "#1e3a5f", borderColor: "#0891b2" }}>
            <Clock className="h-4 w-4" style={{ color: "#0891b2" }} />
            <AlertTitle style={{ color: "#e0f2fe" }}>Dosing Window Open</AlertTitle>
            <AlertDescription style={{ color: "#94a3b8" }}>{timeRemaining} to verify your dose</AlertDescription>
          </Alert>
        )}

        {/* Progress Steps */}
        <Card style={{ backgroundColor: "#1e293b", borderColor: "#334155" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step === "scan" ? "bg-cyan-500" : step !== "scan" ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  <QrCode className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs mt-1 text-gray-400">Scan</span>
              </div>
              <div className="flex-1 h-1 mx-2" style={{ backgroundColor: step !== "scan" ? "#22c55e" : "#334155" }} />
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step === "location"
                      ? "bg-cyan-500"
                      : ["biometric", "success"].includes(step)
                        ? "bg-green-500"
                        : "bg-gray-600"
                  }`}
                >
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs mt-1 text-gray-400">GPS</span>
              </div>
              <div
                className="flex-1 h-1 mx-2"
                style={{ backgroundColor: ["biometric", "success"].includes(step) ? "#22c55e" : "#334155" }}
              />
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step === "biometric" ? "bg-cyan-500" : step === "success" ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs mt-1 text-gray-400">Face ID</span>
              </div>
              <div
                className="flex-1 h-1 mx-2"
                style={{ backgroundColor: step === "success" ? "#22c55e" : "#334155" }}
              />
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step === "success" ? "bg-green-500" : "bg-gray-600"
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs mt-1 text-gray-400">Done</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: QR Scan */}
        {step === "scan" && (
          <Card style={{ backgroundColor: "#1e293b", borderColor: "#334155" }}>
            <CardHeader className="text-center">
              <CardTitle className="text-white flex items-center justify-center gap-2">
                <QrCode className="h-6 w-6" style={{ color: "#0891b2" }} />
                Scan Bottle QR Code
              </CardTitle>
              <CardDescription style={{ color: "#94a3b8" }}>
                Point your camera at the QR code on your medication bottle
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div
                className="w-64 h-64 rounded-xl border-4 border-dashed flex items-center justify-center mb-4"
                style={{ borderColor: "#0891b2", backgroundColor: "#0f172a" }}
              >
                {isScanning ? (
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-2" style={{ color: "#0891b2" }} />
                    <p className="text-sm" style={{ color: "#94a3b8" }}>
                      Scanning...
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <ScanLine className="h-16 w-16 mx-auto mb-2" style={{ color: "#0891b2" }} />
                    <p className="text-sm" style={{ color: "#94a3b8" }}>
                      Ready to scan
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleScan}
                disabled={isScanning || !isWithinDosingWindow()}
                className="w-full gap-2"
                style={{ backgroundColor: "#0891b2" }}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Start Scan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Location Verification */}
        {step === "location" && (
          <Card style={{ backgroundColor: "#1e293b", borderColor: "#334155" }}>
            <CardHeader className="text-center">
              <CardTitle className="text-white flex items-center justify-center gap-2">
                <MapPin className="h-6 w-6" style={{ color: "#0891b2" }} />
                Verifying Location
              </CardTitle>
              <CardDescription style={{ color: "#94a3b8" }}>
                Confirming you are at your registered home address
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {/* Bottle Info */}
              {bottleData && (
                <div className="w-full p-4 rounded-lg mb-4" style={{ backgroundColor: "#0f172a" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Pill className="h-8 w-8" style={{ color: "#0891b2" }} />
                    <div>
                      <p className="font-bold text-white">
                        {bottleData.medication} {bottleData.dose}
                      </p>
                      <p className="text-sm" style={{ color: "#94a3b8" }}>
                        Bottle {bottleData.bottle_number} of {bottleData.total_bottles}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p style={{ color: "#64748b" }}>Bottle ID</p>
                      <p className="text-white font-mono text-xs">{bottleData.bottle_id}</p>
                    </div>
                    <div>
                      <p style={{ color: "#64748b" }}>Expected Date</p>
                      <p className="text-white">{bottleData.expected_consumption_date}</p>
                    </div>
                  </div>
                </div>
              )}

              {locationStatus === "pending" && (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: "#0891b2" }} />
                  <p className="text-white">Verifying your location...</p>
                  <p className="text-sm mt-2" style={{ color: "#94a3b8" }}>
                    Please ensure GPS is enabled
                  </p>
                </div>
              )}

              {locationStatus === "success" && (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <p className="text-white font-bold">Location Verified</p>
                  <p className="text-sm mt-2" style={{ color: "#94a3b8" }}>
                    You are within your registered home area
                  </p>
                  {gpsCoords && (
                    <p className="text-xs mt-2 font-mono" style={{ color: "#64748b" }}>
                      {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              )}

              {locationStatus === "error" && (
                <div className="text-center py-8">
                  <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                  <p className="text-white font-bold">Location Verification Failed</p>
                  <p className="text-sm mt-2 text-red-400">{errorMessage}</p>
                  <Button onClick={requestLocation} variant="outline" className="mt-4 bg-transparent">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Biometric Verification */}
        {step === "biometric" && (
          <Card style={{ backgroundColor: "#1e293b", borderColor: "#334155" }}>
            <CardHeader className="text-center">
              <CardTitle className="text-white flex items-center justify-center gap-2">
                <User className="h-6 w-6" style={{ color: "#0891b2" }} />
                Facial Verification
              </CardTitle>
              <CardDescription style={{ color: "#94a3b8" }}>
                Position your face in the frame for identity verification
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div
                className="relative w-64 h-64 rounded-xl overflow-hidden mb-4 border-4"
                style={{ borderColor: "#0891b2" }}
              >
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {/* Face outline overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-48 border-2 border-dashed rounded-full" style={{ borderColor: "#0891b2" }} />
                </div>
                {isCapturing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-12 w-12 animate-spin text-white" />
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} width={640} height={480} className="hidden" />

              <Button
                onClick={captureBiometric}
                disabled={isCapturing}
                className="w-full gap-2"
                style={{ backgroundColor: "#0891b2" }}
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Capture & Verify
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <Card style={{ backgroundColor: "#1e293b", borderColor: "#22c55e" }}>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Dose Verified!</h2>
              <p style={{ color: "#94a3b8" }} className="mb-6">
                Your take-home dose has been successfully verified. You may now consume your medication.
              </p>

              <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: "#0f172a" }}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-green-500" />
                    <p className="text-xs" style={{ color: "#94a3b8" }}>
                      QR Scanned
                    </p>
                  </div>
                  <div>
                    <MapPin className="h-6 w-6 mx-auto mb-1 text-green-500" />
                    <p className="text-xs" style={{ color: "#94a3b8" }}>
                      Location OK
                    </p>
                  </div>
                  <div>
                    <User className="h-6 w-6 mx-auto mb-1 text-green-500" />
                    <p className="text-xs" style={{ color: "#94a3b8" }}>
                      Face Verified
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: "#0f172a" }}>
                <p className="text-sm font-medium text-white mb-1">Verification ID</p>
                <p className="font-mono text-xs" style={{ color: "#0891b2" }}>
                  VRF-{Date.now()}-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </p>
                <p className="text-xs mt-2" style={{ color: "#64748b" }}>
                  {new Date().toLocaleString()}
                </p>
              </div>

              <Link href="/patient-portal">
                <Button className="w-full mt-6 bg-transparent" variant="outline">
                  Return to Patient Portal
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Failed */}
        {step === "failed" && (
          <Card style={{ backgroundColor: "#1e293b", borderColor: "#ef4444" }}>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-red-400 mb-6">{errorMessage}</p>

              <Alert variant="destructive" className="text-left mb-6">
                <Phone className="h-4 w-4" />
                <AlertTitle>Contact Your Clinic Immediately</AlertTitle>
                <AlertDescription>
                  Call: (555) 123-4567
                  <br />
                  This incident has been logged and your counselor has been notified.
                </AlertDescription>
              </Alert>

              <Button onClick={() => setStep("scan")} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Emergency Contact */}
        <Card style={{ backgroundColor: "#1e293b", borderColor: "#334155" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5" style={{ color: "#0891b2" }} />
                <div>
                  <p className="text-sm font-medium text-white">Need Help?</p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>
                    Contact your clinic
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="tel:5551234567">Call Now</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
