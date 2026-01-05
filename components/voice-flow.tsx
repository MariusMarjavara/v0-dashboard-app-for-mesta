"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, XCircle, Undo2, Mic } from "lucide-react"
import { speak, systemIsSpeaking } from "@/lib/voice/tts"

interface Question {
  key: string
  prompt: string
  type: "yesno" | "text"
}

const QUESTIONS: Question[] = [
  { key: "type", prompt: "Er dette en loggbok? Si ja eller nei.", type: "yesno" },
  { key: "vakttlf", prompt: "Gjelder det vaktelefon?", type: "yesno" },
  { key: "caller", prompt: "Hvem ringte?", type: "text" },
  { key: "reason", prompt: "Hva gjaldt det?", type: "text" },
  { key: "action", prompt: "Hva ble gjort?", type: "text" },
]

interface VoiceFlowProps {
  transcript: string
  onComplete: (data: Record<string, string>) => void
  onCancel: () => void
}

function calculateConfidence(text: string): number {
  let score = 0.5

  if (text.length > 10) score += 0.2
  if (!/[?]/.test(text)) score += 0.1
  if (!/(eh|øh|hm)/i.test(text)) score += 0.1
  if (text.split(" ").length >= 3) score += 0.1

  return Math.min(1, Math.round(score * 100) / 100)
}

const isEcho = (spoken: string, prompt: string): boolean => {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\wæøå]/g, "")
      .trim()

  const normalizedSpoken = normalize(spoken)
  const normalizedPrompt = normalize(prompt)

  // Check if spoken text contains significant portion of prompt
  return normalizedSpoken.includes(normalizedPrompt.substring(0, Math.min(10, normalizedPrompt.length)))
}

const SpeechRecognition =
  typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null

