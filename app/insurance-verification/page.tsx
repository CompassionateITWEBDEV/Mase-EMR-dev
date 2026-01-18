"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Shield, CheckCircle, XCircle, AlertTriangle, Search, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function InsuranceVerificationPage() {
  const [selectedPatient, setSelectedPatient] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)

  const { data: verifications, mutate } = useSWR("/api/insurance-verification", fetcher)
  const { data: patientsData } = useSWR("/api/patients?limit=100", fetcher)

  const patients = patientsData?.patients || []

  const handleVerify = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient")
      return
    }

    setIsVerifying(true)
    try {
      const response = await fetch("/api/insurance-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient,
          serviceType: "outpatient",
        }),
      })

      if (!response.ok) throw new Error("Verification failed")

      const result = await response.json()
      toast.success("Insurance verified successfully")
      mutate()
      setShowNewDialog(false)
      setSelectedPatient("")
    } catch (error) {
      toast.error("Failed to verify insurance")
    } finally {
      setIsVerifying(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary">
            <RefreshCw className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="border-b bg-card">
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Insurance Eligibility Verification
              </h1>
              <p className="text-muted-foreground mt-1">Real-time insurance verification and benefits checking</p>
            </div>
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Verify Insurance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Verify Patient Insurance</DialogTitle>
                  <DialogDescription>Check real-time insurance eligibility and benefits</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Patient</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.first_name} {p.last_name} - {p.patient_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleVerify} disabled={isVerifying} className="w-full">
                    {isVerifying ? "Verifying..." : "Run Verification"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{verifications?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {verifications?.filter((v: any) => v.eligibility_status === "active").length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Auth Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {verifications?.filter((v: any) => v.authorization_required).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {verifications?.filter((v: any) => v.eligibility_status === "error").length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Verifications</CardTitle>
              <CardDescription>Insurance eligibility checks performed in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {verifications?.slice(0, 10).map((verification: any) => (
                  <div key={verification.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {verification.patients?.first_name} {verification.patients?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {verification.patient_insurance?.insurance_name} -{" "}
                        {verification.patient_insurance?.policy_number}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Verified: {new Date(verification.verification_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      {getStatusBadge(verification.eligibility_status)}
                      {verification.authorization_required && (
                        <Badge variant="outline" className="ml-2">
                          Auth Required
                        </Badge>
                      )}
                      {verification.copay_amount && (
                        <div className="text-sm text-muted-foreground">Copay: ${verification.copay_amount}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
