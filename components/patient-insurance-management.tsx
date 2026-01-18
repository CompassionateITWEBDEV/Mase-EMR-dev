"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Plus, Edit, Trash2, Search, CreditCard, Calendar, Loader2 } from "lucide-react"
import useSWR from "swr"

interface PatientInsurance {
  id: string
  patient_id: string
  payer_id: string
  policy_number: string
  group_number?: string
  subscriber_name?: string
  relationship_to_subscriber: string
  effective_date: string
  termination_date?: string
  copay_amount?: number
  deductible_amount?: number
  priority_order: number
  is_active: boolean
  patients?: { id: string; first_name: string; last_name: string }
  insurance_payers?: { id: string; payer_name: string }
}

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface Payer {
  id: string
  payer_name: string
  payer_id: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function PatientInsuranceManagement() {
  const { data, error, isLoading, mutate } = useSWR("/api/insurance?type=patient-insurance", fetcher)
  const { data: patientsData } = useSWR("/api/insurance?type=patients", fetcher)
  const { data: payersData } = useSWR("/api/insurance?type=payers", fetcher)

  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingInsurance, setEditingInsurance] = useState<PatientInsurance | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [newInsurance, setNewInsurance] = useState({
    patientId: "",
    payerId: "",
    policyNumber: "",
    groupNumber: "",
    subscriberName: "",
    relationshipToSubscriber: "self",
    effectiveDate: "",
    terminationDate: "",
    copayAmount: 0,
    deductibleAmount: 0,
    priorityOrder: 1,
    isActive: true,
  })

  const patientInsurance: PatientInsurance[] = data?.patientInsurance || []
  const patients: Patient[] = patientsData?.patients || []
  const payers: Payer[] = payersData?.payers || []

  const filteredInsurance = patientInsurance.filter((insurance) => {
    const patientName = insurance.patients
      ? `${insurance.patients.first_name} ${insurance.patients.last_name}`.toLowerCase()
      : ""
    const payerName = insurance.insurance_payers?.payer_name?.toLowerCase() || ""
    const search = searchTerm.toLowerCase()
    return (
      patientName.includes(search) ||
      payerName.includes(search) ||
      insurance.policy_number.toLowerCase().includes(search)
    )
  })

  const handleAddInsurance = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "patient-insurance", ...newInsurance }),
      })
      if (res.ok) {
        mutate()
        resetForm()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditInsurance = (insurance: PatientInsurance) => {
    setEditingInsurance(insurance)
    setNewInsurance({
      patientId: insurance.patient_id,
      payerId: insurance.payer_id,
      policyNumber: insurance.policy_number,
      groupNumber: insurance.group_number || "",
      subscriberName: insurance.subscriber_name || "",
      relationshipToSubscriber: insurance.relationship_to_subscriber,
      effectiveDate: insurance.effective_date,
      terminationDate: insurance.termination_date || "",
      copayAmount: insurance.copay_amount || 0,
      deductibleAmount: insurance.deductible_amount || 0,
      priorityOrder: insurance.priority_order,
      isActive: insurance.is_active,
    })
    setShowAddForm(true)
  }

  const handleUpdateInsurance = async () => {
    if (!editingInsurance) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/insurance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "patient-insurance", id: editingInsurance.id, ...newInsurance }),
      })
      if (res.ok) {
        mutate()
        resetForm()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteInsurance = async (insuranceId: string) => {
    if (!confirm("Are you sure you want to delete this insurance record?")) return
    await fetch(`/api/insurance?type=patient-insurance&id=${insuranceId}`, { method: "DELETE" })
    mutate()
  }

  const resetForm = () => {
    setNewInsurance({
      patientId: "",
      payerId: "",
      policyNumber: "",
      groupNumber: "",
      subscriberName: "",
      relationshipToSubscriber: "self",
      effectiveDate: "",
      terminationDate: "",
      copayAmount: 0,
      deductibleAmount: 0,
      priorityOrder: 1,
      isActive: true,
    })
    setShowAddForm(false)
    setEditingInsurance(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
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
          <h2 className="text-2xl font-bold">Patient Insurance Management</h2>
          <p className="text-muted-foreground">Manage patient insurance coverage and benefits</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Patient Insurance
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name, payer, or policy number..."
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
            <CardTitle>{editingInsurance ? "Edit" : "Add"} Patient Insurance</CardTitle>
            <CardDescription>{editingInsurance ? "Update" : "Enter"} patient insurance information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="patientId">Patient *</Label>
                <Select
                  value={newInsurance.patientId}
                  onValueChange={(value) => setNewInsurance({ ...newInsurance, patientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payerId">Insurance Payer *</Label>
                <Select
                  value={newInsurance.payerId}
                  onValueChange={(value) => setNewInsurance({ ...newInsurance, payerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payer" />
                  </SelectTrigger>
                  <SelectContent>
                    {payers.map((payer) => (
                      <SelectItem key={payer.id} value={payer.id}>
                        {payer.payer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="policyNumber">Policy Number *</Label>
                <Input
                  id="policyNumber"
                  value={newInsurance.policyNumber}
                  onChange={(e) => setNewInsurance({ ...newInsurance, policyNumber: e.target.value })}
                  placeholder="Policy number"
                />
              </div>
              <div>
                <Label htmlFor="groupNumber">Group Number</Label>
                <Input
                  id="groupNumber"
                  value={newInsurance.groupNumber}
                  onChange={(e) => setNewInsurance({ ...newInsurance, groupNumber: e.target.value })}
                  placeholder="Group number"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="subscriberName">Subscriber Name</Label>
                <Input
                  id="subscriberName"
                  value={newInsurance.subscriberName}
                  onChange={(e) => setNewInsurance({ ...newInsurance, subscriberName: e.target.value })}
                  placeholder="Primary subscriber name"
                />
              </div>
              <div>
                <Label htmlFor="relationshipToSubscriber">Relationship to Subscriber</Label>
                <Select
                  value={newInsurance.relationshipToSubscriber}
                  onValueChange={(value) => setNewInsurance({ ...newInsurance, relationshipToSubscriber: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Self</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="effectiveDate">Effective Date *</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={newInsurance.effectiveDate}
                  onChange={(e) => setNewInsurance({ ...newInsurance, effectiveDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="terminationDate">Termination Date</Label>
                <Input
                  id="terminationDate"
                  type="date"
                  value={newInsurance.terminationDate}
                  onChange={(e) => setNewInsurance({ ...newInsurance, terminationDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="copayAmount">Copay Amount ($)</Label>
                <Input
                  id="copayAmount"
                  type="number"
                  value={newInsurance.copayAmount}
                  onChange={(e) =>
                    setNewInsurance({ ...newInsurance, copayAmount: Number.parseFloat(e.target.value) || 0 })
                  }
                  placeholder="25.00"
                />
              </div>
              <div>
                <Label htmlFor="deductibleAmount">Deductible Amount ($)</Label>
                <Input
                  id="deductibleAmount"
                  type="number"
                  value={newInsurance.deductibleAmount}
                  onChange={(e) =>
                    setNewInsurance({ ...newInsurance, deductibleAmount: Number.parseFloat(e.target.value) || 0 })
                  }
                  placeholder="500.00"
                />
              </div>
              <div>
                <Label htmlFor="priorityOrder">Priority Order</Label>
                <Select
                  value={newInsurance.priorityOrder.toString()}
                  onValueChange={(value) => setNewInsurance({ ...newInsurance, priorityOrder: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Primary (1)</SelectItem>
                    <SelectItem value="2">Secondary (2)</SelectItem>
                    <SelectItem value="3">Tertiary (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={newInsurance.isActive}
                onCheckedChange={(checked) => setNewInsurance({ ...newInsurance, isActive: checked })}
              />
              <Label htmlFor="isActive">Active Coverage</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={editingInsurance ? handleUpdateInsurance : handleAddInsurance}
                className="bg-primary hover:bg-primary/90"
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingInsurance ? "Update" : "Add"} Insurance
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insurance List */}
      <div className="grid gap-4">
        {filteredInsurance.map((insurance) => (
          <Card key={insurance.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      {insurance.patients
                        ? `${insurance.patients.first_name} ${insurance.patients.last_name}`
                        : "Unknown Patient"}
                    </h3>
                    <Badge variant={insurance.priority_order === 1 ? "default" : "secondary"}>
                      {insurance.priority_order === 1
                        ? "Primary"
                        : insurance.priority_order === 2
                          ? "Secondary"
                          : "Tertiary"}
                    </Badge>
                    <Badge variant={insurance.is_active ? "default" : "destructive"}>
                      {insurance.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{insurance.insurance_payers?.payer_name || "Unknown Payer"}</span>
                    </div>
                    <div>
                      <span className="font-medium">Policy:</span> {insurance.policy_number}
                    </div>
                    {insurance.group_number && (
                      <div>
                        <span className="font-medium">Group:</span> {insurance.group_number}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Subscriber:</span> {insurance.subscriber_name || "N/A"}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Effective: {insurance.effective_date}</span>
                    </div>
                    {insurance.termination_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Expires: {insurance.termination_date}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Relationship:</span> {insurance.relationship_to_subscriber}
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm">
                    {insurance.copay_amount && <Badge variant="outline">Copay: ${insurance.copay_amount}</Badge>}
                    {insurance.deductible_amount && (
                      <Badge variant="outline">Deductible: ${insurance.deductible_amount}</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditInsurance(insurance)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteInsurance(insurance.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInsurance.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No patient insurance found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms." : "Add patient insurance coverage to get started."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
