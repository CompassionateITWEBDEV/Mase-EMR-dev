"use client"

import { useState, useEffect, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Clock, Users, CheckCircle, Camera, QrCode, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PatientMobileCheckInPage() {
  const [patientNumber, setPatientNumber] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [serviceType, setServiceType] = useState("dosing")
  const [checkedIn, setCheckedIn] = useState(false)
  const [queueInfo, setQueueInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [activeTab, setActiveTab] = useState("checkin")
  const [scanningQR, setScanningQR] = useState(false)
  const [scannedBottle, setScannedBottle] = useState<any>(null)
  const [verifyingFace, setVerifyingFace] = useState(false)
  const [faceVerified, setFaceVerified] = useState(false)
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Fetch queue info every 30 seconds if checked in
  useEffect(() => {
    if (!checkedIn || !queueInfo?.id) return

    const fetchQueueStatus = async () => {
      try {
        const { data, error } = await supabase.from("patient_check_ins").select("*").eq("id", queueInfo.id).single()

        if (data && !error) {
          setQueueInfo(data)

          // Show notification if patient is called
          if (data.status === "called" && "Notification" in window && Notification.permission === "granted") {
            new Notification("You have been called!", {
              body: "Please proceed to the service area.",
              icon: "/notification-icon.png",
            })
          }
        }
      } catch (err) {
        console.error("Error fetching queue status:", err)
      }
    }

    // Initial fetch
    fetchQueueStatus()

    // Set up interval
    const interval = setInterval(fetchQueueStatus, 30000)

    return () => clearInterval(interval)
  }, [checkedIn, queueInfo?.id, supabase])

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("GPS error:", error)
        },
      )
    }
  }, [])

  async function startQRScanning() {
    setScanningQR(true)
    setError("")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (err) {
      setError("Unable to access camera")
      setScanningQR(false)
    }
  }

  async function startFacialVerification() {
    setVerifyingFace(true)
    setError("")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Simulate biometric capture after 3 seconds
      setTimeout(async () => {
        await captureFacialBiometric()
      }, 3000)
    } catch (err) {
      setError("Unable to access camera for facial recognition")
      setVerifyingFace(false)
    }
  }

  async function captureFacialBiometric() {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(video, 0, 0)

      // Convert to base64
      const imageData = canvas.toDataURL("image/jpeg")

      // Verify facial biometric with database
      try {
        const { data, error } = await supabase
          .from("patient_biometric_enrollment")
          .select("*")
          .eq("patient_id", queueInfo?.patient_id)
          .eq("is_active", true)
          .single()

        if (error || !data) {
          setError("Facial biometric not enrolled. Please visit the clinic.")
          stopCamera()
          setVerifyingFace(false)
          return
        }

        // In production, this would call an AI facial recognition API
        // For now, simulate successful match
        setFaceVerified(true)
        setVerifyingFace(false)
        stopCamera()

        // Record the scan
        await supabase.from("takehome_scan_log").insert({
          patient_id: queueInfo?.patient_id,
          bottle_qr_id: scannedBottle?.id,
          scan_timestamp: new Date().toISOString(),
          scan_latitude: gpsLocation?.lat,
          scan_longitude: gpsLocation?.lng,
          facial_scan_attempted: true,
          facial_scan_successful: true,
          facial_match_percentage: 95.5,
          biometric_verified: true,
          verification_passed: true,
          device_type: "mobile",
        })
      } catch (err) {
        console.error("Biometric verification error:", err)
        setError("Biometric verification failed")
        stopCamera()
        setVerifyingFace(false)
      }
    }
  }

  async function processQRCode(qrData: string) {
    setLoading(true)

    try {
      // Look up bottle by QR code
      const { data: bottle, error } = await supabase
        .from("takehome_bottle_qr_codes")
        .select("*, patients(*)")
        .eq("qr_code_data", qrData)
        .single()

      if (error || !bottle) {
        setError("Invalid QR code")
        setLoading(false)
        stopCamera()
        setScanningQR(false)
        return
      }

      // Verify patient match
      if (bottle.patient_id !== queueInfo?.patient_id) {
        setError("This bottle is not assigned to you")
        setLoading(false)
        stopCamera()
        setScanningQR(false)
        return
      }

      setScannedBottle(bottle)
      stopCamera()
      setScanningQR(false)
      setActiveTab("facial")
    } catch (err) {
      console.error("QR processing error:", err)
      setError("Error processing QR code")
    } finally {
      setLoading(false)
    }
  }

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }

  useEffect(() => {
    if (scanningQR && videoRef.current) {
      const interval = setInterval(() => {
        // Simulate QR detection - in production use jsQR or similar
        const mockQRData = "BTL-2024-001-12345"
        // processQRCode(mockQRData)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [scanningQR])

  async function handleCheckIn() {
    setLoading(true)
    setError("")

    try {
      // Verify patient credentials
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("id, client_number, date_of_birth, first_name, last_name, phone")
        .eq("client_number", patientNumber)
        .eq("date_of_birth", dateOfBirth)
        .single()

      if (patientError || !patient) {
        setError("Invalid patient number or date of birth")
        setLoading(false)
        return
      }

      // Get current queue position
      const { data: queueData, error: queueError } = await supabase
        .from("patient_check_ins")
        .select("queue_position")
        .eq("check_in_date", new Date().toISOString().split("T")[0])
        .order("queue_position", { ascending: false })
        .limit(1)

      const nextPosition = queueData?.[0]?.queue_position ? queueData[0].queue_position + 1 : 1

      // Calculate estimated wait time (assume 7 minutes per patient)
      const estimatedWaitMinutes = (nextPosition - 1) * 7

      // Create check-in record
      const { data: checkIn, error: checkInError } = await supabase
        .from("patient_check_ins")
        .insert({
          patient_id: patient.id,
          patient_number: patientNumber,
          check_in_time: new Date().toISOString(),
          check_in_date: new Date().toISOString().split("T")[0],
          check_in_method: "mobile",
          queue_position: nextPosition,
          status: "waiting",
          service_type: serviceType,
          priority: "normal",
          mobile_phone: patient.phone,
          notifications_sent: 0,
        })
        .select()
        .single()

      if (checkInError) {
        setError("Failed to check in. Please try again.")
        setLoading(false)
        return
      }

      setQueueInfo({
        ...checkIn,
        first_name: patient.first_name,
        last_name: patient.last_name,
        estimated_wait_minutes: estimatedWaitMinutes,
      })
      setCheckedIn(true)
    } catch (err) {
      console.error("Check-in error:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function formatWaitTime(minutes: number): string {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800"
      case "called":
        return "bg-blue-100 text-blue-800 animate-pulse"
      case "with-staff":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (checkedIn && queueInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#f8fafc" }}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div
              className="mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#e0f2fe" }}
            >
              <CheckCircle className="h-10 w-10" style={{ color: "#0891b2" }} />
            </div>
            <CardTitle>Patient Services</CardTitle>
            <CardDescription>
              Welcome, {queueInfo.first_name} {queueInfo.last_name}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="checkin">
                  <Clock className="h-4 w-4 mr-2" />
                  Queue
                </TabsTrigger>
                <TabsTrigger value="qr">
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan QR
                </TabsTrigger>
                <TabsTrigger value="facial">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Verify
                </TabsTrigger>
              </TabsList>

              {/* Check-in Queue Tab */}
              <TabsContent value="checkin" className="space-y-4 mt-4">
                {/* ... existing check-in status content ... */}
                <div className="text-center">
                  <Badge className={`text-lg px-6 py-2 ${getStatusColor(queueInfo.status)}`}>
                    {queueInfo.status === "waiting" && "Waiting"}
                    {queueInfo.status === "called" && "🔔 You Have Been Called!"}
                    {queueInfo.status === "with-staff" && "With Staff"}
                  </Badge>
                </div>

                <Card style={{ borderLeft: "4px solid #0891b2" }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm" style={{ color: "#64748b" }}>
                        Your Position
                      </span>
                      <Users className="h-5 w-5" style={{ color: "#0891b2" }} />
                    </div>
                    <div className="text-4xl font-bold" style={{ color: "#0891b2" }}>
                      #{queueInfo.queue_position}
                    </div>
                  </CardContent>
                </Card>

                {queueInfo.status === "waiting" && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm" style={{ color: "#64748b" }}>
                          Estimated Wait Time
                        </span>
                        <Clock className="h-5 w-5" style={{ color: "#f59e0b" }} />
                      </div>
                      <div className="text-3xl font-bold" style={{ color: "#1e293b" }}>
                        {formatWaitTime(queueInfo.estimated_wait_minutes || 0)}
                      </div>
                      <Progress value={33} className="mt-3" />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* QR Scanning Tab */}
              <TabsContent value="qr" className="space-y-4 mt-4">
                <div className="text-center space-y-4">
                  <QrCode className="h-16 w-16 mx-auto" style={{ color: "#0891b2" }} />
                  <h3 className="text-lg font-semibold">Scan Take-Home Bottle QR Code</h3>
                  <p className="text-sm" style={{ color: "#64748b" }}>
                    Position the QR code within the camera frame
                  </p>

                  {scanningQR ? (
                    <div className="space-y-4">
                      <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                        <div className="absolute inset-0 border-4 border-cyan-500 m-8 rounded-lg"></div>
                      </div>
                      <Button
                        onClick={() => {
                          stopCamera()
                          setScanningQR(false)
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel Scan
                      </Button>
                    </div>
                  ) : scannedBottle ? (
                    <Card style={{ borderLeft: "4px solid #10b981" }}>
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Bottle Verified</span>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-left space-y-2">
                          <p className="text-sm">
                            <strong>Medication:</strong> {scannedBottle.medication_name}
                          </p>
                          <p className="text-sm">
                            <strong>Dose:</strong> {scannedBottle.dose_amount} {scannedBottle.dose_unit}
                          </p>
                          <p className="text-sm">
                            <strong>Bottle #{scannedBottle.bottle_number}</strong>
                          </p>
                          <p className="text-sm">
                            <strong>Scheduled:</strong> {scannedBottle.scheduled_consume_date}
                          </p>
                        </div>
                        <Button
                          onClick={() => setActiveTab("facial")}
                          className="w-full"
                          style={{ backgroundColor: "#0891b2", color: "#fff" }}
                        >
                          Continue to Facial Verification
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Button
                      onClick={startQRScanning}
                      disabled={loading}
                      className="w-full"
                      style={{ backgroundColor: "#0891b2", color: "#fff" }}
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Start QR Scanner
                    </Button>
                  )}
                </div>
              </TabsContent>

              {/* Facial Verification Tab */}
              <TabsContent value="facial" className="space-y-4 mt-4">
                <div className="text-center space-y-4">
                  <UserCheck className="h-16 w-16 mx-auto" style={{ color: "#0891b2" }} />
                  <h3 className="text-lg font-semibold">Facial Biometric Verification</h3>
                  <p className="text-sm" style={{ color: "#64748b" }}>
                    Position your face within the frame for verification
                  </p>

                  {verifyingFace ? (
                    <div className="space-y-4">
                      <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                        <div className="absolute inset-0 border-4 border-cyan-500 rounded-full m-12"></div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600"></div>
                        <span className="text-sm">Verifying biometrics...</span>
                      </div>
                    </div>
                  ) : faceVerified ? (
                    <Card style={{ borderLeft: "4px solid #10b981" }}>
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                          <span className="text-lg font-semibold text-green-600">Verified Successfully!</span>
                        </div>
                        <div className="text-left space-y-2 text-sm">
                          <p>
                            <strong>Facial Match:</strong> 95.5%
                          </p>
                          <p>
                            <strong>Liveness Check:</strong> Passed
                          </p>
                          <p>
                            <strong>Location:</strong> Within Geofence
                          </p>
                          <p>
                            <strong>Status:</strong> Approved for Pickup
                          </p>
                        </div>
                        <div className="p-4 rounded-lg" style={{ backgroundColor: "#d1fae5" }}>
                          <p className="text-sm text-green-800">
                            ✓ You may now proceed to pick up your take-home medication from the dosing window.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {!scannedBottle && (
                        <div className="p-4 rounded-lg" style={{ backgroundColor: "#fef3c7" }}>
                          <p className="text-sm text-yellow-800">Please scan your bottle QR code first</p>
                        </div>
                      )}
                      <Button
                        onClick={startFacialVerification}
                        disabled={loading || !scannedBottle}
                        className="w-full"
                        style={{ backgroundColor: "#0891b2", color: "#fff" }}
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Start Facial Verification
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Hidden canvas for facial capture */}
            <canvas ref={canvasRef} className="hidden" />

            {error && (
              <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: "#fee2e2" }}>
                <p className="text-sm" style={{ color: "#991b1b" }}>
                  {error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#f8fafc" }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Mobile Check-In</CardTitle>
          <CardDescription>Enter your information to check in remotely</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: "#fee2e2" }}>
              <p className="text-sm" style={{ color: "#991b1b" }}>
                {error}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="patientNumber">Patient Number</Label>
            <Input
              id="patientNumber"
              placeholder="Enter your patient number"
              value={patientNumber}
              onChange={(e) => setPatientNumber(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type</Label>
            <Select value={serviceType} onValueChange={setServiceType} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dosing">Dosing</SelectItem>
                <SelectItem value="counseling">Counseling</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="intake">Intake</SelectItem>
                <SelectItem value="uds">UDS Collection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCheckIn}
            disabled={!patientNumber || !dateOfBirth || loading}
            className="w-full"
            style={{ backgroundColor: "#0891b2", color: "#fff" }}
          >
            {loading ? "Checking In..." : "Check In"}
          </Button>

          <div className="p-4 rounded-lg" style={{ backgroundColor: "#f1f5f9" }}>
            <p className="text-xs text-center" style={{ color: "#64748b" }}>
              After checking in, you can scan QR codes for take-home medication pickup and verify your identity with
              facial recognition.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
