"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { AlertTriangle, CheckCircle, FileText, UserCheck } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function GuestDosingPage() {
  const { toast } = useToast()
  const supabase = createClient()
  const { data: patientsData } = useSWR("/api/patients", fetcher)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [homeFacility, setHomeFacility] = useState("")
  const [authorizationNumber, setAuthorizationNumber] = useState("")
  const [medication, setMedication] = useState("methadone")
  const [doseAmount, setDoseAmount] = useState("")
  const [guestNotes, setGuestNotes] = useState("")
  const [verificationMethod, setVerificationMethod] = useState<"pin" | "biometric" | "id">("id")
  const [verifiedIdentity, setVerifiedIdentity] = useState(false)

  const patients = patientsData?.patients || []
  const filteredPatients = patients.filter((p: any) => {
    const query = searchQuery.toLowerCase()
    return (
      p.first_name?.toLowerCase().includes(query) ||
      p.last_name?.toLowerCase().includes(query) ||
      p.client_number?.toLowerCase().includes(query)
    )
  })

  const handleVerifyIdentity = () => {
    if (!selectedPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient first",
        variant: "destructive",
      })
      return
    }
    setVerifiedIdentity(true)
    toast({
      title: "Identity Verified",
      description: `Patient verified via ${verificationMethod.toUpperCase()}`,
    })
  }

  const handleGuestDose = async () => {
    if (!selectedPatient || !verifiedIdentity) {
      toast({
        title: "Cannot Dispense",
        description: "Patient must be selected and identity verified",
        variant: "destructive",
      })
      return
    }

    if (!homeFacility || !authorizationNumber || !doseAmount) {
      toast({
        title: "Missing Information",
        description: "Please provide home facility, authorization, and dose amount",
        variant: "destructive",
      })
      return
    }

    try {
      const doseLog = {
        patient_id: selectedPatient.id,
        dose_date: new Date().toISOString().split("T")[0],
        dose_time: new Date().toTimeString().split(" ")[0],
        medication,
        dose_amount: Number.parseFloat(doseAmount),
        dispensed_by: "current_nurse_id",
        notes: `GUEST DOSE - Home Facility: ${homeFacility} | Auth#: ${authorizationNumber} | ${guestNotes}`,
        patient_response: null,
      }

      const { error } = await supabase.from("dosing_log").insert(doseLog)

      if (error) throw error

      toast({
        title: "Guest Dose Dispensed",
        description: `${doseAmount}mg ${medication} dispensed to guest patient`,
      })

      // Reset form
      setSelectedPatient(null)
      setHomeFacility("")
      setAuthorizationNumber("")
      setDoseAmount("")
      setGuestNotes("")
      setVerifiedIdentity(false)
      setSearchQuery("")
    } catch (error) {
      console.error("Error dispensing guest dose:", error)
      toast({
        title: "Dispensing Error",
        description: "Failed to record guest dose",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader />
        <main className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Guest Dosing</h1>
              <p className="text-muted-foreground mt-2">Dispense medication to patients from other OTP facilities</p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Guest Dosing Protocol</AlertTitle>
              <AlertDescription>
                Guest dosing requires verification of patient identity, home facility authorization, and proper
                documentation. All guest doses must be reported to the patient's home facility.
              </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Patient Search */}
              <Card>
                <CardHeader>
                  <CardTitle>Patient Lookup</CardTitle>
                  <CardDescription>Search for patient by name or client number</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Search patient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredPatients.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No patients found</p>
                      ) : (
                        filteredPatients.slice(0, 10).map((patient: any) => (
                          <div
                            key={patient.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedPatient?.id === patient.id ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"
                            }`}
                            onClick={() => {
                              setSelectedPatient(patient)
                              setVerifiedIdentity(false)
                            }}
                          >
                            <p className="font-medium">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              DOB: {patient.date_of_birth} • #{patient.client_number}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Patient Info & Verification */}
              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                  <CardDescription>Verify patient identity before dispensing</CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedPatient ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserCheck className="h-8 w-8 mx-auto mb-2" />
                      <p>Select a patient to continue</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium">
                          {selectedPatient.first_name} {selectedPatient.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">DOB: {selectedPatient.date_of_birth}</p>
                        <p className="text-sm text-muted-foreground">Client #: {selectedPatient.client_number}</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Verification Method</Label>
                        <Select value={verificationMethod} onValueChange={(v: any) => setVerificationMethod(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="id">Photo ID</SelectItem>
                            <SelectItem value="pin">PIN Entry</SelectItem>
                            <SelectItem value="biometric">Biometric Scan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {verifiedIdentity ? (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-800">Identity Verified</AlertTitle>
                          <AlertDescription className="text-green-700">
                            Patient verified via {verificationMethod.toUpperCase()}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Button onClick={handleVerifyIdentity} className="w-full">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Verify Identity
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Guest Dosing Form */}
            <Card>
              <CardHeader>
                <CardTitle>Guest Dosing Authorization</CardTitle>
                <CardDescription>Verify authorization from home facility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Home Facility Name *</Label>
                    <Input
                      placeholder="Enter home facility name"
                      value={homeFacility}
                      onChange={(e) => setHomeFacility(e.target.value)}
                      disabled={!verifiedIdentity}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Authorization Number *</Label>
                    <Input
                      placeholder="Enter authorization #"
                      value={authorizationNumber}
                      onChange={(e) => setAuthorizationNumber(e.target.value)}
                      disabled={!verifiedIdentity}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Medication *</Label>
                    <Select value={medication} onValueChange={setMedication} disabled={!verifiedIdentity}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="methadone">Methadone</SelectItem>
                        <SelectItem value="suboxone">Suboxone</SelectItem>
                        <SelectItem value="buprenorphine">Buprenorphine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dose Amount (mg) *</Label>
                    <Input
                      type="number"
                      placeholder="Enter dose"
                      value={doseAmount}
                      onChange={(e) => setDoseAmount(e.target.value)}
                      disabled={!verifiedIdentity}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Guest Dosing Notes</Label>
                  <Textarea
                    placeholder="Enter any additional notes about guest dosing..."
                    value={guestNotes}
                    onChange={(e) => setGuestNotes(e.target.value)}
                    disabled={!verifiedIdentity}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleGuestDose}
                  disabled={!verifiedIdentity || !homeFacility || !authorizationNumber || !doseAmount}
                  className="w-full"
                  size="lg"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Dispense Guest Dose
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
