"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileUpload: (file: File) => void
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [error, setError] = useState<string>("")

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError("")

      if (rejectedFiles.length > 0) {
        setError("Please upload only .xlsx or .csv files")
        return
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          setError("File is too large. Maximum 10MB.")
          return
        }
        onFileUpload(file)
      }
    },
    [onFileUpload],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4">Turn your data into powerful insights</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload your Excel or CSV file and our AI will automatically analyze your data to suggest the best
          visualizations and create a professional dashboard in seconds.
        </p>
      </div>

      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={cn(
              "cursor-pointer text-center py-12 px-6 rounded-lg transition-colors",
              isDragActive ? "bg-primary/5 border-primary" : "hover:bg-muted/50",
            )}
          >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center gap-4">
              <Upload className="h-16 w-16 text-primary mx-auto" />

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {isDragActive ? "Drop your file here" : "Drag your file or click to select"}
                </h3>
                <p className="text-muted-foreground mb-4">Supported formats: .xlsx, .csv (maximum 10MB)</p>

                <Button variant="outline" size="lg" className="mt-2 bg-transparent">
                  Select file
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-primary-foreground font-bold">1</span>
          </div>
          <h4 className="font-semibold text-foreground mb-2">Upload your file</h4>
          <p className="text-sm text-muted-foreground">Drag and drop or select your Excel or CSV file</p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-secondary-foreground font-bold">2</span>
          </div>
          <h4 className="font-semibold text-foreground mb-2">AI analyzes</h4>
          <p className="text-sm text-muted-foreground">Our AI identifies patterns and suggests visualizations</p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-accent-foreground font-bold">3</span>
          </div>
          <h4 className="font-semibold text-foreground mb-2">Create dashboard</h4>
          <p className="text-sm text-muted-foreground">Select charts and build your interactive dashboard</p>
        </div>
      </div>
    </div>
  )
}
