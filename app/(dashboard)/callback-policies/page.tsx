"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, FileText, AlertTriangle, RefreshCw } from "lucide-react"

export default function CallbackPoliciesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">State Callback Policies</h1>
          <p className="text-muted-foreground">
            Manage state-mandated callback requirements and compliance tracking
          </p>
        </div>
        <Badge variant="outline" className="text-amber-600 border-amber-600">
          Coming Soon
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Policy Management</CardTitle>
            </div>
            <CardDescription>
              Configure state-specific callback policies and requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Define callback windows, maximum failures allowed, and automated triggers for each state's requirements.
            </p>
            <Button variant="outline" disabled>
              Configure Policies
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg">Compliance Alerts</CardTitle>
            </div>
            <CardDescription>
              Track and respond to callback compliance alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View pending callbacks, overdue items, and audit trails for regulatory compliance.
            </p>
            <Button variant="outline" disabled>
              View Alerts
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Callback Log</CardTitle>
            </div>
            <CardDescription>
              Historical record of all callbacks and outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Complete audit trail of callbacks with patient outcomes, staff notes, and compliance status.
            </p>
            <Button variant="outline" disabled>
              View History
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Settings className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900">Feature Under Development</h3>
              <p className="text-sm text-blue-800 mt-1">
                State callback policy management is currently being developed. This feature will integrate with 
                the Diversion Control system to automatically trigger callbacks based on state-specific regulations 
                for take-home medication compliance failures.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
