"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  Search,
  Eye,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"

interface EDITransaction {
  id: string
  transactionType: string
  transactionName: string
  direction: "outbound" | "inbound"
  transactionId: string
  status: "sent" | "received" | "failed" | "pending"
  timestamp: string
  fileSize: string
  responseTime?: string
}

const mockTransactions: EDITransaction[] = [
  {
    id: "1",
    transactionType: "837",
    transactionName: "Health Care Claim",
    direction: "outbound",
    transactionId: "TXN-837-20241208-001",
    status: "sent",
    timestamp: "2024-12-08 14:23:15",
    fileSize: "45 KB",
    responseTime: "2.3s",
  },
  {
    id: "2",
    transactionType: "997",
    transactionName: "Functional Acknowledgment",
    direction: "inbound",
    transactionId: "TXN-997-20241208-001",
    status: "received",
    timestamp: "2024-12-08 14:25:42",
    fileSize: "2 KB",
    responseTime: "1.8s",
  },
  {
    id: "3",
    transactionType: "835",
    transactionName: "Electronic Remittance Advice",
    direction: "inbound",
    transactionId: "TXN-835-20241208-003",
    status: "received",
    timestamp: "2024-12-08 13:45:22",
    fileSize: "128 KB",
    responseTime: "3.1s",
  },
  {
    id: "4",
    transactionType: "270",
    transactionName: "Eligibility Inquiry",
    direction: "outbound",
    transactionId: "TXN-270-20241208-012",
    status: "sent",
    timestamp: "2024-12-08 12:15:33",
    fileSize: "8 KB",
    responseTime: "1.2s",
  },
  {
    id: "5",
    transactionType: "271",
    transactionName: "Eligibility Response",
    direction: "inbound",
    transactionId: "TXN-271-20241208-012",
    status: "received",
    timestamp: "2024-12-08 12:15:35",
    fileSize: "12 KB",
    responseTime: "2.0s",
  },
]

export function EDITransactionMonitor() {
  const [transactions] = useState<EDITransaction[]>(mockTransactions)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [directionFilter, setDirectionFilter] = useState<string>("all")

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.transactionName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || txn.transactionType === typeFilter
    const matchesDirection = directionFilter === "all" || txn.direction === directionFilter

    return matchesSearch && matchesType && matchesDirection
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
      case "received":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
      case "received":
        return "default"
      case "failed":
        return "destructive"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">EDI Transaction Monitor</h2>
          <p className="text-muted-foreground">Real-time monitoring of all EDI transactions</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Log
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by transaction ID or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="837">837 - Claims</SelectItem>
                  <SelectItem value="835">835 - ERA</SelectItem>
                  <SelectItem value="270">270 - Eligibility</SelectItem>
                  <SelectItem value="271">271 - Response</SelectItem>
                  <SelectItem value="276">276 - Status Inquiry</SelectItem>
                  <SelectItem value="277">277 - Status Response</SelectItem>
                  <SelectItem value="997">997 - Acknowledgment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="grid gap-4">
        {filteredTransactions.map((txn) => (
          <Card key={txn.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {txn.direction === "outbound" ? (
                      <ArrowUpRight className="h-5 w-5 text-blue-500" />
                    ) : (
                      <ArrowDownLeft className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {txn.transactionType} - {txn.transactionName}
                        </h3>
                        <Badge variant="outline">{txn.transactionId}</Badge>
                        <Badge variant={getStatusColor(txn.status)}>{txn.status.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {txn.direction === "outbound" ? "Sent to" : "Received from"} clearinghouse
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-4 text-sm">
                    <div>
                      <span className="font-medium">Timestamp:</span> {txn.timestamp}
                    </div>
                    <div>
                      <span className="font-medium">File Size:</span> {txn.fileSize}
                    </div>
                    {txn.responseTime && (
                      <div>
                        <span className="font-medium">Response Time:</span> {txn.responseTime}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {getStatusIcon(txn.status)}
                      <span className="font-medium">{txn.status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
