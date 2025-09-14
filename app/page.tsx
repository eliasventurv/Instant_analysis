"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { AnalysisCards } from "@/components/analysis-cards"
import { Dashboard } from "@/components/dashboard"
import { LoadingScreen } from "@/components/loading-screen"
import { Brain, BarChart3 } from "lucide-react"

export default function Home() {
  const [currentStep, setCurrentStep] = useState<"upload" | "loading" | "analysis" | "dashboard">("upload")
  const [analysisResults, setAnalysisResults] = useState<any[]>([])
  const [selectedCharts, setSelectedCharts] = useState<any[]>([])
  const [fileName, setFileName] = useState<string>("")

  const handleFileUpload = async (file: File) => {
    setFileName(file.name)
    setCurrentStep("loading")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const results = await response.json()
      setAnalysisResults(results)
      setCurrentStep("analysis")
    } catch (error) {
      console.error("Error:", error)
      alert(`Error analyzing file: ${error instanceof Error ? error.message : "Unknown error"}`)
      setCurrentStep("upload")
    }
  }

  const handleAddToDashboard = (chart: any) => {
    setSelectedCharts((prev) => [...prev, chart])
  }

  const handleViewDashboard = () => {
    setCurrentStep("dashboard")
  }

  const handleBackToAnalysis = () => {
    setCurrentStep("analysis")
  }

  const handleStartOver = () => {
    setCurrentStep("upload")
    setAnalysisResults([])
    setSelectedCharts([])
    setFileName("")
  }

  const handleDeleteChart = (chartIndex: number) => {
    setSelectedCharts((prev) => prev.filter((_, index) => index !== chartIndex))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <BarChart3 className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Instant Analysis</h1>
              <p className="text-sm text-muted-foreground">AI Dashboard Creator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentStep === "upload" && <FileUpload onFileUpload={handleFileUpload} />}

        {currentStep === "loading" && <LoadingScreen fileName={fileName} />}

        {currentStep === "analysis" && (
          <AnalysisCards
            results={analysisResults}
            selectedCharts={selectedCharts}
            onAddToDashboard={handleAddToDashboard}
            onViewDashboard={handleViewDashboard}
            onStartOver={handleStartOver}
          />
        )}

        {currentStep === "dashboard" && (
          <Dashboard
            charts={selectedCharts}
            onBackToAnalysis={handleBackToAnalysis}
            onStartOver={handleStartOver}
            onDeleteChart={handleDeleteChart}
          />
        )}
      </main>
    </div>
  )
}
