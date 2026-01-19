"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, Loader2, Copy, Database, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EBPMigrationPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [migrationStatus, setMigrationStatus] = useState<any>(null)
  const [sqlContent, setSqlContent] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Check migration status on mount
  useEffect(() => {
    checkMigrationStatus()
  }, [])

  const checkMigrationStatus = async () => {
    setChecking(true)
    setError(null)
    try {
      const response = await fetch("/api/evidence-based-practices/migrate")
      const data = await response.json()

      if (response.ok) {
        setMigrationStatus(data)
        if (data.sql) {
          setSqlContent(data.sql)
        }
      } else {
        setError(data.message || "Failed to check migration status")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check migration status")
    } finally {
      setChecking(false)
    }
  }

  const copyToClipboard = () => {
    if (!sqlContent) {
      toast({
        variant: "destructive",
        title: "No SQL content",
        description: "SQL content not loaded. Please refresh the page.",
      })
      return
    }

    navigator.clipboard.writeText(sqlContent)
    toast({
      title: "Copied!",
      description: "SQL has been copied to your clipboard. Paste it in Supabase SQL Editor.",
    })
  }

  const handleMigrate = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/evidence-based-practices/migrate", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setMigrationStatus(data)
        if (data.sql) {
          setSqlContent(data.sql)
        }
        toast({
          title: "SQL Loaded",
          description: "SQL content loaded. Please copy and run it in Supabase SQL Editor.",
        })
      } else {
        setError(data.message || "Failed to load migration")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute migration")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Evidence-Based Practices Migration</h1>
        <p className="text-gray-600">
          Set up the database tables for Evidence-Based Practices tracking
        </p>
      </div>

      {/* Migration Status */}
      {checking ? (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <span className="text-gray-500">Checking migration status...</span>
            </div>
          </CardContent>
        </Card>
      ) : migrationStatus?.migrated ? (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Migration Already Completed</h3>
                <p className="text-sm text-green-700 mt-1">
                  All Evidence-Based Practices tables have been created.
                </p>
                <div className="mt-3 space-y-1">
                  {Object.entries(migrationStatus.tableStatus || {}).map(([table, exists]) => (
                    <div key={table} className="flex items-center gap-2 text-sm">
                      {exists ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className={exists ? "text-green-800" : "text-yellow-800"}>
                        {table} {exists ? "✓" : "✗"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={checkMigrationStatus} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">Migration Required</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Evidence-Based Practices tables have not been created yet.
                </p>
              </div>
              <Button onClick={checkMigrationStatus} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SQL Content Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            SQL Migration Script
          </CardTitle>
          <CardDescription>
            Copy this SQL and run it in your Supabase SQL Editor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sqlContent ? (
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">{sqlContent}</pre>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">SQL content not loaded</p>
              <Button onClick={handleMigrate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Load SQL
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={copyToClipboard} className="flex-1" disabled={!sqlContent}>
              <Copy className="h-4 w-4 mr-2" />
              Copy SQL to Clipboard
            </Button>
            <Button onClick={handleMigrate} disabled={loading} variant="outline">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Reload SQL
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How to Run This Migration:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Click "Copy SQL to Clipboard" above</li>
              <li>Open your Supabase Dashboard</li>
              <li>Go to SQL Editor in the left sidebar</li>
              <li>Click "New Query"</li>
              <li>Paste the SQL (Ctrl+V or Cmd+V)</li>
              <li>Click "Run" to execute</li>
              <li>Wait for completion (may take 30-60 seconds)</li>
              <li>Refresh this page to verify</li>
            </ol>
          </div>

          {/* Alternative: Node.js Script */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Alternative: Use Node.js Script</h4>
            <p className="text-sm text-gray-700 mb-2">
              If you have database access configured, you can run:
            </p>
            <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs font-mono">
              node scripts/execute-ebp-migration.js
            </code>
            <p className="text-xs text-gray-600 mt-2">
              Make sure you have DATABASE_URL in your .env.local file
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

