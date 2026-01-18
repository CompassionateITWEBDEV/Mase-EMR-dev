"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Heart,
  Shield,
  Stethoscope,
  User,
  UserCog,
  Users,
  Activity,
  HeartPulse,
  Syringe,
  Dumbbell,
  BarChart3,
  MapPin,
  GraduationCap,
  Truck,
  Database,
  AlertTriangle,
  Camera,
  Globe,
  Target,
  FileCheck,
  ShieldAlert,
  Phone,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const Crisis988Banner = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-900">In Crisis? Call or Text 988</p>
            <p className="text-sm text-blue-700">24/7 free and confidential support</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 bg-transparent" asChild>
            <a href="tel:988">
              <Phone className="h-3 w-3 mr-1" />
              Call 988
            </a>
          </Button>
          <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 bg-transparent" asChild>
            <a href="sms:988">
              <MessageSquare className="h-3 w-3 mr-1" />
              Text 988
            </a>
          </Button>
        </div>
      </div>
      <p className="text-xs text-blue-600 mt-2">🇪🇸 Servicios de texto y chat disponibles en Español</p>
    </div>
  )

  const loginOptions = [
    {
      title: "Clinical Staff Portal",
      description: "Providers, nurses, counselors, peer specialists, admin staff",
      icon: Stethoscope,
      href: "/auth/staff-login",
      color: "bg-blue-600",
    },
    {
      title: "Patient Portal",
      description: "Access your health records",
      icon: User,
      href: "/auth/patient-login",
      color: "bg-pink-500",
    },
    {
      title: "State Oversight Dashboard",
      description: "Michigan MDHHS/MPHI oversight",
      icon: BarChart3,
      href: "/state-oversight",
      color: "bg-cyan-500",
    },
    {
      title: "SOTA Dashboard",
      description: "State Opioid Treatment Authority",
      icon: ShieldAlert,
      href: "/sota-dashboard",
      color: "bg-red-600",
    },
    {
      title: "Mi-SUTWA Portal",
      description: "Michigan SUD Treatment Workforce Assessment",
      icon: GraduationCap,
      href: "/mi-sutwa-portal",
      color: "bg-blue-500",
    },
    {
      title: "DEA/Regulatory Staff",
      description: "DEA compliance and regulatory oversight",
      icon: ShieldAlert,
      href: "/regulatory-portal",
      color: "bg-orange-600",
    },
    {
      title: "County Health Department",
      description: "Public health integration",
      icon: Building2,
      href: "/county-health",
      color: "bg-emerald-600",
    },
    {
      title: "PIHP Staff Portal",
      description: "Prepaid Inpatient Health Plan access",
      icon: FileCheck,
      href: "/pihp-portal",
      color: "bg-indigo-600",
    },
    {
      title: "External Provider Portal",
      description: "Community partner access",
      icon: Users,
      href: "/provider-collaboration",
      color: "bg-lime-600",
    },
    {
      title: "Community Outreach",
      description: "Public resources, shelters, food banks",
      icon: Globe,
      href: "/community-outreach",
      color: "bg-violet-500",
    },
    {
      title: "Super Admin Portal",
      description: "MASE system administrators",
      icon: Shield,
      href: "/super-admin/login",
      color: "bg-red-500",
    },
  ]

  const features = [
    { icon: HeartPulse, title: "Multi-Specialty EHR", desc: "Behavioral Health, Primary Care, OTP, PT/OT/SLP" },
    { icon: Activity, title: "AI Clinical Decision Support", desc: "Michigan surveillance-powered risk scoring" },
    { icon: AlertTriangle, title: "Detox & Crisis Unit", desc: "CIWA/COWS protocols, 23-hour observation" },
    { icon: Syringe, title: "OTP Medication Management", desc: "Methadone, buprenorphine with bottle tracking" },
    { icon: Truck, title: "Off-Site Dosing", desc: "Nursing home delivery with QR scanning" },
    { icon: ShieldAlert, title: "Diversion Control", desc: "GPS & biometric bottle tracking" },
    { icon: Database, title: "Michigan Surveillance", desc: "MiOFR, SUDORS, DOSE-SYS, MiPHY integration" },
    { icon: Target, title: "Predictive Analytics", desc: "30/60/90-day overdose forecasts" },
    { icon: Users, title: "Mi-SUTWA Workforce", desc: "Recovery Friendly Workplace certification" },
    { icon: Globe, title: "MiHIN Integration", desc: "Statewide health data exchange" },
    { icon: Camera, title: "Biometric Time Clock", desc: "Facial recognition for payroll" },
    { icon: GraduationCap, title: "Training Library", desc: "CEU tracking and compliance" },
    { icon: Shield, title: "Security Portal", desc: "Incident reporting and crisis response" },
    { icon: FileCheck, title: "DEA Compliance", desc: "Form 222, diversion reporting" },
    { icon: MapPin, title: "GPS Tracking", desc: "Real-time location monitoring" },
    { icon: BarChart3, title: "State Oversight", desc: "Multi-clinic monitoring dashboard" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <Crisis988Banner />

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-10 w-10 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">MASE Behavioral Health EMR</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            Comprehensive Electronic Medical Records for Behavioral Health, Opioid Treatment Programs, and Specialty
            Care
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary">Michigan Surveillance</Badge>
            <Badge variant="secondary">DEA Compliant</Badge>
            <Badge variant="secondary">42 CFR Part 2</Badge>
            <Badge variant="secondary">HIPAA Certified</Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: "Active Patients", value: "15,000+" },
            { label: "Clinical Staff", value: "500+" },
            { label: "Prescriptions/mo", value: "50K" },
            { label: "Uptime", value: "99.9%" },
          ].map((stat, i) => (
            <Card key={i} className="text-center">
              <CardContent className="pt-4">
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-center mb-6">System Capabilities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <Card key={i} className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-4">
                    <Icon className="h-5 w-5 text-primary mb-2" />
                    <p className="font-medium text-sm">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Login Options */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-6">Select Your Portal</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {loginOptions.map((option, i) => {
              const Icon = option.icon
              return (
                <Link key={i} href={option.href}>
                  <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-2 hover:border-primary">
                    <CardHeader className="pb-2">
                      <div className={`w-10 h-10 rounded-lg ${option.color} flex items-center justify-center mb-2`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-base">{option.title}</CardTitle>
                      <CardDescription className="text-xs">{option.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Sign In
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t">
          <p>© 2025 MASE Behavioral Health EMR. All rights reserved.</p>
          <p className="mt-1 text-xs">HIPAA • 42 CFR Part 2 • DEA Registered • Joint Commission Ready</p>
          <p className="mt-1 text-xs">Integrated with Michigan MODA, CDC SUDORS, DOSE-SYS, MiPHY</p>
        </div>
      </div>
    </div>
  )
}
