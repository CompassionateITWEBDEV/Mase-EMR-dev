"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FileCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  Eye,
  Calendar,
} from "lucide-react"

interface LicenseVerificationDashboardProps {
  licenses: any[]
  providers: any[]
  isLoading: boolean
  onRefresh: () => void
}

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
]

const LICENSE_TYPES = ["MD", "DO", "NP", "PA", "RN", "LPN", "LCSW", "LPC", "LMFT", "LCDC", "PharmD", "DDS", "DVM"]

export function LicenseVerificationDashboard({
  licenses,
  providers,
  isLoading,
  onRefresh,
}: LicenseVerificationDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [newLicense, setNewLicense] = useState({
    providerId: "",
    licenseNumber: "",
    licenseType: "",
    issuingState: "",
    issueDate: "",
    expirationDate: "",
    renewalRequiredBy: "",
    cmeRequirements: "",
    autoVerifyEnabled: true,
    notes: "",
  })

  const filteredLicenses = licenses.filter(
    (license) =>
      license.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.license_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.license_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.issuing_state?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "expired":
      case "suspended":
      case "revoked":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <FileCheck className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "verified":
        return "default"
      case "expired":
      case "suspended":
      case "revoked":
        return "destructive"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  const isExpiringSoon = (expirationDate: string) => {
    if (!expirationDate) return false
    const expDate = new Date(expirationDate)
    const today = new Date()
    const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return daysUntilExpiration <= 90 && daysUntilExpiration > 0
  }

  const handleVerifyLicense = async (licenseId: string) => {
    setIsVerifying(licenseId)
    try {
      await fetch("/api/provider-verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "license", id: licenseId, action: "verify" }),
      })
      onRefresh()
    } catch (error) {
      console.error("Error verifying license:", error)
    } finally {
      setIsVerifying(null)
    }
  }

  const handleAddLicense = async () => {
    if (
      !newLicense.providerId ||
      !newLicense.licenseNumber ||
      !newLicense.licenseType ||
      !newLicense.issuingState ||
      !newLicense.expirationDate
    ) {
      return
    }

    setIsSaving(true)
    try {
      await fetch("/api/provider-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "license", ...newLicense }),
      })
      onRefresh()
      setNewLicense({
        providerId: "",
        licenseNumber: "",
        licenseType: "",
        issuingState: "",
        issueDate: "",
        expirationDate: "",
        renewalRequiredBy: "",
        cmeRequirements: "",
        autoVerifyEnabled: true,
        notes: "",
      })
      setShowAddForm(false)
    } catch (error) {
      console.error("Error adding license:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">License Verification & Tracking</h2>
          <p className="text-muted-foreground">Monitor provider licenses and ensure compliance</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add License
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by provider name, license number, type, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add License Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New License Verification</CardTitle>
            <CardDescription>Enter provider license information for tracking and verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="providerId">Provider *</Label>
                <Select
                  value={newLicense.providerId}
                  onValueChange={(value) => setNewLicense({ ...newLicense, providerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.first_name} {provider.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="licenseNumber">License Number *</Label>
                <Input
                  id="licenseNumber"
                  value={newLicense.licenseNumber}
                  onChange={(e) => setNewLicense({ ...newLicense, licenseNumber: e.target.value })}
                  placeholder="MD123456"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="licenseType">License Type *</Label>
                <Select
                  value={newLicense.licenseType}
                  onValueChange={(value) => setNewLicense({ ...newLicense, licenseType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="issuingState">Issuing State *</Label>
                <Select
                  value={newLicense.issuingState}
                  onValueChange={(value) => setNewLicense({ ...newLicense, issuingState: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={newLicense.issueDate}
                  onChange={(e) => setNewLicense({ ...newLicense, issueDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expirationDate">Expiration Date *</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={newLicense.expirationDate}
                  onChange={(e) => setNewLicense({ ...newLicense, expirationDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="renewalRequiredBy">Renewal Required By</Label>
                <Input
                  id="renewalRequiredBy"
                  type="date"
                  value={newLicense.renewalRequiredBy}
                  onChange={(e) => setNewLicense({ ...newLicense, renewalRequiredBy: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="autoVerifyEnabled"
                  checked={newLicense.autoVerifyEnabled}
                  onCheckedChange={(checked) => setNewLicense({ ...newLicense, autoVerifyEnabled: checked })}
                />
                <Label htmlFor="autoVerifyEnabled">Enable Auto-Verification</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="cmeRequirements">CME Requirements</Label>
              <Input
                id="cmeRequirements"
                value={newLicense.cmeRequirements}
                onChange={(e) => setNewLicense({ ...newLicense, cmeRequirements: e.target.value })}
                placeholder="e.g., 150 hours over 3 years"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newLicense.notes}
                onChange={(e) => setNewLicense({ ...newLicense, notes: e.target.value })}
                placeholder="Additional notes about this license..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddLicense} disabled={isSaving} className="bg-primary hover:bg-primary/90">
                {isSaving ? "Adding..." : "Add License"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* License List */}
      {filteredLicenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Licenses Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Try adjusting your search terms." : "Add your first license to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLicenses.map((license) => (
            <Card key={license.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <FileCheck className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{license.providerName}</h3>
                      <Badge variant="outline">
                        {license.license_type} - {license.issuing_state}
                      </Badge>
                      <Badge variant="outline">{license.license_number}</Badge>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(license.verification_status)}
                        <Badge variant={getStatusColor(license.verification_status)}>
                          {license.verification_status?.toUpperCase()}
                        </Badge>
                      </div>
                      {license.expiration_date && isExpiringSoon(license.expiration_date) && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expiring Soon
                        </Badge>
                      )}
                    </div>

                    <div className="grid gap-2 md:grid-cols-3 text-sm mb-3">
                      {license.issue_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Issued: {license.issue_date}</span>
                        </div>
                      )}
                      {license.expiration_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Expires: {license.expiration_date}</span>
                        </div>
                      )}
                      {license.verification_date && (
                        <div>
                          <span className="font-medium">Verified:</span> {license.verification_date}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2 md:grid-cols-2 text-sm mb-3">
                      <div>
                        <span className="font-medium">Source:</span> {license.verification_source || "Manual Entry"}
                      </div>
                      {license.renewal_required_by && (
                        <div>
                          <span className="font-medium">Renewal Due:</span> {license.renewal_required_by}
                        </div>
                      )}
                    </div>

                    {license.notes && (
                      <div className="text-sm mb-3">
                        <span className="font-medium">Notes:</span> {license.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {license.verification_status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifyLicense(license.id)}
                        disabled={isVerifying === license.id}
                      >
                        {isVerifying === license.id ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <FileCheck className="mr-2 h-4 w-4" />
                            Verify
                          </>
                        )}
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
