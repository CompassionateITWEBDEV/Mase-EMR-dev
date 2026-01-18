"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Building2, Plus, Edit, Trash2, Phone, Mail, MapPin, Search, Loader2 } from "lucide-react"
import useSWR from "swr"

interface InsurancePayer {
  id: string
  payer_name: string
  payer_id: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  billing_address?: string
  electronic_payer_id?: string
  claim_submission_method: string
  prior_auth_required: boolean
  network_type: string
  is_active: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function InsurancePayerManagement() {
  const { data, error, isLoading, mutate } = useSWR("/api/insurance?type=payers", fetcher)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPayer, setEditingPayer] = useState<InsurancePayer | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [newPayer, setNewPayer] = useState({
    payerName: "",
    payerId: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    billingAddress: "",
    electronicPayerId: "",
    claimSubmissionMethod: "electronic",
    priorAuthRequired: false,
    networkType: "in-network",
    isActive: true,
  })

  const payers: InsurancePayer[] = data?.payers || []
  const filteredPayers = payers.filter(
    (payer) =>
      payer.payer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payer.payer_id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddPayer = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payer", ...newPayer }),
      })
      if (res.ok) {
        mutate()
        resetForm()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditPayer = (payer: InsurancePayer) => {
    setEditingPayer(payer)
    setNewPayer({
      payerName: payer.payer_name,
      payerId: payer.payer_id,
      contactName: payer.contact_name || "",
      contactPhone: payer.contact_phone || "",
      contactEmail: payer.contact_email || "",
      billingAddress: payer.billing_address || "",
      electronicPayerId: payer.electronic_payer_id || "",
      claimSubmissionMethod: payer.claim_submission_method,
      priorAuthRequired: payer.prior_auth_required,
      networkType: payer.network_type,
      isActive: payer.is_active,
    })
    setShowAddForm(true)
  }

  const handleUpdatePayer = async () => {
    if (!editingPayer) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/insurance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "payer", id: editingPayer.id, ...newPayer }),
      })
      if (res.ok) {
        mutate()
        resetForm()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePayer = async (payerId: string) => {
    if (!confirm("Are you sure you want to delete this payer?")) return
    await fetch(`/api/insurance?type=payer&id=${payerId}`, { method: "DELETE" })
    mutate()
  }

  const resetForm = () => {
    setNewPayer({
      payerName: "",
      payerId: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      billingAddress: "",
      electronicPayerId: "",
      claimSubmissionMethod: "electronic",
      priorAuthRequired: false,
      networkType: "in-network",
      isActive: true,
    })
    setShowAddForm(false)
    setEditingPayer(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-16 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Insurance Payer Management</h2>
          <p className="text-muted-foreground">Manage insurance companies and billing information</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Payer
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payers by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPayer ? "Edit" : "Add New"} Insurance Payer</CardTitle>
            <CardDescription>{editingPayer ? "Update" : "Enter"} the insurance payer information below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="payerName">Payer Name *</Label>
                <Input
                  id="payerName"
                  value={newPayer.payerName}
                  onChange={(e) => setNewPayer({ ...newPayer, payerName: e.target.value })}
                  placeholder="Blue Cross Blue Shield"
                />
              </div>
              <div>
                <Label htmlFor="payerId">Payer ID *</Label>
                <Input
                  id="payerId"
                  value={newPayer.payerId}
                  onChange={(e) => setNewPayer({ ...newPayer, payerId: e.target.value })}
                  placeholder="BCBS001"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={newPayer.contactName}
                  onChange={(e) => setNewPayer({ ...newPayer, contactName: e.target.value })}
                  placeholder="Provider Relations"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={newPayer.contactPhone}
                  onChange={(e) => setNewPayer({ ...newPayer, contactPhone: e.target.value })}
                  placeholder="(800) 555-0000"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={newPayer.contactEmail}
                  onChange={(e) => setNewPayer({ ...newPayer, contactEmail: e.target.value })}
                  placeholder="provider@insurance.com"
                />
              </div>
              <div>
                <Label htmlFor="electronicPayerId">Electronic Payer ID</Label>
                <Input
                  id="electronicPayerId"
                  value={newPayer.electronicPayerId}
                  onChange={(e) => setNewPayer({ ...newPayer, electronicPayerId: e.target.value })}
                  placeholder="BCBS"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Textarea
                id="billingAddress"
                value={newPayer.billingAddress}
                onChange={(e) => setNewPayer({ ...newPayer, billingAddress: e.target.value })}
                placeholder="123 Insurance Way, City, State ZIP"
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="claimSubmissionMethod">Claim Submission</Label>
                <Select
                  value={newPayer.claimSubmissionMethod}
                  onValueChange={(value) => setNewPayer({ ...newPayer, claimSubmissionMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="paper">Paper</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="networkType">Network Type</Label>
                <Select
                  value={newPayer.networkType}
                  onValueChange={(value) => setNewPayer({ ...newPayer, networkType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-network">In-Network</SelectItem>
                    <SelectItem value="out-of-network">Out-of-Network</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="priorAuthRequired"
                  checked={newPayer.priorAuthRequired}
                  onCheckedChange={(checked) => setNewPayer({ ...newPayer, priorAuthRequired: checked })}
                />
                <Label htmlFor="priorAuthRequired">Prior Auth Required</Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={newPayer.isActive}
                onCheckedChange={(checked) => setNewPayer({ ...newPayer, isActive: checked })}
              />
              <Label htmlFor="isActive">Active Payer</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={editingPayer ? handleUpdatePayer : handleAddPayer}
                className="bg-primary hover:bg-primary/90"
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPayer ? "Update" : "Add"} Payer
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payers List */}
      <div className="grid gap-4">
        {filteredPayers.map((payer) => (
          <Card key={payer.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{payer.payer_name}</h3>
                    <Badge variant="outline">{payer.payer_id}</Badge>
                    <Badge variant={payer.is_active ? "default" : "secondary"}>
                      {payer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 text-sm">
                    {payer.contact_name && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Contact:</span>
                        <span>{payer.contact_name}</span>
                      </div>
                    )}
                    {payer.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{payer.contact_phone}</span>
                      </div>
                    )}
                    {payer.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{payer.contact_email}</span>
                      </div>
                    )}
                    {payer.billing_address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{payer.billing_address}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 mt-3 text-sm">
                    <Badge variant="outline">{payer.claim_submission_method}</Badge>
                    <Badge variant="outline">{payer.network_type}</Badge>
                    {payer.prior_auth_required && <Badge variant="destructive">Prior Auth Required</Badge>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditPayer(payer)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeletePayer(payer.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPayers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No payers found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms." : "Add your first insurance payer to get started."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
