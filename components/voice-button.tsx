"use client"

import { useState, useRef } from "react"
import { Mic } from "lucide-react"
import { useCarMode } from "./car-mode-provider"
import { ActiveRecordingOverlay } from "./active-recording-overlay"
import { speak, systemIsSpeaking } from "@/lib/voice/tts"

interface VoiceButtonProps {
  onFinished: (blob: Blob, liveTranscript: string) => void
  disabled?: boolean
}

function isIOSBrowser(): boolean {
  if (typeof window === "undefined") return false
  const ua = window.navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua) || (ua.includes("mac") && "ontouchend" in document)
}

export function VoiceButton({ onFinished, disabled }: VoiceButtonProps) {
  const [recording, setRecording] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState("")
  const [debugInfo, setDebugInfo] = useState<string>("")
  const { carMode = true } = useCarMode()
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef<string>("")
  const interimTranscriptRef = useRef<string>("")
  const isIOS = useRef(isIOSBrowser())

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      console.log("[ANDROID DEBUG] getUserMedia successful, stream tracks:", stream.getAudioTracks().length)

      const mimeType = "audio/webm;codecs=opus"
      const supported = MediaRecorder.isTypeSupported(mimeType)

      console.log("[ANDROID DEBUG] MIME type support:", { mimeType, supported })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supported ? mimeType : undefined,
      })

      mediaRef.current = mediaRecorder
      chunks.current = []
      finalTranscriptRef.current = ""
      interimTranscriptRef.current = ""

      mediaRecorder.ondataavailable = (e) => {
        console.log("[ANDROID DEBUG] chunk received - size:", e.data.size, "type:", e.data.type)
        if (e.data.size > 0) {
          chunks.current.push(e.data)
          setDebugInfo(`chunk: ${e.data.size} bytes`)
        } else {
          setDebugInfo("chunk: 0 bytes")
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks.current, { type: supported ? mimeType : "audio/webm" })

        setDebugInfo(`chunks: ${chunks.current.length}, blob: ${blob.size} bytes`)

        console.log(
          "[ANDROID DEBUG] final blob - size:",
          blob.size,
          "type:",
          blob.type,
          "chunks count:",
          chunks.current.length,
        )

        if (isIOS.current) {
          console.log("[v0] 📱 iOS detected - routing audio to backend STT")

          const formData = new FormData()
          formData.append("audio", blob, "voice-memo.webm")

          try {
            console.log("[ANDROID DEBUG] sending to backend /api/voice/transcribe")
            const response = await fetch("/api/voice/transcribe", {
              method: "POST",
              body: formData,
            })

            console.log("[ANDROID DEBUG] backend response status:", response.status)
            const data = await response.json()
            const backendTranscript = data?.transcript || ""
            console.log("[v0] ✅ Backend transcription result:", backendTranscript)

            onFinished(blob, backendTranscript)
          } catch (error) {
            console.error("[v0] ❌ Backend transcription failed:", error)
            onFinished(blob, "")
          }
        } else {
          console.log("[ANDROID DEBUG] non-iOS path - using live transcript:", finalTranscriptRef.current.trim())
          onFinished(blob, finalTranscriptRef.current.trim())
        }

        stream.getTracks().forEach((track) => track.stop())
      }

      console.log("[ANDROID DEBUG] starting MediaRecorder with 250ms timeslice")
      mediaRecorder.start(250)

      if (!isIOS.current && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

        const recognition = new SpeechRecognition()
        recognition.lang = "nb-NO"
        recognition.interimResults = true
        recognition.continuous = true

        recognition.onresult = (event: any) => {
          if (systemIsSpeaking()) {
            return
          }

          let interimText = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            const text = result[0].transcript.trim()

            if (result.isFinal) {
              finalTranscriptRef.current += " " + text
            } else {
              interimText += " " + text
            }
          }

          const displayText = (finalTranscriptRef.current + " " + interimText).trim()
          setLiveTranscript(displayText)
        }

        recognition.onerror = (event: any) => {
          console.error("SpeechRecognition error:", event.error)
          if (event.error === "network" || event.error === "aborted") {
            console.log("[v0] 🔄 Restarting SpeechRecognition after transient error")
            setTimeout(() => {
              if (recognitionRef.current && recording) {
                try {
                  recognitionRef.current.start()
                } catch (e) {
                  console.error("[v0] ❌ Could not restart recognition:", e)
                }
              }
            }, 500)
          }
        }

        recognition.start()
        recognitionRef.current = recognition
        console.log("[v0] 🎙️ SpeechRecognition started (non-iOS)")
      } else if (isIOS.current) {
        console.log("[v0] 📱 iOS detected - SpeechRecognition disabled, using backend STT")
        setLiveTranscript("Lytter... (transkriberes etter opptak)")
      }

      if (!isIOS.current) {
        speak("Jeg hører deg")
      }

      if (navigator.vibrate) navigator.vibrate(100)
      setRecording(true)
    } catch (error) {
      console.error("[ANDROID DEBUG] Recording error:", error)
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    }
  }

  const stopRecording = () => {
    console.log("[ANDROID DEBUG] stopRecording called")

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    setTimeout(() => {
      mediaRef.current?.stop()
      setLiveTranscript("")
    }, 200)

    if (!isIOS.current) {
      speak("Takk")
    }

    if (navigator.vibrate) navigator.vibrate([80, 80])
    setRecording(false)
  }

  const handleClick = () => {
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

      {recording && (
        <div className="fixed bottom-40 right-6 z-50 bg-black/70 text-white text-xs p-2 rounded">{debugInfo}</div>
      )}

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
