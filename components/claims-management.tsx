"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileCheck, Search, Eye, RefreshCw, Download, DollarSign, Plus, Package, Send, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Claim {
  id: string
  claimNumber: string
  patientName: string
  patientId: string
  payerName: string
  payerId: string
  providerName: string
  providerId: string
  serviceDate: string
  submissionDate: string
  totalCharges: number
  allowedAmount?: number
  paidAmount?: number
  patientResponsibility?: number
  status: string
  claimType: string
  denialReason?: string
  appealStatus?: string
  appealDate?: string
  notes?: string
}

interface Batch {
  id: string
  batchNumber: string
  batchType: string
  batchStatus: string
  totalClaims: number
  totalCharges: number
  submittedAt?: string
  createdAt: string
  notes?: string
}

export function ClaimsManagement() {
  const { toast } = useToast()
  const { data, isLoading, mutate } = useSWR("/api/claims", fetcher)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [payerFilter, setPayerFilter] = useState<string>("all")
  const [showNewClaimDialog, setShowNewClaimDialog] = useState(false)
  const [showNewBatchDialog, setShowNewBatchDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [selectedClaimsForBatch, setSelectedClaimsForBatch] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New claim form state
  const [newClaim, setNewClaim] = useState({
    patientId: "",
    payerId: "",
    providerId: "",
    serviceDate: new Date().toISOString().split("T")[0],
    totalCharges: "",
    claimType: "professional",
    notes: "",
  })

  // Edit claim state
  const [editClaim, setEditClaim] = useState({
    status: "",
    notes: "",
    paidAmount: "",
    denialReason: "",
  })

  // New batch form state
  const [newBatch, setNewBatch] = useState({
    batchType: "837P",
    notes: "",
  })

  const claims: Claim[] = data?.claims || []
  const batches: Batch[] = data?.batches || []
  const patients = data?.patients || []
  const payers = data?.payers || []
  const providers = data?.providers || []
  const summary = data?.summary || {}

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.payerName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || claim.status === statusFilter
    const matchesPayer = payerFilter === "all" || claim.payerName === payerFilter

    return matchesSearch && matchesStatus && matchesPayer
  })

  const uniquePayers = Array.from(new Set(claims.map((claim) => claim.payerName)))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default"
      case "submitted":
      case "pending":
        return "secondary"
      case "denied":
        return "destructive"
      case "appealed":
        return "outline"
      default:
        return "secondary"
    }
  }

  const handleCreateClaim = async () => {
    if (!newClaim.patientId || !newClaim.payerId || !newClaim.totalCharges) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "claim",
          ...newClaim,
          totalCharges: Number.parseFloat(newClaim.totalCharges),
        }),
      })

      if (res.ok) {
        toast({ title: "Success", description: "Claim created successfully" })
        setShowNewClaimDialog(false)
        setNewClaim({
          patientId: "",
          payerId: "",
          providerId: "",
          serviceDate: new Date().toISOString().split("T")[0],
          totalCharges: "",
          claimType: "professional",
          notes: "",
        })
        mutate()
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create claim", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateBatch = async () => {
    if (selectedClaimsForBatch.length === 0) {
      toast({ title: "Error", description: "Please select at least one claim", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "batch",
          ...newBatch,
          claimIds: selectedClaimsForBatch,
        }),
      })

      if (res.ok) {
        toast({ title: "Success", description: "Batch created successfully" })
        setShowNewBatchDialog(false)
        setNewBatch({ batchType: "837P", notes: "" })
        setSelectedClaimsForBatch([])
        mutate()
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create batch", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAppeal = async (claimId: string) => {
    try {
      await fetch("/api/claims", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: claimId, action: "appeal" }),
      })
      toast({ title: "Success", description: "Appeal initiated" })
      mutate()
    } catch (error) {
      toast({ title: "Error", description: "Failed to appeal claim", variant: "destructive" })
    }
  }

  const handleSubmitBatch = async (batchId: string) => {
    try {
      await fetch("/api/claims", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: batchId, action: "submit_batch" }),
      })
      toast({ title: "Success", description: "Batch submitted to clearinghouse" })
      mutate()
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit batch", variant: "destructive" })
    }
  }

  const handleViewClaim = (claim: Claim) => {
    setSelectedClaim(claim)
    setShowViewDialog(true)
  }

  const handleEditClaim = (claim: Claim) => {
    setSelectedClaim(claim)
    setEditClaim({
      status: claim.status,
      notes: claim.notes || "",
      paidAmount: claim.paidAmount?.toString() || "",
      denialReason: claim.denialReason || "",
    })
    setShowEditDialog(true)
  }

  const handleUpdateClaim = async () => {
    if (!selectedClaim) return

    setIsSubmitting(true)
    try {
      const updates: any = {
        claim_status: editClaim.status,
        notes: editClaim.notes,
      }

      if (editClaim.paidAmount) {
        updates.paid_amount = Number.parseFloat(editClaim.paidAmount)
      }
      if (editClaim.denialReason) {
        updates.denial_reason = editClaim.denialReason
      }

      await fetch("/api/claims", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedClaim.id, action: "update", ...updates }),
      })

      toast({ title: "Success", description: "Claim updated successfully" })
      setShowEditDialog(false)
      mutate()
    } catch (error) {
      toast({ title: "Error", description: "Failed to update claim", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleClaimSelection = (claimId: string) => {
    setSelectedClaimsForBatch((prev) =>
      prev.includes(claimId) ? prev.filter((id) => id !== claimId) : [...prev, claimId],
    )
  }

  const handleExportClaims = () => {
    const csv = [
      ["Claim Number", "Patient", "Payer", "Service Date", "Charges", "Status"].join(","),
      ...filteredClaims.map((c) =>
        [c.claimNumber, c.patientName, c.payerName, c.serviceDate, c.totalCharges, c.status].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `claims-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    toast({ title: "Exported", description: "Claims exported to CSV" })
  }

  const pendingClaims = claims.filter((c) => c.status === "pending")

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Claims Management</h2>
          <p className="text-muted-foreground">Track and manage insurance claims</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportClaims}>
            <Download className="mr-2 h-4 w-4" />
            Export Claims
          </Button>
          <Dialog open={showNewBatchDialog} onOpenChange={setShowNewBatchDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="mr-2 h-4 w-4" />
                New Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Claim Batch</DialogTitle>
                <DialogDescription>Create a batch of claims for submission to the clearinghouse</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Batch Type</Label>
                    <Select
                      value={newBatch.batchType}
                      onValueChange={(v) => setNewBatch({ ...newBatch, batchType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="837P">837P - Professional</SelectItem>
                        <SelectItem value="837I">837I - Institutional</SelectItem>
                        <SelectItem value="837D">837D - Dental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Selected Claims</Label>
                    <div className="text-sm text-muted-foreground p-2 border rounded">
                      {selectedClaimsForBatch.length} claims selected
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Pending Claims to Include</Label>
                  <div className="border rounded max-h-48 overflow-y-auto">
                    {pendingClaims.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">No pending claims available</div>
                    ) : (
                      pendingClaims.map((claim) => (
                        <div
                          key={claim.id}
                          className="flex items-center gap-3 p-2 border-b last:border-b-0 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedClaimsForBatch.includes(claim.id)}
                            onCheckedChange={() => toggleClaimSelection(claim.id)}
                          />
                          <div className="flex-1">
                            <span className="font-medium">{claim.patientName}</span>
                            <span className="text-muted-foreground ml-2">- {claim.claimNumber}</span>
                          </div>
                          <span className="text-sm">${claim.totalCharges.toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={newBatch.notes}
                    onChange={(e) => setNewBatch({ ...newBatch, notes: e.target.value })}
                    placeholder="Optional batch notes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewBatchDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBatch} disabled={isSubmitting || selectedClaimsForBatch.length === 0}>
                  {isSubmitting ? "Creating..." : "Create Batch"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewClaimDialog} onOpenChange={setShowNewClaimDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                New Claim
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Manual Claim Entry</DialogTitle>
                <DialogDescription>Enter claim details manually for submission</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient *</Label>
                    <Select
                      value={newClaim.patientId}
                      onValueChange={(v) => setNewClaim({ ...newClaim, patientId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.first_name} {p.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Payer *</Label>
                    <Select value={newClaim.payerId} onValueChange={(v) => setNewClaim({ ...newClaim, payerId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payer" />
                      </SelectTrigger>
                      <SelectContent>
                        {payers.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.payer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rendering Provider</Label>
                    <Select
                      value={newClaim.providerId}
                      onValueChange={(v) => setNewClaim({ ...newClaim, providerId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.first_name} {p.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Service Date *</Label>
                    <Input
                      type="date"
                      value={newClaim.serviceDate}
                      onChange={(e) => setNewClaim({ ...newClaim, serviceDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Charges *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newClaim.totalCharges}
                      onChange={(e) => setNewClaim({ ...newClaim, totalCharges: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Claim Type</Label>
                    <Select
                      value={newClaim.claimType}
                      onValueChange={(v) => setNewClaim({ ...newClaim, claimType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional (CMS-1500)</SelectItem>
                        <SelectItem value="institutional">Institutional (UB-04)</SelectItem>
                        <SelectItem value="bundle">OTP Bundle</SelectItem>
                        <SelectItem value="apg">APG Claim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={newClaim.notes}
                    onChange={(e) => setNewClaim({ ...newClaim, notes: e.target.value })}
                    placeholder="Service description, diagnosis codes, procedure codes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewClaimDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateClaim}
                  disabled={isSubmitting || !newClaim.patientId || !newClaim.payerId || !newClaim.totalCharges}
                >
                  {isSubmitting ? "Creating..." : "Create Claim"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="claims" className="space-y-4">
        <TabsList>
          <TabsTrigger value="claims" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Claims
          </TabsTrigger>
          <TabsTrigger value="batches" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Batches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Charges</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">${(summary.totalCharges || 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{summary.totalCount || 0} claims</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">${(summary.totalPaid || 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{summary.paidCount || 0} paid claims</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">${(summary.pendingAmount || 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{summary.pendingCount || 0} awaiting payment</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{summary.collectionRate || 0}%</div>
                    <p className="text-xs text-muted-foreground">of total charges collected</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Claims List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Claims List</CardTitle>
                  <CardDescription>View and manage all claims</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => mutate()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by claim number, patient, or payer..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="appealed">Appealed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={payerFilter} onValueChange={setPayerFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Payer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payers</SelectItem>
                    {uniquePayers.map((payer) => (
                      <SelectItem key={payer} value={payer}>
                        {payer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Claims Table */}
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredClaims.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileCheck className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">No claims found</p>
                  <p className="text-sm">Create a new claim to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <div>
                          <p className="font-medium">{claim.claimNumber}</p>
                          <p className="text-sm text-muted-foreground">{claim.patientName}</p>
                        </div>
                        <div>
                          <p className="text-sm">{claim.payerName}</p>
                          <p className="text-sm text-muted-foreground">{claim.serviceDate}</p>
                        </div>
                        <div>
                          <p className="font-medium">${claim.totalCharges.toFixed(2)}</p>
                          {claim.paidAmount && (
                            <p className="text-sm text-green-600">Paid: ${claim.paidAmount.toFixed(2)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(claim.status)}>
                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewClaim(claim)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditClaim(claim)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {claim.status === "denied" && (
                          <Button variant="ghost" size="sm" onClick={() => handleAppeal(claim.id)}>
                            Appeal
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Claim Batches</CardTitle>
                  <CardDescription>Manage claim submission batches</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => mutate()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : batches.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">No batches found</p>
                  <p className="text-sm">Create a batch to submit multiple claims at once</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {batches.map((batch) => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <div>
                          <p className="font-medium">{batch.batchNumber}</p>
                          <p className="text-sm text-muted-foreground">{batch.batchType}</p>
                        </div>
                        <div>
                          <p className="text-sm">{batch.totalClaims} claims</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(batch.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">${batch.totalCharges.toFixed(2)}</p>
                        </div>
                        <div>
                          <Badge
                            variant={
                              batch.batchStatus === "submitted"
                                ? "default"
                                : batch.batchStatus === "pending"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {batch.batchStatus.charAt(0).toUpperCase() + batch.batchStatus.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      {batch.batchStatus === "pending" && (
                        <Button size="sm" onClick={() => handleSubmitBatch(batch.id)}>
                          <Send className="mr-2 h-4 w-4" />
                          Submit
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Claim Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogDescription>Full details for claim {selectedClaim?.claimNumber}</DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">{selectedClaim.patientName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payer</Label>
                  <p className="font-medium">{selectedClaim.payerName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Provider</Label>
                  <p className="font-medium">{selectedClaim.providerName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Service Date</Label>
                  <p className="font-medium">{selectedClaim.serviceDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Charges</Label>
                  <p className="font-medium">${selectedClaim.totalCharges.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={getStatusColor(selectedClaim.status)}>
                    {selectedClaim.status.charAt(0).toUpperCase() + selectedClaim.status.slice(1)}
                  </Badge>
                </div>
                {selectedClaim.paidAmount && (
                  <div>
                    <Label className="text-muted-foreground">Paid Amount</Label>
                    <p className="font-medium text-green-600">${selectedClaim.paidAmount.toFixed(2)}</p>
                  </div>
                )}
                {selectedClaim.denialReason && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Denial Reason</Label>
                    <p className="font-medium text-red-600">{selectedClaim.denialReason}</p>
                  </div>
                )}
                {selectedClaim.notes && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Notes</Label>
                    <p>{selectedClaim.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Claim Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Claim</DialogTitle>
            <DialogDescription>Update claim {selectedClaim?.claimNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editClaim.status} onValueChange={(v) => setEditClaim({ ...editClaim, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                  <SelectItem value="appealed">Appealed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editClaim.status === "paid" && (
              <div className="space-y-2">
                <Label>Paid Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editClaim.paidAmount}
                  onChange={(e) => setEditClaim({ ...editClaim, paidAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            )}
            {editClaim.status === "denied" && (
              <div className="space-y-2">
                <Label>Denial Reason</Label>
                <Textarea
                  value={editClaim.denialReason}
                  onChange={(e) => setEditClaim({ ...editClaim, denialReason: e.target.value })}
                  placeholder="Reason for denial..."
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editClaim.notes}
                onChange={(e) => setEditClaim({ ...editClaim, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateClaim} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
