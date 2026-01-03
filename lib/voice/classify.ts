/**
 * Voice Transcript Classification System
 *
 * Classifies voice transcripts into registration types using
 * a hybrid approach: rule-based matching (80-90% accuracy) with
 * optional LLM fallback for uncertain cases.
 *
 * Registration types:
 * - friksjon: Friction measurements
 * - loggbok: Work log / vakttlf entries
 * - vinterarbeid: Winter maintenance activities
 * - voice_memo: Unclassified notes
 */

import { REGISTRATION_TYPES, type RegistrationType } from "@/lib/types"

export interface Classification {
  registration_type: RegistrationType
  subcategory: string
  confidence: number
  keywords: string[]
}

/**
 * Classifies a voice transcript into the most appropriate registration type
 */
export function classifyVoiceTranscript(text: string): Classification {
  const t = text.toLowerCase()
  const keywords: string[] = []

  // Friksjon (Friction measurements)
  if (
    t.includes("friksjon") ||
    t.includes("målt friksjon") ||
    t.includes("friksjonsmåling") ||
    t.match(/\b0[,.]2[0-9]\b/) || // Matches friction values like 0.25
    t.match(/\b0[,.]3[0-9]\b/)
  ) {
    keywords.push("friksjon", "måling")
    return {
      registration_type: REGISTRATION_TYPES.FRIKSJON,
      subcategory: "måling",
      confidence: 0.9,
      keywords,
    }
  }

  // Vakttlf / Loggbok (Work log entries)
  if (
    t.includes("oppringt") ||
    t.includes("ringt") ||
    t.includes("ringer") ||
    t.includes("vakttlf") ||
    t.includes("vaktelefon") ||
    t.includes("vts") ||
    t.includes("politiet") ||
    t.includes("brannvesen") ||
    t.includes("varslet") ||
    t.includes("melding fra")
  ) {
    keywords.push("vakttlf", "loggbok")
    return {
      registration_type: REGISTRATION_TYPES.VOICE_MEMO,
      subcategory: "vakttlf",
      confidence: 0.85,
      keywords,
    }
  }

  // Vinterarbeid (Winter maintenance)
  if (
    t.includes("brøyting") ||
    t.includes("brøytet") ||
    t.includes("strøing") ||
    t.includes("strødd") ||
    t.includes("kallte ut") ||
    t.includes("kalte ut") ||
    t.includes("ute med") ||
    t.includes("kjørt") ||
    t.includes("plog") ||
    t.includes("saltspreder") ||
    t.includes("snørydding")
  ) {
    keywords.push("vinterarbeid", "tiltak")
    return {
      registration_type: REGISTRATION_TYPES.VINTERARBEID,
      subcategory: "tiltak",
      confidence: 0.8,
      keywords,
    }
  }

  // Maskin (Machine/Equipment)
  if (
    t.includes("maskin") ||
    t.includes("traktor") ||
    t.includes("hjullaster") ||
    t.includes("gravemaskin") ||
    t.includes("service") ||
    t.includes("vedlikehold maskin")
  ) {
    keywords.push("maskin")
    return {
      registration_type: REGISTRATION_TYPES.MASKIN,
      subcategory: "registrering",
      confidence: 0.75,
      keywords,
    }
  }

  // Utbedring (Road repairs)
  if (
    t.includes("utbedring") ||
    t.includes("reparasjon") ||
    t.includes("hull") ||
    t.includes("asfaltering") ||
    t.includes("lappe") ||
    t.includes("skade på veg")
  ) {
    keywords.push("utbedring")
    return {
      registration_type: REGISTRATION_TYPES.UTBEDRING,
      subcategory: "reparasjon",
      confidence: 0.75,
      keywords,
    }
  }

  // Innkjøp (Purchases)
  if (
    t.includes("innkjøp") ||
    t.includes("kjøpt") ||
    t.includes("bestilt") ||
    t.includes("materiale") ||
    t.includes("salt") ||
    t.includes("fylt")
  ) {
    keywords.push("innkjøp")
    return {
      registration_type: REGISTRATION_TYPES.INNKJOP,
      subcategory: "materiale",
      confidence: 0.7,
      keywords,
    }
  }

  // Fallback: Keep as voice memo (unclassified)
  return {
    registration_type: REGISTRATION_TYPES.VOICE_MEMO,
    subcategory: "notat",
    confidence: 0.4,
    keywords: ["notat"],
  }
}

/**
 * Returns a human-readable label for a registration type
 */
export function getRegistrationTypeLabel(type: RegistrationType): string {
  const labels: Record<RegistrationType, string> = {
    [REGISTRATION_TYPES.FRIKSJON]: "Friksjonsmåling",
    [REGISTRATION_TYPES.VINTERARBEID]: "Vinterarbeid",
    [REGISTRATION_TYPES.MASKIN]: "Maskinregistrering",
    [REGISTRATION_TYPES.UTBEDRING]: "Utbedring",
    [REGISTRATION_TYPES.INNKJOP]: "Innkjøp",
    [REGISTRATION_TYPES.ARBEIDSDOK]: "Arbeidsdok",
    [REGISTRATION_TYPES.AVVIK_RUH]: "Avvik/RUH",
    [REGISTRATION_TYPES.VOICE_MEMO]: "Notat",
  }
  return labels[type] || "Registrering"
}
