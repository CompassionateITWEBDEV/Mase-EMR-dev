"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Package, Smartphone, Lock, Search, Plus, AlertCircle, Printer } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function PatientPropertyPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<string>("")

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader
          title="Patient Property Management"
          description="Track lockboxes, smartphones, and other issued items"
        />

        <div className="p-6 space-y-6">
          {/* Search and Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by patient name, ID, or serial number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Issue Property
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Issue Property to Patient</DialogTitle>
                  <DialogDescription>Record issued lockbox or smartphone with patient signature</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patient *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="p1">John Doe - #12345</SelectItem>
                          <SelectItem value="p2">Sarah Johnson - #12346</SelectItem>
                          <SelectItem value="p3">Michael Thompson - #12347</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Property Type *</Label>
                      <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lockbox">Lockbox</SelectItem>
                          <SelectItem value="smartphone">Smartphone</SelectItem>
                          <SelectItem value="tablet">Tablet</SelectItem>
                          <SelectItem value="other">Other Equipment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Serial Number *</Label>
                      <Input placeholder="Enter serial number" />
                    </div>

                    <div className="space-y-2">
                      <Label>Asset ID</Label>
                      <Input placeholder="Internal asset ID" />
                    </div>
                  </div>

                  {selectedProperty === "smartphone" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input placeholder="(555) 123-4567" />
                      </div>

                      <div className="space-y-2">
                        <Label>IMEI Number</Label>
                        <Input placeholder="Enter IMEI" />
                      </div>
                    </div>
                  )}

                  {selectedProperty === "lockbox" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Lock Combination</Label>
                        <Input type="password" placeholder="Enter combination" />
                      </div>

                      <div className="space-y-2">
                        <Label>Key Number</Label>
                        <Input placeholder="If applicable" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="refurbished">Refurbished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Purpose/Notes</Label>
                    <Textarea placeholder="Reason for issuance, special instructions..." rows={3} />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Patient Signature</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Signature Method</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pin">PIN Verification</SelectItem>
                            <SelectItem value="fingerprint">Fingerprint</SelectItem>
                            <SelectItem value="facial">Facial Recognition</SelectItem>
                            <SelectItem value="written">Written Signature</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Issued By (Staff)</Label>
                        <Input placeholder="Your name" defaultValue="Current User" disabled />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button>
                    <Printer className="h-4 w-4 mr-2" />
                    Issue & Print Receipt
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Issued</p>
                    <p className="text-2xl font-bold">127</p>
                  </div>
                  <Package className="h-8 w-8 text-cyan-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Lockboxes Out</p>
                    <p className="text-2xl font-bold">84</p>
                  </div>
                  <Lock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Smartphones Out</p>
                    <p className="text-2xl font-bold">43</p>
                  </div>
                  <Smartphone className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue Returns</p>
                    <p className="text-2xl font-bold text-red-600">7</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Records Tabs */}
          <Tabs defaultValue="issued" className="space-y-4">
            <TabsList>
              <TabsTrigger value="issued">Issued (127)</TabsTrigger>
              <TabsTrigger value="returned">Returned (456)</TabsTrigger>
              <TabsTrigger value="overdue">Overdue (7)</TabsTrigger>
              <TabsTrigger value="damaged">Damaged/Lost (12)</TabsTrigger>
            </TabsList>

            <TabsContent value="issued" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {[
                      {
                        patient: "John Doe",
                        id: "#12345",
                        item: "Lockbox",
                        serial: "LB-2024-0145",
                        date: "12/20/2024",
                        status: "issued",
                      },
                      {
                        patient: "Sarah Johnson",
                        id: "#12346",
                        item: "Smartphone",
                        serial: "SP-2024-0892",
                        date: "12/18/2024",
                        status: "issued",
                      },
                      {
                        patient: "Michael Thompson",
                        id: "#12347",
                        item: "Tablet",
                        serial: "TB-2024-0321",
                        date: "12/15/2024",
                        status: "issued",
                      },
                    ].map((record, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div className="flex items-center gap-4">
                          {record.item === "Lockbox" ? (
                            <Lock className="h-8 w-8 text-blue-600" />
                          ) : record.item === "Smartphone" ? (
                            <Smartphone className="h-8 w-8 text-purple-600" />
                          ) : (
                            <Package className="h-8 w-8 text-cyan-600" />
                          )}
                          <div>
                            <p className="font-medium">
                              {record.patient} {record.id}
                            </p>
                            <p className="text-sm text-gray-600">
                              {record.item} - Serial: {record.serial}
                            </p>
                            <p className="text-xs text-gray-500">Issued: {record.date}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                          <Button variant="outline" size="sm">
                            Process Return
                          </Button>
                          <Button variant="outline" size="sm">
                            Print Receipt
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overdue">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Overdue Returns
                  </CardTitle>
                  <CardDescription>Items not returned by expected date</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-4">
                        <Lock className="h-8 w-8 text-red-600" />
                        <div>
                          <p className="font-medium">Robert Martinez #12350</p>
                          <p className="text-sm text-gray-600">Lockbox - Serial: LB-2024-0098</p>
                          <p className="text-xs text-red-600">Expected return: 12/10/2024 (20 days overdue)</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">Overdue</Badge>
                        <Button variant="outline" size="sm">
                          Send Reminder
                        </Button>
                        <Button variant="outline" size="sm">
                          Report Lost
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
