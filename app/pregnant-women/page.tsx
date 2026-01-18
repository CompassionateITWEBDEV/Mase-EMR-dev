"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Baby, AlertCircle, Heart, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface PregnantPatient {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  phone: string
  gestational_age?: number
  due_date?: string
  prenatal_care?: string
  risk_factors?: string[]
  priority_status: string
  last_visit?: string
  next_appointment?: string
}

export default function PregnantWomenPage() {
  const [patients, setPatients] = useState<PregnantPatient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPregnantPatients()
  }, [])

  const fetchPregnantPatients = async () => {
    try {
      const supabase = createClient()
      // This would need a proper query to identify pregnant patients
      // For now, showing example structure
      setPatients([])
    } catch (error) {
      console.error("Error fetching pregnant patients:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader />
        <main className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Baby className="h-8 w-8 text-pink-600" />
              <h1 className="text-3xl font-bold text-gray-900">Pregnant Women - Priority Patients</h1>
            </div>
            <p className="text-gray-500">
              Federal priority patients per 42 CFR Part 8 - Pregnant women receive priority admission to OTP services
            </p>
          </div>

          {/* Federal Priority Notice */}
          <Card className="mb-6 border-pink-200 bg-pink-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-pink-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-pink-900 mb-1">Federal Priority Status</h3>
                  <p className="text-sm text-pink-800">
                    Under 42 CFR §8.12(f)(4), OTPs must give priority admission to pregnant women. This includes
                    immediate access to withdrawal management and continued MAT services.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Patients</CardDescription>
                <CardTitle className="text-2xl">{patients.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>High Risk</CardDescription>
                <CardTitle className="text-2xl text-red-600">0</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Due This Month</CardDescription>
                <CardTitle className="text-2xl">0</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Appointments</CardDescription>
                <CardTitle className="text-2xl">0</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">Active Patients</TabsTrigger>
              <TabsTrigger value="priority-admission">Priority Admission Queue</TabsTrigger>
              <TabsTrigger value="prenatal-care">Prenatal Care Coordination</TabsTrigger>
              <TabsTrigger value="compliance">Federal Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active Pregnant Patients in MAT Program</CardTitle>
                  <CardDescription>Real-time monitoring and priority care coordination</CardDescription>
                </CardHeader>
                <CardContent>
                  {patients.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Baby className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No active pregnant patients currently enrolled</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {patients.map((patient) => (
                        <Card key={patient.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">
                                  {patient.first_name} {patient.last_name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Gestational Age: {patient.gestational_age} weeks
                                </p>
                              </div>
                              <Badge variant="default">Priority</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="priority-admission">
              <Card>
                <CardHeader>
                  <CardTitle>Priority Admission Queue</CardTitle>
                  <CardDescription>
                    Pregnant women requesting admission receive priority per federal regulations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No pending priority admissions</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prenatal-care">
              <Card>
                <CardHeader>
                  <CardTitle>Prenatal Care Coordination</CardTitle>
                  <CardDescription>OB/GYN referrals and maternal health monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Heart className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-blue-900">Integrated Care Model</h4>
                        <p className="text-sm text-blue-800">
                          Coordinate MAT services with prenatal care, ensure regular OB visits, and monitor
                          maternal-fetal health
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance">
              <Card>
                <CardHeader>
                  <CardTitle>Federal Compliance Documentation</CardTitle>
                  <CardDescription>42 CFR Part 8 compliance tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Priority Admission Policy</h4>
                        <p className="text-sm text-gray-500">Written policy on file</p>
                      </div>
                      <Badge variant="default">Compliant</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Staff Training Documentation</h4>
                        <p className="text-sm text-gray-500">All staff trained on priority admission protocols</p>
                      </div>
                      <Badge variant="default">Compliant</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">OB/GYN Referral Network</h4>
                        <p className="text-sm text-gray-500">Active agreements with prenatal care providers</p>
                      </div>
                      <Badge variant="default">Compliant</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
