"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Truck, MapPin, Calendar, Clock, Plus, Phone, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TransportationRequestsPage() {
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader
          title="Transportation Requests"
          description="Manage patient transportation for appointments and services"
        />

        <div className="p-6 space-y-6">
          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
              <Button variant="outline">Export Schedule</Button>
            </div>

            <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Transportation Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Transportation Request</DialogTitle>
                  <DialogDescription>Schedule transportation for patient appointments</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patient *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="p1">John Doe - #12345</SelectItem>
                          <SelectItem value="p2">Sarah Johnson - #12346</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Request Type *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appointment">Medical Appointment</SelectItem>
                          <SelectItem value="treatment">Treatment Session</SelectItem>
                          <SelectItem value="lab">Lab/Diagnostic</SelectItem>
                          <SelectItem value="pharmacy">Pharmacy</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input type="date" />
                    </div>

                    <div className="space-y-2">
                      <Label>Pickup Time *</Label>
                      <Input type="time" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Pickup Location *</Label>
                    <Input placeholder="Full address for pickup" />
                  </div>

                  <div className="space-y-2">
                    <Label>Destination *</Label>
                    <Input placeholder="Full address for destination" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Return Trip Needed?</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes - Same Day</SelectItem>
                          <SelectItem value="scheduled">Yes - Schedule Return</SelectItem>
                          <SelectItem value="no">No Return Needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Wheelchair Accessible?</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes - Required</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Special Instructions</Label>
                    <Textarea placeholder="Mobility issues, escort needed, oxygen required..." rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input placeholder="Emergency contact number" />
                  </div>

                  <div className="space-y-2">
                    <Label>Authorization/Insurance</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medicaid">Medicaid Transportation</SelectItem>
                        <SelectItem value="insurance">Private Insurance</SelectItem>
                        <SelectItem value="grant">Grant Funded</SelectItem>
                        <SelectItem value="selfpay">Self-Pay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button>Submit Request</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Requests</p>
                    <p className="text-2xl font-bold">18</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Today's Trips</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Transit</p>
                    <p className="text-2xl font-bold">5</p>
                  </div>
                  <MapPin className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold">247</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Request Lists */}
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">Pending (18)</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled (12)</TabsTrigger>
              <TabsTrigger value="intransit">In Transit (5)</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {[
                      {
                        patient: "John Doe",
                        pickup: "123 Main St",
                        destination: "County Hospital",
                        time: "10:00 AM",
                        date: "12/30/2024",
                        type: "Medical Appointment",
                      },
                      {
                        patient: "Sarah Johnson",
                        pickup: "456 Oak Ave",
                        destination: "Lab Services Center",
                        time: "2:00 PM",
                        date: "12/30/2024",
                        type: "Lab/Diagnostic",
                      },
                    ].map((req, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div className="flex items-center gap-4">
                          <Truck className="h-8 w-8 text-yellow-600" />
                          <div>
                            <p className="font-medium">{req.patient}</p>
                            <p className="text-sm text-gray-600">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {req.pickup} → {req.destination}
                            </p>
                            <p className="text-xs text-gray-500">
                              {req.date} at {req.time} - {req.type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Pending
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                          <Button size="sm">Assign Driver</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

