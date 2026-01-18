"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Shield, UserPlus, Clock, AlertTriangle, CheckCircle, Eye, FileText, Calendar, Building } from "lucide-react"
import { format, addDays } from "date-fns"

interface RegulatoryAccess {
  id: string
  inspectorName: string
  organization: string
  accessType: "dea" | "joint_commission" | "state" | "other"
  grantedAt: string
  expiresAt: string
  grantedBy: string
  status: "active" | "expired" | "revoked"
  permissions: string[]
  accessCode: string
}

export function RegulatoryAccessControl() {
  const [activeAccess, setActiveAccess] = useState<RegulatoryAccess[]>([
    {
      id: "ACC-001",
      inspectorName: "Agent Michael Rodriguez",
      organization: "DEA District Office",
      accessType: "dea",
      grantedAt: "2024-01-15T09:00:00Z",
      expiresAt: "2024-01-17T17:00:00Z",
      grantedBy: "Dr. Sarah Johnson",
      status: "active",
      permissions: ["view_inventory", "view_dispensing", "view_acquisition", "generate_reports"],
      accessCode: "DEA-2024-001",
    },
    {
      id: "ACC-002",
      inspectorName: "Dr. Patricia Chen",
      organization: "Joint Commission",
      accessType: "joint_commission",
      grantedAt: "2024-01-10T08:00:00Z",
      expiresAt: "2024-01-20T18:00:00Z",
      grantedBy: "Dr. Sarah Johnson",
      status: "active",
      permissions: ["view_quality_measures", "view_patient_safety", "view_policies", "generate_reports"],
      accessCode: "JC-2024-002",
    },
  ])

  const [showGrantDialog, setShowGrantDialog] = useState(false)
  const [newAccess, setNewAccess] = useState({
    inspectorName: "",
    organization: "",
    accessType: "",
    duration: "3",
    permissions: [] as string[],
    notes: "",
  })

  const getAccessTypeIcon = (type: string) => {
    switch (type) {
      case "dea":
        return <Shield className="h-4 w-4 text-blue-600" />
      case "joint_commission":
        return <FileText className="h-4 w-4 text-emerald-600" />
      case "state":
        return <Building className="h-4 w-4 text-purple-600" />
      default:
        return <Eye className="h-4 w-4 text-gray-600" />
    }
  }

  const getAccessTypeBadge = (type: string) => {
    switch (type) {
      case "dea":
        return <Badge className="bg-blue-100 text-blue-800">DEA</Badge>
      case "joint_commission":
        return <Badge className="bg-emerald-100 text-emerald-800">Joint Commission</Badge>
      case "state":
        return <Badge className="bg-purple-100 text-purple-800">State</Badge>
      default:
        return <Badge variant="outline">Other</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "expired":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "revoked":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const handleGrantAccess = () => {
    const expiresAt = addDays(new Date(), Number.parseInt(newAccess.duration))
    const accessCode = `${newAccess.accessType.toUpperCase()}-${new Date().getFullYear()}-${String(activeAccess.length + 1).padStart(3, "0")}`

    const newAccessRecord: RegulatoryAccess = {
      id: `ACC-${String(activeAccess.length + 1).padStart(3, "0")}`,
      inspectorName: newAccess.inspectorName,
      organization: newAccess.organization,
      accessType: newAccess.accessType as any,
      grantedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      grantedBy: "Dr. Sarah Johnson",
      status: "active",
      permissions: newAccess.permissions,
      accessCode,
    }

    setActiveAccess([newAccessRecord, ...activeAccess])
    setShowGrantDialog(false)
    setNewAccess({
      inspectorName: "",
      organization: "",
      accessType: "",
      duration: "3",
      permissions: [],
      notes: "",
    })
  }

  const handleRevokeAccess = (id: string) => {
    setActiveAccess(
      activeAccess.map((access) => (access.id === id ? { ...access, status: "revoked" as const } : access)),
    )
  }

  const availablePermissions = {
    dea: [
      "view_inventory",
      "view_dispensing",
      "view_acquisition",
      "view_waste_disposal",
      "view_security_records",
      "generate_reports",
    ],
    joint_commission: [
      "view_quality_measures",
      "view_patient_safety",
      "view_policies",
      "view_staff_competency",
      "view_performance_improvement",
      "generate_reports",
    ],
    state: ["view_licensing", "view_facility_records", "view_staff_credentials", "view_policies", "generate_reports"],
  }

  return (
    <div className="space-y-6">
      {/* Active Access Sessions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Active Regulatory Access</CardTitle>
              <CardDescription>Currently granted inspector and surveyor access</CardDescription>
            </div>
            <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Grant Access
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Grant Regulatory Access</DialogTitle>
                  <DialogDescription>Provide temporary access to regulatory inspectors or surveyors</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Inspector/Surveyor Name</Label>
                      <Input
                        placeholder="Enter full name"
                        value={newAccess.inspectorName}
                        onChange={(e) => setNewAccess({ ...newAccess, inspectorName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Organization</Label>
                      <Input
                        placeholder="DEA, Joint Commission, etc."
                        value={newAccess.organization}
                        onChange={(e) => setNewAccess({ ...newAccess, organization: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Access Type</Label>
                      <Select
                        value={newAccess.accessType}
                        onValueChange={(value) => setNewAccess({ ...newAccess, accessType: value, permissions: [] })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select access type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dea">DEA Inspection</SelectItem>
                          <SelectItem value="joint_commission">Joint Commission Survey</SelectItem>
                          <SelectItem value="state">State Inspection</SelectItem>
                          <SelectItem value="other">Other Regulatory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Access Duration</Label>
                      <Select
                        value={newAccess.duration}
                        onValueChange={(value) => setNewAccess({ ...newAccess, duration: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="3">3 days</SelectItem>
                          <SelectItem value="7">1 week</SelectItem>
                          <SelectItem value="14">2 weeks</SelectItem>
                          <SelectItem value="30">1 month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {newAccess.accessType && (
                    <div>
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {availablePermissions[newAccess.accessType as keyof typeof availablePermissions]?.map(
                          (permission) => (
                            <div key={permission} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={permission}
                                checked={newAccess.permissions.includes(permission)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewAccess({
                                      ...newAccess,
                                      permissions: [...newAccess.permissions, permission],
                                    })
                                  } else {
                                    setNewAccess({
                                      ...newAccess,
                                      permissions: newAccess.permissions.filter((p) => p !== permission),
                                    })
                                  }
                                }}
                              />
                              <Label htmlFor={permission} className="text-sm">
                                {permission.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Label>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Additional notes or context for this access grant..."
                      value={newAccess.notes}
                      onChange={(e) => setNewAccess({ ...newAccess, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowGrantDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGrantAccess}
                      disabled={!newAccess.inspectorName || !newAccess.organization || !newAccess.accessType}
                    >
                      Grant Access
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeAccess.map((access) => (
              <div key={access.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(access.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      {getAccessTypeIcon(access.accessType)}
                      <h4 className="font-medium">{access.inspectorName}</h4>
                      {getAccessTypeBadge(access.accessType)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <p>
                        {access.organization} • Code: {access.accessCode}
                      </p>
                      <p>
                        Expires: {format(new Date(access.expiresAt), "MMM dd, yyyy 'at' h:mm a")} • Granted by:{" "}
                        {access.grantedBy}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {access.status === "active" && (
                    <Button variant="destructive" size="sm" onClick={() => handleRevokeAccess(access.id)}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Access Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">3.2</p>
                <p className="text-sm text-muted-foreground">Avg Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-muted-foreground">Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
