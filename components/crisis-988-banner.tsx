"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Phone, MessageSquare, Video, X, Languages } from "lucide-react"

interface Crisis988BannerProps {
  variant?: "full" | "compact"
  className?: string
}

export function Crisis988Banner({ variant = "full", className = "" }: Crisis988BannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [showSpanish, setShowSpanish] = useState(false)

  if (dismissed) return null

  if (variant === "compact") {
    return (
      <Alert className={`bg-red-50 border-red-200 ${className}`}>
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-red-600" />
            <span className="font-semibold text-red-900">Crisis Support: Call/Text 988</span>
            <span className="text-red-700 text-sm">24/7 Free & Confidential</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            <X className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className={`bg-gradient-to-r from-red-50 to-orange-50 border-red-200 ${className}`}>
      <AlertDescription>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-red-900 text-lg">
                {showSpanish ? "Línea de vida 988" : "988 Suicide & Crisis Lifeline"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSpanish(!showSpanish)} className="ml-auto">
                <Languages className="h-4 w-4 mr-1" />
                {showSpanish ? "English" : "Español"}
              </Button>
            </div>
            <p className="text-red-800 mb-3">
              {showSpanish
                ? "Si necesitas apoyo emocional, comunícate con la línea de salud mental nacional: 988. No estás solo."
                : "If you need emotional support, reach out to the national mental health hotline: 988. You are not alone."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => window.open("tel:988", "_self")}>
                <Phone className="h-4 w-4 mr-2" />
                {showSpanish ? "Llamar 988" : "Call 988"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
                onClick={() => window.open("sms:988", "_self")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {showSpanish ? "Mensaje de texto 988" : "Text 988"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
                onClick={() => window.open("https://988lifeline.org/chat/", "_blank")}
              >
                <Video className="h-4 w-4 mr-2" />
                {showSpanish ? "Chat en línea" : "Chat Online"}
              </Button>
            </div>
            <p className="text-xs text-red-700 mt-2">
              {showSpanish
                ? "Servicio gratuito, confidencial y disponible 24/7 en inglés y español"
                : "Free, confidential support available 24/7 in English and Spanish"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
