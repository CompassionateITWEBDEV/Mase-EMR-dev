"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Shield, FileCheck, Building, ExternalLink, ArrowLeft, UserPlus, Key, Copy, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function RegulatoryPortalPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    inspectorId: string
    tempPassword: string
  } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [newAgent, setNewAgent] = useState({
    inspectorName: "",
    organization: "DEA",
    accessLevel: "read_only",
    expiresInDays: "30",
  })

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const generateInspectorId = (org: string) => {
    const prefix = org === "DEA" ? "DEA" : org === "Joint Commission" ? "JC" : "SB"
    const num = Math.floor(100000 + Math.random() * 900000)
    return `${prefix}-${num}`
  }

  const handleCreateAgent = async () => {
    if (!newAgent.inspectorName) {
      toast({ title: "Error", description: "Please enter agent name", variant: "destructive" })
      return
    }

    setIsCreating(true)
    const supabase = createClient()

    try {
      const inspectorId = generateInspectorId(newAgent.organization)
      const tempPassword = generatePassword()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number.parseInt(newAgent.expiresInDays))

      // Create the regulatory access record
      const { error } = await supabase.from("regulatory_access").insert({
        inspector_id: inspectorId,
        inspector_name: newAgent.inspectorName,
        organization: newAgent.organization,
        role: newAgent.accessLevel === "full" ? "inspector" : "viewer",
        access_granted_at: new Date().toISOString(),
        access_expires_at: expiresAt.toISOString(),
        is_active: true,
        notes: `Temporary password: ${tempPassword} (should be changed on first login)`,
      })

      if (error) throw error

      setGeneratedCredentials({
        inspectorId,
        tempPassword,
      })

      toast({ title: "Success", description: "Agent credentials created successfully" })
    } catch (error) {
      console.error("[v0] Error creating agent:", error)
      toast({ title: "Error", description: "Failed to create agent credentials", variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Fallback for when clipboard API fails
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const resetDialog = () => {
    setGeneratedCredentials(null)
    setNewAgent({
      inspectorName: "",
      organization: "DEA",
      accessLevel: "read_only",
      expiresInDays: "30",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-slate-800 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-slate-800" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Regulatory Portal Access</h1>
                <p className="text-slate-200">Select your regulatory organization to access the appropriate portal</p>
              </div>
            </div>
            <Link href="/">
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-slate-800 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to EMR
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Admin Actions */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-800">
              <Key className="h-5 w-5" />
              <span>Administrator Actions</span>
            </CardTitle>
            <CardDescription className="text-amber-700">
              Create and manage access credentials for regulatory agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open)
                if (!open) resetDialog()
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Agent Credentials
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Regulatory Agent Credentials</DialogTitle>
                  <DialogDescription>
                    Generate temporary login credentials for DEA agents, Joint Commission surveyors, or state
                    inspectors.
                  </DialogDescription>
                </DialogHeader>

                {!generatedCredentials ? (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="agentName">Agent Name *</Label>
                      <Input
                        id="agentName"
                        placeholder="Enter agent's full name"
                        value={newAgent.inspectorName}
                        onChange={(e) => setNewAgent({ ...newAgent, inspectorName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization</Label>
                      <Select
                        value={newAgent.organization}
                        onValueChange={(value) => setNewAgent({ ...newAgent, organization: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DEA">Drug Enforcement Administration (DEA)</SelectItem>
                          <SelectItem value="Joint Commission">The Joint Commission</SelectItem>
                          <SelectItem value="State Board">State Regulatory Board</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accessLevel">Access Level</Label>
                      <Select
                        value={newAgent.accessLevel}
                        onValueChange={(value) => setNewAgent({ ...newAgent, accessLevel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read_only">Read Only (View Reports)</SelectItem>
                          <SelectItem value="full">Full Access (Inspection Mode)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expires">Access Expires In</Label>
                      <Select
                        value={newAgent.expiresInDays}
                        onValueChange={(value) => setNewAgent({ ...newAgent, expiresInDays: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Day</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="90">90 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 font-medium mb-3">
                        Credentials created successfully! Share these with the agent:
                      </p>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-green-700">Agent ID</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input value={generatedCredentials.inspectorId} readOnly className="font-mono bg-white" />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => copyToClipboard(generatedCredentials.inspectorId, "id")}
                            >
                              {copied === "id" ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-green-700">Temporary Password</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input value={generatedCredentials.tempPassword} readOnly className="font-mono bg-white" />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => copyToClipboard(generatedCredentials.tempPassword, "password")}
                            >
                              {copied === "password" ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-green-600 mt-3">
                        Agent should change password on first login. Access expires in {newAgent.expiresInDays} days.
                      </p>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {!generatedCredentials ? (
                    <>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAgent} disabled={isCreating}>
                        {isCreating ? "Creating..." : "Generate Credentials"}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsCreateDialogOpen(false)}>Done</Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* DEA Portal */}
          <Card className="border-blue-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold">DEA Compliance Portal</div>
                  <div className="text-sm text-muted-foreground font-normal">Drug Enforcement Administration</div>
                </div>
              </CardTitle>
              <CardDescription className="text-base">
                Access controlled substance inventory, acquisition records, security compliance, and DEA inspection
                documentation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Compliance Score</span>
                  <Badge className="bg-yellow-100 text-yellow-800">83%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Violations</span>
                  <Badge className="bg-red-100 text-red-800">1 Critical</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Inspection</span>
                  <span className="text-sm">March 2024</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Link href="/regulatory/dea">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Access DEA Portal
                  </Button>
                </Link>
                <Link href="/auth/regulatory-login">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Shield className="h-4 w-4 mr-2" />
                    DEA Grant Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Joint Commission Portal */}
          <Card className="border-emerald-200 hover:shadow-lg transition-all duration-200 hover:border-emerald-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Joint Commission Portal</div>
                  <div className="text-sm text-muted-foreground font-normal">Healthcare Accreditation</div>
                </div>
              </CardTitle>
              <CardDescription className="text-base">
                Review accreditation standards, quality measures, patient safety indicators, and survey preparation
                materials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Standards Compliance</span>
                  <Badge className="bg-emerald-100 text-emerald-800">78%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Standards Not Met</span>
                  <Badge className="bg-red-100 text-red-800">1 Standard</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Next Survey</span>
                  <span className="text-sm">March 2026</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Link href="/regulatory/joint-commission">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Access JC Portal
                  </Button>
                </Link>
                <Link href="/auth/regulatory-login">
                  <Button variant="outline" className="w-full bg-transparent">
                    <FileCheck className="h-4 w-4 mr-2" />
                    Surveyor Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-slate-600" />
              <span>Regulatory Access Information</span>
            </CardTitle>
            <CardDescription>
              Important information for regulatory personnel and facility administrators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">For DEA Agents & Surveyors</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>{'• Use the "DEA Grant Login" or "Surveyor Login" buttons above'}</li>
                  <li>• Temporary access credentials are provided by facility administrators</li>
                  <li>• All access is logged and monitored for compliance purposes</li>
                  <li>• Access expires automatically based on inspection schedule</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">For Facility Staff</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Access portals directly using the main portal buttons</li>
                  <li>• Generate compliance reports and documentation</li>
                  <li>• Monitor real-time compliance status and alerts</li>
                  <li>• Use "Create Agent Credentials" above to grant access</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Need Help?</h4>
                  <p className="text-sm text-muted-foreground">Contact your system administrator for access issues</p>
                </div>
                <Link href="/regulatory/dashboard">
                  <Button variant="outline">
                    <Building className="h-4 w-4 mr-2" />
                    Admin Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
