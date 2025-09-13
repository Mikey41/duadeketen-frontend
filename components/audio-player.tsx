"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

interface AudioPlayerProps {
  audioUrl: string | null
  isPlaying: boolean
  onPlayingChange: (playing: boolean) => void
  className?: string
}

export function AudioPlayer({ audioUrl, isPlaying, onPlayingChange, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  // Update audio element when URL changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      setIsLoading(true)
      audioRef.current.src = audioUrl
      audioRef.current.load()
    }
  }, [audioUrl])

  // Handle play/pause state changes
  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Audio play failed:", error)
        onPlayingChange(false)
      })
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, onPlayingChange])

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      onPlayingChange(false)
      setCurrentTime(0)
    }

    const handleLoadStart = () => {
      setIsLoading(true)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    const handleError = () => {
      setIsLoading(false)
      onPlayingChange(false)
      console.error("Audio playback error")
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("error", handleError)
    }
  }, [onPlayingChange])

  // Update volume and mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  const handleSeek = (value: number[]) => {
    if (audioRef.current && duration > 0) {
      const newTime = (value[0] / 100) * duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100)
    setIsMuted(false)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
    }
  }

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds))
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time: number): string => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!audioUrl) {
    return (
      <div className={`bg-muted rounded-lg p-4 text-center ${className}`}>
        <p className="text-sm text-muted-foreground">No audio available</p>
      </div>
    )
  }

  return (
    <div className={`bg-card border rounded-lg p-4 space-y-4 ${className}`}>
      <audio ref={audioRef} preload="metadata" />

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <Slider
          value={[progressPercentage]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="w-full"
          disabled={!audioUrl || duration === 0}
        />
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button onClick={() => handleSkip(-10)} disabled={!audioUrl || duration === 0} size="sm" variant="outline">
          <span>⏪</span>
        </Button>

        <Button onClick={handleRestart} disabled={!audioUrl || duration === 0} size="sm" variant="outline">
          <span>🔄</span>
        </Button>

        <Button
          onClick={() => onPlayingChange(!isPlaying)}
          disabled={!audioUrl || isLoading}
          size="lg"
          className="h-12 w-12 rounded-full"
        >
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : isPlaying ? (
            <span className="text-lg">⏸️</span>
          ) : (
            <span className="text-lg">▶️</span>
          )}
        </Button>

        <Button onClick={() => handleSkip(10)} disabled={!audioUrl || duration === 0} size="sm" variant="outline">
          <span>⏩</span>
        </Button>

        <Button onClick={toggleMute} disabled={!audioUrl} size="sm" variant="outline">
          {isMuted ? <span>🔇</span> : <span>🔊</span>}
        </Button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center gap-4">
        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-muted-foreground">🔊</span>
          <Slider
            value={[isMuted ? 0 : volume * 100]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8">{Math.round(isMuted ? 0 : volume * 100)}%</span>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Speed:</span>
          <div className="flex gap-1">
            {[0.75, 1, 1.25, 1.5].map((rate) => (
              <Button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                size="sm"
                variant={playbackRate === rate ? "default" : "outline"}
                className="h-6 px-2 text-xs"
              >
                {rate}x
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLoading && <Badge variant="secondary">Loading...</Badge>}
          {isPlaying && <Badge variant="default">Playing</Badge>}
          {playbackRate !== 1 && <Badge variant="outline">{playbackRate}x speed</Badge>}
        </div>
      </div>
    </div>
  )
}
