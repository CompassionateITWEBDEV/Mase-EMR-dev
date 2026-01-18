"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Shield, Calendar, Building, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"

interface RegulatoryAccess {
  id: string
  inspector_id: string
  inspector_name: string
  organization: string
  role: string
  access_expires_at: string
  is_active: boolean
  notes?: string
}

export function RegulatoryAccessManager() {
  const [accessList, setAccessList] = useState<RegulatoryAccess[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    inspectorId: "",
    inspectorName: "",
    organization: "",
    role: "",
    accessDuration: "30", // days
    notes: "",
  })

  const supabase = createClient()

  const fetchAccessList = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("regulatory_access")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setAccessList(data || [])
    } catch (error) {
      console.error("Error fetching access list:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchAccessList()
  }, [fetchAccessList])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const generateTemporaryPassword = () => {
    return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase()
  }

  const createRegulatoryAccess = async () => {
    try {
      const tempPassword = generateTemporaryPassword()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number.parseInt(formData.accessDuration))

      // Create the provider account for the inspector
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: `${formData.inspectorId}@regulatory.temp`,
        password: tempPassword,
        user_metadata: {
          inspector_id: formData.inspectorId,
          inspector_name: formData.inspectorName,
          organization: formData.organization,
          role: formData.role,
        },
      })

      if (authError) throw authError

      // Create provider record
      const { error: providerError } = await supabase.from("providers").insert({
        id: authData.user.id,
        first_name: formData.inspectorName.split(" ")[0] || formData.inspectorName,
        last_name: formData.inspectorName.split(" ").slice(1).join(" ") || "",
        email: `${formData.inspectorId}@regulatory.temp`,
        role: formData.role,
        organization: formData.organization,
        inspector_id: formData.inspectorId,
        access_expires_at: expiresAt.toISOString(),
      })

      if (providerError) throw providerError

      // Create regulatory access record
      const { error: accessError } = await supabase.from("regulatory_access").insert({
        inspector_id: formData.inspectorId,
        inspector_name: formData.inspectorName,
        organization: formData.organization,
        role: formData.role,
        access_expires_at: expiresAt.toISOString(),
        notes: formData.notes,
      })

      if (accessError) throw accessError

      // Show the temporary credentials to the admin
      alert(
        `Regulatory access created successfully!\n\nInspector ID: ${formData.inspectorId}\nTemporary Password: ${tempPassword}\n\nPlease provide these credentials to the inspector securely.`,
      )

      setIsDialogOpen(false)
      setFormData({
        inspectorId: "",
        inspectorName: "",
        organization: "",
        role: "",
        accessDuration: "30",
        notes: "",
      })
      fetchAccessList()
    } catch (error) {
      console.error("Error creating regulatory access:", error)
      alert("Failed to create regulatory access. Please try again.")
    }
  }

  const revokeAccess = async (accessId: string, inspectorId: string) => {
    if (!confirm("Are you sure you want to revoke this regulatory access?")) return

    try {
      // Deactivate the access record
      const { error: accessError } = await supabase
        .from("regulatory_access")
        .update({ is_active: false })
        .eq("id", accessId)

      if (accessError) throw accessError

      // Update provider record
      const { error: providerError } = await supabase
        .from("providers")
        .update({ access_expires_at: new Date().toISOString() })
        .eq("inspector_id", inspectorId)

      if (providerError) throw providerError

      fetchAccessList()
    } catch (error) {
      console.error("Error revoking access:", error)
      alert("Failed to revoke access. Please try again.")
    }
  }

  const getStatusBadge = (access: RegulatoryAccess) => {
    const isExpired = new Date(access.access_expires_at) < new Date()

    if (!access.is_active) {
      return <Badge variant="destructive">Revoked</Badge>
    } else if (isExpired) {
      return <Badge variant="secondary">Expired</Badge>
    } else {
      return <Badge variant="default">Active</Badge>
    }
  }

  const getOrganizationIcon = (org: string) => {
    switch (org) {
      case "DEA":
        return <Shield className="h-4 w-4" />
      case "Joint Commission":
        return <Building className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Regulatory Access Management</span>
            </CardTitle>
            <CardDescription>Manage temporary access for regulatory inspectors and surveyors</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Grant Access
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Grant Regulatory Access</DialogTitle>
                <DialogDescription>Create temporary access for a regulatory inspector or surveyor</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inspectorId">Inspector ID</Label>
                  <Input
                    id="inspectorId"
                    placeholder="DEA-12345 or JC-67890"
                    value={formData.inspectorId}
                    onChange={(e) => handleInputChange("inspectorId", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inspectorName">Inspector Name</Label>
                  <Input
                    id="inspectorName"
                    placeholder="John Smith"
                    value={formData.inspectorName}
                    onChange={(e) => handleInputChange("inspectorName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Select onValueChange={(value) => handleInputChange("organization", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEA">Drug Enforcement Administration</SelectItem>
                      <SelectItem value="Joint Commission">The Joint Commission</SelectItem>
                      <SelectItem value="State Board">State Regulatory Board</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Access Role</Label>
                  <Select onValueChange={(value) => handleInputChange("role", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dea_inspector">DEA Inspector</SelectItem>
                      <SelectItem value="joint_commission_surveyor">Joint Commission Surveyor</SelectItem>
                      <SelectItem value="state_inspector">State Inspector</SelectItem>
                      <SelectItem value="read_only_auditor">Read-Only Auditor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessDuration">Access Duration (Days)</Label>
                  <Select onValueChange={(value) => handleInputChange("accessDuration", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Survey purpose, contact info, etc."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                  />
                </div>
                <Button onClick={createRegulatoryAccess} className="w-full">
                  Create Access
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading access records...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inspector</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessList.map((access) => (
                <TableRow key={access.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{access.inspector_name}</div>
                      <div className="text-sm text-muted-foreground">{access.inspector_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getOrganizationIcon(access.organization)}
                      <span>{access.organization}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {access.role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{format(new Date(access.access_expires_at), "MMM dd, yyyy")}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(access)}</TableCell>
                  <TableCell>
                    {access.is_active && new Date(access.access_expires_at) > new Date() && (
                      <Button variant="outline" size="sm" onClick={() => revokeAccess(access.id, access.inspector_id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
