"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

interface PatientErrorFallbackProps {
  error?: Error
  resetError?: () => void
}

/**
 * Fallback UI for patient-related errors
 */
export function PatientErrorFallback({ error, resetError }: PatientErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Patient Data Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We encountered an error while loading patient data. This could be due to a network issue
            or a problem with the database connection.
          </p>
          {error && (
            <div className="rounded bg-muted p-3">
              <p className="text-sm font-medium">Error message:</p>
              <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            </div>
          )}
          <div className="flex gap-2">
            {resetError && (
              <Button onClick={resetError} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/patients">
                <Home className="mr-2 h-4 w-4" />
                Back to Patients
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

