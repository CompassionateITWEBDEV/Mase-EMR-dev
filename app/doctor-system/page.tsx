"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Send, Pill, ClipboardCheck, CheckCircle, Plus, Search, Fingerprint, Lock } from "lucide-react"

export default function DoctorSystemPage() {
  const [selectedPatient, setSelectedPatient] = useState("")
  const [treatmentPlanDialogOpen, setTreatmentPlanDialogOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false)
  const [referralDialogOpen, setReferralDialogOpen] = useState(false)
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [signatureMethod, setSignatureMethod] = useState("pin")
  const [pinValue, setPinValue] = useState("")

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Physician Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Medical treatment planning, orders, prescriptions, and MAPS integration
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setTreatmentPlanDialogOpen(true)} className="bg-cyan-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Treatment Plan
                </Button>
                <Button onClick={() => setPrescriptionDialogOpen(true)} variant="outline">
                  <Send className="w-4 h-4 mr-2" />
                  E-Prescribe
                </Button>
              </div>
            </div>

            {/* Patient Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Select Patient
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Search Patient</Label>
                    <Input placeholder="Search by name or MRN..." />
                  </div>
                  <div>
                    <Label>My Patient Panel</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select from your panel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient1">Sarah Johnson - Follow-up Due</SelectItem>
                        <SelectItem value="patient2">Michael Chen - New Order</SelectItem>
                        <SelectItem value="patient3">Emily Davis - Medication Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="orders" className="space-y-4">
              <TabsList>
                <TabsTrigger value="orders">Order Queue</TabsTrigger>
                <TabsTrigger value="treatment">Treatment Plans</TabsTrigger>
                <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
              </TabsList>

              {/* Order Queue Tab */}
              <TabsContent value="orders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-cyan-600" />
                      Pending Medication Orders
                      <Badge variant="destructive" className="ml-2">
                        8 Pending
                      </Badge>
                    </CardTitle>
                    <CardDescription>Review and sign medication orders from nursing staff</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          patient: "Sarah Johnson",
                          medication: "Methadone",
                          currentDose: "80mg",
                          requestedDose: "90mg",
                          reason: "Patient reports persistent cravings",
                          requestedBy: "Nurse Kelly",
                          priority: "routine",
                        },
                        {
                          patient: "Michael Chen",
                          medication: "Buprenorphine",
                          currentDose: "16mg",
                          requestedDose: "12mg",
                          reason: "Patient stabilized, ready for taper",
                          requestedBy: "Nurse Maria",
                          priority: "routine",
                        },
                        {
                          patient: "Emily Davis",
                          medication: "Methadone",
                          currentDose: "60mg",
                          requestedDose: "Hold Dose",
                          reason: "Positive UDS for benzodiazepines",
                          requestedBy: "Nurse John",
                          priority: "urgent",
                        },
                      ].map((order, idx) => (
                        <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-semibold text-lg">{order.patient}</div>
                              <div className="text-sm text-gray-600">Requested by {order.requestedBy}</div>
                            </div>
                            <Badge variant={order.priority === "urgent" ? "destructive" : "secondary"}>
                              {order.priority}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                            <div>
                              <span className="text-gray-600">Medication:</span>
                              <span className="ml-2 font-medium">{order.medication}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Current:</span>
                              <span className="ml-2 font-medium">{order.currentDose}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Requested:</span>
                              <span className="ml-2 font-medium text-cyan-600">{order.requestedDose}</span>
                            </div>
                          </div>
                          <div className="text-sm mb-3">
                            <span className="text-gray-600">Clinical Justification:</span>
                            <p className="mt-1">{order.reason}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600"
                              onClick={() => {
                                setSignatureDialogOpen(true)
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve & Sign
                            </Button>
                            <Button size="sm" variant="outline">
                              Request More Info
                            </Button>
                            <Button size="sm" variant="destructive">
                              Deny
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Treatment Plans Tab */}
              <TabsContent value="treatment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Treatment Plans</CardTitle>
                    <CardDescription>Create and manage comprehensive medical treatment plans</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          patient: "Sarah Johnson",
                          diagnosis: "Opioid Use Disorder",
                          plan: "MAT with Methadone 80mg daily",
                          status: "active",
                        },
                        {
                          patient: "Michael Chen",
                          diagnosis: "Opioid Use Disorder",
                          plan: "MAT with Buprenorphine 16mg daily",
                          status: "active",
                        },
                      ].map((plan, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">{plan.patient}</div>
                            <Badge variant="default">Active</Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>Diagnosis:</strong> {plan.diagnosis}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Treatment:</strong> {plan.plan}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline">
                              View Full Plan
                            </Button>
                            <Button size="sm" variant="outline">
                              Modify
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Prescriptions Tab */}
              <TabsContent value="prescriptions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Pill className="w-5 h-5 text-cyan-600" />
                          E-Prescribing & MAPS Integration
                        </CardTitle>
                        <CardDescription>Electronic prescribing with PDMP/MAPS monitoring</CardDescription>
                      </div>
                      <Button onClick={() => setPrescriptionDialogOpen(true)} className="bg-cyan-600">
                        <Plus className="w-4 h-4 mr-2" />
                        New Prescription
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          patient: "Sarah Johnson",
                          medication: "Methadone 80mg",
                          pharmacy: "Main Street Pharmacy",
                          status: "active",
                          lastFill: "3 days ago",
                        },
                        {
                          patient: "Michael Chen",
                          medication: "Buprenorphine 16mg",
                          pharmacy: "Care Pharmacy",
                          status: "active",
                          lastFill: "1 week ago",
                        },
                      ].map((rx, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-semibold">{rx.patient}</div>
                              <div className="text-sm text-gray-600">{rx.medication}</div>
                            </div>
                            <Badge variant="default">Active</Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Pharmacy:</strong> {rx.pharmacy}
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            <strong>Last Fill:</strong> {rx.lastFill}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Check MAPS/PDMP
                            </Button>
                            <Button size="sm" variant="outline">
                              Modify
                            </Button>
                            <Button size="sm" variant="outline">
                              Discontinue
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Referrals Tab */}
              <TabsContent value="referrals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Specialist Referrals</CardTitle>
                      <Button onClick={() => setReferralDialogOpen(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        New Referral
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          patient: "Sarah Johnson",
                          specialty: "Psychiatry",
                          reason: "Anxiety disorder management",
                          status: "pending",
                        },
                        {
                          patient: "Michael Chen",
                          specialty: "Pain Management",
                          reason: "Chronic back pain",
                          status: "scheduled",
                        },
                      ].map((referral, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">{referral.patient}</div>
                            <Badge variant={referral.status === "scheduled" ? "default" : "secondary"}>
                              {referral.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>Specialty:</strong> {referral.specialty}
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Reason:</strong> {referral.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Medical Order</DialogTitle>
            <DialogDescription>Authenticate using PIN or biometric verification</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={signatureMethod === "pin" ? "default" : "outline"}
                onClick={() => setSignatureMethod("pin")}
                className="flex-1"
              >
                <Lock className="w-4 h-4 mr-2" />
                PIN
              </Button>
              <Button
                variant={signatureMethod === "fingerprint" ? "default" : "outline"}
                onClick={() => setSignatureMethod("fingerprint")}
                className="flex-1"
              >
                <Fingerprint className="w-4 h-4 mr-2" />
                Fingerprint
              </Button>
            </div>

            {signatureMethod === "pin" && (
              <div>
                <Label>Enter 4-Digit PIN</Label>
                <Input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value)}
                />
              </div>
            )}

            {signatureMethod === "fingerprint" && (
              <div className="flex flex-col items-center justify-center py-8">
                <Fingerprint className="w-24 h-24 text-cyan-600 mb-4" />
                <p className="text-center text-gray-600">Place your finger on the scanner to authenticate</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignatureDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600">Approve & Sign Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Other dialogs can be added as needed */}
    </div>
  )
}
