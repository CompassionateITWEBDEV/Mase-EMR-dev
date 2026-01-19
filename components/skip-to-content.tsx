"use client"

import { cn } from "@/lib/utils"

interface SkipToContentProps {
  /** ID of the main content element to skip to */
  contentId?: string
  /** Custom class name */
  className?: string
}

/**
 * SkipToContent - Accessibility component for keyboard navigation
 * 
 * Allows keyboard users to skip directly to main content,
 * bypassing navigation and other repeated elements.
 * 
 * Usage:
 * 1. Add <SkipToContent /> at the top of your layout
 * 2. Add id="main-content" to your main content element
 */
export function SkipToContent({ 
  contentId = "main-content",
  className 
}: SkipToContentProps) {
  return (
    <a
      href={`#${contentId}`}
      className={cn(
        // Hidden by default, visible on focus
        "sr-only focus:not-sr-only",
        // Styling when visible
        "focus:absolute focus:top-4 focus:left-4 focus:z-[100]",
        "focus:px-4 focus:py-2 focus:rounded-md",
        "focus:bg-primary focus:text-primary-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "focus:shadow-lg",
        className
      )}
    >
      Skip to main content
    </a>
  )
}

/**
 * SkipLinks - Multiple skip links for complex layouts
 */
export function SkipLinks({
  links = [
    { id: "main-content", label: "Skip to main content" },
    { id: "main-nav", label: "Skip to navigation" },
  ],
}: {
  links?: { id: string; label: string }[]
}) {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4 focus-within:z-[100] focus-within:flex focus-within:flex-col focus-within:gap-2">
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className={cn(
            "px-4 py-2 rounded-md",
            "bg-primary text-primary-foreground",
            "outline-none ring-2 ring-ring ring-offset-2",
            "shadow-lg",
            "focus:opacity-100"
          )}
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}
