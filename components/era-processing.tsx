"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DollarSign,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  CreditCard,
  FileText,
} from "lucide-react"

interface ERA {
  id: string
  eraNumber: string
  payerName: string
  checkNumber: string
  paymentMethod: "check" | "eft" | "credit_card"
  paymentDate: string
  totalPayment: number
  claimsCount: number
  processingStatus: "pending" | "processing" | "posted" | "error"
  reconciliationStatus: "pending" | "matched" | "unmatched" | "partial"
}

interface ERAClaim {
  id: string
  claimNumber: string
  patientName: string
  chargeAmount: number
  paymentAmount: number
  patientResponsibility: number
  adjustmentAmount: number
  adjustmentReasons: string[]
  claimStatus: "processed" | "processed_with_adjustments" | "denied"
}

const mockERAs: ERA[] = [
  {
    id: "1",
    eraNumber: "ERA-2024-1208-001",
    payerName: "Blue Cross Blue Shield",
    checkNumber: "CHK-8945623",
    paymentMethod: "eft",
    paymentDate: "2024-12-08",
    totalPayment: 4230.5,
    claimsCount: 5,
    processingStatus: "pending",
    reconciliationStatus: "pending",
  },
  {
    id: "2",
    eraNumber: "ERA-2024-1207-003",
    payerName: "Aetna",
    checkNumber: "CHK-7823456",
    paymentMethod: "eft",
    paymentDate: "2024-12-07",
    totalPayment: 3180.0,
    claimsCount: 4,
    processingStatus: "posted",
    reconciliationStatus: "matched",
  },
  {
    id: "3",
    eraNumber: "ERA-2024-1206-002",
    payerName: "UnitedHealthcare",
    checkNumber: "CHK-9012345",
    paymentMethod: "check",
    paymentDate: "2024-12-06",
    totalPayment: 2450.75,
    claimsCount: 3,
    processingStatus: "posted",
    reconciliationStatus: "partial",
  },
]

const mockERADetails: ERAClaim[] = [
  {
    id: "1",
    claimNumber: "CLM-2024-001",
    patientName: "Sarah Johnson",
    chargeAmount: 1247.5,
    paymentAmount: 1222.5,
    patientResponsibility: 25.0,
    adjustmentAmount: 0,
    adjustmentReasons: [],
    claimStatus: "processed",
  },
  {
    id: "2",
    claimNumber: "CLM-2024-002",
    patientName: "Michael Chen",
    chargeAmount: 892.0,
    paymentAmount: 862.0,
    patientResponsibility: 30.0,
    adjustmentAmount: 0,
    adjustmentReasons: [],
    claimStatus: "processed",
  },
  {
    id: "3",
    claimNumber: "CLM-2024-003",
    patientName: "Emily Rodriguez",
    chargeAmount: 345.0,
    paymentAmount: 0,
    patientResponsibility: 0,
    adjustmentAmount: 345.0,
    adjustmentReasons: ["CO-16: Claim lacks information", "CO-22: Incomplete documentation"],
    claimStatus: "denied",
  },
]

export function ERAProcessing() {
  const [eras] = useState<ERA[]>(mockERAs)
  const [selectedERA, setSelectedERA] = useState<ERA | null>(null)
  const [eraDetails] = useState<ERAClaim[]>(mockERADetails)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredERAs = eras.filter((era) => {
    const matchesSearch =
      era.eraNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      era.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      era.checkNumber.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || era.processingStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "posted":
      case "matched":
        return "default"
      case "pending":
      case "processing":
        return "secondary"
      case "error":
      case "unmatched":
        return "destructive"
      case "partial":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "eft":
        return <DollarSign className="h-4 w-4 text-green-500" />
      case "check":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "credit_card":
        return <CreditCard className="h-4 w-4 text-purple-500" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />
    }
  }

  const totalPending = eras.filter((e) => e.processingStatus === "pending").reduce((sum, e) => sum + e.totalPayment, 0)
  const totalPosted = eras.filter((e) => e.processingStatus === "posted").reduce((sum, e) => sum + e.totalPayment, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">ERA Processing & Payment Posting</h2>
          <p className="text-muted-foreground">Process electronic remittance advice and post payments</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download ERAs
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending ERAs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {eras.filter((e) => e.processingStatus === "pending").length} ERAs to process
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posted Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPosted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {eras.filter((e) => e.processingStatus === "posted").length} ERAs posted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unmatched Claims</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Require manual matching</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denials Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Need review</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ERA number, payer, or check number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ERA List */}
      <div className="grid gap-4">
        {filteredERAs.map((era) => (
          <Card key={era.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getPaymentMethodIcon(era.paymentMethod)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{era.payerName}</h3>
                        <Badge variant="outline">{era.eraNumber}</Badge>
                        <Badge variant={getStatusColor(era.processingStatus)}>
                          {era.processingStatus.toUpperCase()}
                        </Badge>
                        <Badge variant={getStatusColor(era.reconciliationStatus)}>
                          {era.reconciliationStatus.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {era.paymentMethod.toUpperCase()} • Check #{era.checkNumber}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-4 text-sm">
                    <div>
                      <span className="font-medium">Payment Date:</span> {era.paymentDate}
                    </div>
                    <div>
                      <span className="font-medium">Total Payment:</span> ${era.totalPayment.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Claims:</span> {era.claimsCount}
                    </div>
                    <div>
                      <span className="font-medium">Avg per Claim:</span> $
                      {(era.totalPayment / era.claimsCount).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedERA(era)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  {era.processingStatus === "pending" && (
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Post Payments
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download 835
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ERA Details Modal */}
      {selectedERA && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>ERA Details: {selectedERA.eraNumber}</CardTitle>
                <CardDescription>Claim-level payment details and adjustments</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedERA(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eraDetails.map((claim) => (
                <div key={claim.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    {claim.claimStatus === "denied" ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : claim.adjustmentAmount > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <h4 className="font-medium">{claim.patientName}</h4>
                    <Badge variant="outline">{claim.claimNumber}</Badge>
                    <Badge
                      variant={
                        claim.claimStatus === "denied"
                          ? "destructive"
                          : claim.claimStatus === "processed_with_adjustments"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {claim.claimStatus.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid gap-2 md:grid-cols-4 text-sm mb-2">
                    <div>
                      <span className="font-medium">Charged:</span> ${claim.chargeAmount.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Paid:</span> ${claim.paymentAmount.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Patient Resp:</span> ${claim.patientResponsibility.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Adjustment:</span> ${claim.adjustmentAmount.toFixed(2)}
                    </div>
                  </div>

                  {claim.adjustmentReasons.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm font-medium text-yellow-900 mb-1">Adjustment Reasons:</p>
                      <ul className="text-sm text-yellow-700 list-disc list-inside">
                        {claim.adjustmentReasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
