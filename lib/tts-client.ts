interface TTSResponse {
  success: boolean
  audioUrl?: string
  error?: string
}

export class TTSClient {
  private static instance: TTSClient
  private audioCache = new Map<string, string>()

  static getInstance(): TTSClient {
    if (!TTSClient.instance) {
      TTSClient.instance = new TTSClient()
    }
    return TTSClient.instance
  }

  async generateAudio(text: string): Promise<TTSResponse> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(text)
      if (this.audioCache.has(cacheKey)) {
        return {
          success: true,
          audioUrl: this.audioCache.get(cacheKey)!,
        }
      }

      // Validate input
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: "Text cannot be empty",
        }
      }

      if (text.length > 5000) {
        return {
          success: false,
          error: "Text too long. Maximum 5000 characters allowed.",
        }
      }

      // Call TTS API
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      // Convert response to blob URL
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      // Cache the result
      this.audioCache.set(cacheKey, audioUrl)

      // Clean up old cache entries (keep last 10)
      if (this.audioCache.size > 10) {
        const firstKey = this.audioCache.keys().next().value
        const oldUrl = this.audioCache.get(firstKey)
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl)
        }
        this.audioCache.delete(firstKey)
      }

      return {
        success: true,
        audioUrl,
      }
    } catch (error) {
      console.error("TTS client error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error occurred",
      }
    }
  }

  private getCacheKey(text: string): string {
    // Simple hash function for caching
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  // Clean up method to revoke blob URLs
  cleanup(): void {
    for (const url of this.audioCache.values()) {
      URL.revokeObjectURL(url)
    }
    this.audioCache.clear()
  }
}

// Export singleton instance
export const ttsClient = TTSClient.getInstance()
