"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, MessageSquare, Video, Ear } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface CrisisLifeline988Props {
  variant?: "full" | "compact" | "banner"
  showSpanish?: boolean
}

export function CrisisLifeline988({ variant = "full", showSpanish = true }: CrisisLifeline988Props) {
  const handleCall988 = () => {
    window.location.href = "tel:988"
  }

  const handleText988 = () => {
    window.location.href = "sms:988"
  }

  const handleChat = () => {
    window.open("https://988lifeline.org/chat/", "_blank")
  }

  const handleDeafHoH = () => {
    window.open("https://988lifeline.org/help-yourself/for-deaf-hard-of-hearing/", "_blank")
  }

  if (variant === "banner") {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Phone className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">In Crisis? Call or Text 988</AlertTitle>
        <AlertDescription className="flex items-center gap-2 flex-wrap">
          <span className="text-blue-800">
            24/7 free and confidential support for people in distress, prevention and crisis resources
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCall988}
            className="text-blue-600 border-blue-300 bg-transparent"
          >
            <Phone className="h-3 w-3 mr-1" />
            Call 988
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleText988}
            className="text-blue-600 border-blue-300 bg-transparent"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Text 988
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (variant === "compact") {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            988 Suicide & Crisis Lifeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-3">
            If you need emotional support, reach out to the national mental health hotline 24/7
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCall988} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Phone className="h-4 w-4 mr-1" />
              Call 988
            </Button>
            <Button onClick={handleText988} size="sm" variant="outline">
              <MessageSquare className="h-4 w-4 mr-1" />
              Text 988
            </Button>
            <Button onClick={handleChat} size="sm" variant="outline">
              <Video className="h-4 w-4 mr-1" />
              Chat
            </Button>
            <Button onClick={handleDeafHoH} size="sm" variant="outline">
              <Ear className="h-4 w-4 mr-1" />
              Deaf/HoH
            </Button>
          </div>
          {showSpanish && (
            <p className="text-xs text-gray-600 mt-2">🇪🇸 Servicios de texto y chat disponibles en Español</p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Full variant
  return (
    <Card className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-2 border-blue-300">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-2 text-5xl font-bold text-blue-600">988</div>
        <CardTitle className="text-2xl">Suicide & Crisis Lifeline</CardTitle>
        <p className="text-gray-600 text-sm mt-2">If you need to talk, the 988 Lifeline is here</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-blue-100">
          <p className="text-gray-700 text-sm leading-relaxed">
            At the 988 Suicide & Crisis Lifeline, we understand that life's challenges can sometimes be difficult.
            Whether you're facing mental health struggles, emotional distress, alcohol or drug use concerns, or just
            need someone to talk to, our caring counselors are here for you.{" "}
            <strong className="text-blue-700">You are not alone.</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleCall988} className="bg-blue-600 hover:bg-blue-700 h-auto py-4 flex-col gap-2">
            <Phone className="h-6 w-6" />
            <span className="text-lg font-semibold">Call</span>
            <span className="text-xs opacity-90">Dial 988</span>
          </Button>
          <Button onClick={handleText988} className="bg-blue-600 hover:bg-blue-700 h-auto py-4 flex-col gap-2">
            <MessageSquare className="h-6 w-6" />
            <span className="text-lg font-semibold">Text</span>
            <span className="text-xs opacity-90">Text 988</span>
          </Button>
          <Button
            onClick={handleChat}
            variant="outline"
            className="h-auto py-4 flex-col gap-2 border-blue-300 bg-transparent"
          >
            <Video className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold">Chat</span>
            <span className="text-xs text-gray-600">Online Chat</span>
          </Button>
          <Button
            onClick={handleDeafHoH}
            variant="outline"
            className="h-auto py-4 flex-col gap-2 border-blue-300 bg-transparent"
          >
            <Ear className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold">Deaf/HoH</span>
            <span className="text-xs text-gray-600">TTY Service</span>
          </Button>
        </div>

        {showSpanish && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 text-center font-medium">
              🇪🇸 Los servicios de texto y chat de 988 Lifeline ya están disponibles en Español
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Free and confidential support 24/7/365</p>
          <p>Available for anyone experiencing mental health-related distress</p>
        </div>
      </CardContent>
    </Card>
  )
}
