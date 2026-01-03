"use client"

import { useState } from "react"
import { classifyVoiceTranscript } from "@/lib/voice/classify"
import { ClassificationSelector } from "@/components/classification-selector"
import type { RegistrationType } from "@/lib/types"

interface VoiceConfirmProps {
  summary: string
  transcript: string
  onConfirm: (classification: { type: RegistrationType; confidence: number; overridden: boolean }) => void
  onCancel?: () => void
}

export function VoiceConfirm({ summary, transcript, onConfirm, onCancel }: VoiceConfirmProps) {
  const initialClassification = classifyVoiceTranscript(transcript)
  const [selectedType, setSelectedType] = useState<RegistrationType>(initialClassification.registration_type)
  const [wasOverridden, setWasOverridden] = useState(false)

  const handleTypeChange = (newType: RegistrationType) => {
    setSelectedType(newType)
    setWasOverridden(true)
    console.log("[v0] 🔄 User overrode classification:", newType)
  }

  const handleConfirm = () => {
    onConfirm({
      type: selectedType,
      confidence: initialClassification.confidence,
      overridden: wasOverridden,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 text-white flex flex-col justify-center items-center p-6 overflow-y-auto">
      <h2 className="text-3xl font-bold mb-6">Registrert</h2>

      <p className="text-xl text-center mb-6 max-w-md leading-relaxed whitespace-pre-line">{summary}</p>

      <ClassificationSelector
        value={selectedType}
        confidence={initialClassification.confidence}
        onChange={handleTypeChange}
      />

      <div className="flex flex-col gap-4 w-full max-w-sm mt-8">
        <button
          onClick={handleConfirm}
          className="bg-orange-600 hover:bg-orange-700 text-white text-3xl px-16 py-8 rounded-2xl font-bold shadow-2xl active:scale-95 transition-transform touch-manipulation"
        >
          LAGRE
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="bg-transparent border-2 border-white/30 hover:border-white/50 text-white text-xl px-8 py-4 rounded-xl font-semibold active:scale-95 transition-transform touch-manipulation"
          >
            Avbryt
          </button>
        )}
      </div>
    </div>
  )
}
