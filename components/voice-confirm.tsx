"use client"

import { useState } from "react"
import { interpretVoiceMemo, type VoiceInterpretation } from "@/lib/voice/classify"
import { ClassificationSelector } from "@/components/classification-selector"
import type { RegistrationType } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface VoiceConfirmProps {
  transcript: string
  onConfirm: (classification: {
    type: RegistrationType
    confidence: number
    overridden: boolean
    interpretation: VoiceInterpretation
  }) => void
  onEdit?: () => void
  onCancel?: () => void
}

export function VoiceConfirm({ transcript, onConfirm, onEdit, onCancel }: VoiceConfirmProps) {
  const interpretation = interpretVoiceMemo(transcript)
  const [selectedType, setSelectedType] = useState<RegistrationType>(interpretation.registration_type)
  const [wasOverridden, setWasOverridden] = useState(false)

  const handleTypeChange = (newType: RegistrationType) => {
    setSelectedType(newType)
    setWasOverridden(true)
    console.log("[v0] 🔄 User overrode classification:", newType)
  }

  const handleConfirm = () => {
    onConfirm({
      type: selectedType,
      confidence: interpretation.confidence,
      overridden: wasOverridden,
      interpretation,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 text-white flex flex-col justify-center items-center p-6 overflow-y-auto">
      <h2 className="text-3xl font-bold mb-2">Jeg tolket dette som:</h2>

      <div className="bg-[#2a3442] p-6 rounded-xl mb-6 max-w-md border-2 border-[#ff6b35]">
        <p className="text-2xl font-semibold mb-4">{interpretation.summary}</p>

        {Object.keys(interpretation.extracted).length > 0 && (
          <div className="space-y-2 text-sm text-gray-300">
            {interpretation.extracted.location && (
              <div className="flex gap-2">
                <span className="font-semibold">Sted:</span>
                <span>{interpretation.extracted.location}</span>
              </div>
            )}
            {interpretation.extracted.value && (
              <div className="flex gap-2">
                <span className="font-semibold">Verdi:</span>
                <span>{interpretation.extracted.value}</span>
              </div>
            )}
            {interpretation.extracted.caller && (
              <div className="flex gap-2">
                <span className="font-semibold">Ringer:</span>
                <span>{interpretation.extracted.caller}</span>
              </div>
            )}
            {interpretation.extracted.reason && (
              <div className="flex gap-2">
                <span className="font-semibold">Gjelder:</span>
                <span>{interpretation.extracted.reason}</span>
              </div>
            )}
            {interpretation.extracted.action && (
              <div className="flex gap-2">
                <span className="font-semibold">Tiltak:</span>
                <span>{interpretation.extracted.action}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-lg text-gray-400 mb-6">Stemmer det?</p>

      <ClassificationSelector value={selectedType} confidence={interpretation.confidence} onChange={handleTypeChange} />

      <div className="flex flex-col gap-4 w-full max-w-sm mt-8">
        <button
          onClick={handleConfirm}
          className="bg-green-600 hover:bg-green-700 text-white text-3xl px-16 py-8 rounded-2xl font-bold shadow-2xl active:scale-95 transition-transform touch-manipulation"
        >
          ✔️ STEMMER
        </button>

        {onEdit && interpretation.confidence < 0.7 && (
          <Button
            onClick={onEdit}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xl px-8 py-6 rounded-xl font-semibold"
          >
            ✏️ Endre detaljer
          </Button>
        )}

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
