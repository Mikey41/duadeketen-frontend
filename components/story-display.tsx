"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface StoryDisplayProps {
  text: string
  pageData?: {
    pageNumber: number
    qrCodeUrl: string
    audioUrl: string | null
  } | null
  isLoading?: boolean
  showManualInput?: boolean
}

export function StoryDisplay({ text, pageData, isLoading = false, showManualInput = true }: StoryDisplayProps) {
  const wordCount = text ? text.split(/\s+/).filter((word) => word.length > 0).length : 0
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200)) // Average reading speed

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!text) {
    return (
      <Card className="h-full border-dashed border-2 border-muted-foreground/20">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-96">
          <div className="text-6xl mb-4">📖</div>
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No story loaded</h3>
          <p className="text-sm text-muted-foreground/80 max-w-sm">
            {showManualInput
              ? "Scan a QR code from your Ga-language book or enter text manually to begin reading"
              : "Story content could not be loaded"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full shadow-lg">
      <CardContent className="p-0">
        {/* Story Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              📖{" "}
              <h2 className="text-xl font-bold text-foreground">
                {pageData ? `Page ${pageData.pageNumber}` : "Story Text"}
              </h2>
            </div>
            {pageData?.qrCodeUrl && (
              <Button variant="ghost" size="sm" asChild>
                <a href={pageData.qrCodeUrl} target="_blank" rel="noopener noreferrer">
                  🔗
                </a>
              </Button>
            )}
          </div>

          {/* Story Metadata */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-background/50">
              📝 {text.length} characters
            </Badge>
            <Badge variant="outline" className="bg-background/50">
              ⏱️ ~{estimatedReadTime} min read
            </Badge>
            {pageData?.audioUrl && (
              <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
                Pre-recorded audio
              </Badge>
            )}
          </div>
        </div>

        {/* Story Content */}
        <div className="p-8">
          <div className="prose prose-lg max-w-none">
            <div className="bg-card rounded-lg p-6 shadow-sm border border-border/50">
              <p className="text-foreground leading-relaxed text-lg font-medium text-pretty whitespace-pre-wrap">
                {text}
              </p>
            </div>
          </div>

          {/* QR Code Preview */}
          {pageData?.qrCodeUrl && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Source QR Code:</h4>
              <div className="flex justify-center">
                <img
                  src={pageData.qrCodeUrl || "/placeholder.svg"}
                  alt={`QR code for page ${pageData.pageNumber}`}
                  className="w-20 h-20 object-contain bg-white rounded border shadow-sm"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
