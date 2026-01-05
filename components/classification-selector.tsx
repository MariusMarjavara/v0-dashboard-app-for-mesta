"use client"

import { useState } from "react"
import { ChevronDown, Check } from "lucide-react"
import type { RegistrationType } from "@/lib/types"
import { REGISTRATION_TYPES } from "@/lib/types"

const OPTIONS = [
  { type: REGISTRATION_TYPES.FRIKSJON, label: "Friksjonsmåling" },
  { type: REGISTRATION_TYPES.VOICE_MEMO, label: "Vakttlf / loggbok" },
  { type: REGISTRATION_TYPES.ARBEIDSDOK, label: "Manuelt arbeid" },
  { type: REGISTRATION_TYPES.MASKIN, label: "Maskinregistrering" },
  { type: REGISTRATION_TYPES.UTBEDRING, label: "Utbedring / reparasjon" },
  { type: REGISTRATION_TYPES.INNKJOP, label: "Innkjøp / materiale" },
]

interface Props {
  value: RegistrationType
  confidence: number
  onChange: (value: RegistrationType) => void
}

export function ClassificationSelector({ value, confidence, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const current = OPTIONS.find((o) => o.type === value)
  const confidencePercent = Math.round(confidence * 100)
  const isLowConfidence = confidence < 0.6

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      {/* Current classification */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between
                   rounded-xl border border-orange-500/40
                   bg-orange-500/10 px-5 py-4 text-left
                   hover:bg-orange-500/15 transition-colors
                   active:scale-[0.98] touch-manipulation"
      >
        <div className="flex-1">
          <p className="text-sm text-gray-300">Registrert som</p>
          <p className="text-xl font-bold text-white">{current?.label}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-400">Sikkerhet: {confidencePercent}%</p>
            {isLowConfidence && <span className="text-xs text-yellow-400">⚠️ Usikker – kontroller</span>}
          </div>
        </div>

        <ChevronDown
          className={`h-6 w-6 text-orange-400 transition-transform flex-shrink-0 ml-3 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Options */}
      {open && (
        <div className="mt-3 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
          {OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => {
                onChange(opt.type)
                setOpen(false)
                if (navigator.vibrate) navigator.vibrate(30)
              }}
              className={`w-full flex items-center justify-between
                         px-5 py-4 text-lg text-left
                         transition-colors touch-manipulation
                         ${
                           opt.type === value
                             ? "bg-green-600 text-white font-semibold"
                             : "bg-[#1a2332] text-white hover:bg-[#243044] active:bg-[#2a3850]"
                         }`}
            >
              <span>{opt.label}</span>
              {opt.type === value && <Check className="h-5 w-5 flex-shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
