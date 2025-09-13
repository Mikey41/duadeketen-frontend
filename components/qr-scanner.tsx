"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "./loading-spinner"
import { useToast } from "./toast-provider"

interface QRScannerProps {
  onScanResult: (
    text: string,
    isChunked: boolean,
    chunkInfo?: { current: number; total: number; pageId: string },
    pageData?: { pageNumber: number; qrCodeUrl: string; audioUrl: string | null },
  ) => void
  onError: (error: string) => void
  isScanning: boolean
  onScanningChange: (scanning: boolean) => void
}

interface BackendPageData {
  pageNumber: number
  gaText: string
  qrCodeUrl: string
  audioUrl: string | null
}

interface ChunkData {
  pageId: string
  current: number
  total: number
  text: string
}

export function QRScanner({ onScanResult, onError, isScanning, onScanningChange }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const chunkTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const qrScannerRef = useRef<any>(null)

  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [chunks, setChunks] = useState<Map<string, ChunkData>>(new Map())
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline">("online")
  const [lastScanTime, setLastScanTime] = useState<number>(0)
  const [isQRScannerLoading, setIsQRScannerLoading] = useState(false)

  const { addToast } = useToast()

  useEffect(() => {
    const handleOnline = () => setConnectionStatus("online")
    const handleOffline = () => setConnectionStatus("offline")

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setConnectionStatus(navigator.onLine ? "online" : "offline")

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    const loadQRScanner = async () => {
      try {
        setIsQRScannerLoading(true)
        const QrScanner = (await import("qr-scanner")).default
        qrScannerRef.current = QrScanner
        console.log("[v0] QR Scanner library loaded successfully")
      } catch (error) {
        console.error("[v0] Failed to load QR scanner library:", error)
        console.log("[v0] Falling back to demo mode")
      } finally {
        setIsQRScannerLoading(false)
      }
    }

    loadQRScanner()
  }, [])

  const parseQRContent = (
    content: string,
  ): { isChunked: boolean; data: ChunkData | null; pageNumber: number | null } => {
    console.log("[v0] Parsing QR content:", content)

    if (typeof content !== "string") {
      console.log("[v0] Content is not a string, converting:", typeof content)
      content = String(content)
    }

    // Try to parse as JSON first (Spring Boot backend response)
    try {
      const jsonData = JSON.parse(content) as BackendPageData
      if (jsonData.pageNumber && jsonData.gaText) {
        console.log("[v0] Detected JSON QR code with page:", jsonData.pageNumber)
        return {
          isChunked: false,
          data: null,
          pageNumber: jsonData.pageNumber,
        }
      }
    } catch {
      // Not JSON, continue with chunk parsing
    }

    // Try to parse as page number first (for backend API call)
    const pageMatch = content.match(/page[_-]?(\d+)/i)
    if (pageMatch) {
      const pageNumber = Number.parseInt(pageMatch[1])
      console.log("[v0] Detected page number QR code:", pageNumber)
      return {
        isChunked: false,
        data: null,
        pageNumber,
      }
    }

    const numberMatch = content.match(/^\d+$/)
    if (numberMatch) {
      const pageNumber = Number.parseInt(content)
      console.log("[v0] Detected plain number QR code:", pageNumber)
      return {
        isChunked: false,
        data: null,
        pageNumber,
      }
    }

    // Parse chunked QR format
    const chunkMatch = content.match(/^GANPAGE\/ID:([^;]+);CHUNK:(\d+)\/(\d+);(.*)$/s)

    if (chunkMatch) {
      const [, pageId, current, total, text] = chunkMatch
      console.log("[v0] Detected chunked QR code:", { pageId, current, total })
      return {
        isChunked: true,
        data: {
          pageId,
          current: Number.parseInt(current),
          total: Number.parseInt(total),
          text,
        },
        pageNumber: null,
      }
    }

    console.log("[v0] Treating as plain text QR code")
    return { isChunked: false, data: null, pageNumber: null }
  }

  const assembleChunks = (pageId: string, chunksMap: Map<string, ChunkData>): string | null => {
    const pageChunks = Array.from(chunksMap.values()).filter((chunk) => chunk.pageId === pageId)

    if (pageChunks.length === 0) return null

    const totalExpected = pageChunks[0].total
    if (pageChunks.length !== totalExpected) return null

    pageChunks.sort((a, b) => a.current - b.current)
    return pageChunks.map((chunk) => chunk.text).join("")
  }

  const detectQRCode = async (): Promise<string | null> => {
    const now = Date.now()
    if (now - lastScanTime < 500) return null
    setLastScanTime(now)

    if (!videoRef.current || !canvasRef.current || !qrScannerRef.current) {
      console.log("[v0] Missing refs for QR detection")
      return null
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
        console.log("[v0] Video not ready:", { videoWidth: video.videoWidth, videoHeight: video.videoHeight })
        return null
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const result = await qrScannerRef.current.scanImage(canvas, { returnDetailedScanResult: false })

      console.log("[v0] QR scan result:", result)

      if (result && typeof result === "object" && "data" in result) {
        console.log("[v0] Extracting data from scan result:", result.data)
        return result.data
      }

      return result
    } catch (error) {
      if (error && typeof error === "object" && "message" in error && !error.message.includes("No QR code found")) {
        console.log("[v0] QR scan error:", error)
      }
      return null
    }
  }

  const startCamera = async () => {
    setIsInitializing(true)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setHasPermission(true)
      addToast({
        type: "success",
        title: "Camera ready",
        description: "Position QR codes within the frame to scan",
        duration: 3000,
      })
      return true
    } catch (error) {
      console.error("Camera access error:", error)
      setHasPermission(false)

      let errorMessage = "Camera access denied. Please allow camera permissions."
      if (error instanceof Error) {
        if (error.name === "NotFoundError") {
          errorMessage = "No camera found on this device."
        } else if (error.name === "NotAllowedError") {
          errorMessage = "Camera permission denied. Please enable camera access in your browser settings."
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application."
        }
      }

      onError(errorMessage)
      addToast({
        type: "error",
        title: "Camera Error",
        description: errorMessage,
        duration: 5000,
      })
      return false
    } finally {
      setIsInitializing(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (chunkTimeoutRef.current) {
      clearTimeout(chunkTimeoutRef.current)
      chunkTimeoutRef.current = null
    }
  }

  const fetchPageData = async (pageNumber: number): Promise<BackendPageData | null> => {
    try {
      const response = await fetch(`https://duadeketen-stories.onrender.com/api/stories/page/${pageNumber}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch page data: ${response.status}`)
      }
      const data = await response.json()
      console.log("[v0] Backend response:", data)
      return data
    } catch (error) {
      console.error("[v0] Backend fetch error:", error)
      addToast({
        type: "error",
        title: "Backend Error",
        description: `Failed to fetch page ${pageNumber} data from server`,
        duration: 5000,
      })
      return null
    }
  }

  const startScanning = async () => {
    if (!qrScannerRef.current) {
      addToast({
        type: "warning",
        title: "QR Scanner Loading",
        description: "QR scanner is still loading. Please try again in a moment.",
        duration: 3000,
      })
      return
    }

    if (connectionStatus === "offline") {
      addToast({
        type: "warning",
        title: "No internet connection",
        description: "QR scanning works offline, but audio generation requires internet.",
        duration: 4000,
      })
    }

    const cameraStarted = await startCamera()
    if (!cameraStarted) return

    onScanningChange(true)
    setChunks(new Map())
    setCurrentPageId(null)

    scanIntervalRef.current = setInterval(async () => {
      const qrContent = await detectQRCode()

      if (qrContent) {
        console.log("[v0] QR content scanned:", qrContent)
        const { isChunked, data, pageNumber } = parseQRContent(qrContent)

        if (pageNumber) {
          // Fetch data from Spring Boot backend
          addToast({
            type: "info",
            title: "QR code detected",
            description: `Fetching page ${pageNumber} data from server...`,
            duration: 3000,
          })

          const backendData = await fetchPageData(pageNumber)
          if (backendData) {
            addToast({
              type: "success",
              title: "Page data loaded",
              description: `Page ${backendData.pageNumber} - Text ready for audio generation`,
              duration: 3000,
            })
            onScanResult(backendData.gaText, false, undefined, {
              pageNumber: backendData.pageNumber,
              qrCodeUrl: backendData.qrCodeUrl,
              audioUrl: backendData.audioUrl,
            })
            stopScanning()
          }
        } else if (isChunked && data) {
          // Handle chunked QR codes (existing logic)
          const newChunks = new Map(chunks)
          const chunkKey = `${data.pageId}-${data.current}`

          if (newChunks.has(chunkKey)) return

          newChunks.set(chunkKey, data)
          setChunks(newChunks)
          setCurrentPageId(data.pageId)

          if (chunkTimeoutRef.current) {
            clearTimeout(chunkTimeoutRef.current)
          }
          chunkTimeoutRef.current = setTimeout(() => {
            const pageChunks = Array.from(newChunks.values()).filter((chunk) => chunk.pageId === data.pageId)
            if (pageChunks.length < data.total) {
              addToast({
                type: "warning",
                title: "Incomplete scan",
                description: `Missing ${data.total - pageChunks.length} chunks. Try scanning the missing QR codes.`,
                duration: 5000,
              })
            }
          }, 10000)

          const completeText = assembleChunks(data.pageId, newChunks)
          if (completeText) {
            addToast({
              type: "success",
              title: "Scan complete",
              description: `Successfully scanned all ${data.total} chunks`,
              duration: 3000,
            })
            onScanResult(completeText, true, {
              current: data.total,
              total: data.total,
              pageId: data.pageId,
            })
            stopScanning()
          } else {
            const pageChunks = Array.from(newChunks.values()).filter((chunk) => chunk.pageId === data.pageId)
            onScanResult("", true, {
              current: pageChunks.length,
              total: data.total,
              pageId: data.pageId,
            })
          }
        } else {
          console.log("[v0] Processing plain text QR code:", qrContent)
          addToast({
            type: "success",
            title: "QR code scanned",
            description: "Text ready for audio generation",
            duration: 3000,
          })
          onScanResult(qrContent, false)
          stopScanning()
        }
      }
    }, 1000) // Reduced interval to 1000ms for more responsive scanning
  }

  const stopScanning = () => {
    onScanningChange(false)
    stopCamera()
  }

  const resetScanner = () => {
    if (chunks.size > 0) {
      addToast({
        type: "info",
        title: "Scanner reset",
        description: "Cleared all scanned chunks. Ready for new scan.",
        duration: 3000,
      })
    }
    stopScanning()
    setChunks(new Map())
    setCurrentPageId(null)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  if (isQRScannerLoading) {
    return (
      <div className="space-y-4">
        <div className="relative bg-card border-2 border-dashed border-border rounded-lg overflow-hidden h-64 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading QR scanner..." />
        </div>
      </div>
    )
  }

  const currentChunks = currentPageId
    ? Array.from(chunks.values()).filter((chunk) => chunk.pageId === currentPageId)
    : []

  return (
    <div className="space-y-4">
      {connectionStatus === "offline" && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <span className="text-yellow-600">📶</span>
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            Offline mode - Audio generation unavailable
          </span>
        </div>
      )}

      <div className="relative bg-card border-2 border-dashed border-border rounded-lg overflow-hidden">
        <video ref={videoRef} className="w-full h-64 object-cover bg-muted" playsInline muted />
        <canvas ref={canvasRef} className="hidden" width="640" height="480" />

        {isScanning && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <div className="bg-background/90 rounded-lg p-4 text-center">
              <div className="animate-pulse text-primary mb-2">
                <span className="text-2xl">📷</span>
              </div>
              <p className="text-sm font-medium">Scanning for QR codes...</p>
              {currentChunks.length > 0 && (
                <Badge variant="secondary" className="mt-2">
                  Found {currentChunks.length} of {currentChunks[0]?.total || 0} chunks
                </Badge>
              )}
            </div>
          </div>
        )}

        {isInitializing && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Initializing camera..." />
          </div>
        )}

        {hasPermission === false && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-center p-4">
              <span className="text-4xl mb-2 block">📷❌</span>
              <p className="text-sm text-muted-foreground mb-2">Camera access required</p>
              <Button onClick={startCamera} size="sm" variant="outline">
                <span className="mr-2">📷</span>
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={isScanning ? stopScanning : startScanning}
          disabled={hasPermission === false || isInitializing || isQRScannerLoading}
          className="flex-1"
        >
          {isInitializing ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Initializing...
            </>
          ) : isScanning ? (
            <>
              <span className="mr-2">📷❌</span>
              Stop Scanning
            </>
          ) : (
            <>
              <span className="mr-2">📷</span>
              Start Scanning
            </>
          )}
        </Button>

        {(chunks.size > 0 || currentPageId) && (
          <Button onClick={resetScanner} variant="outline" size="icon">
            <span>🔄</span>
          </Button>
        )}
      </div>

      {currentChunks.length > 0 && (
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Scanning Progress:</h4>
            <Badge variant="outline">Page {currentPageId}</Badge>
          </div>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {Array.from({ length: currentChunks[0]?.total || 0 }, (_, i) => {
              const chunkNum = i + 1
              const hasChunk = currentChunks.some((chunk) => chunk.current === chunkNum)
              return (
                <div
                  key={i}
                  className={`h-8 rounded flex items-center justify-center text-xs font-medium ${
                    hasChunk ? "bg-primary text-primary-foreground" : "bg-border text-muted-foreground"
                  }`}
                >
                  {chunkNum}
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Scanned</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-border" />
              <span>Missing</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
