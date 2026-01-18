"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Settings, Building2, Save, RefreshCw } from "lucide-react"

interface BillingConfig {
  facilityName: string
  facilityNPI: string
  facilityTaxId: string
  billingAddress: string
  contactPhone: string
  contactEmail: string
  clearinghouseName: string
  clearinghouseId: string
  defaultPlaceOfService: string
  claimFrequency: string
  autoSubmitClaims: boolean
  requirePriorAuthCheck: boolean
}

export function BillingConfiguration() {
  const [config, setConfig] = useState<BillingConfig>({
    facilityName: "MASE Behavioral Health Center",
    facilityNPI: "1234567890",
    facilityTaxId: "12-3456789",
    billingAddress: "123 Healthcare Drive, Medical City, MC 12345",
    contactPhone: "(555) 123-4567",
    contactEmail: "billing@masebehavioral.com",
    clearinghouseName: "Change Healthcare",
    clearinghouseId: "CHC001",
    defaultPlaceOfService: "11",
    claimFrequency: "daily",
    autoSubmitClaims: false,
    requirePriorAuthCheck: true,
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
    }, 1000)
  }

  const placeOfServiceCodes = [
    { code: "11", description: "Office" },
    { code: "12", description: "Home" },
    { code: "22", description: "On Campus-Outpatient Hospital" },
    { code: "23", description: "Emergency Room - Hospital" },
    { code: "31", description: "Skilled Nursing Facility" },
    { code: "32", description: "Nursing Facility" },
    { code: "53", description: "Community Mental Health Center" },
    { code: "57", description: "Non-residential Substance Abuse Treatment Facility" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Billing Configuration</h2>
          <p className="text-muted-foreground">Configure billing center settings and preferences</p>
        </div>
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

      {/* Facility Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Facility Information
          </CardTitle>
          <CardDescription>Basic facility information for billing and claims</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="facilityName">Facility Name *</Label>
              <Input
                id="facilityName"
                value={config.facilityName}
                onChange={(e) => setConfig({ ...config, facilityName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="facilityNPI">Facility NPI *</Label>
              <Input
                id="facilityNPI"
                value={config.facilityNPI}
                onChange={(e) => setConfig({ ...config, facilityNPI: e.target.value })}
                maxLength={10}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="facilityTaxId">Tax ID (EIN) *</Label>
              <Input
                id="facilityTaxId"
                value={config.facilityTaxId}
                onChange={(e) => setConfig({ ...config, facilityTaxId: e.target.value })}
                placeholder="12-3456789"
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone *</Label>
              <Input
                id="contactPhone"
                value={config.contactPhone}
                onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={config.contactEmail}
                onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                placeholder="billing@facility.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="billingAddress">Billing Address *</Label>
            <Textarea
              id="billingAddress"
              value={config.billingAddress}
              onChange={(e) => setConfig({ ...config, billingAddress: e.target.value })}
              placeholder="123 Healthcare Drive, Medical City, MC 12345"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Clearinghouse Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Clearinghouse Configuration
          </CardTitle>
          <CardDescription>Electronic claims submission settings</CardDescription>
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
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="clearinghouseId">Clearinghouse ID</Label>
              <Input
                id="clearinghouseId"
                value={config.clearinghouseId}
                onChange={(e) => setConfig({ ...config, clearinghouseId: e.target.value })}
                placeholder="CHC001"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Preferences</CardTitle>
          <CardDescription>Default settings for claims and billing processes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="defaultPlaceOfService">Default Place of Service</Label>
              <Select
                value={config.defaultPlaceOfService}
                onValueChange={(value) => setConfig({ ...config, defaultPlaceOfService: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {placeOfServiceCodes.map((pos) => (
                    <SelectItem key={pos.code} value={pos.code}>
                      {pos.code} - {pos.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="claimFrequency">Claim Submission Frequency</Label>
              <Select
                value={config.claimFrequency}
                onValueChange={(value) => setConfig({ ...config, claimFrequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoSubmitClaims">Auto-Submit Claims</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically submit claims based on the frequency setting
                </p>
              </div>
              <Switch
                id="autoSubmitClaims"
                checked={config.autoSubmitClaims}
                onCheckedChange={(checked) => setConfig({ ...config, autoSubmitClaims: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requirePriorAuthCheck">Require Prior Authorization Check</Label>
                <p className="text-sm text-muted-foreground">
                  Check for prior authorization requirements before submitting claims
                </p>
              </div>
              <Switch
                id="requirePriorAuthCheck"
                checked={config.requirePriorAuthCheck}
                onCheckedChange={(checked) => setConfig({ ...config, requirePriorAuthCheck: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current status of billing system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Clearinghouse Connection</p>
                <p className="text-sm text-muted-foreground">Change Healthcare</p>
              </div>
              <Badge variant="default">Connected</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">NPI Verification</p>
                <p className="text-sm text-muted-foreground">NPPES Registry</p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Eligibility Verification</p>
                <p className="text-sm text-muted-foreground">Real-time checks</p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Claims Submission</p>
                <p className="text-sm text-muted-foreground">Electronic EDI</p>
              </div>
              <Badge variant="default">Operational</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Prior Auth Integration</p>
                <p className="text-sm text-muted-foreground">Multi-payer support</p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Backup System</p>
                <p className="text-sm text-muted-foreground">Last backup: 2 hours ago</p>
              </div>
              <Badge variant="default">Current</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
