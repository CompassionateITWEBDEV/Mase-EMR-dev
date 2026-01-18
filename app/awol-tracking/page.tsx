"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Users, MapPin, Clock, Phone, FileText, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AWOLTrackingPage() {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader
          title="AWOL/Runaway Patient Tracking"
        />

        <div className="p-6 space-y-6">
          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button variant="outline">Export Report</Button>

            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report AWOL/Runaway
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Report AWOL/Runaway Patient</DialogTitle>
                  <DialogDescription>Document patient leaving against medical advice</DialogDescription>
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
                      <Label>Incident Type *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="awol">AWOL (Against Medical Advice)</SelectItem>
                          <SelectItem value="runaway">Runaway</SelectItem>
                          <SelectItem value="elopement">Elopement</SelectItem>
                          <SelectItem value="unauthorized">Unauthorized Absence</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date Last Seen *</Label>
                      <Input type="date" />
                    </div>

                    <div className="space-y-2">
                      <Label>Time Last Seen *</Label>
                      <Input type="time" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Last Known Location</Label>
                    <Input placeholder="Where was patient last seen?" />
                  </div>

                  <div className="space-y-2">
                    <Label>Circumstances *</Label>
                    <Textarea placeholder="Describe what happened leading up to the incident..." rows={4} />
                  </div>

                  <div className="space-y-2">
                    <Label>Witness/Staff Present</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="s1">Dr. Smith</SelectItem>
                        <SelectItem value="s2">Nurse Johnson</SelectItem>
                        <SelectItem value="s3">Counselor Williams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patient Belongings Status</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="taken">Patient took belongings</SelectItem>
                          <SelectItem value="left">Belongings left behind</SelectItem>
                          <SelectItem value="partial">Some items taken</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Patient Mental State</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="calm">Calm/Rational</SelectItem>
                          <SelectItem value="agitated">Agitated</SelectItem>
                          <SelectItem value="distressed">Distressed</SelectItem>
                          <SelectItem value="impaired">Impaired/Intoxicated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Emergency Contacts & Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="family" className="rounded" />
                        <label htmlFor="family" className="text-sm">
                          Notify family/emergency contacts
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="police" className="rounded" />
                        <label htmlFor="police" className="text-sm">
                          Notify law enforcement
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="sponsor" className="rounded" />
                        <label htmlFor="sponsor" className="text-sm">
                          Notify program sponsor
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="supervisor" className="rounded" />
                        <label htmlFor="supervisor" className="text-sm">
                          Notify clinical supervisor
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Immediate Actions Taken</Label>
                    <Textarea placeholder="What steps were taken immediately after discovery..." rows={3} />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700">Submit AWOL Report</Button>
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
                    <p className="text-sm text-gray-600">Active Cases</p>
                    <p className="text-2xl font-bold text-red-600">7</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Returned (30 days)</p>
                    <p className="text-2xl font-bold text-green-600">12</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Time Away</p>
                    <p className="text-2xl font-bold">3.5 days</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total (YTD)</p>
                    <p className="text-2xl font-bold">89</p>
                  </div>
                  <Users className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AWOL Cases Tabs */}
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">Active Cases (7)</TabsTrigger>
              <TabsTrigger value="returned">Returned (12)</TabsTrigger>
              <TabsTrigger value="closed">Closed Cases</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {[
                      {
                        patient: "Robert Martinez",
                        id: "#12350",
                        lastSeen: "12/28/2024 3:45 PM",
                        duration: "2 days 14 hrs",
                        location: "Main Building, 2nd Floor",
                        type: "AWOL",
                        risk: "moderate",
                      },
                      {
                        patient: "Emily Chen",
                        id: "#12351",
                        lastSeen: "12/29/2024 8:00 AM",
                        duration: "1 day 18 hrs",
                        location: "Group Therapy Room",
                        type: "Runaway",
                        risk: "high",
                      },
                      {
                        patient: "David Wilson",
                        id: "#12352",
                        lastSeen: "12/27/2024 11:30 PM",
                        duration: "3 days 1 hr",
                        location: "Outside Entrance",
                        type: "Elopement",
                        risk: "high",
                      },
                    ].map((record, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div className="flex items-center gap-4">
                          <AlertTriangle className="h-8 w-8 text-red-600" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {record.patient} {record.id}
                              </p>
                              {record.risk === "high" && <Badge variant="destructive">High Risk</Badge>}
                              {record.risk === "moderate" && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Moderate Risk
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              <Clock className="h-3 w-3 inline mr-1" />
                              Last seen: {record.lastSeen} ({record.duration} ago)
                            </p>
                            <p className="text-xs text-gray-500">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {record.location} - {record.type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Mark Returned
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="returned">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Returned Patients (Last 30 Days)
                  </CardTitle>
                  <CardDescription>Patients who returned to treatment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-medium">Jessica Taylor #12349</p>
                          <p className="text-sm text-gray-600">Away for: 4 days - Returned: 12/25/2024</p>
                          <p className="text-xs text-gray-500">Status: Re-enrolled in program</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Returned
                        </Badge>
                        <Button variant="outline" size="sm">
                          View Case Notes
                        </Button>
                      </div>
                    </div>
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
