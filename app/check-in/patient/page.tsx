"use client"

import { useState, useEffect } from "react"
import {
  Clock,
  CheckCircle,
  MapPin,
  Bell,
  Coffee,
  ArrowLeft,
  Phone,
  AlertCircle,
  Timer,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface PatientQueueStatus {
  queueId: string
  patientNumber: string
  position: number
  totalAhead: number
  estimatedWaitMinutes: number
  status: "checked-in" | "waiting" | "called" | "return-later"
  serviceType: string
  checkInTime: string
  returnTime?: string
  clinicMessage?: string
}

export default function PatientCheckInPage() {
  const [step, setStep] = useState<"check-in" | "status">("check-in")
  const [patientNumber, setPatientNumber] = useState("")
  const [mobilePhone, setMobilePhone] = useState("")
  const [serviceType, setServiceType] = useState("dosing")
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [queueStatus, setQueueStatus] = useState<PatientQueueStatus | null>(null)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  useEffect(() => {
    // Check if already checked in (from URL or localStorage)
    const savedQueueId = localStorage.getItem("queueId")
    if (savedQueueId) {
      fetchQueueStatus(savedQueueId)
    }
  }, [])

  useEffect(() => {
    // Auto-refresh status every 30 seconds
    if (queueStatus && step === "status") {
      const interval = setInterval(() => {
        fetchQueueStatus(queueStatus.queueId)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [queueStatus, step])

  async function handleCheckIn() {
    if (!patientNumber) {
      setError("Please enter your patient number")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/check-in/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientNumber,
          mobilePhone: enableNotifications ? mobilePhone : null,
          serviceType,
          checkInMethod: "mobile",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setQueueStatus(data)
        localStorage.setItem("queueId", data.queueId)
        setStep("status")
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Check-in failed. Please try again.")
      }
    } catch (err) {
      // Mock successful check-in for demo
      const mockStatus: PatientQueueStatus = {
        queueId: `q-${Date.now()}`,
        patientNumber,
        position: 4,
        totalAhead: 3,
        estimatedWaitMinutes: 25,
        status: "waiting",
        serviceType,
        checkInTime: new Date().toISOString(),
        clinicMessage: "Please wait in the lobby. We will call your number.",
      }
      setQueueStatus(mockStatus)
      localStorage.setItem("queueId", mockStatus.queueId)
      setStep("status")
    } finally {
      setLoading(false)
    }
  }

  async function fetchQueueStatus(queueId: string) {
    try {
      const response = await fetch(`/api/check-in/status/${queueId}`)
      if (response.ok) {
        const data = await response.json()
        setQueueStatus(data)
        setStep("status")
      }
    } catch (err) {
      // Keep existing status or show error
    }
  }

  async function handleLeaveQueue() {
    if (!queueStatus) return

    try {
      await fetch(`/api/check-in/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId: queueStatus.queueId }),
      })
    } catch (err) {
      // Continue anyway
    }

    localStorage.removeItem("queueId")
    setQueueStatus(null)
    setStep("check-in")
    setShowLeaveDialog(false)
  }

  async function requestReturnLater() {
    if (!queueStatus) return

    try {
      await fetch(`/api/check-in/return-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId: queueStatus.queueId }),
      })

      setQueueStatus({
        ...queueStatus,
        status: "return-later",
        returnTime: new Date(Date.now() + 45 * 60000).toISOString(),
      })
    } catch (err) {
      // Mock update
      setQueueStatus({
        ...queueStatus,
        status: "return-later",
        returnTime: new Date(Date.now() + 45 * 60000).toISOString(),
      })
    }
  }

  function getWaitTime(checkInTime: string): number {
    return Math.round((Date.now() - new Date(checkInTime).getTime()) / 60000)
  }

  // Check-In Form
  if (step === "check-in") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#f0f9ff" }}>
        <Card className="w-full max-w-md">
          <CardHeader
            className="text-center"
            style={{ backgroundColor: "#0891b2", color: "#fff", borderRadius: "8px 8px 0 0" }}
          >
            <div className="flex justify-center mb-2">
              <Smartphone className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl">Mobile Check-In</CardTitle>
            <CardDescription style={{ color: "#e0f2fe" }}>
              {"Check in from your phone and we'll notify you when it's your turn"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {error && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
                <AlertCircle className="h-4 w-4 inline mr-2" />
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="patientNumber">Patient Number *</Label>
              <Input
                id="patientNumber"
                type="text"
                placeholder="Enter your patient number"
                value={patientNumber}
                onChange={(e) => setPatientNumber(e.target.value)}
                className="text-lg h-12 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="serviceType">Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger className="h-12 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dosing">Daily Dosing</SelectItem>
                  <SelectItem value="counseling">Counseling Session</SelectItem>
                  <SelectItem value="medical">Medical Appointment</SelectItem>
                  <SelectItem value="intake">New Patient Intake</SelectItem>
                  <SelectItem value="uds">UDS Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: "#f1f5f9" }}>
              <div className="flex items-center justify-between mb-3">
                <Label htmlFor="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Text Notifications
                </Label>
                <Switch id="notifications" checked={enableNotifications} onCheckedChange={setEnableNotifications} />
              </div>
              {enableNotifications && (
                <div>
                  <Label htmlFor="phone" className="text-sm">
                    Mobile Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                    {"We'll text you when it's almost your turn"}
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleCheckIn}
              disabled={loading || !patientNumber}
              className="w-full h-12 text-lg"
              style={{ backgroundColor: "#0891b2", color: "#fff" }}
            >
              {loading ? (
                <>Loading...</>
              ) : (
                <>
                  <MapPin className="h-5 w-5 mr-2" />
                  {"I'm Here - Check Me In"}
                </>
              )}
            </Button>

            <p className="text-center text-sm" style={{ color: "#64748b" }}>
              Already checked in?{" "}
              <button
                onClick={() => {
                  const savedQueueId = localStorage.getItem("queueId")
                  if (savedQueueId) {
                    fetchQueueStatus(savedQueueId)
                  }
                }}
                style={{ color: "#0891b2", textDecoration: "underline" }}
              >
                View my status
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Queue Status View
  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: "#f0f9ff" }}>
      <div className="max-w-md mx-auto space-y-4">
        {/* Status Card */}
        <Card>
          <CardHeader className="text-center pb-2">
            {queueStatus?.status === "called" ? (
              <div className="p-4 rounded-lg mb-2" style={{ backgroundColor: "#d1fae5" }}>
                <CheckCircle className="h-16 w-16 mx-auto mb-2" style={{ color: "#10b981" }} />
                <CardTitle className="text-2xl" style={{ color: "#065f46" }}>
                  {"You're Being Called!"}
                </CardTitle>
                <CardDescription style={{ color: "#047857" }}>Please proceed to the service window</CardDescription>
              </div>
            ) : queueStatus?.status === "return-later" ? (
              <div className="p-4 rounded-lg mb-2" style={{ backgroundColor: "#e0e7ff" }}>
                <Coffee className="h-16 w-16 mx-auto mb-2" style={{ color: "#6366f1" }} />
                <CardTitle className="text-2xl" style={{ color: "#3730a3" }}>
                  Return Later
                </CardTitle>
                <CardDescription style={{ color: "#4338ca" }}>
                  Come back at{" "}
                  {queueStatus.returnTime
                    ? new Date(queueStatus.returnTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "scheduled time"}
                </CardDescription>
              </div>
            ) : (
              <>
                <CardTitle className="text-xl" style={{ color: "#1e293b" }}>
                  Patient #{queueStatus?.patientNumber}
                </CardTitle>
                <CardDescription>
                  {"You're checked in for"} {queueStatus?.serviceType}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Position Display */}
            {queueStatus?.status === "waiting" && (
              <>
                <div className="text-center p-6 rounded-lg" style={{ backgroundColor: "#f1f5f9" }}>
                  <p className="text-sm mb-1" style={{ color: "#64748b" }}>
                    Your Position
                  </p>
                  <p className="text-6xl font-bold" style={{ color: "#0891b2" }}>
                    {queueStatus.position}
                  </p>
                  <p style={{ color: "#64748b" }}>
                    {queueStatus.totalAhead} {queueStatus.totalAhead === 1 ? "person" : "people"} ahead of you
                  </p>
                </div>

                {/* Wait Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: "#fef3c7" }}>
                    <Clock className="h-6 w-6 mx-auto mb-1" style={{ color: "#f59e0b" }} />
                    <p className="text-sm" style={{ color: "#92400e" }}>
                      Estimated Wait
                    </p>
                    <p className="text-2xl font-bold" style={{ color: "#92400e" }}>
                      ~{queueStatus.estimatedWaitMinutes}m
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: "#e0f2fe" }}>
                    <Timer className="h-6 w-6 mx-auto mb-1" style={{ color: "#0891b2" }} />
                    <p className="text-sm" style={{ color: "#0369a1" }}>
                      Waiting
                    </p>
                    <p className="text-2xl font-bold" style={{ color: "#0369a1" }}>
                      {getWaitTime(queueStatus.checkInTime)}m
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1" style={{ color: "#64748b" }}>
                    <span>Progress</span>
                    <span>
                      {Math.round((1 - queueStatus.position / (queueStatus.totalAhead + queueStatus.position)) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={(1 - queueStatus.position / (queueStatus.totalAhead + queueStatus.position)) * 100}
                  />
                </div>

                {/* Long wait option */}
                {queueStatus.estimatedWaitMinutes > 45 && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: "#fef3c7", border: "1px solid #fcd34d" }}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 mt-0.5" style={{ color: "#f59e0b" }} />
                      <div>
                        <p className="font-medium" style={{ color: "#92400e" }}>
                          Long wait time detected
                        </p>
                        <p className="text-sm" style={{ color: "#a16207" }}>
                          You can leave and return later while keeping your place in line
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 bg-transparent"
                          onClick={requestReturnLater}
                        >
                          <Coffee className="h-4 w-4 mr-1" />
                          Return Later
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Clinic Message */}
            {queueStatus?.clinicMessage && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#e0f2fe" }}>
                <p className="text-sm" style={{ color: "#0369a1" }}>
                  {queueStatus.clinicMessage}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t space-y-2">
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => queueStatus && fetchQueueStatus(queueStatus.queueId)}
              >
                Refresh Status
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                style={{ color: "#dc2626" }}
                onClick={() => setShowLeaveDialog(true)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Leave Queue
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2" style={{ color: "#1e293b" }}>
              Need Help?
            </h3>
            <p className="text-sm mb-3" style={{ color: "#64748b" }}>
              If you need assistance or have questions, please speak to the front desk staff.
            </p>
            <div className="flex items-center gap-2 text-sm" style={{ color: "#0891b2" }}>
              <Phone className="h-4 w-4" />
              Front Desk: (555) 123-4567
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Queue Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Queue?</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave the queue? You will lose your place in line and need to check in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
              Stay in Queue
            </Button>
            <Button onClick={handleLeaveQueue} style={{ backgroundColor: "#dc2626", color: "#fff" }}>
              Leave Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
