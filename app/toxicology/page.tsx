"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { DashboardHeader } from "@/components/dashboard-header"
import {
  FlaskConical,
  Plus,
  FileCheck,
  Clock,
  Search,
  Building2,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Eye,
  TestTube,
  Printer,
  RefreshCw,
  Settings,
  Loader2,
  Edit,
  Trash2,
  Ban,
  Send,
  FileSignature,
  AlertTriangle,
} from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function ToxicologyContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const preSelectedPatientId = searchParams.get("patient")
  
  const { data, error, isLoading, mutate } = useSWR("/api/toxicology", fetcher)
  const { data: labsData, mutate: mutateLabs } = useSWR("/api/toxicology?action=labs", fetcher)
  const { data: ordersData, mutate: mutateOrders } = useSWR("/api/toxicology?action=orders", fetcher)
  const { data: settingsData, mutate: mutateSettings } = useSWR("/api/toxicology?action=settings", fetcher)
  
  // Fetch pre-selected patient data if provided via URL
  const { data: preSelectedPatientData } = useSWR(
    preSelectedPatientId ? `/api/patients/${preSelectedPatientId}` : null,
    fetcher
  )
  
  // Combine patients list with pre-selected patient (if not already in list)
  const allPatients = (() => {
    const basePatients = data?.patients || []
    if (preSelectedPatientData?.patient && preSelectedPatientId) {
      const patientInList = basePatients.some((p: any) => p.id === preSelectedPatientId)
      if (!patientInList) {
        const patient = preSelectedPatientData.patient
        return [
          {
            id: patient.id,
            full_name: patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
          },
          ...basePatients
        ]
      }
    }
    return basePatients
  })()

  const [activeTab, setActiveTab] = useState("orders")
  const [searchTerm, setSearchTerm] = useState("")
  const hasAutoOpenedRef = useRef(false)

  // Dialog states
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [newLabOpen, setNewLabOpen] = useState(false)
  const [editLabOpen, setEditLabOpen] = useState(false)
  const [deactivateLabOpen, setDeactivateLabOpen] = useState(false)
  const [collectSpecimenOpen, setCollectSpecimenOpen] = useState(false)
  const [enterResultsOpen, setEnterResultsOpen] = useState(false)
  const [viewOrderOpen, setViewOrderOpen] = useState(false)
  const [cancelOrderOpen, setCancelOrderOpen] = useState(false)
  const [sendToLabOpen, setSendToLabOpen] = useState(false)
  const [reviewResultsOpen, setReviewResultsOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [selectedLab, setSelectedLab] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [trackingInfo, setTrackingInfo] = useState("")
  const [reviewNotes, setReviewNotes] = useState("")
  
  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    defaultCollectionMethod: "Urine",
    observedCollectionPolicy: "clinical",
    defaultTestPanel: "",
    autoSendToLab: false,
    preferredLabId: "",
  })
  const [savingSettings, setSavingSettings] = useState(false)

  // New Order form
  const [orderForm, setOrderForm] = useState({
    patientId: "",
    providerId: "",
    labId: "",
    collectionMethod: "Urine",
    testPanel: "",
    substancesToTest: [] as string[],
    reasonForTesting: "routine",
    urgency: "Routine",
  })

  // New Lab form
  const [labForm, setLabForm] = useState({
    labName: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cliaNumber: "",
    samhsaCertified: false,
    capAccredited: false,
    turnaroundHours: 24,
    testPanelsOffered: [] as string[],
  })

  // Collection form
  const [collectionForm, setCollectionForm] = useState({
    specimenId: "",
    temperatureCheck: true,
    specimenIntegrity: "Valid",
    observedCollection: false,
    cocNumber: "",
    staffId: "",
  })

  // Results form
  const [resultsForm, setResultsForm] = useState({
    overallResult: "Negative",
    results: [] as any[],
  })

  // Pre-select patient from URL parameter (when navigating from Patient Chart)
  useEffect(() => {
    // Skip if already auto-opened or no pre-selected patient
    if (hasAutoOpenedRef.current || !preSelectedPatientId) return
    
    // Wait for providers to load before opening the dialog
    if (data?.providers && data.providers.length > 0) {
      // Check if the patient exists in the combined patients list or if we have pre-selected patient data
      const patientExists = allPatients.some((p: any) => p.id === preSelectedPatientId) || preSelectedPatientData?.patient
      if (patientExists) {
        setOrderForm(prev => ({ ...prev, patientId: preSelectedPatientId }))
        // Auto-open the new order dialog
        setNewOrderOpen(true)
        hasAutoOpenedRef.current = true
      }
    }
  }, [preSelectedPatientId, allPatients, preSelectedPatientData, data?.providers])

  // Load settings when data arrives
  useEffect(() => {
    if (settingsData?.settings) {
      setSettingsForm({
        defaultCollectionMethod: settingsData.settings.default_collection_method || "Urine",
        observedCollectionPolicy: settingsData.settings.observed_collection_policy || "clinical",
        defaultTestPanel: settingsData.settings.default_test_panel || "",
        autoSendToLab: settingsData.settings.auto_send_to_lab || false,
        preferredLabId: settingsData.settings.preferred_lab_id || "",
      })
    }
  }, [settingsData?.settings])

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-settings",
          ...settingsForm,
        }),
      })

      if (!res.ok) throw new Error("Failed to save settings")

      toast({ title: "Success", description: "Settings saved successfully" })
      mutateSettings()
    } catch (err) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setSavingSettings(false)
    }
  }

  // Print handler for toxicology reports
  const handlePrint = (order: any) => {
    const patientName = `${order.patients?.first_name || ""} ${order.patients?.last_name || ""}`
    const providerName = `${order.providers?.first_name || ""} ${order.providers?.last_name || ""}`
    const orderDate = order.order_date ? new Date(order.order_date).toLocaleDateString() : "-"
    const collectionDate = order.collection_date ? new Date(order.collection_date).toLocaleDateString() : "-"
    const resultDate = order.result_received_date ? new Date(order.result_received_date).toLocaleDateString() : "-"

    const resultsHtml = (order.results || []).map((r: any) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${r.substance_name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${r.substance_class || "-"}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: ${r.result === "Positive" ? "#dc2626" : "#16a34a"};">${r.result}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${r.cutoff_level || "-"}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${r.concentration || "-"}</td>
      </tr>
    `).join("")

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Toxicology Report - ${order.order_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 20px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .info-item { margin-bottom: 10px; }
          .info-label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
          .info-value { font-size: 14px; color: #1f2937; }
          .overall-result { font-size: 18px; font-weight: bold; padding: 10px; border-radius: 5px; display: inline-block; }
          .negative { background: #dcfce7; color: #16a34a; }
          .positive { background: #fee2e2; color: #dc2626; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #ddd; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #6b7280; }
          .chain-of-custody { background: #f9fafb; padding: 15px; border-radius: 5px; margin-top: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Drug Screen Report</h1>
        <div class="header">
          <div><strong>Order #:</strong> ${order.order_number}</div>
          <div><strong>Status:</strong> ${order.status}</div>
        </div>
        
        <h2>Patient Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Patient Name</div>
            <div class="info-value">${patientName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Ordering Provider</div>
            <div class="info-value">Dr. ${providerName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Order Date</div>
            <div class="info-value">${orderDate}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Test Panel</div>
            <div class="info-value">${order.test_panel}</div>
          </div>
        </div>

        <h2>Collection Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Collection Date</div>
            <div class="info-value">${collectionDate}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Collection Method</div>
            <div class="info-value">${order.collection_method || "-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Specimen ID</div>
            <div class="info-value">${order.specimen_id || "-"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Specimen Integrity</div>
            <div class="info-value">${order.specimen_integrity || "-"}</div>
          </div>
        </div>

        ${order.chain_of_custody_number ? `
        <div class="chain-of-custody">
          <strong>Chain of Custody #:</strong> ${order.chain_of_custody_number}<br>
          <strong>Observed Collection:</strong> ${order.observed_collection ? "Yes" : "No"}<br>
          <strong>Temperature Check:</strong> ${order.temperature_check ? "Passed" : "N/A"}
        </div>
        ` : ""}

        ${order.overall_result ? `
        <h2>Results</h2>
        <div class="info-item">
          <div class="info-label">Result Date</div>
          <div class="info-value">${resultDate}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Overall Result</div>
          <div class="overall-result ${order.overall_result === "Negative" ? "negative" : "positive"}">${order.overall_result}</div>
        </div>

        ${(order.results || []).length > 0 ? `
        <h3>Detailed Results</h3>
        <table>
          <thead>
            <tr>
              <th>Substance</th>
              <th>Class</th>
              <th>Result</th>
              <th>Cutoff Level</th>
              <th>Concentration</th>
            </tr>
          </thead>
          <tbody>
            ${resultsHtml}
          </tbody>
        </table>
        ` : ""}
        ` : ""}

        <div class="footer">
          <p>This report was generated on ${new Date().toLocaleString()}</p>
          <p>MASE EMR - Toxicology Lab Integration</p>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    } else {
      toast({ title: "Error", description: "Unable to open print window. Please check popup blocker settings.", variant: "destructive" })
    }
  }

  const testPanels = [
    { id: "5-panel", name: "5-Panel Standard", substances: ["THC", "Cocaine", "Opiates", "PCP", "Amphetamines"] },
    {
      id: "10-panel",
      name: "10-Panel Extended",
      substances: [
        "THC",
        "Cocaine",
        "Opiates",
        "PCP",
        "Amphetamines",
        "Barbiturates",
        "Benzodiazepines",
        "Methadone",
        "Propoxyphene",
        "Methaqualone",
      ],
    },
    {
      id: "12-panel",
      name: "12-Panel Comprehensive",
      substances: [
        "THC",
        "Cocaine",
        "Opiates",
        "PCP",
        "Amphetamines",
        "Barbiturates",
        "Benzodiazepines",
        "Methadone",
        "Oxycodone",
        "MDMA",
        "Buprenorphine",
        "Fentanyl",
      ],
    },
    {
      id: "opioid-panel",
      name: "Opioid Specific Panel",
      substances: ["Opiates", "Oxycodone", "Methadone", "Buprenorphine", "Fentanyl", "Tramadol"],
    },
    {
      id: "mat-panel",
      name: "MAT Monitoring Panel",
      substances: [
        "Methadone",
        "Buprenorphine",
        "Naltrexone",
        "Opiates",
        "Benzodiazepines",
        "Cocaine",
        "Amphetamines",
        "THC",
      ],
    },
  ]

  const handleCreateOrder = async () => {
    if (!orderForm.patientId || !orderForm.providerId || !orderForm.testPanel) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const panel = testPanels.find((p) => p.id === orderForm.testPanel)
      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-order",
          patientId: orderForm.patientId,
          providerId: orderForm.providerId,
          labId: orderForm.labId || null,
          collectionMethod: orderForm.collectionMethod,
          testPanel: panel?.name || orderForm.testPanel,
          substancesToTest: panel?.substances || [],
          reasonForTesting: orderForm.reasonForTesting,
          urgency: orderForm.urgency,
        }),
      })

      if (!res.ok) throw new Error("Failed to create order")

      toast({ title: "Success", description: "Drug screen order created successfully" })
      setNewOrderOpen(false)
      setOrderForm({
        patientId: "",
        providerId: "",
        labId: "",
        collectionMethod: "Urine",
        testPanel: "",
        substancesToTest: [],
        reasonForTesting: "routine",
        urgency: "Routine",
      })
      mutate()
      mutateOrders()
    } catch (err) {
      toast({ title: "Error", description: "Failed to create order", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateLab = async () => {
    if (!labForm.labName || !labForm.cliaNumber) {
      toast({ title: "Error", description: "Lab name and CLIA number are required", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-lab",
          ...labForm,
        }),
      })

      if (!res.ok) throw new Error("Failed to create lab")

      toast({ title: "Success", description: "Lab added successfully" })
      setNewLabOpen(false)
      setLabForm({
        labName: "",
        contactName: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        cliaNumber: "",
        samhsaCertified: false,
        capAccredited: false,
        turnaroundHours: 24,
        testPanelsOffered: [],
      })
      mutateLabs()
    } catch (err) {
      toast({ title: "Error", description: "Failed to create lab", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCollectSpecimen = async () => {
    if (!selectedOrder || !collectionForm.specimenId) {
      toast({ title: "Error", description: "Specimen ID is required", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record-collection",
          orderId: selectedOrder.id,
          ...collectionForm,
        }),
      })

      if (!res.ok) throw new Error("Failed to record collection")

      toast({ title: "Success", description: "Specimen collection recorded" })
      setCollectSpecimenOpen(false)
      setCollectionForm({
        specimenId: "",
        temperatureCheck: true,
        specimenIntegrity: "Valid",
        observedCollection: false,
        cocNumber: "",
        staffId: "",
      })
      mutate()
      mutateOrders()
    } catch (err) {
      toast({ title: "Error", description: "Failed to record collection", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnterResults = async () => {
    if (!selectedOrder || resultsForm.results.length === 0) {
      toast({ title: "Error", description: "Please enter results", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enter-results",
          orderId: selectedOrder.id,
          overallResult: resultsForm.overallResult,
          results: resultsForm.results,
        }),
      })

      if (!res.ok) throw new Error("Failed to enter results")

      toast({ title: "Success", description: "Results entered successfully" })
      setEnterResultsOpen(false)
      setResultsForm({ overallResult: "Negative", results: [] })
      mutate()
      mutateOrders()
    } catch (err) {
      toast({ title: "Error", description: "Failed to enter results", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const openCollectSpecimen = (order: any) => {
    setSelectedOrder(order)
    setCollectionForm({
      specimenId: `SPEC-${Date.now()}`,
      temperatureCheck: true,
      specimenIntegrity: "Valid",
      observedCollection: false,
      cocNumber: `COC-${Date.now()}`,
      staffId: "",
    })
    setCollectSpecimenOpen(true)
  }

  const openEnterResults = (order: any) => {
    setSelectedOrder(order)
    const substances = order.substances_to_test || ["THC", "Cocaine", "Opiates", "PCP", "Amphetamines"]
    setResultsForm({
      overallResult: "Negative",
      results: substances.map((s: string) => ({
        substance: s,
        substanceClass: s,
        result: "Negative",
        cutoffLevel: "50 ng/mL",
        concentration: "",
        confirmationRequired: false,
      })),
    })
    setEnterResultsOpen(true)
  }

  const openViewOrder = (order: any) => {
    setSelectedOrder(order)
    setViewOrderOpen(true)
  }

  // Edit Lab handlers
  const openEditLab = (lab: any) => {
    setSelectedLab(lab)
    setLabForm({
      labName: lab.lab_name || "",
      contactName: lab.contact_name || "",
      phone: lab.phone || "",
      email: lab.email || "",
      address: lab.address || "",
      city: lab.city || "",
      state: lab.state || "",
      zip: lab.zip || "",
      cliaNumber: lab.clia_number || "",
      samhsaCertified: lab.samhsa_certified || false,
      capAccredited: lab.cap_accredited || false,
      turnaroundHours: lab.average_turnaround_hours || 24,
      testPanelsOffered: lab.test_panels_offered || [],
    })
    setEditLabOpen(true)
  }

  const handleEditLab = async () => {
    if (!selectedLab || !labForm.labName || !labForm.cliaNumber) {
      toast({ title: "Error", description: "Lab name and CLIA number are required", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-lab",
          labId: selectedLab.id,
          ...labForm,
        }),
      })

      if (!res.ok) throw new Error("Failed to update lab")

      toast({ title: "Success", description: "Lab updated successfully" })
      setEditLabOpen(false)
      setSelectedLab(null)
      mutateLabs()
    } catch (err) {
      toast({ title: "Error", description: "Failed to update lab", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const openDeactivateLab = (lab: any) => {
    setSelectedLab(lab)
    setDeactivateLabOpen(true)
  }

  const handleDeactivateLab = async () => {
    if (!selectedLab) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deactivate-lab",
          labId: selectedLab.id,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to deactivate lab")

      toast({ title: "Success", description: "Lab deactivated successfully" })
      setDeactivateLabOpen(false)
      setSelectedLab(null)
      mutateLabs()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to deactivate lab", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // Cancel Order handlers
  const openCancelOrder = (order: any) => {
    setSelectedOrder(order)
    setCancellationReason("")
    setCancelOrderOpen(true)
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel-order",
          orderId: selectedOrder.id,
          cancellationReason,
        }),
      })

      if (!res.ok) throw new Error("Failed to cancel order")

      toast({ title: "Success", description: "Order cancelled successfully" })
      setCancelOrderOpen(false)
      setSelectedOrder(null)
      mutate()
      mutateOrders()
    } catch (err) {
      toast({ title: "Error", description: "Failed to cancel order", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // Send to Lab handlers
  const openSendToLab = (order: any) => {
    setSelectedOrder(order)
    setTrackingInfo("")
    setSendToLabOpen(true)
  }

  const handleSendToLab = async () => {
    if (!selectedOrder) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-to-lab",
          orderId: selectedOrder.id,
          trackingInfo,
        }),
      })

      if (!res.ok) throw new Error("Failed to send to lab")

      toast({ title: "Success", description: "Order sent to lab" })
      setSendToLabOpen(false)
      setSelectedOrder(null)
      mutate()
      mutateOrders()
    } catch (err) {
      toast({ title: "Error", description: "Failed to send to lab", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // Provider Review handlers
  const openReviewResults = (order: any) => {
    setSelectedOrder(order)
    setReviewNotes("")
    setReviewResultsOpen(true)
  }

  const handleReviewResults = async () => {
    if (!selectedOrder) return

    setSubmitting(true)
    try {
      // Use the first provider for now (in a real app, use the logged-in provider)
      const providerId = data?.providers?.[0]?.id

      const res = await fetch("/api/toxicology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "provider-review",
          orderId: selectedOrder.id,
          providerId,
          clinicalNotes: reviewNotes,
        }),
      })

      if (!res.ok) throw new Error("Failed to review results")

      toast({ title: "Success", description: "Results reviewed and signed off" })
      setReviewResultsOpen(false)
      setSelectedOrder(null)
      mutate()
      mutateOrders()
    } catch (err) {
      toast({ title: "Error", description: "Failed to review results", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      collected: "bg-blue-100 text-blue-800",
      "in-lab": "bg-purple-100 text-purple-800",
      resulted: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>
  }

  const getResultBadge = (result: string) => {
    if (result === "Negative")
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Negative
        </Badge>
      )
    if (result === "Positive")
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Positive
        </Badge>
      )
    return <Badge className="bg-gray-100 text-gray-800">{result}</Badge>
  }

  const filteredOrders = (ordersData?.orders || []).filter((order: any) => {
    if (!searchTerm) return true
    const patientName = `${order.patients?.first_name || ""} ${order.patients?.last_name || ""}`.toLowerCase()
    const orderNum = (order.order_number || "").toLowerCase()
    return patientName.includes(searchTerm.toLowerCase()) || orderNum.includes(searchTerm.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Toxicology Lab Integration</h1>
              <p className="text-sm text-muted-foreground">Drug Screening Orders & Results Management</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  mutate()
                  mutateOrders()
                  mutateLabs()
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => setNewOrderOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Drug Screen
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Collection</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats?.pending || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting specimen</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">At Laboratory</CardTitle>
                <FlaskConical className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats?.collected || 0}</div>
                <p className="text-xs text-muted-foreground">In processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Results Ready</CardTitle>
                <FileCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stats?.resulted || 0}</div>
                <p className="text-xs text-muted-foreground">Completed tests</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Labs Connected</CardTitle>
                <Building2 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{labsData?.labs?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Active integrations</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="orders">
                <ClipboardList className="mr-2 h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="results">
                <TestTube className="mr-2 h-4 w-4" />
                Results
              </TabsTrigger>
              <TabsTrigger value="labs">
                <Building2 className="mr-2 h-4 w-4" />
                Labs
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Drug Screen Orders</CardTitle>
                      <CardDescription>Manage toxicology test orders</CardDescription>
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search orders..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No orders found</p>
                      <Button className="mt-4" onClick={() => setNewOrderOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Order
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Test Panel</TableHead>
                          <TableHead>Order Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.order_number}</TableCell>
                            <TableCell>
                              {order.patients?.first_name} {order.patients?.last_name}
                            </TableCell>
                            <TableCell>{order.test_panel}</TableCell>
                            <TableCell>
                              {order.order_date ? new Date(order.order_date).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{order.overall_result ? getResultBadge(order.overall_result) : "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openViewOrder(order)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {order.status === "pending" && (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => openCollectSpecimen(order)}>
                                      Collect
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => openCancelOrder(order)}>
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {order.status === "collected" && (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => openSendToLab(order)}>
                                      <Send className="h-4 w-4 mr-1" />
                                      Send
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => openEnterResults(order)}>
                                      Results
                                    </Button>
                                  </>
                                )}
                                {order.status === "in-lab" && (
                                  <Button size="sm" variant="outline" onClick={() => openEnterResults(order)}>
                                    Results
                                  </Button>
                                )}
                                {order.status === "resulted" && (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => openReviewResults(order)}>
                                      <FileSignature className="h-4 w-4 mr-1" />
                                      Review
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handlePrint(order)}>
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                  <CardDescription>View and review completed drug screen results</CardDescription>
                </CardHeader>
                <CardContent>
                  {(ordersData?.orders || []).filter((o: any) => o.status === "resulted").length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No results available yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Test Panel</TableHead>
                          <TableHead>Collection Date</TableHead>
                          <TableHead>Result Date</TableHead>
                          <TableHead>Overall Result</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(ordersData?.orders || [])
                          .filter((o: any) => o.status === "resulted")
                          .map((order: any) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">{order.order_number}</TableCell>
                              <TableCell>
                                {order.patients?.first_name} {order.patients?.last_name}
                              </TableCell>
                              <TableCell>{order.test_panel}</TableCell>
                              <TableCell>
                                {order.collection_date ? new Date(order.collection_date).toLocaleDateString() : "-"}
                              </TableCell>
                              <TableCell>
                                {order.result_received_date
                                  ? new Date(order.result_received_date).toLocaleDateString()
                                  : "-"}
                              </TableCell>
                              <TableCell>{getResultBadge(order.overall_result)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => openViewOrder(order)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => openReviewResults(order)}>
                                    <FileSignature className="h-4 w-4 mr-1" />
                                    Review
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handlePrint(order)}>
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Labs Tab */}
            <TabsContent value="labs">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Connected Laboratories</CardTitle>
                      <CardDescription>Manage toxicology lab integrations</CardDescription>
                    </div>
                    <Button onClick={() => setNewLabOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Lab
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(labsData?.labs || []).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No laboratories configured</p>
                      <Button className="mt-4" onClick={() => setNewLabOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Lab
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {(labsData?.labs || []).map((lab: any) => (
                        <Card key={lab.id} className="border">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{lab.lab_name}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={lab.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100"}
                                >
                                  {lab.status}
                                </Badge>
                                <Button size="sm" variant="ghost" onClick={() => openEditLab(lab)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => openDeactivateLab(lab)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <p>
                              <span className="text-muted-foreground">Contact:</span> {lab.contact_name || "-"}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Phone:</span> {lab.phone || "-"}
                            </p>
                            <p>
                              <span className="text-muted-foreground">CLIA #:</span> {lab.clia_number || "-"}
                            </p>
                            <div className="flex gap-2 pt-2">
                              {lab.samhsa_certified && <Badge variant="outline">SAMHSA Certified</Badge>}
                              {lab.cap_accredited && <Badge variant="outline">CAP Accredited</Badge>}
                            </div>
                            <p>
                              <span className="text-muted-foreground">Turnaround:</span>{" "}
                              {lab.average_turnaround_hours || 24} hours
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Toxicology Settings</CardTitle>
                      <CardDescription>Configure default settings for drug screening</CardDescription>
                    </div>
                    <Button onClick={handleSaveSettings} disabled={savingSettings}>
                      {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Settings
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Default Test Panel</h3>
                    <Select 
                      value={settingsForm.defaultTestPanel || "none"} 
                      onValueChange={(v) => setSettingsForm({ ...settingsForm, defaultTestPanel: v === "none" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select default test panel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No default</SelectItem>
                        {testPanels.map((panel) => (
                          <SelectItem key={panel.id} value={panel.id}>
                            {panel.name} ({panel.substances.length} substances)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid gap-3">
                      {testPanels.map((panel) => (
                        <div key={panel.id} className={`flex items-center justify-between p-3 border rounded-lg ${settingsForm.defaultTestPanel === panel.id ? 'border-primary bg-primary/5' : ''}`}>
                          <div className="flex-1 font-medium">{panel.name}</div>
                          <Badge variant="outline">{panel.substances.length} substances</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Chain of Custody Settings</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Default Collection Method</Label>
                        <Select 
                          value={settingsForm.defaultCollectionMethod}
                          onValueChange={(v) => setSettingsForm({ ...settingsForm, defaultCollectionMethod: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Urine">Urine</SelectItem>
                            <SelectItem value="Oral Fluid">Oral Fluid</SelectItem>
                            <SelectItem value="Hair">Hair</SelectItem>
                            <SelectItem value="Blood">Blood</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Require Observed Collection</Label>
                        <Select 
                          value={settingsForm.observedCollectionPolicy}
                          onValueChange={(v) => setSettingsForm({ ...settingsForm, observedCollectionPolicy: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="always">Always</SelectItem>
                            <SelectItem value="clinical">Clinical Decision</SelectItem>
                            <SelectItem value="never">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Lab Integration</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Preferred Laboratory</Label>
                        <Select 
                          value={settingsForm.preferredLabId || "none"}
                          onValueChange={(v) => setSettingsForm({ ...settingsForm, preferredLabId: v === "none" ? "" : v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select preferred lab" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No preference</SelectItem>
                            {(labsData?.labs || []).filter((lab: any) => lab.id).map((lab: any) => (
                              <SelectItem key={lab.id} value={lab.id}>
                                {lab.lab_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Auto-Send to Lab</Label>
                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="auto-send"
                            checked={settingsForm.autoSendToLab}
                            onCheckedChange={(c) => setSettingsForm({ ...settingsForm, autoSendToLab: c === true })}
                          />
                          <Label htmlFor="auto-send" className="font-normal">
                            Automatically send collected specimens to preferred lab
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* New Order Dialog */}
      <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Drug Screen Order</DialogTitle>
            <DialogDescription>Create a new toxicology test order</DialogDescription>
          </DialogHeader>
          {isLoading || (allPatients.length === 0 && !data?.providers) ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Loading patients and providers...</span>
            </div>
          ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={orderForm.patientId} onValueChange={(v) => setOrderForm({ ...orderForm, patientId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {allPatients.filter((p: any) => p.id).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || "Unknown Patient"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ordering Provider *</Label>
              <Select value={orderForm.providerId} onValueChange={(v) => setOrderForm({ ...orderForm, providerId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {(data?.providers || []).filter((p: any) => p.id).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      Dr. {p.first_name} {p.last_name} {p.license_type ? `, ${p.license_type}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Test Panel *</Label>
              <Select value={orderForm.testPanel} onValueChange={(v) => setOrderForm({ ...orderForm, testPanel: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test panel" />
                </SelectTrigger>
                <SelectContent>
                  {testPanels.map((panel) => (
                    <SelectItem key={panel.id} value={panel.id}>
                      {panel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Collection Method</Label>
                <Select
                  value={orderForm.collectionMethod}
                  onValueChange={(v) => setOrderForm({ ...orderForm, collectionMethod: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urine">Urine</SelectItem>
                    <SelectItem value="Oral Fluid">Oral Fluid</SelectItem>
                    <SelectItem value="Hair">Hair</SelectItem>
                    <SelectItem value="Blood">Blood</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Urgency</Label>
                <Select value={orderForm.urgency} onValueChange={(v) => setOrderForm({ ...orderForm, urgency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Routine">Routine</SelectItem>
                    <SelectItem value="STAT">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason for Testing</Label>
              <Select
                value={orderForm.reasonForTesting}
                onValueChange={(v) => setOrderForm({ ...orderForm, reasonForTesting: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine Monitoring</SelectItem>
                  <SelectItem value="admission">Admission Screening</SelectItem>
                  <SelectItem value="random">Random Testing</SelectItem>
                  <SelectItem value="for-cause">For Cause</SelectItem>
                  <SelectItem value="post-incident">Post-Incident</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(labsData?.labs || []).length > 0 && (
              <div className="space-y-2">
                <Label>Send to Lab (Optional)</Label>
                <Select
                  value={orderForm.labId || "in-house"}
                  onValueChange={(v) => setOrderForm({ ...orderForm, labId: v === "in-house" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lab" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-house">In-house testing</SelectItem>
                    {(labsData?.labs || []).filter((lab: any) => lab.id).map((lab: any) => (
                      <SelectItem key={lab.id} value={lab.id}>
                        {lab.lab_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOrderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrder} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Lab Dialog */}
      <Dialog open={newLabOpen} onOpenChange={setNewLabOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Toxicology Lab</DialogTitle>
            <DialogDescription>Configure a new laboratory for drug screening</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lab Name *</Label>
              <Input value={labForm.labName} onChange={(e) => setLabForm({ ...labForm, labName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  value={labForm.contactName}
                  onChange={(e) => setLabForm({ ...labForm, contactName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={labForm.phone} onChange={(e) => setLabForm({ ...labForm, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={labForm.email}
                onChange={(e) => setLabForm({ ...labForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CLIA Number *</Label>
              <Input
                value={labForm.cliaNumber}
                onChange={(e) => setLabForm({ ...labForm, cliaNumber: e.target.value })}
                placeholder="e.g., 12D3456789"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turnaround (hours)</Label>
                <Input
                  type="number"
                  value={labForm.turnaroundHours}
                  onChange={(e) => setLabForm({ ...labForm, turnaroundHours: Number.parseInt(e.target.value) || 24 })}
                />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="samhsa"
                  checked={labForm.samhsaCertified}
                  onCheckedChange={(c) => setLabForm({ ...labForm, samhsaCertified: c === true })}
                />
                <Label htmlFor="samhsa">SAMHSA Certified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cap"
                  checked={labForm.capAccredited}
                  onCheckedChange={(c) => setLabForm({ ...labForm, capAccredited: c === true })}
                />
                <Label htmlFor="cap">CAP Accredited</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewLabOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLab} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Lab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collect Specimen Dialog */}
      <Dialog open={collectSpecimenOpen} onOpenChange={setCollectSpecimenOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Collect Specimen</DialogTitle>
            <DialogDescription>Record specimen collection for order {selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Collector</Label>
              <Select
                value={collectionForm.staffId || "self"}
                onValueChange={(v) => setCollectionForm({ ...collectionForm, staffId: v === "self" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select collector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Self (Current User)</SelectItem>
                  {(data?.providers || []).filter((p: any) => p.id).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} {p.license_type ? `(${p.license_type})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Specimen ID *</Label>
              <Input
                value={collectionForm.specimenId}
                onChange={(e) => setCollectionForm({ ...collectionForm, specimenId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Chain of Custody #</Label>
              <Input
                value={collectionForm.cocNumber}
                onChange={(e) => setCollectionForm({ ...collectionForm, cocNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Specimen Integrity</Label>
              <Select
                value={collectionForm.specimenIntegrity}
                onValueChange={(v) => setCollectionForm({ ...collectionForm, specimenIntegrity: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Valid">Valid - Normal</SelectItem>
                  <SelectItem value="Dilute">Dilute</SelectItem>
                  <SelectItem value="Substituted">Substituted</SelectItem>
                  <SelectItem value="Adulterated">Adulterated</SelectItem>
                  <SelectItem value="Invalid">Invalid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temp"
                  checked={collectionForm.temperatureCheck}
                  onCheckedChange={(c) => setCollectionForm({ ...collectionForm, temperatureCheck: c === true })}
                />
                <Label htmlFor="temp">Temperature in Range (90-100°F)</Label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="observed"
                checked={collectionForm.observedCollection}
                onCheckedChange={(c) => setCollectionForm({ ...collectionForm, observedCollection: c === true })}
              />
              <Label htmlFor="observed">Observed Collection</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectSpecimenOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCollectSpecimen} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enter Results Dialog */}
      <Dialog open={enterResultsOpen} onOpenChange={setEnterResultsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enter Test Results</DialogTitle>
            <DialogDescription>Enter results for order {selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Overall Result</Label>
              <Select
                value={resultsForm.overallResult}
                onValueChange={(v) => setResultsForm({ ...resultsForm, overallResult: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Negative">Negative</SelectItem>
                  <SelectItem value="Positive">Positive</SelectItem>
                  <SelectItem value="Invalid">Invalid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Individual Substance Results</Label>
              {resultsForm.results.map((result, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1 font-medium">{result.substance}</div>
                  <Select
                    value={result.result}
                    onValueChange={(v) => {
                      const newResults = [...resultsForm.results]
                      newResults[idx] = { ...newResults[idx], result: v }
                      setResultsForm({ ...resultsForm, results: newResults })
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negative">Negative</SelectItem>
                      <SelectItem value="Positive">Positive</SelectItem>
                    </SelectContent>
                  </Select>
                  {result.result === "Positive" && (
                    <Input
                      className="w-32"
                      placeholder="Concentration"
                      value={result.concentration}
                      onChange={(e) => {
                        const newResults = [...resultsForm.results]
                        newResults[idx] = { ...newResults[idx], concentration: e.target.value }
                        setResultsForm({ ...resultsForm, results: newResults })
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnterResultsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnterResults} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewOrderOpen} onOpenChange={setViewOrderOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Order #{selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">
                    {selectedOrder.patients?.first_name} {selectedOrder.patients?.last_name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>{getStatusBadge(selectedOrder.status)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Test Panel</Label>
                  <p className="font-medium">{selectedOrder.test_panel}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Collection Method</Label>
                  <p className="font-medium">{selectedOrder.collection_method}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order Date</Label>
                  <p className="font-medium">
                    {selectedOrder.order_date ? new Date(selectedOrder.order_date).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Collection Date</Label>
                  <p className="font-medium">
                    {selectedOrder.collection_date ? new Date(selectedOrder.collection_date).toLocaleDateString() : "-"}
                  </p>
                </div>
              </div>
              {selectedOrder.overall_result && (
                <div className="pt-4 border-t">
                  <Label className="text-muted-foreground">Overall Result</Label>
                  <div className="mt-1">{getResultBadge(selectedOrder.overall_result)}</div>
                </div>
              )}
              {selectedOrder.results && selectedOrder.results.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Individual Results</Label>
                  <div className="space-y-1">
                    {selectedOrder.results.map((r: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>{r.substance_name}</span>
                        {getResultBadge(r.result)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOrderOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lab Dialog */}
      <Dialog open={editLabOpen} onOpenChange={setEditLabOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Toxicology Lab</DialogTitle>
            <DialogDescription>Update laboratory information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lab Name *</Label>
              <Input value={labForm.labName} onChange={(e) => setLabForm({ ...labForm, labName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  value={labForm.contactName}
                  onChange={(e) => setLabForm({ ...labForm, contactName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={labForm.phone} onChange={(e) => setLabForm({ ...labForm, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={labForm.email}
                onChange={(e) => setLabForm({ ...labForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CLIA Number *</Label>
              <Input
                value={labForm.cliaNumber}
                onChange={(e) => setLabForm({ ...labForm, cliaNumber: e.target.value })}
                placeholder="e.g., 12D3456789"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turnaround (hours)</Label>
                <Input
                  type="number"
                  value={labForm.turnaroundHours}
                  onChange={(e) => setLabForm({ ...labForm, turnaroundHours: Number.parseInt(e.target.value) || 24 })}
                />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-samhsa"
                  checked={labForm.samhsaCertified}
                  onCheckedChange={(c) => setLabForm({ ...labForm, samhsaCertified: c === true })}
                />
                <Label htmlFor="edit-samhsa">SAMHSA Certified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-cap"
                  checked={labForm.capAccredited}
                  onCheckedChange={(c) => setLabForm({ ...labForm, capAccredited: c === true })}
                />
                <Label htmlFor="edit-cap">CAP Accredited</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLabOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditLab} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Lab Confirmation Dialog */}
      <Dialog open={deactivateLabOpen} onOpenChange={setDeactivateLabOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Deactivate Laboratory
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate "{selectedLab?.lab_name}"? This will prevent new orders from being sent to this lab.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateLabOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivateLab} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelOrderOpen} onOpenChange={setCancelOrderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Cancel order #{selectedOrder?.order_number}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cancellation Reason</Label>
              <Textarea
                placeholder="Please provide a reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOrderOpen(false)}>
              Keep Order
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Lab Dialog */}
      <Dialog open={sendToLabOpen} onOpenChange={setSendToLabOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" />
              Send to Laboratory
            </DialogTitle>
            <DialogDescription>
              Send specimen for order #{selectedOrder?.order_number} to the laboratory for processing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tracking Information (Optional)</Label>
              <Input
                placeholder="Enter tracking number or courier info..."
                value={trackingInfo}
                onChange={(e) => setTrackingInfo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendToLabOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendToLab} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send to Lab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provider Review Dialog */}
      <Dialog open={reviewResultsOpen} onOpenChange={setReviewResultsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-green-500" />
              Provider Review & Sign-off
            </DialogTitle>
            <DialogDescription>
              Review and sign off on results for order #{selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">
                    {selectedOrder.patients?.first_name} {selectedOrder.patients?.last_name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Overall Result</Label>
                  <div className="mt-1">{getResultBadge(selectedOrder.overall_result)}</div>
                </div>
              </div>
              {selectedOrder.results && selectedOrder.results.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Individual Results</Label>
                  <div className="space-y-1">
                    {selectedOrder.results.map((r: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>{r.substance_name}</span>
                        {getResultBadge(r.result)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Clinical Notes / Interpretation</Label>
                <Textarea
                  placeholder="Enter clinical notes, interpretation, or follow-up recommendations..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewResultsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReviewResults} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Off & Complete Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ToxicologyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="pl-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </main>
        </div>
      </div>
    }>
      <ToxicologyContent />
    </Suspense>
  )
}
