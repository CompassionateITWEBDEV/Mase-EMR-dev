"use client"

import { useState, useEffect } from "react"
import {
  Users,
  FileText,
  Calendar,
  BarChart3,
  Shield,
  Brain,
  Stethoscope,
  ClipboardList,
  MessageSquare,
  Settings,
  Home,
  CreditCard,
  FileCheck,
  Pill,
  Video,
  Package,
  Calculator,
  UserPlus,
  Syringe,
  Archive,
  FileSignature,
  PackageCheck,
  Building2,
  ClipboardCheck,
  UserCheck,
  Send,
  Activity,
  Beaker,
  Heart,
  TrendingUp,
  Workflow,
  FileOutput,
  ClipboardPlus,
  AlertTriangle,
  Clock,
  Bell,
  Crown,
  ChevronDown,
  ChevronRight,
  Handshake,
  Target,
  Network,
  Truck,
  Flag as Flask,
  Dumbbell,
  QrCode,
  Headphones,
  FileBarChart,
  Baby,
  Eye,
  UserCircle,
  FileCheck2,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface NavItem {
  icon: LucideIcon
  label: string
  href: string
  count?: number
  highlight?: "alert" | "premium"
}

interface NavCategory {
  label: string
  icon: LucideIcon
  items: NavItem[]
  defaultOpen?: boolean
}

const checkIsSuperAdmin = (): boolean => {
  if (typeof window === "undefined") return false
  try {
    // Check localStorage for super admin session
    const userRole = localStorage.getItem("userRole")
    const userType = localStorage.getItem("userType")
    return userRole === "super_admin" || userType === "super_admin"
  } catch {
    return false
  }
}

const getNavigationCategories = (isSuperAdmin: boolean): NavCategory[] => {
  const baseCategories: NavCategory[] = [
    {
      label: "Overview",
      icon: Home,
      defaultOpen: true,
      items: [
        { icon: Home, label: "Dashboard", href: isSuperAdmin ? "/super-admin/dashboard" : "/landing" },
        { icon: Clock, label: "Check-In Queue", href: "/check-in", count: 5 },
        { icon: Users, label: "Waiting List", href: "/waiting-list", count: 12, highlight: "alert" },
        { icon: ClipboardCheck, label: "My Work", href: "/my-work", count: 6 },
        { icon: MessageSquare, label: "Notifications", href: "/notifications", count: 7 },
      ],
    },
    {
      label: "Patients",
      icon: Users,
      defaultOpen: true,
      items: [
        { icon: Users, label: "All Patients", href: "/patients", count: 247 },
        { icon: FileText, label: "Patient Chart", href: "/patient-chart" },
        { icon: UserPlus, label: "Intake Queue", href: "/intake-queue", count: 5 },
        { icon: ClipboardCheck, label: "Patient Intake", href: "/intake", count: 3 },
        { icon: Baby, label: "Pregnant Women (Priority)", href: "/pregnant-women", count: 8, highlight: "alert" },
        { icon: Users, label: "Patient Portal", href: "/patient-portal" },
        { icon: Users, label: "Care Teams", href: "/care-teams", count: 8 },
      ],
    },
    {
      label: "Clinical",
      icon: Stethoscope,
      items: [
        { icon: Stethoscope, label: "Nursing Assessment", href: "/nursing-assessment", count: 7, highlight: "alert" },
        { icon: MessageSquare, label: "Counseling Intake", href: "/counseling-intake", count: 5 },
        { icon: Brain, label: "Bio-Psycho-Social", href: "/bio-psycho-social", count: 3 },
        { icon: Target, label: "Treatment Planning", href: "/treatment-planning", count: 8 },
        { icon: Heart, label: "Case Management", href: "/case-management", count: 12 },
        { icon: Users, label: "Peer Recovery", href: "/peer-recovery", count: 6 },
        { icon: Stethoscope, label: "Physician Dashboard", href: "/doctor-system", count: 8, highlight: "alert" },
        { icon: ClipboardPlus, label: "Encounters", href: "/encounters", count: 12 },
        { icon: Video, label: "Telehealth", href: "/telehealth", count: 8 },
        { icon: Calendar, label: "Appointments", href: "/appointments" },
        { icon: FileText, label: "Documentation", href: "/documentation" },
        { icon: Stethoscope, label: "Clinical Notes", href: "/clinical-notes" },
        { icon: ClipboardList, label: "Assessments", href: "/assessments" },
        { icon: Archive, label: "Assessment Library", href: "/assessment-library", count: 19 },
        { icon: FileSignature, label: "Consent Forms", href: "/consent-forms", count: 19 },
        { icon: FileOutput, label: "Discharge Summary", href: "/discharge-summary", count: 4 },
        { icon: Heart, label: "Clinical Protocols", href: "/clinical-protocols", count: 12 },
        { icon: AlertTriangle, label: "Clinical Alerts", href: "/clinical-alerts", count: 5, highlight: "alert" },
        { icon: Brain, label: "AI Coaching", href: "/ai-coaching", count: 5 },
      ],
    },
    {
      label: "Medications",
      icon: Pill,
      items: [
        { icon: Pill, label: "Medication List", href: "/medications", count: 156 },
        { icon: Send, label: "Prescriptions", href: "/prescriptions", count: 8 },
        { icon: Send, label: "E-Prescribing", href: "/e-prescribing", count: 3 },
        { icon: Syringe, label: "Dosing Window", href: "/dosing-window", count: 15, highlight: "alert" },
        { icon: FileCheck2, label: "Order Management", href: "/order-management", count: 8, highlight: "alert" },
        { icon: Syringe, label: "Methadone Dispensing", href: "/dispensing", count: 12 },
        { icon: PackageCheck, label: "Take-Home Mgmt", href: "/takehome", count: 8 },
        { icon: Package, label: "Take-Home Bottles", href: "/dispensing/takehome-bottles", count: 12 },
        { icon: QrCode, label: "Diversion Control", href: "/takehome-diversion", count: 3, highlight: "alert" },
        { icon: Archive, label: "Inventory", href: "/inventory" },
        { icon: FileSignature, label: "DEA Form 222", href: "/form-222", count: 2 },
        { icon: Pill, label: "PMP Monitoring", href: "/pmp" },
      ],
    },
    {
      label: "Lab & Diagnostics",
      icon: Beaker,
      items: [
        { icon: Beaker, label: "Lab Integration", href: "/lab-integration", count: 7 },
        { icon: Flask, label: "Toxicology Lab", href: "/toxicology", count: 3 },
        { icon: Syringe, label: "Vaccinations", href: "/vaccinations", count: 23 },
      ],
    },
    {
      label: "Ancillary Services",
      icon: Heart,
      items: [
        { icon: Truck, label: "DME Management", href: "/dme-management", count: 5 },
        { icon: Dumbbell, label: "Rehabilitation", href: "/rehabilitation", count: 8 },
        { icon: Building2, label: "County Health System", href: "/county-health", count: 12 },
      ],
    },
    {
      label: "Billing & Insurance",
      icon: CreditCard,
      items: [
        { icon: CreditCard, label: "Billing Center", href: "/billing-center" },
        { icon: CreditCard, label: "Insurance Mgmt", href: "/insurance", count: 4 },
        { icon: Workflow, label: "Clearinghouse", href: "/clearinghouse", count: 5 },
        { icon: FileCheck, label: "Prior Authorization", href: "/prior-auth", count: 12 },
        { icon: UserCheck, label: "NPI Verification", href: "/npi-verification", count: 2 },
        { icon: Package, label: "OTP Bundle Billing", href: "/otp-billing" },
        { icon: Calculator, label: "Bundle Calculator", href: "/bundle-calculator" },
      ],
    },
    {
      label: "Communications",
      icon: MessageSquare,
      items: [
        { icon: MessageSquare, label: "Messages", href: "/communications", count: 4 },
        { icon: Bell, label: "Patient Reminders", href: "/patient-reminders", count: 5 },
        { icon: Handshake, label: "Provider Collaboration", href: "/provider-collaboration", count: 3 },
        { icon: Network, label: "HIE Network", href: "/hie-network", count: 2 },
        { icon: UserCircle, label: "Contacts", href: "/contacts" }, // adding Contacts menu item
      ],
    },
    {
      label: "Reports & Analytics",
      icon: BarChart3,
      items: [
        { icon: TrendingUp, label: "Advanced Reports", href: "/reports" },
        { icon: BarChart3, label: "Analytics", href: "/analytics" },
        { icon: Target, label: "MIPS Quality", href: "/quality-dashboard" },
      ],
    },
    {
      label: "Compliance",
      icon: Shield,
      items: [
        { icon: Shield, label: "Compliance Dashboard", href: "/compliance" },
        { icon: Shield, label: "Regulatory Portal", href: "/regulatory/dashboard", count: 2 },
      ],
    },
    {
      label: "Administration",
      icon: Settings,
      items: [
        { icon: UserCheck, label: "Staff Management", href: "/staff", count: 24 },
        { icon: Activity, label: "Staff Workflows", href: "/workflows", count: 3 },
        { icon: Building2, label: "Facility Mgmt", href: "/facility", count: 4 },
        { icon: Crown, label: "Subscription", href: "/subscription", highlight: "premium" },
        { icon: Headphones, label: "IT Support", href: "/it-support", highlight: "premium" },
        { icon: FileBarChart, label: "System Report", href: "/system-report", highlight: "premium" },
        { icon: Settings, label: "Settings", href: "/settings" },
      ],
    },
  ]

  if (isSuperAdmin) {
    const specialtiesCategory: NavCategory = {
      label: "Specialties",
      icon: Stethoscope,
      defaultOpen: false,
      items: [
        { icon: Pill, label: "Behavioral Health / OTP", href: "/specialty/behavioral-health" },
        { icon: Stethoscope, label: "Primary Care", href: "/specialty/primary-care" },
        { icon: Brain, label: "Psychiatry / Mental Health", href: "/specialty/psychiatry" },
        { icon: Baby, label: "OB/GYN / Women's Health", href: "/specialty/obgyn" },
        { icon: Heart, label: "Cardiology", href: "/specialty/cardiology" },
        { icon: Eye, label: "Dermatology", href: "/specialty/dermatology" },
        { icon: Activity, label: "Urgent Care / Walk-In", href: "/specialty/urgent-care" },
        { icon: Baby, label: "Pediatrics", href: "/specialty/pediatrics" },
        { icon: Activity, label: "Podiatry", href: "/specialty/podiatry" },
        { icon: Dumbbell, label: "Physical Therapy", href: "/specialty/physical-therapy" },
        { icon: Brain, label: "Occupational Therapy", href: "/specialty/occupational-therapy" },
        { icon: MessageSquare, label: "Speech Therapy", href: "/specialty/speech-therapy" },
        { icon: Heart, label: "Chiropractic", href: "/specialty/chiropractic" },
      ],
    }

    // Insert Specialties after Overview
    baseCategories.splice(1, 0, specialtiesCategory)
  }

  return baseCategories
}

export function DashboardSidebar() {
  const pathname = usePathname()

  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    const isOnSuperAdminPath = pathname.startsWith("/super-admin")
    const isStoredSuperAdmin = checkIsSuperAdmin()

    if (isOnSuperAdminPath) {
      localStorage.setItem("userRole", "super_admin")
      if (!isSuperAdmin) {
        setIsSuperAdmin(true)
      }
    } else if (isStoredSuperAdmin && !isSuperAdmin) {
      setIsSuperAdmin(true)
    }
  }, [pathname, isSuperAdmin])

  const navigationCategories = getNavigationCategories(isSuperAdmin)

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const initial: Record<string, boolean> = {}
    navigationCategories.forEach((cat) => {
      const containsCurrentPage = cat.items.some((item) => item.href === pathname)
      initial[cat.label] = cat.defaultOpen || containsCurrentPage
    })
    setExpandedCategories(initial)
  }, [])

  useEffect(() => {
    setExpandedCategories((prev) => {
      const updated = { ...prev }
      let hasChanges = false

      navigationCategories.forEach((cat) => {
        const containsCurrentPage = cat.items.some(
          (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
        )
        if (containsCurrentPage && !updated[cat.label]) {
          updated[cat.label] = true
          hasChanges = true
        }
      })

      return hasChanges ? updated : prev
    })
  }, [pathname])

  const toggleCategory = (label: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 border-r overflow-y-auto"
      style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
    >
      <div className="p-4">
        {/* Logo */}
        <div className="flex items-center space-x-2 mb-6 px-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#0891b2" }}>
            <Stethoscope className="h-5 w-5" style={{ color: "#ffffff" }} />
          </div>
          <span className="font-bold text-lg" style={{ color: "#334155" }}>
            MASE EMR
          </span>
          {isSuperAdmin && (
            <Badge variant="outline" className="ml-1 text-xs" style={{ borderColor: "#7c3aed", color: "#7c3aed" }}>
              Admin
            </Badge>
          )}
        </div>

        {/* Navigation Categories */}
        <nav className="space-y-1">
          {navigationCategories.map((category) => {
            const isExpanded = expandedCategories[category.label]
            const hasActiveItem = category.items.some(
              (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
            )
            const totalCount = category.items.reduce((sum, item) => sum + (item.count || 0), 0)
            const hasAlerts = category.items.some((item) => item.highlight === "alert" && item.count)

            return (
              <div key={category.label}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-2 py-2 rounded-md text-sm font-medium transition-colors",
                    hasActiveItem ? "bg-cyan-50" : "hover:bg-gray-100",
                  )}
                  style={{ color: hasAlerts ? "#dc2626" : hasActiveItem ? "#0891b2" : "#475569" }}
                >
                  <div className="flex items-center gap-2">
                    <category.icon className="h-4 w-4" />
                    <span>{category.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {totalCount > 0 && (
                      <Badge variant={hasAlerts ? "destructive" : "secondary"} className="text-xs px-1.5 py-0">
                        {totalCount}
                      </Badge>
                    )}
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l pl-2" style={{ borderColor: "#e2e8f0" }}>
                    {category.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                      const isAlert = item.highlight === "alert" && item.count
                      const isPremium = item.highlight === "premium"

                      return (
                        <Link key={item.href} href={item.href}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start h-8 text-sm",
                              isActive && "bg-cyan-600 text-white hover:bg-cyan-700",
                            )}
                            style={
                              isActive
                                ? { backgroundColor: "#0891b2", color: "#ffffff" }
                                : isAlert
                                  ? { color: "#dc2626", fontWeight: 500 }
                                  : isPremium
                                    ? { color: "#7c3aed", fontWeight: 500 }
                                    : { color: "#64748b" }
                            }
                          >
                            <item.icon
                              className="mr-2 h-3.5 w-3.5"
                              style={
                                isAlert && !isActive
                                  ? { color: "#dc2626" }
                                  : isPremium && !isActive
                                    ? { color: "#7c3aed" }
                                    : undefined
                              }
                            />
                            <span className="truncate">{item.label}</span>
                            {item.count && (
                              <Badge
                                variant={isAlert ? "destructive" : "secondary"}
                                className="ml-auto text-xs px-1.5 py-0"
                              >
                                {item.count}
                              </Badge>
                            )}
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
