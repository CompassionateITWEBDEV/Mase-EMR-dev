"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Plus, FileText, Clock, CheckCircle, XCircle, Send } from "lucide-react"

export function PriorAuthorizationManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [authRequests, setAuthRequests] = useState([
    {
      id: "PA-2024-001",
      patient: "John Doe (#1001)",
      insurance: "BlueCross BlueShield",
      serviceType: "Intensive Outpatient Program",
      requestedUnits: 30,
      requestDate: "2024-01-15",
      status: "approved",
      approvedUnits: 30,
      authNumber: "AUTH-BC-789456",
      validFrom: "2024-01-20",
      validTo: "2024-03-20",
    },
    {
      id: "PA-2024-002",
      patient: "Sarah Johnson (#1042)",
      insurance: "Aetna",
      serviceType: "Medication Assisted Treatment",
      requestedUnits: 60,
      requestDate: "2024-01-18",
      status: "pending",
      submittedTo: "Aetna Prior Auth Dept",
    },
    {
      id: "PA-2024-003",
      patient: "Michael Chen (#1078)",
      insurance: "Medicare",
      serviceType: "Individual Therapy",
      requestedUnits: 12,
      requestDate: "2024-01-10",
      status: "denied",
      denialReason: "Medical necessity not established",
      appealDeadline: "2024-02-10",
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "denied":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Denied
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Prior Authorization Management</h2>
          <p className="text-muted-foreground">Submit and track prior authorization requests</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Authorization Request
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authRequests.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {authRequests.filter((a) => a.status === "approved").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((authRequests.filter((a) => a.status === "approved").length / authRequests.length) * 100)}%
              approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {authRequests.filter((a) => a.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting decision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {authRequests.filter((a) => a.status === "denied").length}
            </div>
            <p className="text-xs text-muted-foreground">Requires appeal</p>
          </CardContent>
        </Card>
      </div>

      {/* Authorization Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Authorization Requests</CardTitle>
          <CardDescription>View and manage all prior authorization requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Units Requested</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authRequests.map((auth) => (
                <TableRow key={auth.id}>
                  <TableCell className="font-medium">{auth.id}</TableCell>
                  <TableCell>{auth.patient}</TableCell>
                  <TableCell>{auth.insurance}</TableCell>
                  <TableCell>{auth.serviceType}</TableCell>
                  <TableCell>{auth.requestedUnits}</TableCell>
                  <TableCell>{auth.requestDate}</TableCell>
                  <TableCell>{getStatusBadge(auth.status)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <FileText className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Auth Request Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Prior Authorization Request</DialogTitle>
            <DialogDescription>Submit a new prior authorization request to the insurance payer</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1001">John Doe (#1001)</SelectItem>
                    <SelectItem value="1042">Sarah Johnson (#1042)</SelectItem>
                    <SelectItem value="1078">Michael Chen (#1078)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Insurance Payer</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select insurance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bcbs">BlueCross BlueShield</SelectItem>
                    <SelectItem value="aetna">Aetna</SelectItem>
                    <SelectItem value="medicare">Medicare</SelectItem>
                    <SelectItem value="medicaid">Medicaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iop">Intensive Outpatient Program</SelectItem>
                  <SelectItem value="mat">Medication Assisted Treatment</SelectItem>
                  <SelectItem value="therapy">Individual Therapy</SelectItem>
                  <SelectItem value="group">Group Therapy</SelectItem>
                  <SelectItem value="php">Partial Hospitalization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Units Requested</Label>
                <Input type="number" placeholder="e.g., 30" />
              </div>

              <div className="space-y-2">
                <Label>Service Period</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Clinical Justification</Label>
              <Textarea placeholder="Provide medical necessity justification..." rows={4} />
            </div>

            <div className="space-y-2">
              <Label>Supporting Documentation</Label>
              <Button variant="outline" className="w-full bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Attach Clinical Documents
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
