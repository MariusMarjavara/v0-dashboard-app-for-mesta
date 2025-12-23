"use client"

import { useState, useRef } from "react"
import { Mic } from "lucide-react"
import { useCarMode } from "./car-mode-provider"

interface VoiceButtonProps {
  onFinished: (blob: Blob) => void
  disabled?: boolean
}

export function VoiceButton({ onFinished, disabled }: VoiceButtonProps) {
  const [recording, setRecording] = useState(false)
  const { carMode } = useCarMode()
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const pressTimer = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRef.current = mediaRecorder
      chunks.current = []

      mediaRecorder.ondataavailable = (e) => chunks.current.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" })
        onFinished(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      if (navigator.vibrate) navigator.vibrate(100)
      setRecording(true)
    } catch (error) {
      console.error("[v0] Failed to start recording:", error)
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    if (navigator.vibrate) navigator.vibrate([80, 80])
    setRecording(false)
  }

  const handleTouchStart = () => {
    if (disabled) return
    pressTimer.current = setTimeout(startRecording, 600)
  }

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    if (recording) stopRecording()
  }

  if (!carMode) return null

  return (
    <button
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      disabled={disabled}
      className={`fixed bottom-6 right-6 z-50 h-24 w-24 rounded-full 
        ${recording ? "bg-red-700 animate-pulse" : "bg-red-600"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        flex items-center justify-center shadow-2xl transition-all active:scale-95`}
      aria-label="Hold for å starte taleopptak"
    >
      <Mic className={`h-12 w-12 text-white ${recording ? "animate-bounce" : ""}`} />
    </button>
  )
}
