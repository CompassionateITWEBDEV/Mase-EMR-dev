"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  Eye,
  ExternalLink,
  Loader2,
} from "lucide-react"

interface NPIVerificationDashboardProps {
  npiRecords: any[]
  providers: any[]
  isLoading: boolean
  onRefresh: () => void
}

export function NPIVerificationDashboard({
  npiRecords,
  providers,
  isLoading,
  onRefresh,
}: NPIVerificationDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const [isSearchingNPPES, setIsSearchingNPPES] = useState(false)
  const [nppesSearchResults, setNppesSearchResults] = useState<any[]>([])
  const [showNPPESSearch, setShowNPPESSearch] = useState(false)
  const [nppesSearchQuery, setNppesSearchQuery] = useState({ firstName: "", lastName: "", npiNumber: "", state: "" })
  const [viewDetails, setViewDetails] = useState<any | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [newNPI, setNewNPI] = useState({
    providerId: "",
    npiNumber: "",
    npiType: 1 as 1 | 2,
    providerNameOnNpi: "",
    taxonomyCode: "",
    taxonomyDescription: "",
    practiceAddress: "",
    phoneNumber: "",
    notes: "",
  })

  const filteredVerifications = npiRecords.filter(
    (verification) =>
      verification.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verification.npi_number?.includes(searchTerm) ||
      verification.taxonomy_description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "invalid":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "verified":
        return "default"
      case "invalid":
        return "destructive"
      case "pending":
        return "secondary"
      case "expired":
        return "outline"
      default:
        return "secondary"
    }
  }

  const handleNPPESSearch = async () => {
    setIsSearchingNPPES(true)
    try {
      // Build NPPES API URL
      const params = new URLSearchParams()
      if (nppesSearchQuery.npiNumber) {
        params.append("number", nppesSearchQuery.npiNumber)
      }
      if (nppesSearchQuery.firstName) {
        params.append("first_name", nppesSearchQuery.firstName)
      }
      if (nppesSearchQuery.lastName) {
        params.append("last_name", nppesSearchQuery.lastName)
      }
      if (nppesSearchQuery.state) {
        params.append("state", nppesSearchQuery.state)
      }
      params.append("version", "2.1")
      params.append("limit", "10")

      const response = await fetch(`https://npiregistry.cms.hhs.gov/api/?${params.toString()}`)
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        setNppesSearchResults(data.results)
        toast.success(`Found ${data.results.length} result(s)`)
      } else {
        setNppesSearchResults([])
        toast.info("No results found in NPPES registry")
      }
    } catch (error) {
      console.error("NPPES search error:", error)
      toast.error("Failed to search NPPES registry")
      setNppesSearchResults([])
    } finally {
      setIsSearchingNPPES(false)
    }
  }

  const importFromNPPES = (result: any) => {
    const basic = result.basic || {}
    const taxonomy = result.taxonomies?.[0] || {}
    const address = result.addresses?.[0] || {}

    setNewNPI({
      ...newNPI,
      npiNumber: result.number || "",
      npiType: result.enumeration_type === "NPI-1" ? 1 : 2,
      providerNameOnNpi:
        result.enumeration_type === "NPI-1"
          ? `${basic.first_name || ""} ${basic.last_name || ""}`.trim()
          : basic.organization_name || "",
      taxonomyCode: taxonomy.code || "",
      taxonomyDescription: taxonomy.desc || "",
      practiceAddress:
        `${address.address_1 || ""} ${address.address_2 || ""}, ${address.city || ""}, ${address.state || ""} ${address.postal_code || ""}`.trim(),
      phoneNumber: address.telephone_number || "",
    })
    setShowNPPESSearch(false)
    toast.success("NPI data imported from NPPES")
  }

  const handleVerifyNPI = async (npiId: string) => {
    setIsVerifying(npiId)
    try {
      const response = await fetch("/api/provider-verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "npi", id: npiId, action: "verify" }),
      })

      if (!response.ok) throw new Error("Failed to verify")
      toast.success("NPI verified successfully")
      onRefresh()
    } catch (error) {
      toast.error("Failed to verify NPI")
    } finally {
      setIsVerifying(null)
    }
  }

  const handleAddNPI = async () => {
    if (!newNPI.providerId || !newNPI.npiNumber) {
      toast.error("Please select a provider and enter NPI number")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/provider-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "npi",
          providerId: newNPI.providerId,
          npiNumber: newNPI.npiNumber,
          npiType: newNPI.npiType,
          providerNameOnNpi: newNPI.providerNameOnNpi,
          taxonomyCode: newNPI.taxonomyCode,
          taxonomyDescription: newNPI.taxonomyDescription,
          practiceAddress: newNPI.practiceAddress,
          phoneNumber: newNPI.phoneNumber,
          notes: newNPI.notes,
        }),
      })

      if (!response.ok) throw new Error("Failed to add NPI")

      toast.success("NPI added successfully")
      setNewNPI({
        providerId: "",
        npiNumber: "",
        npiType: 1,
        providerNameOnNpi: "",
        taxonomyCode: "",
        taxonomyDescription: "",
        practiceAddress: "",
        phoneNumber: "",
        notes: "",
      })
      setShowAddForm(false)
      onRefresh()
    } catch (error) {
      toast.error("Failed to add NPI")
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
          <h2 className="text-2xl font-bold">NPI Verification System</h2>
          <p className="text-muted-foreground">Verify and manage National Provider Identifier (NPI) numbers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNPPESSearch(true)}>
            <Search className="mr-2 h-4 w-4" />
            Search NPPES
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Add NPI
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by provider name, NPI number, or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showNPPESSearch} onOpenChange={setShowNPPESSearch}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search NPPES Registry</DialogTitle>
            <DialogDescription>
              Search the National Plan and Provider Enumeration System (NPPES) for provider NPI information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>NPI Number</Label>
                <Input
                  placeholder="1234567890"
                  value={nppesSearchQuery.npiNumber}
                  onChange={(e) => setNppesSearchQuery({ ...nppesSearchQuery, npiNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  placeholder="MI"
                  maxLength={2}
                  value={nppesSearchQuery.state}
                  onChange={(e) => setNppesSearchQuery({ ...nppesSearchQuery, state: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label>First Name</Label>
                <Input
                  placeholder="John"
                  value={nppesSearchQuery.firstName}
                  onChange={(e) => setNppesSearchQuery({ ...nppesSearchQuery, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  placeholder="Smith"
                  value={nppesSearchQuery.lastName}
                  onChange={(e) => setNppesSearchQuery({ ...nppesSearchQuery, lastName: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleNPPESSearch} disabled={isSearchingNPPES} className="w-full">
              {isSearchingNPPES ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search NPPES Registry
                </>
              )}
            </Button>

            {nppesSearchResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Search Results</h4>
                {nppesSearchResults.map((result, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {result.enumeration_type === "NPI-1"
                                ? `${result.basic?.first_name} ${result.basic?.last_name}`
                                : result.basic?.organization_name}
                            </span>
                            <Badge variant="outline">NPI: {result.number}</Badge>
                            <Badge variant="secondary">
                              {result.enumeration_type === "NPI-1" ? "Individual" : "Organization"}
                            </Badge>
                          </div>
                          {result.taxonomies?.[0] && (
                            <p className="text-sm text-muted-foreground">{result.taxonomies[0].desc}</p>
                          )}
                          {result.addresses?.[0] && (
                            <p className="text-sm text-muted-foreground">
                              {result.addresses[0].city}, {result.addresses[0].state}
                            </p>
                          )}
                        </div>
                        <Button size="sm" onClick={() => importFromNPPES(result)}>
                          Import
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add NPI Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New NPI Verification</CardTitle>
            <CardDescription>Enter provider information for NPI verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="providerId">Provider *</Label>
                <Select
                  value={newNPI.providerId}
                  onValueChange={(value) => setNewNPI({ ...newNPI, providerId: value })}
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
                <Label htmlFor="npiNumber">NPI Number *</Label>
                <Input
                  id="npiNumber"
                  value={newNPI.npiNumber}
                  onChange={(e) => setNewNPI({ ...newNPI, npiNumber: e.target.value })}
                  placeholder="1234567890"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="npiType">NPI Type</Label>
                <Select
                  value={newNPI.npiType.toString()}
                  onValueChange={(value) => setNewNPI({ ...newNPI, npiType: Number.parseInt(value) as 1 | 2 })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Type 1 - Individual Provider</SelectItem>
                    <SelectItem value="2">Type 2 - Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="providerNameOnNpi">Name on NPI</Label>
                <Input
                  id="providerNameOnNpi"
                  value={newNPI.providerNameOnNpi}
                  onChange={(e) => setNewNPI({ ...newNPI, providerNameOnNpi: e.target.value })}
                  placeholder="Name as it appears on NPI"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="taxonomyCode">Taxonomy Code</Label>
                <Input
                  id="taxonomyCode"
                  value={newNPI.taxonomyCode}
                  onChange={(e) => setNewNPI({ ...newNPI, taxonomyCode: e.target.value })}
                  placeholder="207Q00000X"
                />
              </div>
              <div>
                <Label htmlFor="taxonomyDescription">Taxonomy Description</Label>
                <Input
                  id="taxonomyDescription"
                  value={newNPI.taxonomyDescription}
                  onChange={(e) => setNewNPI({ ...newNPI, taxonomyDescription: e.target.value })}
                  placeholder="Family Medicine"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="practiceAddress">Practice Address</Label>
              <Input
                id="practiceAddress"
                value={newNPI.practiceAddress}
                onChange={(e) => setNewNPI({ ...newNPI, practiceAddress: e.target.value })}
                placeholder="123 Medical Center Dr, City, State ZIP"
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={newNPI.phoneNumber}
                onChange={(e) => setNewNPI({ ...newNPI, phoneNumber: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newNPI.notes}
                onChange={(e) => setNewNPI({ ...newNPI, notes: e.target.value })}
                placeholder="Additional notes about this provider..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddNPI} disabled={isSaving} className="bg-primary hover:bg-primary/90">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add NPI
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NPI Verification List */}
      <div className="grid gap-4">
        {filteredVerifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No NPI verifications found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms." : "Add your first NPI verification to get started."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredVerifications.map((verification) => (
            <Card key={verification.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{verification.providerName}</h3>
                      <Badge variant="outline">NPI: {verification.npi_number}</Badge>
                      <Badge variant="outline">Type {verification.npi_type}</Badge>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(verification.verification_status)}
                        <Badge variant={getStatusColor(verification.verification_status)}>
                          {verification.verification_status?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {verification.taxonomy_description && (
                      <div className="mb-2">
                        <Badge variant="secondary">{verification.taxonomy_description}</Badge>
                      </div>
                    )}

                    <div className="grid gap-2 md:grid-cols-2 text-sm mb-3">
                      {verification.verification_date && (
                        <div>
                          <span className="font-medium">Verified:</span> {verification.verification_date}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Source:</span> {verification.verification_source}
                      </div>
                      {verification.taxonomy_code && (
                        <div>
                          <span className="font-medium">Taxonomy:</span> {verification.taxonomy_code}
                        </div>
                      )}
                      {verification.last_updated_npi && (
                        <div>
                          <span className="font-medium">Last Updated:</span> {verification.last_updated_npi}
                        </div>
                      )}
                    </div>

                    {verification.practice_address && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Practice Address:</span> {verification.practice_address}
                      </div>
                    )}

                    {verification.phone_number && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Phone:</span> {verification.phone_number}
                      </div>
                    )}

                    {verification.notes && (
                      <div className="text-sm mb-3">
                        <span className="font-medium">Notes:</span> {verification.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {verification.verification_status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifyNPI(verification.id)}
                        disabled={isVerifying === verification.id}
                      >
                        {isVerifying === verification.id ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Verify NPI
                          </>
                        )}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setViewDetails(verification)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `https://npiregistry.cms.hhs.gov/provider-view/${verification.npi_number}`,
                          "_blank",
                        )
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      NPPES
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!viewDetails} onOpenChange={() => setViewDetails(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>NPI Details</DialogTitle>
          </DialogHeader>
          {viewDetails && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="font-medium">Provider:</span>
                  <span>{viewDetails.providerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">NPI Number:</span>
                  <span>{viewDetails.npi_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">NPI Type:</span>
                  <span>
                    Type {viewDetails.npi_type} ({viewDetails.npi_type === 1 ? "Individual" : "Organization"})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge variant={getStatusColor(viewDetails.verification_status)}>
                    {viewDetails.verification_status?.toUpperCase()}
                  </Badge>
                </div>
                {viewDetails.provider_name_on_npi && (
                  <div className="flex justify-between">
                    <span className="font-medium">Name on NPI:</span>
                    <span>{viewDetails.provider_name_on_npi}</span>
                  </div>
                )}
                {viewDetails.taxonomy_code && (
                  <div className="flex justify-between">
                    <span className="font-medium">Taxonomy Code:</span>
                    <span>{viewDetails.taxonomy_code}</span>
                  </div>
                )}
                {viewDetails.taxonomy_description && (
                  <div className="flex justify-between">
                    <span className="font-medium">Specialty:</span>
                    <span>{viewDetails.taxonomy_description}</span>
                  </div>
                )}
                {viewDetails.practice_address && (
                  <div>
                    <span className="font-medium">Practice Address:</span>
                    <p className="text-sm text-muted-foreground">{viewDetails.practice_address}</p>
                  </div>
                )}
                {viewDetails.phone_number && (
                  <div className="flex justify-between">
                    <span className="font-medium">Phone:</span>
                    <span>{viewDetails.phone_number}</span>
                  </div>
                )}
                {viewDetails.verification_date && (
                  <div className="flex justify-between">
                    <span className="font-medium">Verified Date:</span>
                    <span>{viewDetails.verification_date}</span>
                  </div>
                )}
                {viewDetails.notes && (
                  <div>
                    <span className="font-medium">Notes:</span>
                    <p className="text-sm text-muted-foreground">{viewDetails.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* NPI Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            About NPI Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">NPI Type 1 (Individual)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Individual healthcare providers</li>
                <li>• Physicians, nurses, therapists</li>
                <li>• Must be a person, not an organization</li>
                <li>• Used for individual billing and identification</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">NPI Type 2 (Organization)</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Healthcare organizations and facilities</li>
                <li>• Hospitals, clinics, group practices</li>
                <li>• Suppliers and other healthcare entities</li>
                <li>• Used for organizational billing</li>
              </ul>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              All NPI numbers are verified against the National Plan and Provider Enumeration System (NPPES) registry
              maintained by CMS. Verification includes checking provider information, taxonomy codes, and practice
              locations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
