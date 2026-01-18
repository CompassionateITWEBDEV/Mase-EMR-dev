"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, CreditCard, AlertCircle, CheckCircle, Search, Printer } from "lucide-react"

export default function CashCollectionPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [paymentReference, setPaymentReference] = useState("")

  // Mock patient data with balances
  const [patients, setPatients] = useState([
    {
      id: "PT-001",
      name: "Sarah Johnson",
      balance: 150.0,
      lastPayment: "2024-01-15",
      paymentPlan: "Weekly",
      status: "current",
    },
    {
      id: "PT-002",
      name: "Michael Chen",
      balance: 450.0,
      lastPayment: "2024-01-08",
      paymentPlan: "Bi-weekly",
      status: "overdue",
    },
    {
      id: "PT-003",
      name: "Emily Rodriguez",
      balance: 75.0,
      lastPayment: "2024-01-18",
      paymentPlan: "Weekly",
      status: "current",
    },
    {
      id: "PT-004",
      name: "David Kim",
      balance: 300.0,
      lastPayment: "2024-01-01",
      paymentPlan: "Monthly",
      status: "overdue",
    },
    {
      id: "PT-005",
      name: "Jessica Martinez",
      balance: 0.0,
      lastPayment: "2024-01-19",
      paymentPlan: "Weekly",
      status: "paid",
    },
  ])

  const [todaysCollections, setTodaysCollections] = useState([
    {
      id: "TXN-001",
      patientName: "Sarah Johnson",
      amount: 50.0,
      method: "Cash",
      time: "09:15 AM",
      collectedBy: "Nurse Davis",
    },
    {
      id: "TXN-002",
      patientName: "Michael Chen",
      amount: 100.0,
      method: "Credit Card",
      time: "10:30 AM",
      collectedBy: "Front Desk",
    },
    {
      id: "TXN-003",
      patientName: "Emily Rodriguez",
      amount: 75.0,
      method: "Debit Card",
      time: "11:45 AM",
      collectedBy: "Billing Staff",
    },
  ])

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const overduePatients = patients.filter((p) => p.status === "overdue")
  const totalBalance = patients.reduce((sum, p) => sum + p.balance, 0)
  const todaysTotal = todaysCollections.reduce((sum, t) => sum + t.amount, 0)

  const openPaymentDialog = (patient: any) => {
    setSelectedPatient(patient)
    setPaymentAmount(patient.balance.toString())
    setShowPaymentDialog(true)
  }

  const processPayment = async () => {
    if (!selectedPatient || !paymentAmount) return

    const amount = Number.parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount")
      return
    }

    // Update patient balance
    setPatients(
      patients.map((p) =>
        p.id === selectedPatient.id
          ? {
              ...p,
              balance: Math.max(0, p.balance - amount),
              lastPayment: new Date().toISOString().split("T")[0],
              status: p.balance - amount <= 0 ? "paid" : p.status,
            }
          : p,
      ),
    )

    // Add to today's collections
    const newTransaction = {
      id: `TXN-${String(todaysCollections.length + 1).padStart(3, "0")}`,
      patientName: selectedPatient.name,
      amount,
      method: paymentMethod === "cash" ? "Cash" : paymentMethod === "credit" ? "Credit Card" : "Debit Card",
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      collectedBy: "Current User",
    }
    setTodaysCollections([...todaysCollections, newTransaction])

    // Reset and close
    setShowPaymentDialog(false)
    setPaymentAmount("")
    setPaymentReference("")
    setSelectedPatient(null)

    alert(`Payment of $${amount.toFixed(2)} processed successfully!`)
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-auto p-8 ml-64">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cash Collection</h1>
              <p className="text-gray-600 mt-1">Collect patient payments and manage balances</p>
            </div>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Printer className="h-4 w-4 mr-2" />
              Print Daily Report
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">${totalBalance.toFixed(2)}</div>
                <p className="text-xs text-gray-600 mt-1">{patients.length} patients with balances</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Collections</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${todaysTotal.toFixed(2)}</div>
                <p className="text-xs text-gray-600 mt-1">{todaysCollections.length} transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{overduePatients.length}</div>
                <p className="text-xs text-gray-600 mt-1">Require immediate follow-up</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="balances" className="space-y-6">
            <TabsList>
              <TabsTrigger value="balances">Patient Balances</TabsTrigger>
              <TabsTrigger value="collections">Today's Collections</TabsTrigger>
              <TabsTrigger value="overdue">Overdue Accounts</TabsTrigger>
            </TabsList>

            {/* Patient Balances Tab */}
            <TabsContent value="balances" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Patient Balances</CardTitle>
                      <CardDescription>
                        View and collect payments from patients with outstanding balances
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search patients..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Last Payment</TableHead>
                        <TableHead>Payment Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell className="font-medium">{patient.id}</TableCell>
                          <TableCell>{patient.name}</TableCell>
                          <TableCell className="font-semibold">${patient.balance.toFixed(2)}</TableCell>
                          <TableCell>{patient.lastPayment}</TableCell>
                          <TableCell>{patient.paymentPlan}</TableCell>
                          <TableCell>
                            {patient.status === "overdue" && <Badge variant="destructive">Overdue</Badge>}
                            {patient.status === "current" && <Badge variant="secondary">Current</Badge>}
                            {patient.status === "paid" && (
                              <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => openPaymentDialog(patient)}
                              disabled={patient.balance === 0}
                              className="bg-cyan-600 hover:bg-cyan-700"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Collect Payment
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Today's Collections Tab */}
            <TabsContent value="collections" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Collections</CardTitle>
                  <CardDescription>All payments collected today</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Patient Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Collected By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todaysCollections.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id}</TableCell>
                          <TableCell>{transaction.patientName}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ${transaction.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>{transaction.method}</TableCell>
                          <TableCell>{transaction.time}</TableCell>
                          <TableCell>{transaction.collectedBy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Overdue Accounts Tab */}
            <TabsContent value="overdue" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Overdue Accounts</CardTitle>
                  <CardDescription>Patients with overdue balances requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Last Payment</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overduePatients.map((patient) => {
                        const daysOverdue = Math.floor(
                          (new Date().getTime() - new Date(patient.lastPayment).getTime()) / (1000 * 60 * 60 * 24),
                        )
                        return (
                          <TableRow key={patient.id}>
                            <TableCell className="font-medium">{patient.id}</TableCell>
                            <TableCell>{patient.name}</TableCell>
                            <TableCell className="font-semibold text-red-600">${patient.balance.toFixed(2)}</TableCell>
                            <TableCell>{patient.lastPayment}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">{daysOverdue} days</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => openPaymentDialog(patient)}
                                className="bg-cyan-600 hover:bg-cyan-700"
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Collect Payment
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Collect Payment</DialogTitle>
            <DialogDescription>
              Process payment for {selectedPatient?.name} (ID: {selectedPatient?.id})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Balance */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Balance:</span>
                <span className="text-2xl font-bold text-red-600">${selectedPatient?.balance.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="debit">Debit Card</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="money_order">Money Order</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference Number (for non-cash) */}
            {paymentMethod !== "cash" && (
              <div className="space-y-2">
                <Label htmlFor="reference">
                  {paymentMethod === "check" ? "Check Number" : "Transaction Reference"}
                </Label>
                <Input
                  id="reference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder={`Enter ${paymentMethod === "check" ? "check number" : "reference number"}`}
                />
              </div>
            )}

            {/* Remaining Balance */}
            {paymentAmount && !isNaN(Number.parseFloat(paymentAmount)) && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Remaining Balance:</span>
                  <span className="text-xl font-bold text-green-600">
                    ${Math.max(0, (selectedPatient?.balance || 0) - Number.parseFloat(paymentAmount)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700" onClick={processPayment}>
              <CreditCard className="h-4 w-4 mr-2" />
              Process Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
