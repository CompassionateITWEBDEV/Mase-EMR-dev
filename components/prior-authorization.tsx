"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { FileCheck, Clock, CheckCircle, XCircle, AlertTriangle, Plus, Eye, Send, RefreshCw } from "lucide-react"

interface PriorAuth {
  id: string
  patientName: string
  service: string
  status: "pending" | "approved" | "denied" | "expired"
  submittedDate: string
  responseDate?: string
  authNumber?: string
  expirationDate?: string
  notes?: string
  urgencyLevel?: string
  payerName?: string
  providerName?: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function PriorAuthorization() {
  const { data, error, isLoading, mutate } = useSWR<{ priorAuths: PriorAuth[] }>("/api/prior-auth", fetcher)
  const [showNewForm, setShowNewForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newAuth, setNewAuth] = useState({
    patientName: "",
    service: "",
    diagnosis: "",
    justification: "",
    urgency: "routine",
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "denied":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <FileCheck className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default"
      case "denied":
        return "destructive"
      case "pending":
        return "secondary"
      case "expired":
        return "outline"
      default:
        return "secondary"
    }
  }

  const handleSubmitAuth = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/prior-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAuth),
      })

      if (response.ok) {
        setNewAuth({
          patientName: "",
          service: "",
          diagnosis: "",
          justification: "",
          urgency: "routine",
        })
        setShowNewForm(false)
        mutate() // Refresh the list
      }
    } catch (err) {
      console.error("Error submitting prior auth:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const priorAuths = data?.priorAuths || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Prior Authorization Management</h2>
          <p className="text-muted-foreground">Submit and track prior authorization requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => mutate()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowNewForm(!showNewForm)} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            New Prior Auth
          </Button>
        </div>
      </div>

      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Submit New Prior Authorization</CardTitle>
            <CardDescription>Complete the form below to submit a new prior authorization request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  value={newAuth.patientName}
                  onChange={(e) => setNewAuth({ ...newAuth, patientName: e.target.value })}
                  placeholder="Enter patient name"
                />
              </div>
              <div>
                <Label htmlFor="service">Service/Treatment</Label>
                <Select value={newAuth.service} onValueChange={(value) => setNewAuth({ ...newAuth, service: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iop">Intensive Outpatient Program (IOP)</SelectItem>
                    <SelectItem value="php">Partial Hospitalization Program (PHP)</SelectItem>
                    <SelectItem value="residential">Residential Treatment</SelectItem>
                    <SelectItem value="mat">Medication Assisted Treatment</SelectItem>
                    <SelectItem value="detox">Medical Detoxification</SelectItem>
                    <SelectItem value="counseling">Individual/Group Counseling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="diagnosis">Primary Diagnosis</Label>
                <Input
                  id="diagnosis"
                  value={newAuth.diagnosis}
                  onChange={(e) => setNewAuth({ ...newAuth, diagnosis: e.target.value })}
                  placeholder="ICD-10 code and description"
                />
              </div>
              <div>
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select value={newAuth.urgency} onValueChange={(value) => setNewAuth({ ...newAuth, urgency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine (5-7 business days)</SelectItem>
                    <SelectItem value="urgent">Urgent (24-48 hours)</SelectItem>
                    <SelectItem value="emergent">Emergent (Same day)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="justification">Medical Necessity Justification</Label>
              <Textarea
                id="justification"
                value={newAuth.justification}
                onChange={(e) => setNewAuth({ ...newAuth, justification: e.target.value })}
                placeholder="Provide detailed justification for medical necessity..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSubmitAuth} className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Submit Authorization"}
              </Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Prior Authorization Requests</CardTitle>
          <CardDescription>Track the status of submitted prior authorization requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p>Failed to load prior authorizations</p>
              <Button variant="outline" onClick={() => mutate()} className="mt-2">
                Try Again
              </Button>
            </div>
          ) : priorAuths.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileCheck className="h-8 w-8 mx-auto mb-2" />
              <p>No prior authorization requests found</p>
              <p className="text-sm">Click &quot;New Prior Auth&quot; to submit a request</p>
            </div>
          ) : (
            <div className="space-y-4">
              {priorAuths.map((auth) => (
                <div key={auth.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{auth.patientName}</h4>
                        <Badge variant="outline">{auth.id}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{auth.service}</p>
                      {auth.payerName && <p className="text-xs text-muted-foreground">Payer: {auth.payerName}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(auth.status)}
                      <Badge variant={getStatusColor(auth.status)}>{auth.status.toUpperCase()}</Badge>
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3 text-sm">
                    <div>
                      <span className="font-medium">Submitted:</span> {auth.submittedDate}
                    </div>
                    {auth.responseDate && (
                      <div>
                        <span className="font-medium">Response:</span> {auth.responseDate}
                      </div>
                    )}
                    {auth.authNumber && (
                      <div>
                        <span className="font-medium">Auth #:</span> {auth.authNumber}
                      </div>
                    )}
                  </div>

                  {auth.expirationDate && (
                    <div className="text-sm">
                      <span className="font-medium">Expires:</span> {auth.expirationDate}
                    </div>
                  )}

                  {auth.notes && (
                    <div className="text-sm">
                      <span className="font-medium">Notes:</span> {auth.notes}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    {auth.status === "pending" && (
                      <Button variant="outline" size="sm">
                        <FileCheck className="mr-2 h-4 w-4" />
                        Check Status
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
