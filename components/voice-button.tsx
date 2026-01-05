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

export function VoiceButton({ onFinished, disabled }: VoiceButtonProps) {
  const [recording, setRecording] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState("")
  const { carMode = true } = useCarMode()
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef<string>("")
  const interimTranscriptRef = useRef<string>("")

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mimeType = "audio/webm;codecs=opus"
      const supported = MediaRecorder.isTypeSupported(mimeType)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supported ? mimeType : undefined,
      })

      mediaRef.current = mediaRecorder
      chunks.current = []
      finalTranscriptRef.current = ""
      interimTranscriptRef.current = ""

      mediaRecorder.ondataavailable = (e) => {
        chunks.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: supported ? mimeType : "audio/webm" })
        onFinished(blob, finalTranscriptRef.current.trim())
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()

      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
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
        }

        recognition.start()
        recognitionRef.current = recognition
      }

      speak("Jeg hører deg")

      if (navigator.vibrate) navigator.vibrate(100)
      setRecording(true)
    } catch (error) {
      console.error("Recording error:", error)
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    setTimeout(() => {
      mediaRef.current?.stop()
      setLiveTranscript("")
    }, 200)

    speak("Takk")

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
