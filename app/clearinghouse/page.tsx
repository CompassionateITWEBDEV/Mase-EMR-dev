"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, FileText, DollarSign, CheckCircle, Settings } from "lucide-react"
import { ClearinghouseDashboard } from "@/components/clearinghouse-dashboard"
import { EDITransactionMonitor } from "@/components/edi-transaction-monitor"
import { BatchClaimsSubmission } from "@/components/batch-claims-submission"
import { ERAProcessing } from "@/components/era-processing"
import { ClearinghouseConfiguration } from "@/components/clearinghouse-configuration"

export default function ClearinghousePage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <main className="p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Clearinghouse Management</h1>
              <p className="text-muted-foreground">
                EDI transaction processing, batch claims submission, and electronic remittance
              </p>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="edi" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  EDI Transactions
                </TabsTrigger>
                <TabsTrigger value="batch" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Batch Submission
                </TabsTrigger>
                <TabsTrigger value="era" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  ERA Processing
                </TabsTrigger>
                <TabsTrigger value="config" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuration
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <ClearinghouseDashboard />
              </TabsContent>

              <TabsContent value="edi">
                <EDITransactionMonitor />
              </TabsContent>

              <TabsContent value="batch">
                <BatchClaimsSubmission />
              </TabsContent>

              <TabsContent value="era">
                <ERAProcessing />
              </TabsContent>

              <TabsContent value="config">
                <ClearinghouseConfiguration />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
