"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building2, Plus, CheckCircle, Phone, Mail, FileText, DollarSign } from "lucide-react"

export function InsuranceManagement() {
  const [showAddPayerDialog, setShowAddPayerDialog] = useState(false)
  const [insurancePayers, setInsurancePayers] = useState([
    {
      id: "PAY-001",
      name: "BlueCross BlueShield",
      planType: "Commercial",
      payerId: "BCBS-12345",
      phone: "1-800-555-0100",
      email: "claims@bcbs.com",
      address: "123 Insurance Way, Boston, MA 02101",
      status: "active",
      claimsCount: 156,
      avgPaymentDays: 18,
      contractRate: "95% of charges",
    },
    {
      id: "PAY-002",
      name: "Aetna",
      planType: "Commercial",
      payerId: "AETNA-67890",
      phone: "1-800-555-0200",
      email: "provider@aetna.com",
      address: "456 Healthcare Blvd, Hartford, CT 06103",
      status: "active",
      claimsCount: 98,
      avgPaymentDays: 22,
      contractRate: "90% of charges",
    },
    {
      id: "PAY-003",
      name: "Medicare",
      planType: "Government",
      payerId: "MEDICARE-00000",
      phone: "1-800-MEDICARE",
      email: "medicare@cms.gov",
      address: "7500 Security Blvd, Baltimore, MD 21244",
      status: "active",
      claimsCount: 245,
      avgPaymentDays: 14,
      contractRate: "Medicare Fee Schedule",
    },
    {
      id: "PAY-004",
      name: "Medicaid",
      planType: "Government",
      payerId: "MEDICAID-STATE",
      phone: "1-800-555-0400",
      email: "provider@medicaid.state.gov",
      address: "State Healthcare Office",
      status: "active",
      claimsCount: 189,
      avgPaymentDays: 28,
      contractRate: "Medicaid Rate",
    },
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Insurance Payer Management</h2>
          <p className="text-muted-foreground">Manage insurance companies and payer contracts</p>
        </div>
        <Button onClick={() => setShowAddPayerDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Insurance Payer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Payers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insurancePayers.length}</div>
            <p className="text-xs text-muted-foreground">Insurance companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insurancePayers.reduce((sum, payer) => sum + payer.claimsCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Payment Time</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(
                insurancePayers.reduce((sum, payer) => sum + payer.avgPaymentDays, 0) / insurancePayers.length,
              )}
              d
            </div>
            <p className="text-xs text-muted-foreground">Days to payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract Reviews</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">2</div>
            <p className="text-xs text-muted-foreground">Due for renewal</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payers">All Payers</TabsTrigger>
          <TabsTrigger value="commercial">Commercial</TabsTrigger>
          <TabsTrigger value="government">Government</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>

        <TabsContent value="payers">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Payers</CardTitle>
              <CardDescription>All insurance companies and payer information</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payer Name</TableHead>
                    <TableHead>Plan Type</TableHead>
                    <TableHead>Payer ID</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Claims (MTD)</TableHead>
                    <TableHead>Avg Payment Days</TableHead>
                    <TableHead>Contract Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insurancePayers.map((payer) => (
                    <TableRow key={payer.id}>
                      <TableCell className="font-medium">{payer.name}</TableCell>
                      <TableCell>
                        <Badge variant={payer.planType === "Government" ? "secondary" : "default"}>
                          {payer.planType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{payer.payerId}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{payer.claimsCount}</TableCell>
                      <TableCell>{payer.avgPaymentDays} days</TableCell>
                      <TableCell>{payer.contractRate}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commercial">
          <Card>
            <CardHeader>
              <CardTitle>Commercial Insurance Payers</CardTitle>
              <CardDescription>Private insurance companies</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payer Name</TableHead>
                    <TableHead>Payer ID</TableHead>
                    <TableHead>Claims (MTD)</TableHead>
                    <TableHead>Contract Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insurancePayers
                    .filter((p) => p.planType === "Commercial")
                    .map((payer) => (
                      <TableRow key={payer.id}>
                        <TableCell className="font-medium">{payer.name}</TableCell>
                        <TableCell className="font-mono text-sm">{payer.payerId}</TableCell>
                        <TableCell>{payer.claimsCount}</TableCell>
                        <TableCell>{payer.contractRate}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="government">
          <Card>
            <CardHeader>
              <CardTitle>Government Payers</CardTitle>
              <CardDescription>Medicare, Medicaid, and other government programs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payer Name</TableHead>
                    <TableHead>Payer ID</TableHead>
                    <TableHead>Claims (MTD)</TableHead>
                    <TableHead>Contract Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insurancePayers
                    .filter((p) => p.planType === "Government")
                    .map((payer) => (
                      <TableRow key={payer.id}>
                        <TableCell className="font-medium">{payer.name}</TableCell>
                        <TableCell className="font-mono text-sm">{payer.payerId}</TableCell>
                        <TableCell>{payer.claimsCount}</TableCell>
                        <TableCell>{payer.contractRate}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Contract Management</CardTitle>
              <CardDescription>Payer contracts and rate agreements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>Contract management features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Payer Dialog */}
      <Dialog open={showAddPayerDialog} onOpenChange={setShowAddPayerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Insurance Payer</DialogTitle>
            <DialogDescription>Enter information for a new insurance payer</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payer Name</label>
                <Input placeholder="e.g., BlueCross BlueShield" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payer ID</label>
                <Input placeholder="e.g., BCBS-12345" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Plan Type</label>
                <Input placeholder="e.g., Commercial" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input placeholder="e.g., 1-800-555-0100" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="e.g., claims@insurance.com" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input placeholder="Full mailing address" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contract Rate</label>
              <Input placeholder="e.g., 95% of charges" />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddPayerDialog(false)}>
              Cancel
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Payer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
