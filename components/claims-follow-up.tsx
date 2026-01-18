"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Clock, Phone, FileText, XCircle, MessageSquare } from "lucide-react"

export function ClaimsFollowUp() {
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false)
  const [pendingClaims, setPendingClaims] = useState([
    {
      id: "CLM-2024-0132",
      patient: "John Doe (#1001)",
      insurance: "BlueCross BlueShield",
      serviceDate: "2023-12-15",
      billedAmount: 1575.0,
      submitDate: "2023-12-20",
      daysOutstanding: 30,
      lastFollowUp: "2024-01-10",
      status: "pending_review",
      notes: "Waiting for medical records review",
    },
    {
      id: "CLM-2024-0098",
      patient: "Sarah Johnson (#1042)",
      insurance: "Aetna",
      serviceDate: "2023-12-01",
      billedAmount: 2100.0,
      submitDate: "2023-12-05",
      daysOutstanding: 45,
      lastFollowUp: "2024-01-05",
      status: "information_requested",
      notes: "Payer requested additional clinical documentation",
    },
    {
      id: "CLM-2024-0076",
      patient: "Michael Chen (#1078)",
      insurance: "Medicare",
      serviceDate: "2023-11-20",
      billedAmount: 945.0,
      submitDate: "2023-11-25",
      daysOutstanding: 56,
      lastFollowUp: "2023-12-15",
      status: "overdue",
      notes: "No response from payer. Requires escalation.",
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      case "information_requested":
        return <Badge className="bg-blue-100 text-blue-800">Info Requested</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityLevel = (days: number) => {
    if (days > 45) return { label: "High", color: "text-red-600" }
    if (days > 30) return { label: "Medium", color: "text-yellow-600" }
    return { label: "Normal", color: "text-green-600" }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Claims Follow-Up Tracking</h2>
          <p className="text-muted-foreground">Monitor and manage outstanding insurance claims</p>
        </div>
        <Button onClick={() => setShowFollowUpDialog(true)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Log Follow-Up
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingClaims.length}</div>
            <p className="text-xs text-muted-foreground">Require follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${pendingClaims.reduce((sum, claim) => sum + claim.billedAmount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Days Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {Math.round(pendingClaims.reduce((sum, claim) => sum + claim.daysOutstanding, 0) / pendingClaims.length)}
            </div>
            <p className="text-xs text-muted-foreground">Days in AR</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Claims</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {pendingClaims.filter((c) => c.status === "overdue").length}
            </div>
            <p className="text-xs text-muted-foreground">Over 45 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Claims</TabsTrigger>
          <TabsTrigger value="overdue">Overdue (45+ days)</TabsTrigger>
          <TabsTrigger value="activity">Follow-Up Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Claims Requiring Follow-Up</CardTitle>
              <CardDescription>Claims awaiting insurance response or additional action</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Service Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Days Out</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingClaims.map((claim) => {
                    const priority = getPriorityLevel(claim.daysOutstanding)
                    return (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium">{claim.id}</TableCell>
                        <TableCell>{claim.patient}</TableCell>
                        <TableCell>{claim.insurance}</TableCell>
                        <TableCell>{claim.serviceDate}</TableCell>
                        <TableCell className="font-semibold">${claim.billedAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={priority.color}>{claim.daysOutstanding} days</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              priority.label === "High"
                                ? "bg-red-100 text-red-800"
                                : priority.label === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }
                          >
                            {priority.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(claim.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Phone className="h-3 w-3 mr-1" />
                              Call
                            </Button>
                            <Button size="sm" variant="outline">
                              <FileText className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Claims (45+ days)</CardTitle>
              <CardDescription>Claims requiring immediate escalation</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Days Outstanding</TableHead>
                    <TableHead>Last Follow-Up</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingClaims
                    .filter((c) => c.daysOutstanding > 45)
                    .map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium">{claim.id}</TableCell>
                        <TableCell>{claim.patient}</TableCell>
                        <TableCell>{claim.insurance}</TableCell>
                        <TableCell className="font-semibold text-red-600">
                          ${claim.billedAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-red-600 font-semibold">{claim.daysOutstanding} days</TableCell>
                        <TableCell>{claim.lastFollowUp}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Escalate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Follow-Up Activity Log</CardTitle>
              <CardDescription>Recent follow-up actions and communications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    date: "2024-01-19 2:30 PM",
                    claim: "CLM-2024-0132",
                    action: "Phone Call",
                    user: "Billing Staff",
                    notes: "Spoke with rep Sarah - claim is in medical review queue",
                  },
                  {
                    date: "2024-01-18 10:15 AM",
                    claim: "CLM-2024-0098",
                    action: "Document Submission",
                    user: "Billing Manager",
                    notes: "Submitted additional clinical documentation via payer portal",
                  },
                  {
                    date: "2024-01-17 3:45 PM",
                    claim: "CLM-2024-0076",
                    action: "Email",
                    user: "Billing Staff",
                    notes: "Sent follow-up email to claims department - no response yet",
                  },
                ].map((activity, index) => (
                  <div key={index} className="flex gap-4 border-b pb-4 last:border-0">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        {activity.action === "Phone Call" ? (
                          <Phone className="h-5 w-5 text-blue-600" />
                        ) : activity.action === "Email" ? (
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{activity.action}</span>
                        <span className="text-sm text-muted-foreground">{activity.date}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {activity.claim} · {activity.user}
                      </div>
                      <p className="text-sm">{activity.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Follow-Up Dialog */}
      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Follow-Up Activity</DialogTitle>
            <DialogDescription>Record communication with insurance payer</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Claim ID</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select claim" />
                </SelectTrigger>
                <SelectContent>
                  {pendingClaims.map((claim) => (
                    <SelectItem key={claim.id} value={claim.id}>
                      {claim.id} - {claim.patient}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Follow-Up Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="portal">Payer Portal</SelectItem>
                  <SelectItem value="fax">Fax</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Person</label>
              <Input placeholder="Name of insurance representative" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea placeholder="Detail the follow-up conversation and any next steps..." rows={4} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Next Follow-Up Date</label>
              <Input type="date" />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowFollowUpDialog(false)}>
              Cancel
            </Button>
            <Button>Save Follow-Up</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
