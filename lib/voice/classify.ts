/**
 * Voice Transcript Classification System with Schema-Based Extraction
 *
 * Score-based classification: Each schema gets points based on keywords.
 * Vakttlf/loggbok is the fallback with lowest priority.
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
  score: number
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

interface SchemaScore {
  type: RegistrationType
  subcategory: string
  score: number
  keywords: string[]
}

/**
 * Step 1: Classify which schema this transcript belongs to
 * Uses SCORE-BASED system - highest score wins
 *
 * Enhanced Vakttlf detection with stronger call/decision keywords
 */
export function classifyVoiceTranscript(text: string): Classification {
  const t = text.toLowerCase()

  const scores: Record<string, number> = {
    friksjon: 0,
    innkjop: 0,
    maskin: 0,
    manuelt: 0,
    vakttlf: 0,
  }

  const keywords: Record<string, string[]> = {
    friksjon: [],
    innkjop: [],
    maskin: [],
    manuelt: [],
    vakttlf: [],
  }

  // These should win over generic mentions unless specific activity keywords are stronger
  if (["ble oppringt", "oppringt av", "ringte fra"].some((w) => t.includes(w))) {
    scores.vakttlf += 5 // Strong signal - explicit call mention
    keywords.vakttlf.push("oppringt")
  }
  if (["vakttlf", "vts", "bts", "vegtrafikksentral", "trafikksentral"].some((w) => t.includes(w))) {
    scores.vakttlf += 4 // Very strong signal - explicit vakttlf context
    keywords.vakttlf.push("vakttlf/vts")
  }
  if (["varslet", "melding fra", "telefon fra"].some((w) => t.includes(w))) {
    scores.vakttlf += 3
    keywords.vakttlf.push("varslet")
  }

  if (
    ["kalt ut", "kaldte ut", "sendt ut", "har bedt", "iverksatt", "strøbil", "brøytebil"].some((w) => t.includes(w))
  ) {
    scores.vakttlf += 4 // Strong boost for operational decisions
    keywords.vakttlf.push("operativ beslutning")
  }

  if (["besluttet", "bedt om", "bestilt"].some((w) => t.includes(w))) {
    scores.vakttlf += 3
    keywords.vakttlf.push("beslutning")
  }

  if (["feil på", "stoppet", "virket ikke", "problem med"].some((w) => t.includes(w))) {
    scores.vakttlf += 2
    keywords.vakttlf.push("problem")
  }

  // --- Friksjonsmåling ---
  if (t.includes("friksjon")) {
    scores.friksjon += 3
    keywords.friksjon.push("friksjon")
  }
  if (t.match(/\b0[,.][0-9]{2}\b/)) {
    scores.friksjon += 2
    keywords.friksjon.push("verdi")
  }
  if (t.includes("målt") || t.includes("kjørt friksjon")) {
    scores.friksjon += 1
    keywords.friksjon.push("målt")
  }
  if (t.includes("hele veien") || (t.includes("mellom") && t.includes(" og "))) {
    scores.friksjon += 1
    keywords.friksjon.push("strekning")
  }

  // --- Innkjøp ---
  if (["kjøpt", "handlet", "innom", "kvittering", "faktura"].some((w) => t.includes(w))) {
    scores.innkjop += 3
    keywords.innkjop.push("kjøpt")
  }
  if (t.match(/\bstk\b/)) {
    scores.innkjop += 1
    keywords.innkjop.push("stk")
  }
  if (t.includes("tools") || t.includes("biltema") || t.includes("jula")) {
    scores.innkjop += 2
    keywords.innkjop.push("butikk")
  }
  if (t.includes("kostet") && !t.includes("skilt")) {
    scores.innkjop += 1
    keywords.innkjop.push("kostet")
  }

  // --- Maskinoppfølging (ROUTINE ONLY - STRICT LOCK) ---
  const routineMachinePhrases = [
    "daglig vedlikehold",
    "rutinesjekk",
    "daglig sjekk",
    "kontrollert maskin",
    "service gjennomført",
    "ettersyn",
    "ukentlig sjekk",
  ]

  if (routineMachinePhrases.some((phrase) => t.includes(phrase))) {
    scores.maskin = 10 // Hard lock - guaranteed win
    keywords.maskin.push("rutinesjekk")
  }

  // --- Manuelt vinterarbeid ---
  if (["skilt", "skiltkost", "kostet skilt", "ryddet skilt"].some((w) => t.includes(w))) {
    scores.manuelt += 3
    keywords.manuelt.push("skilt")
  }
  if (["brøytet", "strødde", "saltet", "ryddet"].some((w) => t.includes(w))) {
    scores.manuelt += 3
    keywords.manuelt.push("utført arbeid")
  }
  if (t.includes("manuelt") || t.includes("ute og kostet")) {
    scores.manuelt += 2
    keywords.manuelt.push("manuelt")
  }
  if (t.includes("snømåking") || t.includes("brøytestikk")) {
    scores.manuelt += 2
    keywords.manuelt.push("arbeid")
  }

  // Find highest score
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const winner = sortedScores[0]

  console.log("[v0] 🎯 Classification scores:", scores)
  console.log("[v0] 🏆 Winner:", winner)

  // Return winner
  if (winner[1] > 0) {
    return createClassification(winner[0], winner[1], keywords[winner[0]])
  }

  // Absolute fallback
  return {
    registration_type: REGISTRATION_TYPES.VOICE_MEMO,
    subcategory: "loggbok",
    confidence: 0.3,
    keywords: ["loggbok"],
    score: 0,
  }
}

