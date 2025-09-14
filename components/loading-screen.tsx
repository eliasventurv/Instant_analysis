"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Brain, Zap, BarChart3 } from "lucide-react"

interface LoadingScreenProps {
  fileName: string
}

export function LoadingScreen({ fileName }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { icon: Brain, text: "Processing file...", duration: 2000 },
    { icon: Zap, text: "Analyzing data with AI...", duration: 3000 },
    { icon: BarChart3, text: "Generating suggestions...", duration: 2000 },
  ]

  useEffect(() => {
    let totalDuration = 0
    let currentDuration = 0

    steps.forEach((step, index) => {
      totalDuration += step.duration

      setTimeout(() => {
        setCurrentStep(index)
      }, currentDuration)

      currentDuration += step.duration
    })

    // Progress animation - stops at 90% until real response
    const interval = setInterval(() => {
      setProgress((prev) => {
        const increment = 90 / (totalDuration / 100)
        return Math.min(prev + increment, 90)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const CurrentIcon = steps[currentStep]?.icon || Brain

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrentIcon className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-primary/20 rounded-full animate-spin mx-auto"></div>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">Analyzing your data</h2>
            <p className="text-muted-foreground mb-2">
              File: <span className="font-medium text-foreground">{fileName}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">{steps[currentStep]?.text || "Processing..."}</p>

            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-muted-foreground">{Math.round(progress)}% completed</p>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ⏳ Our AI is identifying the most interesting patterns in your data...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
