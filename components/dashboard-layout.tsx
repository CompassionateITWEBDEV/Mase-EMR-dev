"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  headerClassName?: string
  mainClassName?: string
  showHeader?: boolean
}

/**
 * DashboardLayout - A consistent layout wrapper for dashboard pages
 * 
 * This component provides:
 * - Sidebar navigation with responsive offset (hidden on mobile, visible on lg+)
 * - Optional header with title/subtitle
 * - Consistent padding and spacing
 * - Accessibility: main content landmark with skip-to-content target
 * 
 * Usage:
 * ```tsx
 * <DashboardLayout title="Page Title" subtitle="Description">
 *   <YourPageContent />
 * </DashboardLayout>
 * ```
 */
export function DashboardLayout({
  children,
  title,
  subtitle,
  headerClassName,
  mainClassName,
  showHeader = true,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        {showHeader && (
          <DashboardHeader
            title={title}
            subtitle={subtitle}
            className={headerClassName}
          />
        )}
        <main 
          id="main-content" 
          className={cn("p-6", mainClassName)}
          role="main"
          aria-label={title ? `${title} content` : "Main content"}
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

/**
 * DashboardLayoutSimple - Layout without header for pages that use custom headers
 */
export function DashboardLayoutSimple({
  children,
  mainClassName,
}: {
  children: React.ReactNode
  mainClassName?: string
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <main 
          id="main-content" 
          className={cn(mainClassName)}
          role="main"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