function createClassification(key: string, score: number, keywordList: string[]): Classification {
  const typeMap: Record<string, RegistrationType> = {
    friksjon: REGISTRATION_TYPES.FRIKSJON,
    innkjop: REGISTRATION_TYPES.INNKJOP,
    maskin: REGISTRATION_TYPES.MASKIN,
    manuelt: REGISTRATION_TYPES.ARBEIDSDOK,
    vakttlf: REGISTRATION_TYPES.VOICE_MEMO,
  }

  return {
    registration_type: typeMap[key] || REGISTRATION_TYPES.VOICE_MEMO,
    subcategory: key,
    confidence: Math.min(score / 10, 0.95), // Normalize score to confidence
    keywords: keywordList,
    score,
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
        t.match(/(?:over|under|på|rundt|målt)\s+(0[,.]?\d+)/i) || t.match(/\b(0[,.]2[0-9]|0[,.]3[0-9]|0[,.]4[0-9])\b/)
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

  if (schemaType === REGISTRATION_TYPES.ARBEIDSDOK) {
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

  if (schemaType === REGISTRATION_TYPES.INNKJOP) {
    if (field.name === "hva") {
      const itemMatch = t.match(/(?:kjøpt|handlet)\s+([A-ZÆØÅa-zæøå]+(?:\s+[A-ZÆØÅa-zæøå]+)?)/i)
      return itemMatch ? itemMatch[1] : null
    }

    if (field.name === "antall") {
      const countMatch = t.match(/(\d+)\s*stk/)
      return countMatch ? Number.parseInt(countMatch[1]) : null
    }

    if (field.name === "kostnad") {
      const costMatch = t.match(/(?:kostet)\s+(\d+)/i)
      return costMatch ? Number.parseInt(costMatch[1]) : null
    }
  }

  if (schemaType === REGISTRATION_TYPES.MASKIN) {
    if (field.name === "maskin_type") {
      const typeMatch = t.match(/(?:maskin|traktor|fres)\s+([A-ZÆØÅa-zæøå]+(?:\s+[A-ZÆØÅa-zæøå]+)?)/i)
      return typeMatch ? typeMatch[1] : null
    }

    if (field.name === "arbeid") {
      const workMatch = t.match(/(?:service|vedlikehold|reparasjon)\s+([A-ZÆØÅa-zæøå]+(?:\s+[A-ZÆØÅa-zæøå]+)?)/i)
      return workMatch ? workMatch[1] : null
    }
  }

  // Fallback: store remaining text as comment/beskrivelse
  if (field.name === "kommentar" || field.name === "beskrivelse") {
    return text.substring(0, 200)
  }

  return null
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

  let adjustedConfidence = classification.confidence
  if (
    schema.type === REGISTRATION_TYPES.VOICE_MEMO &&
    entities.actions.includes("operativ_beslutning") &&
    extracted.tiltak
  ) {
    adjustedConfidence = Math.min(adjustedConfidence + 0.2, 0.95)
    console.log("[v0] 🚨 Boosted confidence for operational decision with tiltak:", adjustedConfidence)
  }

  const fieldConfidence: Record<string, "high" | "suggested" | "missing"> = {}
  for (const field of schema.fields) {
    const value = extracted[field.name]
    if (value !== null && value !== undefined) {
      if (field.name === "tiltak" && entities.actions.includes("operativ_beslutning")) {
        fieldConfidence[field.name] = "high"
      } else if (field.name === "strekning" && typeof value === "string" && value.includes("–")) {
        fieldConfidence[field.name] = "high" // Strekning with dash is definitive
      } else if (field.name === "sted" && entities.roads.length > 0) {
        fieldConfidence[field.name] = "high" // Road references are reliable
      } else if (field.name === "friksjon" && entities.numbers.length === 1) {
        fieldConfidence[field.name] = "high" // Single friction number is clear
      } else {
        fieldConfidence[field.name] = "suggested" // Everything else is suggested
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
    confidence: adjustedConfidence, // Use adjusted confidence
    keywords: classification.keywords,
    extracted,
    fieldConfidence,
    summary,
    missingRequired,
  }
}

/**
 * Build human-readable summary from extracted fields
 */
function buildSummary(schema: RegistrationSchema, extracted: Record<string, any>): string {
  if (schema.type === REGISTRATION_TYPES.VOICE_MEMO) {
    const parts = []
    if (extracted.vakttlf) parts.push("Vakttlf")
    if (extracted.oppringt_av) parts.push(`fra ${extracted.oppringt_av}`)
    if (extracted.hendelse) parts.push(extracted.hendelse)
    if (extracted.sted) parts.push(`ved ${extracted.sted}`)
    if (extracted.tiltak) parts.push(`→ ${extracted.tiltak}`)
    return parts.join(" - ") || "Vaktlogg"
  }

  if (schema.type === REGISTRATION_TYPES.FRIKSJON) {
    const parts = ["Friksjonsmåling"]
    if (extracted.strekning) parts.push(extracted.strekning)
    if (extracted.friksjon) parts.push(`${extracted.friksjon}`)
    return parts.join(" - ")
  }

  if (schema.type === REGISTRATION_TYPES.ARBEIDSDOK) {
    const parts = []
    if (extracted.type_arbeid) parts.push(extracted.type_arbeid)
    if (extracted.sted) parts.push(extracted.sted)
    return parts.join(" i ") || "Arbeidsdok"
  }

  if (schema.type === REGISTRATION_TYPES.INNKJOP) {
    const parts = ["Innkjøp"]
    if (extracted.hva) parts.push(extracted.hva)
    if (extracted.antall) parts.push(`${extracted.antall} stk`)
    return parts.join(" - ")
  }

  if (schema.type === REGISTRATION_TYPES.MASKIN) {
    const parts = ["Maskin"]
    if (extracted.maskin_type) parts.push(extracted.maskin_type)
    if (extracted.arbeid) parts.push(extracted.arbeid)
    return parts.join(" - ")
  }

  return schema.description
}

/**
 * Returns a human-readable label for a registration type
 */
export function getRegistrationTypeLabel(type: RegistrationType): string {
  const labels: Record<RegistrationType, string> = {
    [REGISTRATION_TYPES.FRIKSJON]: "Friksjonsmåling",
    [REGISTRATION_TYPES.ARBEIDSDOK]: "Arbeidsdok",
    [REGISTRATION_TYPES.MASKIN]: "Maskinregistrering",
    [REGISTRATION_TYPES.UTBEDRING]: "Utbedring",
    [REGISTRATION_TYPES.INNKJOP]: "Innkjøp",
    [REGISTRATION_TYPES.AVVIK_RUH]: "Avvik/RUH",
    [REGISTRATION_TYPES.VOICE_MEMO]: "Vaktlogg",
  }
  return labels[type] || "Registrering"
}
