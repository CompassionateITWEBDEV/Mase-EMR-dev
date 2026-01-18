"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  Heart,
  Shield,
  Stethoscope,
  User,
  UserCog,
  Users,
  Activity,
  CheckCircle,
  Clock,
  FileText,
  HeartPulse,
  Building,
  Syringe,
  Dumbbell,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const loginOptions = [
    {
      title: "Super Admin Portal",
      description: "MASE system administrators - Manage all organizations",
      icon: Shield,
      href: "/super-admin/login",
      color: "bg-red-500",
      textColor: "text-red-600",
    },
    {
      title: "Clinic Administrator",
      description: "Manage your practice settings and users",
      icon: Building2,
      href: "/auth/admin-login",
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      title: "Healthcare Provider",
      description: "Physicians, NPs, PAs - Clinical access",
      icon: Stethoscope,
      href: "/auth/provider-login",
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      title: "Clinical Staff",
      description: "Nurses, MAs, counselors - Support staff",
      icon: UserCog,
      href: "/auth/staff-login",
      color: "bg-purple-500",
      textColor: "text-purple-600",
    },
    {
      title: "Primary Care Portal",
      description: "Primary care providers - Family medicine, internal medicine",
      icon: HeartPulse,
      href: "/auth/primary-care-login",
      color: "bg-indigo-500",
      textColor: "text-indigo-600",
    },
    {
      title: "OTP Clinic Portal",
      description: "Opioid Treatment Programs - MAT, methadone, buprenorphine dosing",
      icon: Syringe,
      href: "/auth/otp-login",
      color: "bg-rose-500",
      textColor: "text-rose-600",
    },
    {
      title: "Physical Therapy & OT",
      description: "PT, OT, Speech therapists - Rehabilitation services",
      icon: Dumbbell,
      href: "/auth/pt-ot-login",
      color: "bg-amber-500",
      textColor: "text-amber-600",
    },
    {
      title: "Patient Portal",
      description: "Patients - Access your health records",
      icon: User,
      href: "/auth/patient-login",
      color: "bg-pink-500",
      textColor: "text-pink-600",
    },
    {
      title: "County Health System",
      description: "County health departments - WIC, immunizations, public health",
      icon: Building,
      href: "/county-health",
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
    },
    {
      title: "PIHP Portal",
      description: "Managed care - Mental health & OTP data access",
      icon: Building,
      href: "/auth/pihp-login",
      color: "bg-cyan-500",
      textColor: "text-cyan-600",
    },
    {
      title: "Health Department",
      description: "Public health - Immunization & disease reporting",
      icon: Syringe,
      href: "/auth/health-dept-login",
      color: "bg-teal-500",
      textColor: "text-teal-600",
    },
    {
      title: "Regulatory Inspector",
      description: "DEA, Joint Commission, State auditors",
      icon: Users,
      href: "/auth/regulatory-login",
      color: "bg-orange-500",
      textColor: "text-orange-600",
    },
  ]

  const features = [
    {
      icon: HeartPulse,
      title: "Multi-Specialty Support",
      description: "Behavioral Health, Primary Care, OB/GYN, Psychiatry, Cardiology, Pediatrics, Podiatry, and more",
    },
    {
      icon: Activity,
      title: "MIPS Quality Reporting",
      description: "Automatic quality measure tracking and value-based care reporting",
    },
    {
      icon: CheckCircle,
      title: "Clinical Decision Support",
      description: "AI-powered alerts for safety, drug interactions, and preventive care",
    },
    {
      icon: Clock,
      title: "Real-Time Eligibility",
      description: "Instant insurance verification and prior authorization tracking",
    },
    {
      icon: FileText,
      title: "AI Scribe & Documentation",
      description: "Voice-to-text clinical notes with specialty-specific templates",
    },
    {
      icon: Shield,
      title: "42 CFR Part 2 Compliant",
      description: "SUD confidentiality, OTP billing, provider collaboration portal",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-12 w-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">MASE Health EMR</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Next-generation Electronic Medical Records system for behavioral health, primary care, and specialty
            practices
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <feature.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Login Options */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-6">Select Your Portal</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loginOptions.map((option, index) => {
              const Icon = option.icon
              return (
                <Link key={index} href={option.href}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg ${option.color} flex items-center justify-center mb-3`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className={option.textColor}>{option.title}</CardTitle>
                      <CardDescription className="text-sm">{option.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full bg-transparent">
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
        <div className="text-center text-sm text-muted-foreground mt-12 pt-8 border-t">
          <p>© 2025 MASE Health EMR. All rights reserved.</p>
          <p className="mt-2">HIPAA Compliant • 42 CFR Part 2 • SOC 2 Type II</p>
        </div>
      </div>
    </div>
  )
}
