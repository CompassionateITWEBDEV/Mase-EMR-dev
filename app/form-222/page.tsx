"use client"

import { useState, useEffect } from "react"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  FileText,
  AlertTriangle,
  Clock,
  Shield,
  Lock,
  Plus,
  Trash2,
  XCircle,
  Calendar,
  User,
  Building,
  RefreshCw,
  Eye,
  Search,
  Printer,
  Users,
  FileCheck,
} from "lucide-react"

interface Form222Line {
  id: string
  line_number: number
  medication_id: number | null
  medication_name?: string
  quantity_ordered: number
  unit: string
  containers_shipped: number
  containers_received: number
  date_shipped: string | null
  date_received: string | null
  status: string
}

interface Form222 {
  id: number
  form_number: string
  supplier_name: string
  supplier_dea_number: string
  supplier_address: string
  registrant_name: string
  registrant_dea_number: string
  execution_date: string
  expires_at: string
  status: string
  signed_by_user_id: number | null
  signed_at: string | null
  void_reason: string | null
  created_at: string
  lines: Form222Line[]
}

interface DeaPoa {
  id: number
  authorized_name: string
  authorized_user_id: number
  registrant_dea_number: string
  effective_date: string
  expiration_date: string
  status: string
}

export default function Form222Page() {
  const [showNewForm, setShowNewForm] = useState(false)
  const [showReceiving, setShowReceiving] = useState(false)
  const [showViewForm, setShowViewForm] = useState(false)
  const [showVoidDialog, setShowVoidDialog] = useState(false)
  const [showPoaDialog, setShowPoaDialog] = useState(false)
  const [selectedForm, setSelectedForm] = useState<Form222 | null>(null)
  const [forms, setForms] = useState<Form222[]>([])
  const [poaList, setPoaList] = useState<DeaPoa[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()
  const supabase = createBrowserClient()

  // New form state
  const [newForm, setNewForm] = useState({
    supplierName: "",
    supplierDea: "",
    supplierAddress: "",
    signerId: "",
    executionDate: new Date().toISOString().split("T")[0],
  })
  const [newFormLines, setNewFormLines] = useState<
    { lineNumber: number; medication: string; quantity: number; unit: string }[]
  >([{ lineNumber: 1, medication: "", quantity: 0, unit: "mL" }])

  // Receiving state
  const [receivingFormId, setReceivingFormId] = useState<number | null>(null)
  const [receivingLines, setReceivingLines] = useState<
    { lineId: string; containersReceived: number; dateReceived: string }[]
  >([])

  // Void state
  const [voidReason, setVoidReason] = useState("")

  // POA state
  const [newPoa, setNewPoa] = useState({
    authorizedName: "",
    registrantDea: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    expirationDate: "",
  })

  // Fetch forms from database
  const fetchForms = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("dea_form_222")
        .select("*, lines:dea_form_222_line(*)")
        .order("created_at", { ascending: false })

      if (error) throw error
      setForms(data || [])
    } catch (error) {
      console.error("Error fetching forms:", error)
      toast({
        title: "Error",
        description: "Failed to load Form 222 records",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch POA list
  const fetchPoaList = async () => {
    try {
      const { data, error } = await supabase.from("dea_poa").select("*").eq("status", "active").order("authorized_name")

      if (error) throw error
      setPoaList(data || [])
    } catch (error) {
      console.error("Error fetching POA list:", error)
    }
  }

  useEffect(() => {
    fetchForms()
    fetchPoaList()
  }, [])

  // Calculate statistics
  const stats = {
    activeCount: forms.filter((f) => f.status === "executed").length,
    pendingReceipts: forms.reduce((sum, f) => sum + (f.lines?.filter((l) => l.status === "pending").length || 0), 0),
    expiringSoon: forms.filter((f) => {
      if (f.status !== "executed") return false
      const daysLeft = Math.ceil((new Date(f.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysLeft <= 10 && daysLeft > 0
    }).length,
    authorizedSigners: poaList.length + 1, // +1 for registrant
  }

  // Generate form number
  const generateFormNumber = () => {
    const year = new Date().getFullYear()
    const sequence = String(forms.length + 1).padStart(3, "0")
    return `F222-${year}-${sequence}`
  }

  // Execute new Form 222
  const handleExecuteForm = async () => {
    if (!newForm.supplierName || !newForm.supplierDea || !newForm.signerId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (newFormLines.some((l) => !l.medication || l.quantity <= 0)) {
      toast({
        title: "Validation Error",
        description: "Please complete all line items with medication and quantity",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const formNumber = generateFormNumber()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 60)

      // Insert form
      const { data: formData, error: formError } = await supabase
        .from("dea_form_222")
        .insert({
          form_number: formNumber,
          supplier_name: newForm.supplierName,
          supplier_dea_number: newForm.supplierDea,
          supplier_address: newForm.supplierAddress,
          registrant_name: "Clinic DEA Registrant",
          registrant_dea_number: "MC1234567",
          execution_date: newForm.executionDate,
          expires_at: expiresAt.toISOString().split("T")[0],
          status: "executed",
          signed_by_user_id: Number.parseInt(newForm.signerId),
          signed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (formError) throw formError

      // Insert line items
      const lineItems = newFormLines.map((line) => ({
        form_222_id: formData.id,
        line_number: line.lineNumber,
        quantity_ordered: line.quantity,
        unit: line.unit,
        containers_shipped: 0,
        containers_received: 0,
        status: "pending",
      }))

      const { error: linesError } = await supabase.from("dea_form_222_line").insert(lineItems)

      if (linesError) throw linesError

      toast({
        title: "Form 222 Executed",
        description: `Form ${formNumber} has been successfully executed`,
      })

      setShowNewForm(false)
      setNewForm({
        supplierName: "",
        supplierDea: "",
        supplierAddress: "",
        signerId: "",
        executionDate: new Date().toISOString().split("T")[0],
      })
      setNewFormLines([{ lineNumber: 1, medication: "", quantity: 0, unit: "mL" }])
      fetchForms()
    } catch (error) {
      console.error("Error executing form:", error)
      toast({
        title: "Error",
        description: "Failed to execute Form 222",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Process receiving
  const handleProcessReceiving = async () => {
    if (!receivingFormId || receivingLines.length === 0) return

    setSaving(true)
    try {
      for (const line of receivingLines) {
        if (line.containersReceived > 0 && line.dateReceived) {
          await supabase
            .from("dea_form_222_line")
            .update({
              containers_received: line.containersReceived,
              date_received: line.dateReceived,
              status: "complete",
            })
            .eq("id", line.lineId)
        }
      }

      // Check if all lines are complete
      const form = forms.find((f) => f.id === receivingFormId)
      if (form) {
        const allComplete = form.lines?.every(
          (l) => receivingLines.find((rl) => rl.lineId === l.id)?.containersReceived > 0 || l.status === "complete",
        )
        if (allComplete) {
          await supabase.from("dea_form_222").update({ status: "completed" }).eq("id", receivingFormId)
        }
      }

      toast({
        title: "Receipt Processed",
        description: "Form 222 receiving has been recorded",
      })

      setShowReceiving(false)
      setReceivingFormId(null)
      setReceivingLines([])
      fetchForms()
    } catch (error) {
      console.error("Error processing receiving:", error)
      toast({
        title: "Error",
        description: "Failed to process receiving",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Void form
  const handleVoidForm = async () => {
    if (!selectedForm || !voidReason) return

    setSaving(true)
    try {
      await supabase
        .from("dea_form_222")
        .update({
          status: "voided",
          void_reason: voidReason,
        })
        .eq("id", selectedForm.id)

      toast({
        title: "Form Voided",
        description: `Form ${selectedForm.form_number} has been voided`,
      })

      setShowVoidDialog(false)
      setSelectedForm(null)
      setVoidReason("")
      fetchForms()
    } catch (error) {
      console.error("Error voiding form:", error)
      toast({
        title: "Error",
        description: "Failed to void form",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Add POA
  const handleAddPoa = async () => {
    if (!newPoa.authorizedName || !newPoa.registrantDea || !newPoa.expirationDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await supabase.from("dea_poa").insert({
        authorized_name: newPoa.authorizedName,
        registrant_dea_number: newPoa.registrantDea,
        effective_date: newPoa.effectiveDate,
        expiration_date: newPoa.expirationDate,
        status: "active",
      })

      toast({
        title: "POA Added",
        description: `${newPoa.authorizedName} has been added as authorized signer`,
      })

      setShowPoaDialog(false)
      setNewPoa({
        authorizedName: "",
        registrantDea: "",
        effectiveDate: new Date().toISOString().split("T")[0],
        expirationDate: "",
      })
      fetchPoaList()
    } catch (error) {
      console.error("Error adding POA:", error)
      toast({
        title: "Error",
        description: "Failed to add POA",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Add line item
  const addFormLine = () => {
    setNewFormLines([...newFormLines, { lineNumber: newFormLines.length + 1, medication: "", quantity: 0, unit: "mL" }])
  }

  // Remove line item
  const removeFormLine = (index: number) => {
    if (newFormLines.length > 1) {
      const updated = newFormLines
        .filter((_, i) => i !== index)
        .map((line, i) => ({
          ...line,
          lineNumber: i + 1,
        }))
      setNewFormLines(updated)
    }
  }

  // Get status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "executed":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "voided":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getLineStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "partial":
        return "bg-orange-100 text-orange-800"
      case "complete":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Calculate days remaining
  const getDaysRemaining = (expiresAt: string) => {
    return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  // Filter forms
  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      form.form_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || form.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Medications list for selection
  const medications = [
    { id: 1, name: "Methadone HCl 10mg/mL", schedule: "II" },
    { id: 2, name: "Methadone HCl 5mg/mL", schedule: "II" },
    { id: 3, name: "Buprenorphine 8mg SL", schedule: "III" },
    { id: 4, name: "Morphine Sulfate 15mg/mL", schedule: "II" },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />

      <div className="flex-1 ml-64 p-6 space-y-6">
        {/* DEA Warning Banner */}
        <Alert className="bg-red-50 border-red-200">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>DEA Form 222 - Schedule II Ordering:</strong> Only DEA registrants or authorized POA signers may
            execute Form 222. No alterations permitted - changes void the form. 60-day expiry from execution date.
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DEA Form 222 Management</h1>
            <p className="text-muted-foreground">Schedule II controlled substance ordering and receiving</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => fetchForms()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setShowPoaDialog(true)}>
              <Users className="w-4 h-4 mr-2" />
              Manage POA
            </Button>
            <Button onClick={() => setShowNewForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Form 222
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCount}</div>
              <p className="text-xs text-muted-foreground">Within 60-day window</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReceipts}</div>
              <p className="text-xs text-muted-foreground">Line items awaiting delivery</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiringSoon}</div>
              <p className="text-xs text-muted-foreground">Forms expiring in 10 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Authorized Signers</CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.authorizedSigners}</div>
              <p className="text-xs text-muted-foreground">Registrant + {poaList.length} POA</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="register" className="space-y-4">
          <TabsList>
            <TabsTrigger value="register">Form 222 Register</TabsTrigger>
            <TabsTrigger value="poa">Power of Attorney</TabsTrigger>
            <TabsTrigger value="reports">DEA Reports</TabsTrigger>
          </TabsList>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by form number or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="executed">Executed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Forms List */}
            <Card>
              <CardHeader>
                <CardTitle>Form 222 Register</CardTitle>
                <CardDescription>All executed forms with 60-day tracking and receiving status</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading forms...</div>
                ) : filteredForms.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No Form 222 records found</p>
                    <Button className="mt-4" onClick={() => setShowNewForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Execute New Form 222
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredForms.map((form) => {
                      const daysRemaining = getDaysRemaining(form.expires_at)
                      return (
                        <div key={form.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold">{form.form_number}</h3>
                              <Badge className={getStatusColor(form.status)}>{form.status}</Badge>
                              {daysRemaining <= 10 && daysRemaining > 0 && form.status === "executed" && (
                                <Badge className="bg-orange-100 text-orange-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {daysRemaining} days left
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedForm(form)
                                  setShowViewForm(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              {form.status === "executed" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setReceivingFormId(form.id)
                                      setReceivingLines(
                                        form.lines?.map((l) => ({
                                          lineId: l.id,
                                          containersReceived: 0,
                                          dateReceived: new Date().toISOString().split("T")[0],
                                        })) || [],
                                      )
                                      setShowReceiving(true)
                                    }}
                                  >
                                    Process Receipt
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedForm(form)
                                      setShowVoidDialog(true)
                                    }}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center">
                              <Building className="w-4 h-4 mr-2" />
                              {form.supplier_name} (DEA: {form.supplier_dea_number})
                            </div>
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              Signed: {form.signed_at ? new Date(form.signed_at).toLocaleDateString() : "N/A"}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Executed: {form.execution_date}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              Expires: {form.expires_at}
                            </div>
                          </div>

                          {form.lines && form.lines.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Line Items:</h4>
                              {form.lines.map((line) => (
                                <div key={line.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm font-mono">#{line.line_number}</span>
                                    <span className="text-sm">Schedule II Medication</span>
                                    <span className="text-sm text-muted-foreground">
                                      {line.quantity_ordered} {line.unit}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge className={getLineStatusColor(line.status)}>{line.status}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {line.containers_received}/{line.quantity_ordered} received
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* POA Tab */}
          <TabsContent value="poa" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Power of Attorney Management</CardTitle>
                  <CardDescription>Manage authorized signers for Form 222 execution</CardDescription>
                </div>
                <Button onClick={() => setShowPoaDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add POA
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Registrant */}
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold">DEA Registrant</span>
                          <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">DEA: MC1234567</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>

                  {/* POA List */}
                  {poaList.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No Power of Attorney records</p>
                      <p className="text-sm">Add authorized signers to delegate Form 222 execution</p>
                    </div>
                  ) : (
                    poaList.map((poa) => (
                      <div key={poa.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="w-5 h-5 text-gray-600" />
                              <span className="font-semibold">{poa.authorized_name}</span>
                              <Badge variant="outline">POA</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              DEA: {poa.registrant_dea_number} • Effective: {poa.effective_date} to{" "}
                              {poa.expiration_date}
                            </p>
                          </div>
                          <Badge
                            className={
                              poa.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }
                          >
                            {poa.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>DEA Compliance Reports</CardTitle>
                <CardDescription>Generate reports for DEA inspection and audit compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
                    onClick={() => {
                      toast({
                        title: "Report Generated",
                        description: "Form 222 Register report is ready for download",
                      })
                    }}
                  >
                    <FileText className="w-6 h-6" />
                    <span>Form 222 Register</span>
                    <span className="text-xs text-muted-foreground">All forms with line items</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
                    onClick={() => {
                      toast({ title: "Report Generated", description: "Receiving Log report is ready for download" })
                    }}
                  >
                    <FileCheck className="w-6 h-6" />
                    <span>Receiving Log</span>
                    <span className="text-xs text-muted-foreground">All receipts by date</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
                    onClick={() => {
                      toast({ title: "Report Generated", description: "Voided Forms report is ready for download" })
                    }}
                  >
                    <XCircle className="w-6 h-6" />
                    <span>Voided Forms</span>
                    <span className="text-xs text-muted-foreground">Forms voided with reasons</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
                    onClick={() => {
                      toast({
                        title: "Report Generated",
                        description: "POA Authorization report is ready for download",
                      })
                    }}
                  >
                    <Users className="w-6 h-6" />
                    <span>POA Authorization</span>
                    <span className="text-xs text-muted-foreground">All authorized signers</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Form 222 Dialog */}
        <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Execute New DEA Form 222</DialogTitle>
              <DialogDescription>
                Order Schedule II controlled substances - one supplier, one item per line
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>DEA Requirements:</strong> Only registrant or POA-authorized personnel may sign. Form expires
                  60 days from execution. No alterations permitted.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Supplier Name *</Label>
                  <Input
                    placeholder="e.g., Cardinal Health"
                    value={newForm.supplierName}
                    onChange={(e) => setNewForm({ ...newForm, supplierName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Supplier DEA Number *</Label>
                  <Input
                    placeholder="e.g., BC1234567"
                    value={newForm.supplierDea}
                    onChange={(e) => setNewForm({ ...newForm, supplierDea: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Supplier Address *</Label>
                <Textarea
                  placeholder="Complete supplier address"
                  value={newForm.supplierAddress}
                  onChange={(e) => setNewForm({ ...newForm, supplierAddress: e.target.value })}
                />
              </div>

              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold mb-3">Line Items</h4>
                <div className="space-y-3">
                  {newFormLines.map((line, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded border">
                      <span className="font-mono text-sm w-8">#{line.lineNumber}</span>
                      <Select
                        value={line.medication}
                        onValueChange={(value) => {
                          const updated = [...newFormLines]
                          updated[index].medication = value
                          setNewFormLines(updated)
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select medication" />
                        </SelectTrigger>
                        <SelectContent>
                          {medications.map((med) => (
                            <SelectItem key={med.id} value={med.name}>
                              {med.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        className="w-24"
                        placeholder="Qty"
                        type="number"
                        value={line.quantity || ""}
                        onChange={(e) => {
                          const updated = [...newFormLines]
                          updated[index].quantity = Number.parseInt(e.target.value) || 0
                          setNewFormLines(updated)
                        }}
                      />
                      <Select
                        value={line.unit}
                        onValueChange={(value) => {
                          const updated = [...newFormLines]
                          updated[index].unit = value
                          setNewFormLines(updated)
                        }}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mL">mL</SelectItem>
                          <SelectItem value="mg">mg</SelectItem>
                          <SelectItem value="tabs">tabs</SelectItem>
                        </SelectContent>
                      </Select>
                      {newFormLines.length > 1 && (
                        <Button size="sm" variant="outline" onClick={() => removeFormLine(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-3 bg-transparent" onClick={addFormLine}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Line Item
                </Button>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-3">Execution & Signature</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Authorized Signer *</Label>
                    <Select
                      value={newForm.signerId}
                      onValueChange={(value) => setNewForm({ ...newForm, signerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select authorized signer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">DEA Registrant (Primary)</SelectItem>
                        {poaList.map((poa) => (
                          <SelectItem key={poa.id} value={String(poa.authorized_user_id || poa.id)}>
                            {poa.authorized_name} (POA)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Execution Date *</Label>
                    <Input
                      type="date"
                      value={newForm.executionDate}
                      onChange={(e) => setNewForm({ ...newForm, executionDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white border rounded">
                  <p className="text-sm text-muted-foreground">
                    <Lock className="w-4 h-4 inline mr-2" />
                    By executing this form, I certify that I am authorized to order Schedule II controlled substances.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
              <Button className="bg-red-600 hover:bg-red-700" onClick={handleExecuteForm} disabled={saving}>
                <Lock className="w-4 h-4 mr-2" />
                {saving ? "Executing..." : "Execute Form 222"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receiving Dialog */}
        <Dialog open={showReceiving} onOpenChange={setShowReceiving}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Process Form 222 Receipt</DialogTitle>
              <DialogDescription>Record containers received and arrival dates</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {receivingFormId &&
                forms
                  .find((f) => f.id === receivingFormId)
                  ?.lines?.map((line, index) => (
                    <div key={line.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">Line #{line.line_number}</p>
                        <p className="text-sm text-muted-foreground">
                          Ordered: {line.quantity_ordered} {line.unit}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div>
                          <Label className="text-xs">Containers Received</Label>
                          <Input
                            className="w-20"
                            type="number"
                            value={receivingLines[index]?.containersReceived || 0}
                            onChange={(e) => {
                              const updated = [...receivingLines]
                              updated[index] = {
                                ...updated[index],
                                containersReceived: Number.parseInt(e.target.value) || 0,
                              }
                              setReceivingLines(updated)
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Date Received</Label>
                          <Input
                            className="w-36"
                            type="date"
                            value={receivingLines[index]?.dateReceived || ""}
                            onChange={(e) => {
                              const updated = [...receivingLines]
                              updated[index] = {
                                ...updated[index],
                                dateReceived: e.target.value,
                              }
                              setReceivingLines(updated)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReceiving(false)}>
                Cancel
              </Button>
              <Button onClick={handleProcessReceiving} disabled={saving}>
                {saving ? "Processing..." : "Confirm Receipt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Form Dialog */}
        <Dialog open={showViewForm} onOpenChange={setShowViewForm}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Form 222 Details - {selectedForm?.form_number}</DialogTitle>
            </DialogHeader>

            {selectedForm && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Supplier</Label>
                    <p className="font-medium">{selectedForm.supplier_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Supplier DEA</Label>
                    <p className="font-medium">{selectedForm.supplier_dea_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Execution Date</Label>
                    <p className="font-medium">{selectedForm.execution_date}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Expires</Label>
                    <p className="font-medium">{selectedForm.expires_at}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={getStatusColor(selectedForm.status)}>{selectedForm.status}</Badge>
                  </div>
                  {selectedForm.void_reason && (
                    <div>
                      <Label className="text-muted-foreground">Void Reason</Label>
                      <p className="font-medium text-red-600">{selectedForm.void_reason}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Line Items</Label>
                  <div className="space-y-2 mt-2">
                    {selectedForm.lines?.map((line) => (
                      <div key={line.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <span>
                          #{line.line_number} - {line.quantity_ordered} {line.unit}
                        </span>
                        <Badge className={getLineStatusColor(line.status)}>{line.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewForm(false)}>
                Close
              </Button>
              <Button variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Void Dialog */}
        <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Void Form 222</DialogTitle>
              <DialogDescription>This action cannot be undone. Please provide a reason for voiding.</DialogDescription>
            </DialogHeader>

            <div>
              <Label>Void Reason *</Label>
              <Textarea
                placeholder="Enter reason for voiding this form..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVoidDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleVoidForm} disabled={saving || !voidReason}>
                {saving ? "Voiding..." : "Void Form"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* POA Dialog */}
        <Dialog open={showPoaDialog} onOpenChange={setShowPoaDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Power of Attorney</DialogTitle>
              <DialogDescription>Authorize personnel to execute Form 222 on behalf of the registrant</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Authorized Person Name *</Label>
                <Input
                  placeholder="Full name of authorized person"
                  value={newPoa.authorizedName}
                  onChange={(e) => setNewPoa({ ...newPoa, authorizedName: e.target.value })}
                />
              </div>
              <div>
                <Label>Registrant DEA Number *</Label>
                <Input
                  placeholder="DEA number granting authorization"
                  value={newPoa.registrantDea}
                  onChange={(e) => setNewPoa({ ...newPoa, registrantDea: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Effective Date *</Label>
                  <Input
                    type="date"
                    value={newPoa.effectiveDate}
                    onChange={(e) => setNewPoa({ ...newPoa, effectiveDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Expiration Date *</Label>
                  <Input
                    type="date"
                    value={newPoa.expirationDate}
                    onChange={(e) => setNewPoa({ ...newPoa, expirationDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPoaDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPoa} disabled={saving}>
                {saving ? "Adding..." : "Add POA"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
