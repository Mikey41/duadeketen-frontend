"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { QRScanner } from "@/components/qr-scanner"
import { AudioPlayer } from "@/components/audio-player"
import { ErrorBoundary } from "@/components/error-boundary"
import { ToastProvider, useToast } from "@/components/toast-provider"
import { ttsClient } from "@/lib/tts-client"
import { StoryDisplay } from "@/components/story-display"

interface TTSState {
  status: "idle" | "scanning" | "loading" | "success" | "error"
  text: string
  audioUrl: string | null
  isPlaying: boolean
  error: string | null
  scanProgress: { current: number; total: number; pageId?: string } | null
  pageData: { pageNumber: number; qrCodeUrl: string; audioUrl: string | null } | null
}

function TTSQRDemoContent() {
  const [ttsState, setTTSState] = useState<TTSState>({
    status: "idle",
    text: "",
    audioUrl: null,
    isPlaying: false,
    error: null,
    scanProgress: null,
    pageData: null,
  })

  const [manualText, setManualText] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [showTips, setShowTips] = useState(false)

  const { addToast } = useToast()

  useEffect(() => {
    if (ttsState.error) {
      const timer = setTimeout(() => {
        setTTSState((prev) => ({ ...prev, error: null }))
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [ttsState.error])

  const generateAudioForText = async (text: string) => {
    setTTSState((prev) => ({ ...prev, status: "loading", error: null }))

    try {
      if (ttsState.pageData?.audioUrl) {
        setTTSState((prev) => ({
          ...prev,
          status: "success",
          text,
          audioUrl: prev.pageData!.audioUrl,
          error: null,
        }))
        addToast({
          type: "success",
          title: "Audio ready",
          description: "Using pre-generated audio from server",
          duration: 3000,
        })
        return
      }

      const result = await ttsClient.generateAudio(text)

      if (result.success && result.audioUrl) {
        setTTSState((prev) => ({
          ...prev,
          status: "success",
          text,
          audioUrl: result.audioUrl!,
          error: null,
        }))
        addToast({
          type: "success",
          title: "Audio ready",
          description: "Your text has been converted to speech",
          duration: 3000,
        })
      } else {
        throw new Error(result.error || "Failed to generate audio")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate audio"
      setTTSState((prev) => ({
        ...prev,
        status: "error",
        error: errorMessage,
      }))
      addToast({
        type: "error",
        title: "Audio generation failed",
        description: errorMessage,
        duration: 5000,
      })
    }
  }

  const handleQRScanResult = async (
    text: string,
    isChunked: boolean,
    chunkInfo?: { current: number; total: number; pageId: string },
    pageData?: { pageNumber: number; qrCodeUrl: string; audioUrl: string | null },
  ) => {
    setManualText(text)

    if (pageData) {
      setTTSState((prev) => ({
        ...prev,
        pageData,
        scanProgress: null,
        text: text,
      }))
      addToast({
        type: "success",
        title: "Text scanned successfully",
        description: `Page ${pageData.pageNumber} text is ready. Click "Generate Audio" to create speech.`,
        duration: 4000,
      })
    } else if (isChunked && chunkInfo) {
      if (text) {
        setTTSState((prev) => ({
          ...prev,
          scanProgress: { current: chunkInfo.current, total: chunkInfo.total, pageId: chunkInfo.pageId },
          pageData: null,
          text: text,
        }))
        addToast({
          type: "success",
          title: "Multi-chunk text assembled",
          description: 'Text is ready. Click "Generate Audio" to create speech.',
          duration: 4000,
        })
      } else {
        setTTSState((prev) => ({
          ...prev,
          status: "scanning",
          scanProgress: { current: chunkInfo.current, total: chunkInfo.total, pageId: chunkInfo.pageId },
          error: null,
          pageData: null,
        }))
      }
    } else {
      setTTSState((prev) => ({ ...prev, pageData: null, text: text }))
      addToast({
        type: "success",
        title: "Text scanned successfully",
        description: 'Text is ready. Click "Generate Audio" to create speech.',
        duration: 4000,
      })
    }
  }

  const handleQRScanError = (error: string) => {
    setTTSState((prev) => ({
      ...prev,
      status: "error",
      error,
      scanProgress: null,
    }))
  }

  const handleScanningChange = (scanning: boolean) => {
    setIsScanning(scanning)
    if (scanning) {
      setTTSState((prev) => ({ ...prev, status: "scanning", error: null, scanProgress: null }))
    } else if (ttsState.status === "scanning" && !ttsState.text) {
      setTTSState((prev) => ({ ...prev, status: "idle" }))
    }
  }

  const handleGenerateAudio = async () => {
    if (!manualText.trim()) {
      addToast({
        type: "warning",
        title: "No text entered",
        description: "Please enter some text to generate audio",
        duration: 3000,
      })
      return
    }
    await generateAudioForText(manualText)
  }

  const handlePlayingChange = (playing: boolean) => {
    setTTSState((prev) => ({ ...prev, isPlaying: playing }))
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">TTS QR Book Demo</h1>
          <p className="text-muted-foreground text-lg text-pretty">
            Scan QR codes from your Ga-language book to hear the text read aloud
          </p>

          {/* Tips Toggle */}
          <Button variant="ghost" size="sm" onClick={() => setShowTips(!showTips)} className="mt-2">
            💡 {showTips ? "Hide Tips" : "Show Tips"}
          </Button>
        </div>

        {/* Tips Section */}
        {showTips && (
          <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-3 text-blue-900 dark:text-blue-100">How to use:</h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>
                  • <strong>Backend QR:</strong> Scan QR codes that contain JSON data from your Spring Boot backend
                </li>
                <li>
                  • <strong>Multi-chunk QR:</strong> Scan all QR codes for the same page in any order
                </li>
                <li>
                  • <strong>Manual text:</strong> Type or paste Ga text directly for immediate audio generation
                </li>
                <li>
                  • <strong>Audio controls:</strong> Use play/pause, volume, and speed controls once audio is ready
                </li>
                <li>
                  • <strong>Pre-generated audio:</strong> Backend may provide ready-made audio files for faster playback
                </li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Two-Panel Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - QR Scanner & Manual Input */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">📱 QR Scanner & Text Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ErrorBoundary>
                <QRScanner
                  onScanResult={handleQRScanResult}
                  onError={handleQRScanError}
                  isScanning={isScanning}
                  onScanningChange={handleScanningChange}
                />
              </ErrorBoundary>

              {/* Manual Text Input */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Or enter text manually:</label>
                  <Textarea
                    placeholder="Enter Ga text here..."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    className="min-h-32 resize-none"
                    maxLength={5000}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">{manualText.length}/5000 characters</span>
                    {manualText.length > 4500 && (
                      <Badge variant="warning" className="text-xs">
                        Approaching limit
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleGenerateAudio}
                  disabled={!manualText.trim() || ttsState.status === "loading"}
                  variant="secondary"
                  className="w-full"
                >
                  {ttsState.status === "loading" ? "Generating Audio..." : "Generate Audio"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Story Display & Audio Controls */}
          <div className="space-y-6">
            <StoryDisplay text={ttsState.text} pageData={ttsState.pageData} isLoading={ttsState.status === "loading"} />

            {/* Audio Controls Card */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  🔊 <h3 className="text-lg font-semibold text-foreground">Audio Playback</h3>
                </div>

                {/* Status Display */}
                {ttsState.status !== "idle" && (
                  <div className="mb-4 space-y-2">
                    <Badge
                      variant={
                        ttsState.status === "success"
                          ? "default"
                          : ttsState.status === "error"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {ttsState.status === "scanning" && "Scanning QR Code..."}
                      {ttsState.status === "loading" && "Generating Audio..."}
                      {ttsState.status === "success" && "Ready to Play"}
                      {ttsState.status === "error" && "Error"}
                    </Badge>
                    {ttsState.scanProgress && (
                      <Badge variant="outline" className="ml-2">
                        {ttsState.scanProgress.pageId ? `Page ${ttsState.scanProgress.pageId}: ` : ""}
                        {ttsState.scanProgress.current}/{ttsState.scanProgress.total} chunks
                      </Badge>
                    )}
                    {ttsState.error && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive font-medium">Error:</p>
                        <p className="text-sm text-destructive/80">{ttsState.error}</p>
                      </div>
                    )}
                  </div>
                )}

                <ErrorBoundary>
                  <AudioPlayer
                    audioUrl={ttsState.audioUrl}
                    isPlaying={ttsState.isPlaying}
                    onPlayingChange={handlePlayingChange}
                  />
                </ErrorBoundary>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TTSQRDemo() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <TTSQRDemoContent />
      </ToastProvider>
    </ErrorBoundary>
  )
}
