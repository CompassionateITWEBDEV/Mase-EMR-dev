"use client";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  FileText,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

export default function IntegrationsDashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Integrations Dashboard
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Monitor and manage all third-party integrations
              </p>
            </div>

            <Tabs defaultValue="fax" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
                <TabsTrigger value="fax">Vonage Fax</TabsTrigger>
                <TabsTrigger value="sms">Twilio SMS</TabsTrigger>
                <TabsTrigger value="pdmp">State PDMP</TabsTrigger>
                <TabsTrigger value="surescripts">Surescripts</TabsTrigger>
                <TabsTrigger value="ai">AI Processing</TabsTrigger>
              </TabsList>

              <TabsContent value="fax" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Faxes Today
                      </CardTitle>
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">23</div>
                      <p className="text-xs text-muted-foreground">
                        ↑ 12% from yesterday
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Processing
                      </CardTitle>
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">5</div>
                      <p className="text-xs text-muted-foreground">
                        AI extracting data
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Completed
                      </CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">18</div>
                      <p className="text-xs text-muted-foreground">
                        Auto-filed to charts
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Fax Activity</CardTitle>
                    <CardDescription>
                      Latest incoming and outgoing faxes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          from: "St. Mary's Hospital",
                          pages: 5,
                          status: "completed",
                          patient: "John Doe",
                        },
                        {
                          from: "Lab Corp",
                          pages: 2,
                          status: "processing",
                          patient: "Jane Smith",
                        },
                        {
                          from: "Pharmacy Plus",
                          pages: 1,
                          status: "completed",
                          patient: "Bob Johnson",
                        },
                      ].map((fax, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{fax.from}</p>
                              <p className="text-xs text-muted-foreground">
                                {fax.patient} • {fax.pages} pages
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              fax.status === "completed"
                                ? "default"
                                : "secondary"
                            }>
                            {fax.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pdmp" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        PDMP Checks Today
                      </CardTitle>
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12</div>
                      <p className="text-xs text-muted-foreground">
                        Before controlled Rx
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Red Flags
                      </CardTitle>
                      <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">2</div>
                      <p className="text-xs text-muted-foreground">
                        Require provider review
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Clear Reports
                      </CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">10</div>
                      <p className="text-xs text-muted-foreground">
                        No concerns identified
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent PDMP Checks</CardTitle>
                    <CardDescription>
                      Controlled substance monitoring activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          patient: "Sarah Williams",
                          medication: "Oxycodone 10mg",
                          status: "clear",
                          alert: "No red flags",
                        },
                        {
                          patient: "Mike Davis",
                          medication: "Buprenorphine 8mg",
                          status: "warning",
                          alert: "Overlapping prescriptions",
                        },
                        {
                          patient: "Lisa Brown",
                          medication: "Alprazolam 1mg",
                          status: "clear",
                          alert: "No concerns",
                        },
                      ].map((check, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {check.patient}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {check.medication}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {check.alert}
                            </span>
                            <Badge
                              variant={
                                check.status === "clear"
                                  ? "default"
                                  : "destructive"
                              }>
                              {check.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Other tabs content can be added similarly */}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
