"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, XCircle } from "lucide-react"

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

export function VoiceFlow({ transcript, onComplete, onCancel }: VoiceFlowProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Record<string, string>>({})
  const [isListening, setIsListening] = useState(false)

  const current = QUESTIONS[step]
  const isLastStep = step === QUESTIONS.length - 1

  useEffect(() => {
    if (current && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(current.prompt)
      utterance.lang = "nb-NO"
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }
  }, [step, current])

  const handleAnswer = (answer: string) => {
    const newData = { ...data, [current.key]: answer }
    setData(newData)

    if (isLastStep) {
      onComplete(newData)
    } else {
      setStep(step + 1)
    }
  }

  const handleYesNo = (value: boolean) => {
    handleAnswer(value ? "ja" : "nei")
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

          <h2 className="text-3xl font-bold text-white mb-4">🎙️ Voice Logg</h2>
          <p className="text-2xl text-white mb-8">{current.prompt}</p>

          {/* Transcript display */}
          {transcript && (
            <div className="bg-[#2a3442] p-4 rounded-lg mb-6">
              <p className="text-lg text-white italic">"{transcript}"</p>
            </div>
          )}

          {/* Yes/No buttons for yesno questions */}
          {current.type === "yesno" && (
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

          {/* Use transcript button for text questions */}
          {current.type === "text" && transcript && (
            <Button
              onClick={() => handleAnswer(transcript)}
              className="w-full h-20 text-2xl bg-[#ff6b35] hover:bg-[#e55a2b] text-white"
            >
              Bruk svar
            </Button>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {step > 0 && (
              <Button onClick={() => setStep(step - 1)} variant="outline" className="flex-1 h-16 text-xl">
                Tilbake
              </Button>
            )}
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-16 text-xl border-red-500 text-red-500 hover:bg-red-500 hover:text-white bg-transparent"
            >
              Avbryt
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
