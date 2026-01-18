"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { OTPBundleCalculator } from "@/components/otp-bundle-calculator"

export default function BundleCalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="flex-1 space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold">OTP Bundle vs APG Calculator</h1>
            <p className="text-muted-foreground">
              OASAS-compliant billing decision support tool for optimal reimbursement
            </p>
          </div>

          <OTPBundleCalculator />
        </div>
      </div>
    </div>
  )
}
