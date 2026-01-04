"use client"

import { useState, useRef } from "react"
import { Mic } from "lucide-react"
import { useCarMode } from "./car-mode-provider"
import { ActiveRecordingOverlay } from "./active-recording-overlay"

interface VoiceButtonProps {
  onFinished: (blob: Blob, liveTranscript: string) => void
  disabled?: boolean
}

const speak = (text: string) => {
  if (!("speechSynthesis" in window)) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "nb-NO"
  utterance.rate = 0.95
  utterance.pitch = 1
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export function VoiceButton({ onFinished, disabled }: VoiceButtonProps) {
  const [recording, setRecording] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState("")
  const { carMode = true } = useCarMode()
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)
  const liveTranscriptRef = useRef<string>("")

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
        console.log("[v0] 📦 Calling onFinished with blob and liveTranscript:", liveTranscriptRef.current)
        onFinished(blob, liveTranscriptRef.current)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      console.log("[v0] 🎤 MediaRecorder.start() called, state:", mediaRecorder.state)

      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

        const recognition = new SpeechRecognition()
        recognition.lang = "nb-NO"
        recognition.interimResults = true
        recognition.continuous = true

        recognition.onresult = (event: any) => {
          let interim = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            interim += event.results[i][0].transcript
          }
          setLiveTranscript(interim)
          liveTranscriptRef.current = interim
          console.log("[v0] 🗣️ Live transcript:", interim)
        }

        recognition.onerror = (event: any) => {
          console.error("[v0] ❌ SpeechRecognition error:", event.error)
        }

        recognition.start()
        recognitionRef.current = recognition
        console.log("[v0] 🗣️ SpeechRecognition started")
      }

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

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
      console.log("[v0] 🗣️ SpeechRecognition stopped")
    }
    setLiveTranscript("")

    speak("Takk")

    if (navigator.vibrate) navigator.vibrate([80, 80])
    setRecording(false)
  }

  const handleClick = () => {
    console.log("[v0] 🖱️ Click, disabled:", disabled, "recording:", recording)
    if (disabled) return

    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <>
      {recording && <ActiveRecordingOverlay transcript={liveTranscript} onStop={stopRecording} />}

      <button
        onClick={handleClick}
        disabled={disabled}
        className={`fixed bottom-6 right-6 z-50
          flex flex-col items-center justify-center
          rounded-full shadow-2xl transition-all active:scale-95
          ${recording ? "bg-red-700 animate-pulse" : "bg-red-600"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          h-28 w-28`}
        aria-label={recording ? "Avslutt logging" : "Start logging"}
      >
        <Mic className="h-12 w-12 text-white" />

        <span className="text-sm font-bold text-white mt-1">{recording ? "AVSLUTT" : "START"}</span>
      </button>
    </>
  )
}
