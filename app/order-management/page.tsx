"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, XCircle, Clock, Calendar, TrendingUp, TrendingDown } from "lucide-react"

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [physicianSignature, setPhysicianSignature] = useState("")
  const [reviewNotes, setReviewNotes] = useState("")
  const [filterStatus, setFilterStatus] = useState("pending")
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [filterStatus])

  const fetchOrders = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("medication_order")
        .select("*, patients(first_name, last_name), staff(first_name, last_name)")
        .eq("status", filterStatus === "all" ? undefined : `pending_physician_review`)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    }
  }

  const approveOrder = async () => {
    if (!selectedOrder || !physicianSignature) {
      toast({
        title: "Signature Required",
        description: "Please sign the order to approve",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("medication_order")
        .update({
          status: "approved",
          physician_signature: physicianSignature,
          physician_review_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedOrder.id)

      if (error) throw error

      toast({
        title: "Order Approved",
        description: `Order for ${selectedOrder.patients.first_name} ${selectedOrder.patients.last_name} has been approved`,
      })

      setShowReviewDialog(false)
      setPhysicianSignature("")
      setReviewNotes("")
      fetchOrders()
    } catch (error) {
      console.error("Error approving order:", error)
      toast({
        title: "Error",
        description: "Failed to approve order",
        variant: "destructive",
      })
    }
  }

  const denyOrder = async () => {
    if (!selectedOrder || !reviewNotes) {
      toast({
        title: "Reason Required",
        description: "Please provide reason for denial",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("medication_order")
        .update({
          status: "denied",
          physician_review_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedOrder.id)

      if (error) throw error

      toast({
        title: "Order Denied",
        description: "Order has been denied with notes to nursing",
      })

      setShowReviewDialog(false)
      setReviewNotes("")
      fetchOrders()
    } catch (error) {
      console.error("Error denying order:", error)
    }
  }

  const pendingCount = orders.filter((o) => o.status === "pending_physician_review").length

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Medication Order Management</h1>
              <p className="text-gray-600 mt-2">Review and approve medication orders from nursing staff</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Review</p>
                      <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
                    </div>
                    <Clock className="h-10 w-10 text-orange-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Approved Today</p>
                      <p className="text-3xl font-bold text-green-600">12</p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Denied Today</p>
                      <p className="text-3xl font-bold text-red-600">2</p>
                    </div>
                    <XCircle className="h-10 w-10 text-red-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Review Time</p>
                      <p className="text-3xl font-bold text-blue-600">18m</p>
                    </div>
                    <Calendar className="h-10 w-10 text-blue-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={filterStatus} onValueChange={setFilterStatus}>
              <TabsList>
                <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="denied">Denied</TabsTrigger>
                <TabsTrigger value="all">All Orders</TabsTrigger>
              </TabsList>

              <TabsContent value={filterStatus} className="space-y-4 mt-6">
                {orders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={
                                order.order_type === "increase"
                                  ? "default"
                                  : order.order_type === "decrease"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {order.order_type === "increase" && <TrendingUp className="h-3 w-3 mr-1" />}
                              {order.order_type === "decrease" && <TrendingDown className="h-3 w-3 mr-1" />}
                              {order.order_type.toUpperCase()}
                            </Badge>
                            <h3 className="font-semibold text-lg">
                              {order.patients?.first_name} {order.patients?.last_name}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Current Dose</p>
                              <p className="font-medium text-lg">{order.current_dose_mg}mg</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Requested Dose</p>
                              <p className="font-medium text-lg text-cyan-600">{order.requested_dose_mg}mg</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Submitted By</p>
                              <p className="font-medium">
                                {order.staff?.first_name} {order.staff?.last_name}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600 mb-1">Clinical Justification:</p>
                            <p className="text-sm bg-gray-50 p-3 rounded">{order.clinical_justification}</p>
                          </div>
                        </div>

                        {order.status === "pending_physician_review" && (
                          <Button
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowReviewDialog(true)
                            }}
                            className="bg-cyan-600 hover:bg-cyan-700"
                          >
                            Review Order
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {orders.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                      No orders found for this status
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Order Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Medication Order</DialogTitle>
            <DialogDescription>Review the order request and approve or deny with your signature</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Patient Information</h4>
                <p>
                  <strong>Name:</strong> {selectedOrder.patients?.first_name} {selectedOrder.patients?.last_name}
                </p>
                <p>
                  <strong>Order Type:</strong> {selectedOrder.order_type.toUpperCase()}
                </p>
                <p>
                  <strong>Current Dose:</strong> {selectedOrder.current_dose_mg}mg →{" "}
                  <strong className="text-cyan-600">{selectedOrder.requested_dose_mg}mg</strong>
                </p>
                <p>
                  <strong>Submitted by:</strong> {selectedOrder.staff?.first_name} {selectedOrder.staff?.last_name}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Clinical Justification</Label>
                <div className="bg-gray-50 p-3 rounded text-sm">{selectedOrder.clinical_justification}</div>
              </div>

              <div className="space-y-2">
                <Label>Physician Review Notes</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add your clinical assessment and rationale..."
                  rows={3}
                />
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Physician Signature</h4>
                <div className="space-y-2">
                  <Label>Sign Order (Enter PIN or use Biometric)</Label>
                  <Input
                    type="password"
                    value={physicianSignature}
                    onChange={(e) => setPhysicianSignature(e.target.value)}
                    placeholder="Enter 4-digit PIN or use biometric"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={denyOrder}>
              <XCircle className="h-4 w-4 mr-2" />
              Deny Order
            </Button>
            <Button onClick={approveOrder} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve & Sign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
