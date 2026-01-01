"use client"

import { useState, useRef } from "react"
import { Mic } from "lucide-react"
import { useCarMode } from "./car-mode-provider"

interface VoiceButtonProps {
  onFinished: (blob: Blob) => void
  disabled?: boolean
}

const speak = (text: string) => {
  if (!("speechSynthesis" in window)) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "nb-NO"
  utterance.rate = 0.95
  utterance.pitch = 1
  window.speechSynthesis.cancel() // prevent overlap
  window.speechSynthesis.speak(utterance)
}

export function VoiceButton({ onFinished, disabled }: VoiceButtonProps) {
  const [recording, setRecording] = useState(false)
  const { carMode = true } = useCarMode()
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const pressTimer = useRef<NodeJS.Timeout | null>(null)

  console.log("[v0] 🎛️ VoiceButton render, carMode:", carMode, "disabled:", disabled)

  const startRecording = async () => {
    console.log("[v0] 🎤 startRecording called")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("[v0] 🎤 Got media stream")

      const mimeType = "audio/webm;codecs=opus"
      const supported = MediaRecorder.isTypeSupported(mimeType)
      console.log("[v0] 🎤 Codec support for", mimeType, ":", supported)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supported ? mimeType : undefined,
      })
      console.log("[v0] 🎤 MediaRecorder created, state:", mediaRecorder.state)

      mediaRef.current = mediaRecorder
      chunks.current = []

      mediaRecorder.ondataavailable = (e) => {
        console.log("[v0] 🎤 Data available, size:", e.data.size)
        chunks.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        console.log("[v0] 🎧 Recording stopped, chunks:", chunks.current.length)
        const blob = new Blob(chunks.current, { type: supported ? mimeType : "audio/webm" })
        console.log("[v0] 🎧 Audio blob created, size:", blob.size, "type:", blob.type)
        console.log("[v0] 📦 Calling onFinished with blob")
        onFinished(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      console.log("[v0] 🎤 MediaRecorder.start() called, state:", mediaRecorder.state)

      speak("Jeg hører deg")

      if (navigator.vibrate) navigator.vibrate(100)
      setRecording(true)
    } catch (error) {
      console.error("[v0] ❌ Recording error:", error)
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    }
  }

  const stopRecording = () => {
    console.log("[v0] 🛑 stopRecording called")
    mediaRef.current?.stop()

    speak("Takk")

    if (navigator.vibrate) navigator.vibrate([80, 80])
    setRecording(false)
  }

  const handleTouchStart = () => {
    console.log("[v0] 👆 Touch start, disabled:", disabled)
    if (disabled) return
    console.log("[v0] ⏱️ Starting 300ms timer")
    pressTimer.current = setTimeout(startRecording, 300)
  }

  const handleTouchEnd = () => {
    console.log("[v0] 👆 Touch end, timer:", !!pressTimer.current, "recording:", recording)
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    if (recording) stopRecording()
  }

  // The parent component should control whether to render VoiceButton based on context

  return (
    <button
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      disabled={disabled}
      className={`fixed bottom-6 right-6 z-50
        flex flex-col items-center justify-center
        rounded-full shadow-2xl transition-all active:scale-95
        ${recording ? "bg-red-700 scale-110 animate-pulse" : "bg-red-600"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        h-28 w-28`}
      aria-label={recording ? "Lytter" : "Hold for å snakke"}
    >
      <Mic className="h-12 w-12 text-white mb-1" />

      <span className="text-sm font-semibold text-white">{recording ? "Lytter …" : "VOICE"}</span>
    </button>
  )
}
