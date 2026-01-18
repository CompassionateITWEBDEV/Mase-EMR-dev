"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Video, VideoOff, CheckCircle2, AlertCircle, Activity, TrendingUp } from "lucide-react"

interface MovementMetrics {
  exerciseName: string
  timestamp: string
  anglesMeasured: {
    joint: string
    angle: number
    normalRange: string
    status: "normal" | "limited" | "excessive"
  }[]
  formScore: number
  compensations: string[]
  recommendations: string[]
}

interface AIMovementAnalyzerProps {
  exerciseName: string
  mode: "evaluation" | "hep" // PT evaluation vs patient HEP
  onAnalysisComplete?: (metrics: MovementMetrics) => void
}

export function AIMovementAnalyzer({ exerciseName, mode, onAnalysisComplete }: AIMovementAnalyzerProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [currentMetrics, setCurrentMetrics] = useState<MovementMetrics | null>(null)
  const [realtimeFeedback, setRealtimeFeedback] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: mode === "hep" ? "user" : "environment", // Selfie for HEP, rear for PT
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }

      setIsRecording(true)

      // Start AI analysis every 500ms
      analysisIntervalRef.current = setInterval(() => {
        analyzeMovement()
      }, 500)
    } catch (error) {
      console.error("[v0] Camera access denied:", error)
      alert("Please allow camera access to use AI movement analysis")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
    }

    setIsRecording(false)

    if (currentMetrics && onAnalysisComplete) {
      onAnalysisComplete(currentMetrics)
    }
  }

  const analyzeMovement = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw current video frame to canvas for analysis
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

    // Simulate AI pose estimation and analysis
    // In production, this would use TensorFlow.js with PoseNet/MoveNet or similar
    const mockAnalysis = simulateAIPoseEstimation(exerciseName)

    setCurrentMetrics(mockAnalysis)
    setRealtimeFeedback(mockAnalysis.recommendations)
  }

  const simulateAIPoseEstimation = (exercise: string): MovementMetrics => {
    // This simulates what a real AI model would return
    // In production, use TensorFlow.js PoseNet, MoveNet, or MediaPipe

    const exercises: Record<string, MovementMetrics> = {
      "Shoulder Flexion": {
        exerciseName: "Shoulder Flexion",
        timestamp: new Date().toISOString(),
        anglesMeasured: [
          { joint: "Shoulder", angle: 145, normalRange: "150-180°", status: "limited" },
          { joint: "Elbow", angle: 178, normalRange: "170-180°", status: "normal" },
          { joint: "Trunk", angle: 5, normalRange: "0-10°", status: "normal" },
        ],
        formScore: 82,
        compensations: ["Minimal trunk extension noted", "Scapular winging at end range"],
        recommendations: [
          "Good effort! Reached 145° (Goal: 150°)",
          "Keep core engaged to prevent trunk compensation",
          "Focus on scapular stability",
        ],
      },
      "Knee Extension": {
        exerciseName: "Knee Extension",
        timestamp: new Date().toISOString(),
        anglesMeasured: [
          { joint: "Knee", angle: 172, normalRange: "170-180°", status: "normal" },
          { joint: "Hip", angle: 88, normalRange: "85-95°", status: "normal" },
          { joint: "Ankle", angle: 92, normalRange: "85-95°", status: "normal" },
        ],
        formScore: 95,
        compensations: [],
        recommendations: [
          "Excellent form! Full knee extension achieved",
          "Good control throughout movement",
          "Ready to progress to next level",
        ],
      },
      Squat: {
        exerciseName: "Squat",
        timestamp: new Date().toISOString(),
        anglesMeasured: [
          { joint: "Hip", angle: 95, normalRange: "90-110°", status: "normal" },
          { joint: "Knee", angle: 88, normalRange: "80-100°", status: "normal" },
          { joint: "Ankle", angle: 68, normalRange: "60-80°", status: "normal" },
        ],
        formScore: 88,
        compensations: ["Knees tracking slightly medial", "Weight shifted forward on toes"],
        recommendations: [
          "Good depth! Keep knees aligned over toes",
          "Shift weight back to heels",
          "Maintain neutral spine position",
        ],
      },
    }

    return exercises[exercise] || exercises["Knee Extension"]
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          {/* Video Feed */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} width={1280} height={720} className="hidden" />

            {/* Real-time Overlay */}
            {isRecording && currentMetrics && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Skeleton overlay would go here in production */}
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                    <span>AI Analyzing Movement...</span>
                  </div>
                </div>

                {/* Form Score */}
                <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-3 rounded-lg">
                  <div className="text-xs text-gray-300 mb-1">Form Score</div>
                  <div className="text-3xl font-bold">{currentMetrics.formScore}%</div>
                </div>

                {/* Real-time Feedback */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white px-4 py-3 rounded-lg space-y-2">
                  {realtimeFeedback.map((feedback, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feedback}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isRecording && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Camera not active</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!isRecording ? (
              <Button onClick={startCamera} className="flex-1">
                <Video className="h-4 w-4 mr-2" />
                Start AI Analysis
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="destructive" className="flex-1">
                <VideoOff className="h-4 w-4 mr-2" />
                Stop & Save Analysis
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Analysis Results */}
      {currentMetrics && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Movement Analysis Results
          </h3>

          <div className="space-y-4">
            {/* Joint Angles */}
            <div>
              <div className="text-sm font-medium mb-2">Range of Motion</div>
              <div className="space-y-2">
                {currentMetrics.anglesMeasured.map((measurement, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{measurement.joint}</div>
                      <div className="text-xs text-gray-600">Normal: {measurement.normalRange}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{measurement.angle}°</span>
                      <Badge
                        variant={
                          measurement.status === "normal"
                            ? "default"
                            : measurement.status === "limited"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {measurement.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compensations */}
            {currentMetrics.compensations.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Compensatory Patterns</div>
                <div className="space-y-1">
                  {currentMetrics.compensations.map((comp, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-orange-700">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{comp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
