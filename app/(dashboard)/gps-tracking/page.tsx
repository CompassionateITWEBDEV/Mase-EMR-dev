"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Shield, AlertTriangle, History, Settings } from "lucide-react"

export default function GPSTrackingPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GPS Tracking & Geofencing</h1>
          <p className="text-muted-foreground">
            Location-based compliance monitoring for take-home medication programs
          </p>
        </div>
        <Badge variant="outline" className="text-amber-600 border-amber-600">
          Coming Soon
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Live Location Map</CardTitle>
            </div>
            <CardDescription>
              Real-time patient location monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View active patient locations during dosing windows with geofence boundaries 
              and compliance status indicators.
            </p>
            <Button variant="outline" disabled>
              Open Map
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Geofence Management</CardTitle>
            </div>
            <CardDescription>
              Configure patient location boundaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Set up home address geofences, temporary location exceptions, and radius 
              tolerances for each patient.
            </p>
            <Button variant="outline" disabled>
              Manage Geofences
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Location Violations</CardTitle>
            </div>
            <CardDescription>
              Track out-of-boundary alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View patients who scanned outside their approved geofence and manage 
              violation follow-ups.
            </p>
            <Button variant="outline" disabled>
              View Violations
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Location History</CardTitle>
            </div>
            <CardDescription>
              Historical location data and patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Review historical scan locations, identify patterns, and generate 
              compliance reports for regulatory audits.
            </p>
            <Button variant="outline" disabled>
              View History
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-lg">GPS Settings</CardTitle>
            </div>
            <CardDescription>
              Configure tracking parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Set default geofence radius, GPS accuracy requirements, and location 
              verification tolerances.
            </p>
            <Button variant="outline" disabled>
              Configure
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <MapPin className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900">Feature Under Development</h3>
              <p className="text-sm text-blue-800 mt-1">
                GPS Tracking and Geofencing is currently being developed. This feature will integrate with 
                the Take-Home Diversion Control system to provide location-based verification of medication 
                doses, ensuring patients are at approved locations during dosing windows as required by 
                state regulations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-900">Privacy Notice</h3>
              <p className="text-sm text-amber-800 mt-1">
                GPS tracking data is collected only during designated dosing windows with patient consent 
                as part of take-home medication program participation. All location data is encrypted, 
                HIPAA-compliant, and retained according to state regulatory requirements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
