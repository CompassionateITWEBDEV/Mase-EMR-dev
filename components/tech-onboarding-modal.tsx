"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Smartphone,
  Laptop,
  Lock,
  MessageSquare,
  Video,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface TechOnboardingModalProps {
  patient: any
  isOpen: boolean
  onClose: () => void
  onComplete: (data: any) => void
}

export function TechOnboardingModal({ patient, isOpen, onClose, onComplete }: TechOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState("device-check")
  const [onboardingData, setOnboardingData] = useState({
    deviceType: "",
    hasSmartphone: false,
    hasInternet: false,
    emailAddress: "",
    phoneNumber: "",
    portalPassword: "",
    completedTraining: {
      navigation: false,
      messaging: false,
      appointments: false,
      telehealth: false,
      resources: false,
    },
    techSupport: false,
    emergencyContact: "",
  })

  const trainingModules = [
    {
      id: "navigation",
      title: "Portal Navigation",
      description: "Learn to navigate the patient portal",
      icon: Laptop,
      completed: onboardingData.completedTraining.navigation,
    },
    {
      id: "messaging",
      title: "Secure Messaging",
      description: "Communicate safely with your care team",
      icon: MessageSquare,
      completed: onboardingData.completedTraining.messaging,
    },
    {
      id: "appointments",
      title: "Appointment Scheduling",
      description: "Schedule and manage appointments",
      icon: Calendar,
      completed: onboardingData.completedTraining.appointments,
    },
    {
      id: "telehealth",
      title: "Telehealth Sessions",
      description: "Join virtual appointments",
      icon: Video,
      completed: onboardingData.completedTraining.telehealth,
    },
    {
      id: "resources",
      title: "Resources & Tools",
      description: "Access treatment resources and tools",
      icon: FileText,
      completed: onboardingData.completedTraining.resources,
    },
  ]

  const handleComplete = () => {
    onComplete(onboardingData)
    onClose()
  }

  const allTrainingComplete = Object.values(onboardingData.completedTraining).every(Boolean)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Technology Onboarding - {patient?.name}
          </DialogTitle>
          <DialogDescription>Set up patient portal access and provide technology training</DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep} onValueChange={setCurrentStep} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="device-check">Device Check</TabsTrigger>
            <TabsTrigger value="portal-setup">Portal Setup</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="completion">Completion</TabsTrigger>
          </TabsList>

          <TabsContent value="device-check" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Device & Internet Assessment
                </CardTitle>
                <CardDescription>Verify patient's technology access and capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Device Type</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={onboardingData.deviceType}
                      onChange={(e) => setOnboardingData({ ...onboardingData, deviceType: e.target.value })}
                    >
                      <option value="">Select device</option>
                      <option value="smartphone">Smartphone</option>
                      <option value="tablet">Tablet</option>
                      <option value="computer">Computer/Laptop</option>
                      <option value="none">No device available</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Internet Access</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={onboardingData.hasInternet}
                        onCheckedChange={(checked) => setOnboardingData({ ...onboardingData, hasInternet: !!checked })}
                      />
                      <Label>Has reliable internet access</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={onboardingData.emailAddress}
                      onChange={(e) => setOnboardingData({ ...onboardingData, emailAddress: e.target.value })}
                      placeholder="patient@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      type="tel"
                      value={onboardingData.phoneNumber}
                      onChange={(e) => setOnboardingData({ ...onboardingData, phoneNumber: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                {onboardingData.deviceType === "none" && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">No Device Available</span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      Patient will need assistance accessing portal services. Consider providing device or alternative
                      access methods.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portal-setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Patient Portal Account Setup
                </CardTitle>
                <CardDescription>Create secure portal credentials and emergency contacts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Portal Password</Label>
                  <Input
                    type="password"
                    value={onboardingData.portalPassword}
                    onChange={(e) => setOnboardingData({ ...onboardingData, portalPassword: e.target.value })}
                    placeholder="Create secure password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters with uppercase, lowercase, and numbers
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Emergency Contact</Label>
                  <Input
                    value={onboardingData.emergencyContact}
                    onChange={(e) => setOnboardingData({ ...onboardingData, emergencyContact: e.target.value })}
                    placeholder="Emergency contact name and phone"
                  />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Portal Access Information</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p>
                      <strong>Portal URL:</strong> https://portal.mase-emr.com
                    </p>
                    <p>
                      <strong>Username:</strong> {patient?.id || "Patient ID"}
                    </p>
                    <p>
                      <strong>Support:</strong> (555) 123-HELP
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Technology Training Modules
                </CardTitle>
                <CardDescription>Complete training on portal features and functionality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {trainingModules.map((module) => {
                    const IconComponent = module.icon
                    return (
                      <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${module.completed ? "bg-green-100" : "bg-gray-100"}`}>
                            <IconComponent
                              className={`h-4 w-4 ${module.completed ? "text-green-600" : "text-gray-600"}`}
                            />
                          </div>
                          <div>
                            <h4 className="font-medium">{module.title}</h4>
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {module.completed ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Complete
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                setOnboardingData({
                                  ...onboardingData,
                                  completedTraining: {
                                    ...onboardingData.completedTraining,
                                    [module.id]: true,
                                  },
                                })
                              }}
                            >
                              Start Training
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Training Progress</span>
                    <Badge variant={allTrainingComplete ? "default" : "secondary"}>
                      {Object.values(onboardingData.completedTraining).filter(Boolean).length} /{" "}
                      {trainingModules.length}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${(Object.values(onboardingData.completedTraining).filter(Boolean).length / trainingModules.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Onboarding Summary
                </CardTitle>
                <CardDescription>Review completed onboarding and finalize setup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Device Information</h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Device:</strong> {onboardingData.deviceType || "Not specified"}
                      </p>
                      <p>
                        <strong>Internet:</strong> {onboardingData.hasInternet ? "Available" : "Limited"}
                      </p>
                      <p>
                        <strong>Email:</strong> {onboardingData.emailAddress || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Training Status</h4>
                    <div className="text-sm">
                      <p>
                        <strong>Modules Completed:</strong>{" "}
                        {Object.values(onboardingData.completedTraining).filter(Boolean).length} /{" "}
                        {trainingModules.length}
                      </p>
                      <p>
                        <strong>Status:</strong> {allTrainingComplete ? "Complete" : "In Progress"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={onboardingData.techSupport}
                    onCheckedChange={(checked) => setOnboardingData({ ...onboardingData, techSupport: !!checked })}
                  />
                  <Label>Patient requires ongoing tech support</Label>
                </div>

                {!allTrainingComplete && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Training Incomplete</span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      Some training modules are not complete. Patient may need additional support.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {currentStep !== "device-check" && (
              <Button
                variant="outline"
                onClick={() => {
                  const steps = ["device-check", "portal-setup", "training", "completion"]
                  const currentIndex = steps.indexOf(currentStep)
                  if (currentIndex > 0) setCurrentStep(steps[currentIndex - 1])
                }}
              >
                Previous
              </Button>
            )}
            {currentStep !== "completion" ? (
              <Button
                onClick={() => {
                  const steps = ["device-check", "portal-setup", "training", "completion"]
                  const currentIndex = steps.indexOf(currentStep)
                  if (currentIndex < steps.length - 1) setCurrentStep(steps[currentIndex + 1])
                }}
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete}>Complete Onboarding</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
