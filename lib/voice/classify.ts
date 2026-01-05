/**
 * Voice Transcript Classification System with Schema-Based Extraction
 *
 * Two-step process:
 * 1. Classify which schema (registration type)
 * 2. Extract ONLY fields defined in that schema
 *
 * Principle: Excel schema defines the contract. Voice must conform.
 */

import { REGISTRATION_TYPES, type RegistrationType } from "@/lib/types"
import { getSchemaForType, type RegistrationSchema } from "./schemas"
import { extractEntities, mapEntitiesToSchema } from "./entities"

export interface Classification {
  registration_type: RegistrationType
  subcategory: string
  confidence: number
  keywords: string[]
}

export interface VoiceInterpretation {
  registration_type: RegistrationType
  schema: RegistrationSchema | null
  confidence: number
  keywords: string[]
  extracted: Record<string, string | number | boolean | null>
  fieldConfidence: Record<string, "high" | "suggested" | "missing">
  summary: string
  missingRequired: string[]
}

/**
 * Step 1: Classify which schema this transcript belongs to
 */
export function classifyVoiceTranscript(text: string): Classification {
  const t = text.toLowerCase()
  const keywords: string[] = []

  // Friksjon (Friction measurements)
  if (
    t.includes("friksjon") ||
    t.includes("målt friksjon") ||
    t.includes("friksjonsmåling") ||
    t.match(/\b0[,.]2[0-9]\b/) ||
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
    t.includes("stikker") ||
    t.includes("brøytestikk") ||
    t.includes("skiltkosting") ||
    t.includes("leskur")
  ) {
    keywords.push("vinterarbeid")
    return {
      registration_type: REGISTRATION_TYPES.VINTERARBEID,
      subcategory: "manuelt",
      confidence: 0.8,
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
 * Step 2: Extract fields according to schema
 *
 * This is the critical function - it ensures voice data always matches Excel structure
 */
export function interpretVoiceMemo(text: string): VoiceInterpretation {
  const classification = classifyVoiceTranscript(text)
  const schema = getSchemaForType(classification.registration_type)

  if (!schema) {
    // No schema defined for this type yet - fallback to free-form
    return {
      registration_type: classification.registration_type,
      schema: null,
      confidence: classification.confidence,
      keywords: classification.keywords,
      extracted: { raw_text: text },
      fieldConfidence: {},
      summary: text.substring(0, 80) + (text.length > 80 ? "..." : ""),
      missingRequired: [],
    }
  }

  const entities = extractEntities(text)
  console.log("[v0] 📦 Extracted entities:", entities)

  const extracted = mapEntitiesToSchema(entities, schema)
  console.log("[v0] 🎯 Mapped to schema:", extracted)

  const fieldConfidence: Record<string, "high" | "suggested" | "missing"> = {}
  for (const field of schema.fields) {
    const value = extracted[field.name]
    if (value !== null && value !== undefined) {
      // Determine confidence based on entity matching
      if (field.name === "sted" || field.name === "strekning") {
        fieldConfidence[field.name] = entities.places.length === 1 ? "high" : "suggested"
      } else if (field.name === "friksjon") {
        const frictionNumbers = entities.numbers.filter((n) => n > 0 && n < 1)
        fieldConfidence[field.name] = frictionNumbers.length === 1 ? "high" : "suggested"
      } else {
        fieldConfidence[field.name] = "suggested" // Default to suggested
      }
    } else {
      fieldConfidence[field.name] = "missing"
    }
  }

  const missingRequired = schema.fields
    .filter((f) => f.required && fieldConfidence[f.name] === "missing")
    .map((f) => f.name)

  // Build summary
  const summary = buildSummary(schema, extracted)

  return {
    registration_type: schema.type,
    schema,
    confidence: classification.confidence,
    keywords: classification.keywords,
    extracted,
    fieldConfidence,
    summary,
    missingRequired,
  }
}

/**
 * Extract a single field from transcript based on its schema definition
 */
function extractField(
  text: string,
  field: { name: string; type: string; options?: string[] },
  schemaType: RegistrationType,
): string | number | boolean | null {
  const t = text.toLowerCase()

  // Schema-specific extraction logic
  if (schemaType === REGISTRATION_TYPES.VOICE_MEMO) {
    // Vaktlogg schema
    if (field.name === "oppringt_av") {
      if (t.includes("vts") || t.includes("vegtrafikksentral")) return "Vegtrafikksentral"
      if (t.includes("politi")) return "Politiet"
      if (t.includes("trafikant")) return "Trafikant"
      if (t.includes("brann") || t.includes("amk")) return "AMK/Brann"
      return null
    }

    if (field.name === "hendelse") {
      if (t.includes("glatt")) return "Glatt vei"
      if (t.includes("stengt")) return "Stengt vei"
      if (t.includes("ulykke")) return "Ulykke"
      if (t.includes("sikt")) return "Dårlig sikt"
      return "Annet"
    }

    if (field.name === "sted") {
      const locationMatch = t.match(/(?:i|langs|ved|på|strekning)\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/i)
      return locationMatch ? locationMatch[1] : null
    }

    if (field.name === "tiltak") {
      if (t.includes("brøyt")) return "Brøyting"
      if (t.includes("strø")) return "Strøing"
      if (t.includes("befaring")) return "Befaring"
      if (t.includes("ingen")) return "Ingen tiltak"
      if (t.includes("eskalert")) return "Eskalert"
      return null
    }
  }

  if (schemaType === REGISTRATION_TYPES.FRIKSJON) {
    if (field.name === "strekning") {
      const locationMatch = t.match(/(?:langs|ved|på|i)\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/i)
      return locationMatch ? locationMatch[1] : null
    }

    if (field.name === "friksjon") {
      const valueMatch =
        t.match(/(?:over|under|på|rundt|målt)\s+(0[,.]?\d+)/i) || t.match(/\b(0[,.]2[0-9]|0[,.]3[0-9])\b/)
      if (valueMatch) {
        return Number.parseFloat(valueMatch[1].replace(",", "."))
      }
      return null
    }

    if (field.name === "tiltak_startet") {
      if (t.includes("sette tiltak") || t.includes("kaller ut")) return true
      if (t.includes("ingen tiltak")) return false
      return null
    }
  }

  if (schemaType === REGISTRATION_TYPES.VINTERARBEID) {
    if (field.name === "type_arbeid") {
      if (t.includes("brøytestikk")) return "Brøytestikksetting"
      if (t.includes("skiltkosting")) return "Skiltkosting"
      if (t.includes("leskur")) return "Rydding av leskur"
      return "Annet"
    }

    if (field.name === "sted") {
      const locationMatch = t.match(/(?:i|langs|ved|på)\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/i)
      return locationMatch ? locationMatch[1] : null
    }

    if (field.name === "antall_stikker") {
      const countMatch = t.match(/(\d+)\s*stikker/)
      return countMatch ? Number.parseInt(countMatch[1]) : null
    }
  }

  // Fallback: store remaining text as comment/beskrivelse
  if (field.name === "kommentar" || field.name === "beskrivelse") {
    return text.substring(0, 200)
  }

  return null
}

/**
 * Build human-readable summary from extracted fields
 */
function buildSummary(schema: RegistrationSchema, extracted: Record<string, any>): string {
  if (schema.type === REGISTRATION_TYPES.VOICE_MEMO) {
    const parts = []
    if (extracted.oppringt_av) parts.push(`Oppringt av ${extracted.oppringt_av}`)
    if (extracted.hendelse) parts.push(extracted.hendelse)
    if (extracted.sted) parts.push(`ved ${extracted.sted}`)
    if (extracted.tiltak) parts.push(`Tiltak: ${extracted.tiltak}`)
    return parts.join(" - ") || "Vaktlogg"
  }

  if (schema.type === REGISTRATION_TYPES.FRIKSJON) {
    const parts = ["Friksjonsmåling"]
    if (extracted.strekning) parts.push(extracted.strekning)
    if (extracted.friksjon) parts.push(`${extracted.friksjon}`)
    return parts.join(" - ")
  }

  if (schema.type === REGISTRATION_TYPES.VINTERARBEID) {
    const parts = []
    if (extracted.type_arbeid) parts.push(extracted.type_arbeid)
    if (extracted.sted) parts.push(extracted.sted)
    return parts.join(" i ") || "Vinterarbeid"
  }

  return schema.description
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
    [REGISTRATION_TYPES.VOICE_MEMO]: "Vaktlogg",
  }
  return labels[type] || "Registrering"
}