export function VoiceFlow({ transcript, onComplete, onCancel }: VoiceFlowProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Record<string, string>>({})
  const [isListening, setIsListening] = useState(false)

  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<Record<string, number>>({})
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [liveTranscript, setLiveTranscript] = useState<string>("")

  const current = QUESTIONS[step]
  const isLastStep = step === QUESTIONS.length - 1

  useEffect(() => {
    if (!current || awaitingConfirmation) return

    setLiveTranscript("")

    if (!SpeechRecognition) {
      console.log("[v0] 🎙️ SpeechRecognition not available, falling back to buttons")
      speak(current.prompt)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "nb-NO"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log("[v0] 🎙️ Voice recognition started for question:", current.key)
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      if (systemIsSpeaking()) {
        console.log("[v0] 🔇 Ignoring recognition while system is speaking")
        return
      }

      const spoken = event.results[0][0].transcript
      console.log("[v0] 🎙️ Heard:", spoken)

      if (isEcho(spoken, current.prompt)) {
        console.log("[v0] 🔇 Ignored echo:", spoken)
        return
      }

      setLiveTranscript(spoken)

      // Auto-handle yes/no questions
      const normalized = spoken.toLowerCase()
      if (current.type === "yesno") {
        if (normalized.includes("ja") || normalized.includes("yes")) {
          console.log("[v0] ✅ Auto-handling YES")
          handleProposedAnswer("ja")
          return
        }
        if (normalized.includes("nei") || normalized.includes("no")) {
          console.log("[v0] ❌ Auto-handling NO")
          handleProposedAnswer("nei")
          return
        }
        console.log("[v0] ⚠️ Unclear yes/no answer, ignoring")
        return
      }

      // For text questions, propose the answer
      if (current.type === "text" && spoken.trim().length > 0) {
        console.log("[v0] 📝 Proposing text answer:", spoken)
        handleProposedAnswer(spoken)
      }
    }

    recognition.onerror = (e: any) => {
      console.warn("[v0] 🚨 Speech recognition error:", e.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      console.log("[v0] 🛑 Voice recognition ended")
      setIsListening(false)
    }

    speak(current.prompt)

    // Start recognition after TTS completes
    setTimeout(() => {
      try {
        recognition.start()
      } catch (e) {
        console.warn("[v0] Failed to start recognition:", e)
      }
    }, 1000)

    return () => {
      recognition.stop()
      setIsListening(false)
    }
  }, [step, current, awaitingConfirmation])

  const handleProposedAnswer = (answer: string) => {
    setPendingAnswer(answer)
    setAwaitingConfirmation(true)
    speak(`Jeg registrerte: ${answer}. Stemmer det?`)
  }

  const confirmAnswer = (confirmed: boolean) => {
    if (!confirmed || !pendingAnswer) {
      speak("Ok, la oss prøve igjen.")
      setPendingAnswer(null)
      setAwaitingConfirmation(false)
      return
    }

    const newData = { ...data, [current.key]: pendingAnswer }
    setData(newData)

    setConfidence((c) => ({
      ...c,
      [current.key]: calculateConfidence(pendingAnswer),
    }))

    setPendingAnswer(null)
    setAwaitingConfirmation(false)

    if (isLastStep) {
      const transcriptParts = [
        `Type: ${newData.type}`,
        `Vaktelefon: ${newData.vakttlf}`,
        newData.caller ? `Ringer: ${newData.caller}` : "",
        newData.reason ? `Hendelse: ${newData.reason}` : "",
        newData.action ? `Tiltak: ${newData.action}` : "",
      ].filter(Boolean)

      const combinedTranscript = transcriptParts.join(". ")

      // Add transcript to data
      onComplete({ ...newData, transcript: combinedTranscript })
    } else {
      setStep(step + 1)
    }
  }

  const undoLastAnswer = () => {
    if (step === 0) return

    const prevKey = QUESTIONS[step - 1].key
    const newData = { ...data }
    delete newData[prevKey]
    setData(newData)
    setStep(step - 1)
    speak("Forrige svar er fjernet.")
  }

  const handleYesNo = (value: boolean) => {
    handleProposedAnswer(value ? "ja" : "nei")
  }

  if (!current) return null

  return (
    <div className="fixed inset-0 z-40 bg-[#1a2332] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl bg-[#1a2332] border-[#ff6b35] p-8">
        <div className="text-center space-y-6">
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-12 rounded-full ${
                  i < step ? "bg-green-500" : i === step ? "bg-[#ff6b35]" : "bg-gray-600"
                }`}
              />
            ))}
          </div>

          <div className="mb-4">
            <span className="text-sm text-gray-400">
              {awaitingConfirmation ? "Bekreftelse" : `Spørsmål ${step + 1} av ${QUESTIONS.length}`}
            </span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">🎙️ Voice Logg</h2>

          {isListening && !awaitingConfirmation && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Mic className="h-5 w-5 text-[#ff6b35] animate-pulse" />
              <span className="text-[#ff6b35] text-sm font-semibold">Lytter ...</span>
            </div>
          )}

          {awaitingConfirmation ? (
            <p className="text-2xl text-white mb-8">Stemmer det jeg registrerte?</p>
          ) : (
            <p className="text-2xl text-white mb-8">{current.prompt}</p>
          )}

          {/* Transcript or pending answer display */}
          {awaitingConfirmation && pendingAnswer ? (
            <div className="bg-[#2a3442] p-4 rounded-lg mb-6 border-2 border-[#ff6b35]">
              <p className="text-lg text-white font-semibold">"{pendingAnswer}"</p>
            </div>
          ) : liveTranscript ? (
            <div className="bg-[#2a3442] p-4 rounded-lg mb-6">
              <p className="text-lg text-white italic">"{liveTranscript}"</p>
            </div>
          ) : transcript ? (
            <div className="bg-[#2a3442] p-4 rounded-lg mb-6">
              <p className="text-lg text-white italic">"{transcript}"</p>
            </div>
          ) : null}

          {!awaitingConfirmation && confidence[current.key] && (
            <p className="text-sm text-gray-400 mb-4">Sikkerhet: {Math.round(confidence[current.key] * 100)}%</p>
          )}

          {awaitingConfirmation && (
            <div className="flex gap-4">
              <Button
                onClick={() => confirmAnswer(true)}
                className="flex-1 h-20 text-2xl bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="mr-2 h-8 w-8" />
                JA
              </Button>
              <Button
                onClick={() => confirmAnswer(false)}
                className="flex-1 h-20 text-2xl bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="mr-2 h-8 w-8" />
                NEI
              </Button>
            </div>
          )}

          {/* Yes/No buttons for yesno questions (hidden during confirmation) */}
          {!awaitingConfirmation && current.type === "yesno" && (
            <div className="flex gap-4">
              <Button
                onClick={() => handleYesNo(true)}
                className="flex-1 h-20 text-2xl bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="mr-2 h-8 w-8" />
                JA
              </Button>
              <Button
                onClick={() => handleYesNo(false)}
                className="flex-1 h-20 text-2xl bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="mr-2 h-8 w-8" />
                NEI
              </Button>
            </div>
          )}

          {/* Use transcript button for text questions (hidden during confirmation) */}
          {!awaitingConfirmation && current.type === "text" && transcript && (
            <Button
              onClick={() => handleProposedAnswer(transcript)}
              className="w-full h-20 text-2xl bg-[#ff6b35] hover:bg-[#e55a2b] text-white"
            >
              Bruk svar
            </Button>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {step > 0 && !awaitingConfirmation && (
              <Button onClick={undoLastAnswer} variant="outline" className="flex-1 h-16 text-xl bg-transparent">
                <Undo2 className="mr-2 h-5 w-5" />
                Angre forrige
              </Button>
            )}

            {!awaitingConfirmation && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1 h-16 text-xl border-red-500 text-red-500 hover:bg-red-500 hover:text-white bg-transparent"
              >
                Avbryt
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
