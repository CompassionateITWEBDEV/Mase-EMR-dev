"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Save, RefreshCw, TestTube, CheckCircle, XCircle, Key } from "lucide-react"

interface ClearinghouseConfig {
  clearinghouseName: string
  clearinghouseId: string
  connectionType: string
  apiEndpoint: string
  submitterId: string
  receiverId: string
  isProduction: boolean
  autoDownloadERA: boolean
  autoSubmitClaims: boolean
  batchFrequency: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ClearinghouseConfiguration() {
  const { data, mutate } = useSWR("/api/clearinghouse", fetcher)

  const existingConnection = data?.connections?.[0]

  const [config, setConfig] = useState<ClearinghouseConfig>({
    clearinghouseName: existingConnection?.clearinghouse_name || "Change Healthcare",
    clearinghouseId: existingConnection?.clearinghouse_id || "",
    connectionType: existingConnection?.connection_type || "api",
    apiEndpoint: existingConnection?.api_endpoint || "",
    submitterId: existingConnection?.submitter_id || "",
    receiverId: existingConnection?.receiver_id || "",
    isProduction: existingConnection?.is_production || false,
    autoDownloadERA: true,
    autoSubmitClaims: false,
    batchFrequency: "daily",
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "failed" | null>(null)
  const [credentialsOpen, setCredentialsOpen] = useState(false)
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    apiKey: "",
    host: "",
    port: "22",
  })
  const [savingCredentials, setSavingCredentials] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/clearinghouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_config", config }),
      })
      if (response.ok) {
        mutate()
      }
    } catch (error) {
      console.error("Error saving config:", error)
    }
    setIsSaving(false)
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const response = await fetch("/api/clearinghouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_connection" }),
      })
      const result = await response.json()
      setTestResult(result.success ? "success" : "failed")
    } catch {
      setTestResult("failed")
    }
    setIsTesting(false)
  }

  const handleSaveCredentials = async () => {
    setSavingCredentials(true)
    try {
      const response = await fetch("/api/clearinghouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_credentials",
          credentials: {
            ...credentials,
            clearinghouseName: config.clearinghouseName,
          },
        }),
      })
      if (response.ok) {
        setCredentialsOpen(false)
        mutate()
      }
    } catch (error) {
      console.error("Error saving credentials:", error)
    }
    setSavingCredentials(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Clearinghouse Configuration</h2>
          <p className="text-muted-foreground">Configure clearinghouse connection and EDI settings</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={credentialsOpen} onOpenChange={setCredentialsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Key className="mr-2 h-4 w-4" />
                Credential Management
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Credential Management</DialogTitle>
                <DialogDescription>
                  Configure authentication credentials for {config.clearinghouseName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {config.connectionType === "sftp" ? (
                  <>
                    <div>
                      <Label htmlFor="sftp-host">SFTP Host</Label>
                      <Input
                        id="sftp-host"
                        value={credentials.host}
                        onChange={(e) => setCredentials({ ...credentials, host: e.target.value })}
                        placeholder="sftp.clearinghouse.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sftp-port">SFTP Port</Label>
                      <Input
                        id="sftp-port"
                        value={credentials.port}
                        onChange={(e) => setCredentials({ ...credentials, port: e.target.value })}
                        placeholder="22"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sftp-username">Username</Label>
                      <Input
                        id="sftp-username"
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        placeholder="your_username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sftp-password">Password</Label>
                      <Input
                        id="sftp-password"
                        type="password"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="api-key">API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={credentials.apiKey}
                        onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                        placeholder="Enter your API key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="api-username">API Username (Optional)</Label>
                      <Input
                        id="api-username"
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        placeholder="your_api_username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="api-password">API Password (Optional)</Label>
                      <Input
                        id="api-password"
                        type="password"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCredentialsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveCredentials} disabled={savingCredentials}>
                  {savingCredentials ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Credentials"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
            {isTesting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </div>

      {testResult && (
        <Card className={testResult === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {testResult === "success" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-900">Connection Successful</p>
                    <p className="text-sm text-green-700">Clearinghouse is responding normally</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-900">Connection Failed</p>
                    <p className="text-sm text-red-700">Unable to reach clearinghouse endpoint</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Connection Settings
          </CardTitle>
          <CardDescription>Configure clearinghouse connection parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="clearinghouseName">Clearinghouse Name</Label>
              <Select
                value={config.clearinghouseName}
                onValueChange={(value) => setConfig({ ...config, clearinghouseName: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Change Healthcare">Change Healthcare</SelectItem>
                  <SelectItem value="Availity">Availity</SelectItem>
                  <SelectItem value="Trizetto">Trizetto</SelectItem>
                  <SelectItem value="RelayHealth">RelayHealth</SelectItem>
                  <SelectItem value="Waystar">Waystar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="clearinghouseId">Clearinghouse ID</Label>
              <Input
                id="clearinghouseId"
                value={config.clearinghouseId}
                onChange={(e) => setConfig({ ...config, clearinghouseId: e.target.value })}
                placeholder="Enter clearinghouse ID"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="connectionType">Connection Type</Label>
              <Select
                value={config.connectionType}
                onValueChange={(value) => setConfig({ ...config, connectionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">API (REST/SOAP)</SelectItem>
                  <SelectItem value="sftp">SFTP</SelectItem>
                  <SelectItem value="direct">Direct EDI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="apiEndpoint">API Endpoint</Label>
              <Input
                id="apiEndpoint"
                value={config.apiEndpoint}
                onChange={(e) => setConfig({ ...config, apiEndpoint: e.target.value })}
                placeholder="https://api.clearinghouse.com/v1"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="submitterId">Submitter ID</Label>
              <Input
                id="submitterId"
                value={config.submitterId}
                onChange={(e) => setConfig({ ...config, submitterId: e.target.value })}
                placeholder="Your submitter ID"
              />
            </div>

            <div>
              <Label htmlFor="receiverId">Receiver ID</Label>
              <Input
                id="receiverId"
                value={config.receiverId}
                onChange={(e) => setConfig({ ...config, receiverId: e.target.value })}
                placeholder="Clearinghouse receiver ID"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="space-y-0.5">
              <Label htmlFor="isProduction">Production Mode</Label>
              <p className="text-sm text-muted-foreground">Enable for live claim submission</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isProduction"
                checked={config.isProduction}
                onCheckedChange={(checked) => setConfig({ ...config, isProduction: checked })}
              />
              <Badge variant={config.isProduction ? "default" : "secondary"}>
                {config.isProduction ? "PRODUCTION" : "TEST"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Settings</CardTitle>
          <CardDescription>Configure automated processes and schedules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoDownloadERA">Auto-Download ERAs</Label>
              <p className="text-sm text-muted-foreground">Automatically download 835 remittance files</p>
            </div>
            <Switch
              id="autoDownloadERA"
              checked={config.autoDownloadERA}
              onCheckedChange={(checked) => setConfig({ ...config, autoDownloadERA: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoSubmitClaims">Auto-Submit Claims</Label>
              <p className="text-sm text-muted-foreground">Automatically submit claims based on schedule</p>
            </div>
            <Switch
              id="autoSubmitClaims"
              checked={config.autoSubmitClaims}
              onCheckedChange={(checked) => setConfig({ ...config, autoSubmitClaims: checked })}
            />
          </div>

          <div>
            <Label htmlFor="batchFrequency">Batch Submission Frequency</Label>
            <Select
              value={config.batchFrequency}
              onValueChange={(value) => setConfig({ ...config, batchFrequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time (immediate)</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily (end of day)</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="manual">Manual Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* EDI Transaction Settings */}
      <Card>
        <CardHeader>
          <CardTitle>EDI Transaction Settings</CardTitle>
          <CardDescription>Configure supported EDI transaction types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">837 - Claims Submission</p>
                  <p className="text-sm text-muted-foreground">Professional/Institutional claims</p>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">835 - ERA Processing</p>
                  <p className="text-sm text-muted-foreground">Electronic remittance advice</p>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">270/271 - Eligibility</p>
                  <p className="text-sm text-muted-foreground">Real-time eligibility verification</p>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">276/277 - Claim Status</p>
                  <p className="text-sm text-muted-foreground">Claim status inquiry/response</p>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">278 - Prior Authorization</p>
                  <p className="text-sm text-muted-foreground">Prior auth request/response</p>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">997/999 - Acknowledgments</p>
                  <p className="text-sm text-muted-foreground">Functional acknowledgments</p>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
