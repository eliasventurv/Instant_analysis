"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, RotateCcw, BarChart3, LineChart, PieChart, ScanText as Scatter } from "lucide-react"

interface AnalysisCardsProps {
  results: any[]
  selectedCharts: any[]
  onAddToDashboard: (chart: any) => void
  onViewDashboard: () => void
  onStartOver: () => void
}

const chartIcons = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  scatter: Scatter,
}

export function AnalysisCards({
  results,
  selectedCharts,
  onAddToDashboard,
  onViewDashboard,
  onStartOver,
}: AnalysisCardsProps) {
  const isChartSelected = (chart: any) => {
    return selectedCharts.some((selected) => selected.title === chart.title && selected.chart_type === chart.chart_type)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Analysis Suggestions</h2>
          <p className="text-muted-foreground">
            Our AI has identified {results.length} recommended visualizations for your data
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onStartOver}>
            <RotateCcw className="h-4 w-4 mr-2" />
            New analysis
          </Button>

          {selectedCharts.length > 0 && (
            <Button onClick={onViewDashboard}>
              <Eye className="h-4 w-4 mr-2" />
              View Dashboard ({selectedCharts.length})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((chart, index) => {
          const IconComponent = chartIcons[chart.chart_type as keyof typeof chartIcons] || BarChart3
          const isSelected = isChartSelected(chart)

          return (
            <Card key={index} className={`transition-all hover:shadow-lg ${isSelected ? "ring-2 ring-primary" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <Badge variant="secondary" className="text-xs">
                      {chart.chart_type}
                    </Badge>
                  </div>
                  {isSelected && (
                    <Badge variant="default" className="text-xs">
                      Added
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg leading-tight">{chart.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <p className="font-medium text-foreground mb-1">Analysis:</p>
                  <p>{chart.insight}</p>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium">X Axis:</span> {chart.parameters.x_axis}
                  </p>
                  <p>
                    <span className="font-medium">Y Axis:</span> {chart.parameters.y_axis}
                  </p>
                </div>

                <Button
                  onClick={() => onAddToDashboard(chart)}
                  disabled={isSelected}
                  className="w-full"
                  variant={isSelected ? "secondary" : "default"}
                >
                  {isSelected ? (
                    <>Added to Dashboard</>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Dashboard
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedCharts.length > 0 && (
        <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Dashboard ready to create</h3>
              <p className="text-sm text-muted-foreground">
                You have selected {selectedCharts.length} chart{selectedCharts.length !== 1 ? "s" : ""} for your
                dashboard
              </p>
            </div>
            <Button onClick={onViewDashboard} size="lg">
              <Eye className="h-4 w-4 mr-2" />
              View Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
