import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

async function callPythonAnalysis(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const arrayBuffer = file.arrayBuffer()

    arrayBuffer
      .then((buffer) => {
        const tempFilePath = path.join(process.cwd(), "temp", file.name)

        // Ensure temp directory exists
        const tempDir = path.dirname(tempFilePath)
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true })
        }

        // Write file to temp location
        fs.writeFileSync(tempFilePath, Buffer.from(buffer))

        // Call Python script with the file path as argument
        console.log("[v0] Calling Python script with file:", tempFilePath)
        const pythonProcess = spawn("python", [path.join(process.cwd(), "lib", "data-analysis.py"), tempFilePath])

        let output = ""
        let errorOutput = ""

        pythonProcess.stdout.on("data", (data) => {
          const chunk = data.toString()
          console.log("[v0] Python stdout:", chunk)
          output += chunk
        })

        pythonProcess.stderr.on("data", (data) => {
          const chunk = data.toString()
          console.log("[v0] Python stderr:", chunk)
          errorOutput += chunk
        })

        pythonProcess.on("close", (code) => {
          console.log("[v0] Python process closed with code:", code)

          // Clean up temp file
          try {
            fs.unlinkSync(tempFilePath)
          } catch (e) {
            console.warn("Could not delete temp file:", e)
          }

          if (code !== 0) {
            console.error("[v0] Python script failed. Error output:", errorOutput)
            reject(new Error(`Python script failed with code ${code}: ${errorOutput}`))
            return
          }

          try {
            // PandasAI outputs console messages before the actual JSON response
            const lines = output.trim().split("\n")
            console.log("[v0] Python output lines:", lines)

            // Find where JSON starts (skip console output with hourglass emoji and timing info)
            let jsonStartIndex = -1
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim()
              if (line.startsWith("[") || line.startsWith("{")) {
                jsonStartIndex = i
                break
              }
            }

            if (jsonStartIndex === -1) {
              console.error("[v0] No JSON found in Python output:", output)
              reject(new Error("No JSON found in Python output. Output was: " + output))
              return
            }

            const jsonOutput = lines.slice(jsonStartIndex).join("\n")
            console.log("[v0] Extracted JSON:", jsonOutput)

            const results = JSON.parse(jsonOutput)
            console.log("[v0] Parsed results:", results)
            resolve(results)
          } catch (error) {
            console.error("[v0] Failed to parse Python output:", error)
            reject(new Error(`Failed to parse Python output: ${error}. Raw output: ${output}`))
          }
        })

        pythonProcess.on("error", (error) => {
          console.error("[v0] Failed to start Python process:", error)
          reject(new Error(`Failed to start Python process: ${error.message}`))
        })
      })
      .catch(reject)
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no válido. Solo se permiten archivos .csv, .xlsx y .xls" },
        { status: 400 },
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo es demasiado grande. Máximo 10MB." }, { status: 400 })
    }

    const results = await callPythonAnalysis(file)

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error processing file:", error)
    return NextResponse.json(
      {
        error: "Error al procesar el archivo: " + (error as Error).message,
      },
      { status: 500 },
    )
  }
}
