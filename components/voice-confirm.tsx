"use client"

import { useState, useEffect } from "react"
import { interpretVoiceMemo, type VoiceInterpretation } from "@/lib/voice/classify"
import { ClassificationSelector } from "@/components/classification-selector"
import type { RegistrationType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { speak } from "@/lib/voice/speak"
import { FileSpreadsheet, AlertCircle, AlertTriangle, Check } from "lucide-react"

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
  const [isEditingTranscript, setIsEditingTranscript] = useState(false)
  const [editedTranscript, setEditedTranscript] = useState(transcript)

  const [currentInterpretation, setCurrentInterpretation] = useState(interpretation)

  useEffect(() => {
    if (isEditingTranscript) return // Don't speak while editing

    const summary = currentInterpretation.schema
      ? `Jeg har registrert dette som ${currentInterpretation.schema.sheetName}. Stemmer det?`
      : `Jeg tolket dette som en registrering. Stemmer det?`
    speak(summary)
  }, [currentInterpretation.schema])

  const handleTypeChange = (newType: RegistrationType) => {
    setSelectedType(newType)
    setWasOverridden(true)
    console.log("[v0] 🔄 User overrode classification:", newType)
  }

  const handleTranscriptEditDone = () => {
    setIsEditingTranscript(false)
    // Re-interpret with edited transcript
    const newInterpretation = interpretVoiceMemo(editedTranscript)
    setCurrentInterpretation(newInterpretation)
    setSelectedType(newInterpretation.registration_type)
    console.log("[v0] 🔄 Re-interpreted edited transcript:", newInterpretation)
  }

  const handleConfirm = () => {
    const finalTranscript = isEditingTranscript ? editedTranscript : transcript
    onConfirm({
      type: selectedType,
      confidence: currentInterpretation.confidence,
      overridden: wasOverridden,
      interpretation: { ...currentInterpretation, extracted: currentInterpretation.extracted },
    })
  }

  const handleRepeatSpeech = () => {
    const summary = currentInterpretation.schema
      ? `Dette vil lagres som ${currentInterpretation.schema.sheetName}. Stemmer det?`
      : `Dette vil lagres. Stemmer det?`
    speak(summary)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 text-white flex flex-col justify-center items-center p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <FileSpreadsheet className="h-6 w-6 text-green-500" />
        <h2 className="text-2xl font-bold">Dette vil lagres i Excel:</h2>
      </div>

      {currentInterpretation.schema ? (
        <div className="bg-[#1a2332] p-6 rounded-xl mb-4 max-w-md border-2 border-green-600 w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-green-400">{currentInterpretation.schema.sheetName}</h3>
            {currentInterpretation.missingRequired.length > 0 && <AlertCircle className="h-5 w-5 text-yellow-500" />}
          </div>

          <div className="space-y-3">
            {currentInterpretation.schema.fields.map((field) => {
              const value = currentInterpretation.extracted[field.name]
              const confidence = currentInterpretation.fieldConfidence?.[field.name] || "missing"
              const isMissing = confidence === "missing"
              const isSuggested = confidence === "suggested"

              return (
                <div key={field.name} className="border-b border-gray-700 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-400">{field.placeholder || field.name}</span>
                    {field.required && <span className="text-xs text-red-400">*</span>}
                    {confidence === "high" && <Check className="h-4 w-4 text-green-500" />}
                    {isSuggested && <AlertTriangle className="h-4 w-4 text-yellow-500" title="Foreslått verdi" />}
                  </div>
                  <div
                    className={`text-base ${
                      isMissing ? "text-gray-500 italic" : isSuggested ? "text-yellow-300" : "text-white font-semibold"
                    }`}
                  >
                    {value !== null && value !== undefined ? String(value) : "—"}
                    {isSuggested && <span className="text-xs text-yellow-400 ml-2">(foreslått)</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {currentInterpretation.missingRequired.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded">
              <p className="text-sm text-yellow-300">
                ⚠️ Noen felt kunne ikke fylles automatisk. Du kan redigere transkriptet eller lagre som det er.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#2a3442] p-6 rounded-xl mb-4 max-w-md border-2 border-[#ff6b35]">
          <p className="text-xl font-semibold mb-2">{currentInterpretation.summary}</p>
          <p className="text-sm text-gray-400">Dette vil lagres som fritekstnota</p>
        </div>
      )}

      <div className="w-full max-w-md mb-4">
        <div className="rounded-xl bg-black/40 p-4 mb-2 border border-gray-700">
          {isEditingTranscript ? (
            <div className="space-y-2">
              <textarea
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                className="w-full bg-transparent text-white text-base outline-none resize-none"
                rows={4}
                autoFocus
              />
              <Button onClick={handleTranscriptEditDone} className="w-full bg-green-600 hover:bg-green-700">
                ✔️ Ferdig – tolk på nytt
              </Button>
            </div>
          ) : (
            <p className="text-base text-white leading-relaxed">{editedTranscript}</p>
          )}
        </div>
        {!isEditingTranscript && (
          <button onClick={() => setIsEditingTranscript(true)} className="text-sm text-orange-400 underline">
            ✏️ Rediger og tolk på nytt
          </button>
        )}
      </div>

      <p className="text-lg text-gray-400 mb-4">Stemmer det?</p>

      <ClassificationSelector
        value={selectedType}
        confidence={currentInterpretation.confidence}
        onChange={handleTypeChange}
      />

      <div className="flex flex-col gap-4 w-full max-w-sm mt-6">
        <button
          onClick={handleConfirm}
          className="bg-green-600 hover:bg-green-700 text-white text-2xl px-12 py-6 rounded-2xl font-bold shadow-2xl active:scale-95 transition-transform touch-manipulation"
        >
          ✔️ LAGRE I EXCEL
        </button>

        <Button
          onClick={handleRepeatSpeech}
          variant="outline"
          className="text-base px-6 py-3 border-white/30 hover:border-white/50 bg-transparent"
        >
          🔊 Les opp igjen
        </Button>

        {onEdit && currentInterpretation.confidence < 0.7 && (
          <Button
            onClick={onEdit}
            className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-6 py-4 rounded-xl font-semibold"
          >
            ✏️ Fyll ut manuelt
          </Button>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="bg-transparent border-2 border-white/30 hover:border-white/50 text-white text-lg px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform touch-manipulation"
          >
            Avbryt
          </button>
        )}
      </div>
    </div>
  )
}
