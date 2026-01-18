"use client"

import { Suspense, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  UserPlus,
  Shield,
  GraduationCap,
  AlertTriangle,
  Clock,
  Calendar,
  Fingerprint,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react"

function HRManagementContent() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Human Resources Management</h1>
            <p className="text-slate-600 mt-1">Complete HR system with hiring, credentials, and time tracking</p>
          </div>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="mr-2 h-5 w-5" />
            Add New Employee
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">247</div>
              <p className="text-xs opacity-80 mt-1">+12 this month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Active Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
              <p className="text-xs opacity-80 mt-1">23 applications pending</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Expiring Licenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">15</div>
              <p className="text-xs opacity-80 mt-1">Within 90 days</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Training Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">42</div>
              <p className="text-xs opacity-80 mt-1">Compliance training overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 lg:w-auto">
            <TabsTrigger value="overview">
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="employees">
              <Users className="h-4 w-4 mr-2" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="hiring">
              <UserPlus className="h-4 w-4 mr-2" />
              Hiring
            </TabsTrigger>
            <TabsTrigger value="credentials">
              <Award className="h-4 w-4 mr-2" />
              Credentials
            </TabsTrigger>
            <TabsTrigger value="training">
              <GraduationCap className="h-4 w-4 mr-2" />
              Training
            </TabsTrigger>
            <TabsTrigger value="background">
              <Shield className="h-4 w-4 mr-2" />
              Background
            </TabsTrigger>
            <TabsTrigger value="complaints">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Complaints
            </TabsTrigger>
            <TabsTrigger value="timeclock">
              <Clock className="h-4 w-4 mr-2" />
              Time Clock
            </TabsTrigger>
            <TabsTrigger value="payroll">
              <Calendar className="h-4 w-4 mr-2" />
              Payroll
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Hires */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Hires</CardTitle>
                  <CardDescription>New employees in the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        name: "Emily Rodriguez",
                        position: "Peer Recovery Specialist",
                        date: "2024-01-08",
                        onboarding: 85,
                      },
                      { name: "James Wilson", position: "Licensed Counselor", date: "2024-01-05", onboarding: 100 },
                      { name: "Maria Garcia", position: "Case Manager", date: "2023-12-28", onboarding: 100 },
                    ].map((hire, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium">{hire.name}</p>
                          <p className="text-sm text-slate-600">{hire.position}</p>
                          <p className="text-xs text-slate-500 mt-1">Hired: {hire.date}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={hire.onboarding === 100 ? "default" : "secondary"} className="mb-1">
                            {hire.onboarding}% Complete
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                    Compliance Alerts
                  </CardTitle>
                  <CardDescription>Items requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        type: "License Expiring",
                        employee: "Sarah Johnson - RN License",
                        date: "Expires: 02/15/2024",
                        priority: "high",
                      },
                      {
                        type: "Background Check",
                        employee: "David Thompson - Pending Review",
                        date: "Due: 01/20/2024",
                        priority: "medium",
                      },
                      {
                        type: "Training Overdue",
                        employee: "15 employees - Annual Compliance",
                        date: "Past due",
                        priority: "high",
                      },
                      {
                        type: "I-9 Verification",
                        employee: "Emily Rodriguez - Documentation",
                        date: "Due: 01/18/2024",
                        priority: "critical",
                      },
                    ].map((alert, idx) => (
                      <div key={idx} className="flex items-start gap-3 border-b pb-3 last:border-0">
                        <AlertCircle
                          className={`h-5 w-5 mt-0.5 ${
                            alert.priority === "critical"
                              ? "text-red-500"
                              : alert.priority === "high"
                                ? "text-orange-500"
                                : "text-yellow-500"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{alert.type}</p>
                          <p className="text-sm text-slate-600">{alert.employee}</p>
                          <p className="text-xs text-slate-500 mt-1">{alert.date}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
                <CardDescription>Employee distribution by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { dept: "Clinical Services", count: 85, openings: 2 },
                    { dept: "Nursing", count: 42, openings: 1 },
                    { dept: "Case Management", count: 35, openings: 3 },
                    { dept: "Peer Services", count: 28, openings: 1 },
                    { dept: "Administration", count: 32, openings: 1 },
                    { dept: "Support Services", count: 25, openings: 0 },
                  ].map((dept, idx) => (
                    <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-slate-900">{dept.dept}</h3>
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{dept.count}</p>
                          <p className="text-xs text-slate-600">Employees</p>
                        </div>
                        {dept.openings > 0 && (
                          <Badge variant="secondary" className="bg-green-50 text-green-700">
                            {dept.openings} Opening{dept.openings > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Employee Directory</CardTitle>
                    <CardDescription>Manage employee information and records</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    <Button className="bg-blue-600">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: "Sarah Johnson",
                      id: "EMP-2024-001",
                      position: "Licensed Clinical Social Worker",
                      dept: "Behavioral Health",
                      status: "Active",
                      biometric: true,
                      licenses: 2,
                    },
                    {
                      name: "Michael Chen",
                      id: "EMP-2024-002",
                      position: "Clinical Director",
                      dept: "Clinical Services",
                      status: "Active",
                      biometric: true,
                      licenses: 1,
                    },
                    {
                      name: "Jennifer Martinez",
                      id: "EMP-2024-003",
                      position: "Registered Nurse",
                      dept: "Nursing",
                      status: "Active",
                      biometric: true,
                      licenses: 1,
                    },
                    {
                      name: "David Thompson",
                      id: "EMP-2024-004",
                      position: "Case Manager",
                      dept: "Case Management",
                      status: "Active",
                      biometric: false,
                      licenses: 1,
                    },
                  ].map((employee, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="font-semibold text-blue-600">{employee.name.charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{employee.name}</h3>
                              <p className="text-sm text-slate-600">{employee.position}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {employee.id}
                                </Badge>
                                <span className="text-xs text-slate-500">{employee.dept}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-slate-600">Licenses</p>
                            <p className="text-lg font-semibold text-slate-900">{employee.licenses}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {employee.biometric ? (
                              <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                                <Fingerprint className="h-3 w-3" />
                                Biometric
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                No Biometric
                              </Badge>
                            )}
                            <Badge className="bg-blue-100 text-blue-700">{employee.status}</Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Clock Tab */}
          <TabsContent value="timeclock" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Biometric Time Clock
                  </CardTitle>
                  <CardDescription>Facial recognition time tracking system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Fingerprint className="h-8 w-8 text-blue-600" />
                        <div>
                          <h3 className="font-semibold">Biometric Verification Active</h3>
                          <p className="text-sm text-slate-600">Facial recognition enabled</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="text-center p-3 bg-white rounded">
                          <p className="text-2xl font-bold text-green-600">98.5%</p>
                          <p className="text-xs text-slate-600">Verification Rate</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded">
                          <p className="text-2xl font-bold text-blue-600">247</p>
                          <p className="text-xs text-slate-600">Enrolled Employees</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Recent Clock Events</h4>
                      {[
                        { name: "Sarah Johnson", event: "Clock In", time: "08:00 AM", verified: true },
                        { name: "Michael Chen", event: "Clock In", time: "07:55 AM", verified: true },
                        { name: "Jennifer Martinez", event: "Clock Out", time: "05:00 PM", verified: true },
                        { name: "David Thompson", event: "Clock In", time: "09:15 AM", verified: false },
                      ].map((event, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                          <div>
                            <p className="font-medium text-sm">{event.name}</p>
                            <p className="text-xs text-slate-600">{event.event}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{event.time}</p>
                            {event.verified ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 text-xs">
                                Manual Entry
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Today's Attendance</CardTitle>
                  <CardDescription>Real-time attendance tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">215</p>
                      <p className="text-xs text-slate-600 mt-1">Clocked In</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">18</p>
                      <p className="text-xs text-slate-600 mt-1">On Break</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-3xl font-bold text-orange-600">14</p>
                      <p className="text-xs text-slate-600 mt-1">Not Clocked In</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Attendance Issues</h4>
                    {[
                      { name: "David Thompson", issue: "Late Clock In", time: "09:15 AM (15 min late)" },
                      { name: "Emily Rodriguez", issue: "Missing Clock Out", time: "Yesterday" },
                      { name: "James Wilson", issue: "Extended Break", time: "45 minutes" },
                    ].map((issue, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="font-medium text-sm">{issue.name}</p>
                          <p className="text-xs text-slate-600">{issue.issue}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-orange-600">{issue.time}</p>
                          <Button size="sm" variant="outline" className="mt-1 bg-transparent">
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Training Library */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Training Library</CardTitle>
                      <CardDescription>Available courses and programs</CardDescription>
                    </div>
                    <Button className="bg-blue-600">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Add Course
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        title: "HIPAA Privacy & Security Training",
                        category: "Compliance",
                        duration: "2 hours",
                        ceu: 2.0,
                        method: "Online",
                        enrolled: 247,
                        completed: 205,
                        required: true,
                        renewal: "Annual",
                      },
                      {
                        title: "42 CFR Part 2 Confidentiality",
                        category: "Compliance",
                        duration: "1.5 hours",
                        ceu: 1.5,
                        method: "Online",
                        enrolled: 198,
                        completed: 156,
                        required: true,
                        renewal: "Annual",
                      },
                      {
                        title: "Medication-Assisted Treatment Protocols",
                        category: "Clinical",
                        duration: "4 hours",
                        ceu: 4.0,
                        method: "Hybrid",
                        enrolled: 85,
                        completed: 73,
                        required: false,
                        renewal: "Biennial",
                      },
                      {
                        title: "Crisis Intervention & De-escalation",
                        category: "Safety",
                        duration: "8 hours",
                        ceu: 8.0,
                        method: "In-Person",
                        enrolled: 247,
                        completed: 231,
                        required: true,
                        renewal: "Annual",
                      },
                      {
                        title: "Cultural Competency in Behavioral Health",
                        category: "Clinical",
                        duration: "3 hours",
                        ceu: 3.0,
                        method: "Online",
                        enrolled: 167,
                        completed: 142,
                        required: false,
                        renewal: "Biennial",
                      },
                      {
                        title: "Trauma-Informed Care Principles",
                        category: "Clinical",
                        duration: "6 hours",
                        ceu: 6.0,
                        method: "Hybrid",
                        enrolled: 203,
                        completed: 189,
                        required: true,
                        renewal: "Biennial",
                      },
                    ].map((course, idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-slate-900">{course.title}</h3>
                              {course.required && <Badge className="bg-red-100 text-red-700 text-xs">Required</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                              <span className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {course.category}
                                </Badge>
                              </span>
                              <span>{course.duration}</span>
                              <span className="font-semibold text-blue-600">{course.ceu} CEUs</span>
                              <span>{course.method}</span>
                              <span className="text-xs">Renew: {course.renewal}</span>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-slate-600">Completion Rate</span>
                                  <span className="text-xs font-semibold">
                                    {Math.round((course.completed / course.enrolled) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{ width: `${(course.completed / course.enrolled) * 100}%` }}
                                  />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  {course.completed} of {course.enrolled} employees completed
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            <Button size="sm" variant="outline">
                              Assign
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Training Summary */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Training Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">83%</p>
                      <p className="text-sm text-slate-600 mt-1">Overall Compliance</p>
                    </div>
                    <div className="space-y-3 pt-3 border-t">
                      {[
                        { label: "Courses Available", value: "42", color: "blue" },
                        { label: "Total Enrolled", value: "1,347", color: "purple" },
                        { label: "Completed This Month", value: "286", color: "green" },
                        { label: "Overdue Training", value: "42", color: "red" },
                      ].map((stat, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{stat.label}</span>
                          <span className={`font-semibold text-${stat.color}-600`}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">CEU Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">3,847</p>
                      <p className="text-xs text-slate-600">Total CEUs Earned (YTD)</p>
                    </div>
                    <div className="space-y-2 pt-2 border-t text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Clinical CEUs</span>
                        <span className="font-semibold">1,523</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Compliance CEUs</span>
                        <span className="font-semibold">1,284</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Safety CEUs</span>
                        <span className="font-semibold">742</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Leadership CEUs</span>
                        <span className="font-semibold">298</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Upcoming Due Dates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { course: "HIPAA Annual Renewal", employees: 15, dueDate: "Jan 31, 2024", urgent: true },
                        { course: "Fire Safety Training", employees: 8, dueDate: "Feb 15, 2024", urgent: false },
                        { course: "CPR Certification", employees: 12, dueDate: "Feb 28, 2024", urgent: false },
                      ].map((item, idx) => (
                        <div key={idx} className="border-b pb-2 last:border-0">
                          <p className="text-sm font-medium">{item.course}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-slate-600">{item.employees} employees</span>
                            <Badge variant={item.urgent ? "destructive" : "secondary"} className="text-xs">
                              {item.dueDate}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Training Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Training Assignments</CardTitle>
                <CardDescription>Track employee training progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      employee: "Sarah Johnson",
                      course: "Trauma-Informed Care Principles",
                      assigned: "Jan 5, 2024",
                      due: "Feb 5, 2024",
                      progress: 65,
                      status: "In Progress",
                    },
                    {
                      employee: "Michael Chen",
                      course: "42 CFR Part 2 Confidentiality",
                      assigned: "Jan 3, 2024",
                      due: "Jan 31, 2024",
                      progress: 100,
                      status: "Completed",
                    },
                    {
                      employee: "Jennifer Martinez",
                      course: "Crisis Intervention & De-escalation",
                      assigned: "Jan 8, 2024",
                      due: "Feb 15, 2024",
                      progress: 25,
                      status: "In Progress",
                    },
                    {
                      employee: "David Thompson",
                      course: "HIPAA Privacy & Security Training",
                      assigned: "Dec 15, 2023",
                      due: "Jan 15, 2024",
                      progress: 0,
                      status: "Overdue",
                    },
                  ].map((assignment, idx) => (
                    <div key={idx} className="border rounded-lg p-4 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {assignment.employee.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{assignment.employee}</p>
                              <p className="text-xs text-slate-600">{assignment.course}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-600 ml-11">
                            <span>Assigned: {assignment.assigned}</span>
                            <span>Due: {assignment.due}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-600">Progress</span>
                              <span className="text-xs font-semibold">{assignment.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  assignment.status === "Completed"
                                    ? "bg-green-500"
                                    : assignment.status === "Overdue"
                                      ? "bg-red-500"
                                      : "bg-blue-500"
                                }`}
                                style={{ width: `${assignment.progress}%` }}
                              />
                            </div>
                          </div>
                          <Badge
                            variant={
                              assignment.status === "Completed"
                                ? "default"
                                : assignment.status === "Overdue"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="min-w-[90px] justify-center"
                          >
                            {assignment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placeholder content for other tabs */}
          <TabsContent value="hiring">
            <Card>
              <CardHeader>
                <CardTitle>Hiring & Recruitment</CardTitle>
                <CardDescription>Manage job postings, applications, and hiring workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Full hiring and applicant tracking system with interview scheduling and offer management.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credentials">
            <Card>
              <CardHeader>
                <CardTitle>Credentials & Licenses</CardTitle>
                <CardDescription>Track professional licenses with automated expiration alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Comprehensive credential tracking with automated license verification and renewal reminders.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="background">
            <Card>
              <CardHeader>
                <CardTitle>Background Checks</CardTitle>
                <CardDescription>Manage background screenings and verification</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  FCRA-compliant background check management with automated renewal tracking.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="complaints">
            <Card>
              <CardHeader>
                <CardTitle>Employee Complaints</CardTitle>
                <CardDescription>Confidential complaint tracking and investigation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Secure complaint management system with investigation workflow and compliance reporting.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Hours</CardTitle>
                <CardDescription>Automated payroll hours from biometric time clock</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Automated payroll calculation with overtime tracking and approval workflow.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function HRManagementPage() {
  return (
    <Suspense fallback={null}>
      <HRManagementContent />
    </Suspense>
  )
}
