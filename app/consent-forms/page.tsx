"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FileSignature, Plus, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { ConsentFormsOverview } from "@/components/consent-forms-overview"
import { FormTemplateManager } from "@/components/form-template-manager"
import { PatientConsentTracker } from "@/components/patient-consent-tracker"
import { ConsentReports } from "@/components/consent-reports"
import { ComprehensiveConsentForms } from "@/components/comprehensive-consent-forms"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ConsentFormsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showComprehensiveConsent, setShowComprehensiveConsent] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)

  const { data, error, isLoading } = useSWR("/api/consent-forms", fetcher, {
    refreshInterval: 30000,
  })

  const metrics = data?.metrics || {
    totalForms: 0,
    pendingSignatures: 0,
    completedToday: 0,
    expiringSoon: 0,
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <div className="flex-1 space-y-6 p-6 lg:ml-64">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Consent Forms Management</h1>
            <p className="text-muted-foreground">Manage patient consent forms, templates, and compliance tracking</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setActiveTab("comprehensive")}>
              <FileSignature className="mr-2 h-4 w-4" />
              Complete Patient Forms
            </Button>
            <Button onClick={() => setActiveTab("templates")}>
              <Plus className="mr-2 h-4 w-4" />
              New Form Template
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
              <FileSignature className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.totalForms}</div>
                  <p className="text-xs text-muted-foreground">Active form templates</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Signatures</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.pendingSignatures}</div>
                  <p className="text-xs text-muted-foreground">Awaiting patient signatures</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.completedToday}</div>
                  <p className="text-xs text-muted-foreground">Forms completed</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.expiringSoon}</div>
                  <p className="text-xs text-muted-foreground">Forms expiring in 30 days</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comprehensive">Complete Patient Forms</TabsTrigger>
            <TabsTrigger value="templates">Form Templates</TabsTrigger>
            <TabsTrigger value="patient-tracking">Patient Tracking</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <ConsentFormsOverview data={data} isLoading={isLoading} error={error} />
          </TabsContent>

          <TabsContent value="comprehensive" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complete Patient Consent Forms</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete all 45+ required and optional consent forms with electronic signature (PIN or biometric)
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => {
                    setSelectedPatient({ id: "demo", name: "Demo Patient", dob: "1990-01-01" })
                    setShowComprehensiveConsent(true)
                  }}
                >
                  <FileSignature className="mr-2 h-4 w-4" />
                  Start Consent Form Process
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Select or search for a patient to begin the comprehensive consent form process
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <FormTemplateManager data={data} isLoading={isLoading} error={error} />
          </TabsContent>

          <TabsContent value="patient-tracking" className="space-y-4">
            <PatientConsentTracker data={data} isLoading={isLoading} error={error} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <ConsentReports data={data} isLoading={isLoading} error={error} />
          </TabsContent>
        </Tabs>

        {showComprehensiveConsent && selectedPatient && (
          <ComprehensiveConsentForms
            patient={selectedPatient}
            isOpen={showComprehensiveConsent}
            onClose={() => setShowComprehensiveConsent(false)}
            onComplete={(data) => {
              console.log("[v0] Consent forms completed:", data)
              setShowComprehensiveConsent(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
