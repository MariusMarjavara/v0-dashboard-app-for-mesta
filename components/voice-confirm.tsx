"use client"

import { useState, useEffect } from "react"
import { interpretVoiceMemo, type VoiceInterpretation } from "@/lib/voice/classify"
import { ClassificationSelector } from "@/components/classification-selector"
import type { RegistrationType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { speak } from "@/lib/voice/tts"
import { FileSpreadsheet, Check } from "lucide-react"

interface VoiceConfirmProps {
  transcript: string
  interpretation: VoiceInterpretation
  onConfirm: (classification: {
    type: RegistrationType
    confidence: number
    overridden: boolean
    interpretation: VoiceInterpretation
  }) => void
  onEdit?: () => void
  onCancel?: () => void
}

export function VoiceConfirm({
  transcript,
  interpretation: initialInterpretation,
  onConfirm,
  onEdit,
  onCancel,
}: VoiceConfirmProps) {
  const [selectedType, setSelectedType] = useState<RegistrationType>(initialInterpretation.registration_type)
  const [wasOverridden, setWasOverridden] = useState(false)
  const [isEditingTranscript, setIsEditingTranscript] = useState(false)
  const [editedTranscript, setEditedTranscript] = useState(transcript)
  const [currentInterpretation, setCurrentInterpretation] = useState(initialInterpretation)
  const [showFullPreview, setShowFullPreview] = useState(false)

  useEffect(() => {
    if (isEditingTranscript || showFullPreview) return

    const typeName = currentInterpretation.schema?.sheetName || "Voice memo"
    const location = currentInterpretation.extracted?.sted || currentInterpretation.extracted?.strekning || ""

    let summary = `Jeg tolket dette som ${typeName}.`
    if (location) {
      summary += ` ${location}.`
    }
    summary += " Ser dette riktig ut?"

    speak(summary)
  }, [currentInterpretation.schema, isEditingTranscript, showFullPreview])

  const handleTypeChange = (newType: RegistrationType) => {
    setSelectedType(newType)
    setWasOverridden(true)
    console.log("[v0] 🔄 User overrode classification:", newType)
  }

  const handleTranscriptEditDone = () => {
    setIsEditingTranscript(false)
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
      interpretation: { ...currentInterpretation, transcript: finalTranscript },
    })
  }

  const handleRepeatSpeech = () => {
    const typeName = currentInterpretation.schema?.sheetName || "Voice memo"
    const caller = currentInterpretation.extracted?.oppringt_av
    const incident = currentInterpretation.extracted?.hendelse
    const location = currentInterpretation.extracted?.sted || currentInterpretation.extracted?.strekning

    let summary = `${typeName}.`
    if (caller) summary += ` Telefon fra ${caller}.`
    if (incident) summary += ` Gjelder ${incident}.`
    if (location) summary += ` Mellom ${location}.`

    speak(summary)
  }

  if (!showFullPreview) {
    const typeName = currentInterpretation.schema?.sheetName || "Voice memo"
    const location = currentInterpretation.extracted?.sted || currentInterpretation.extracted?.strekning || ""

    return (
      <div className="fixed inset-0 z-50 bg-black/90 text-white flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Jeg tolket dette som:</h2>
            <div className="bg-[#1a2332] p-6 rounded-xl border-2 border-green-600 mb-2">
              <p className="text-2xl font-bold text-green-400 mb-2">{typeName}</p>
              {location && <p className="text-lg text-white">{location}</p>}
            </div>
            <p className="text-xl text-gray-300 mt-6">Ser dette riktig ut?</p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => setShowFullPreview(true)}
              className="bg-green-600 hover:bg-green-700 text-white text-2xl px-12 py-6 rounded-2xl font-bold shadow-2xl active:scale-95 transition-transform touch-manipulation"
            >
              ✅ Ja, gå videre
            </button>

            {!isEditingTranscript ? (
              <button
                onClick={() => setIsEditingTranscript(true)}
                className="bg-transparent border-2 border-orange-400 hover:border-orange-300 text-orange-400 hover:text-orange-300 text-lg px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform touch-manipulation"
              >
                ✏️ Endre
              </button>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  className="w-full bg-[#1a2332] text-white text-base p-4 rounded-xl outline-none resize-none border border-gray-700"
                  rows={4}
                  autoFocus
                />
                <Button onClick={handleTranscriptEditDone} className="w-full bg-green-600 hover:bg-green-700">
                  ✔️ Ferdig – tolk på nytt
                </Button>
              </div>
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
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 text-white flex flex-col justify-center items-center p-6 overflow-y-auto">
      <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-4 mb-4 max-w-md w-full">
        <h3 className="text-sm font-semibold text-green-400 mb-2">Systemet foreslår:</h3>
        <div className="space-y-1">
          {currentInterpretation.schema?.fields
            .filter((field) => {
              const value = currentInterpretation.extracted[field.name]
              return value !== null && value !== undefined && value !== ""
            })
            .map((field) => {
              const value = currentInterpretation.extracted[field.name]
              return (
                <div key={field.name} className="flex items-start gap-2">
                  <span className="text-green-400">•</span>
                  <span className="text-sm text-white">
                    <span className="text-gray-400">{field.placeholder || field.name}:</span> {String(value)}
                  </span>
                </div>
              )
            })}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <FileSpreadsheet className="h-6 w-6 text-green-500" />
        <h2 className="text-2xl font-bold">Dette vil lagres i Excel:</h2>
      </div>

      {currentInterpretation.schema ? (
        <div className="bg-[#1a2332] p-6 rounded-xl mb-4 max-w-md border-2 border-green-600 w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-green-400">{currentInterpretation.schema.sheetName}</h3>
          </div>

          <div className="space-y-3">
            {currentInterpretation.schema.fields.map((field) => {
              const value = currentInterpretation.extracted[field.name]
              const confidence = currentInterpretation.fieldConfidence?.[field.name] || "missing"
              const isMissing = confidence === "missing"
              const isSuggested = confidence === "suggested"
              const hasValue = value !== null && value !== undefined && value !== ""

              return (
                <div key={field.name} className="border-b border-gray-700 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-400">{field.placeholder || field.name}</span>
                    {confidence === "high" && <Check className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className={`text-base ${isMissing ? "text-gray-500 italic" : "text-white font-semibold"}`}>
                    {hasValue ? (
                      <>
                        {String(value)}
                        {isSuggested && <span className="text-xs text-gray-400 ml-2">(foreslått)</span>}
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {currentInterpretation.missingRequired.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded">
              <p className="text-sm text-yellow-300">
                ⚠️ Feltene er forhåndsutfylt basert på tale. Du kan lagre direkte eller justere ved behov.
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
            ✏️ Rediger ved behov
          </button>
        )}
      </div>

      <p className="text-lg text-gray-400 mb-4">Ser dette riktig ut?</p>

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
