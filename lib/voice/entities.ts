/**
 * Entity Extraction System
 *
 * Phase 1: Extract raw entities from transcript (places, numbers, keywords, roads)
 * Phase 2: Map entities to schema fields based on context
 *
 * Principle: Parse what was said, then figure out where it belongs
 */

export interface ExtractedEntities {
  places: string[]
  numbers: number[]
  keywords: string[]
  roads: string[]
  callers: string[]
  actions: string[]
  rawText: string
}

/**
 * Extract all entities from transcript without any schema knowledge
 */
export function extractEntities(text: string): ExtractedEntities {
  const t = text.toLowerCase()
  const entities: ExtractedEntities = {
    places: [],
    numbers: [],
    keywords: [],
    roads: [],
    callers: [],
    actions: [],
    rawText: text,
  }

  // List of Norwegian words that are NOT places
  const stopWords = [
    "hver",
    "gang",
    "båten",
    "veien",
    "under",
    "over",
    "annet",
    "noen",
    "alle",
    "ingen",
    "samme",
    "hele",
    "neste",
    "forrige",
  ]

  // Extract place names (capitalized words after location prepositions)
  // But filter out obvious non-places
  const placePattern =
    /(?:i|langs|ved|på|fra|til|mellom|over|strekning)\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/gi
  let match
  while ((match = placePattern.exec(text)) !== null) {
    const candidate = match[1].toLowerCase()
    // Only add if it's not a stopword and is reasonably long
    if (!stopWords.some((sw) => candidate.includes(sw)) && candidate.length >= 4) {
      entities.places.push(match[1])
    }
  }

  // This catches "Bjørnevatn", "Kirkenes", etc. mentioned directly
  const standalonePattern = /\b([A-ZÆØÅ][a-zæøå]{3,}(?:\s+[A-ZÆØÅ][a-zæøå]+)?)\b/g
  while ((match = standalonePattern.exec(text)) !== null) {
    const candidate = match[1]
    const candidateLower = candidate.toLowerCase()

    // Skip if already extracted or is a stopword
    if (entities.places.includes(candidate)) continue
    if (stopWords.some((sw) => candidateLower.includes(sw))) continue

    // Skip if it's at the start and might be a person's name
    if (match.index < 10) continue

    // Add if it looks like a Norwegian place name
    if (candidate.length >= 5 && !candidateLower.includes("entreprenør")) {
      entities.places.push(candidate)
    }
  }

  // Extract road references (FV, RV, E)
  const roadPattern = /\b([EFR]V?\s?\d+)\b/gi
  while ((match = roadPattern.exec(text)) !== null) {
    entities.roads.push(match[1].replace(/\s/g, ""))
  }

  // Extract numbers (including decimals with comma or dot)
  const numberPattern = /\b(\d+(?:[,.]\d+)?)\b/g
  while ((match = numberPattern.exec(text)) !== null) {
    const num = Number.parseFloat(match[1].replace(",", "."))
    if (!Number.isNaN(num)) {
      entities.numbers.push(num)
    }
  }

  // Look for "oppringt av [Name]" pattern
  const callerMatch = text.match(/oppringt av\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/i)
  if (callerMatch) {
    entities.callers.push(callerMatch[1])
  }

  if (t.includes("vts") || t.includes("vegtrafikksentral")) entities.callers.push("Vegtrafikksentral")
  if (t.includes("politi")) entities.callers.push("Politiet")
  if (t.includes("trafikant")) entities.callers.push("Trafikant")
  if (t.includes("brann") || t.includes("amk")) entities.callers.push("AMK/Brann")

  // Extract action keywords
  if (t.includes("brøyt")) entities.actions.push("brøyting")
  if (t.includes("strø")) entities.actions.push("strøing")
  if (t.includes("målt") || t.includes("friksjon")) entities.actions.push("friksjonsmåling")
  if (t.includes("befaring")) entities.actions.push("befaring")
  if (t.includes("kaller ut") || t.includes("kalte ut")) entities.actions.push("kallet_ut")
  if (t.includes("stikker") || t.includes("brøytestikk")) entities.actions.push("brøytestikksetting")

  // Extract general keywords
  const keywordList = [
    "glatt",
    "stengt",
    "ulykke",
    "sikt",
    "friksjon",
    "brøyting",
    "strøing",
    "vakttlf",
    "oppringt",
    "varslet",
    "tiltak",
  ]
  for (const keyword of keywordList) {
    if (t.includes(keyword)) {
      entities.keywords.push(keyword)
    }
  }

  return entities
}

/**
 * Map extracted entities to schema fields based on field definitions
 * This is where the "best guess" logic lives
 */
export function mapEntitiesToSchema(
  entities: ExtractedEntities,
  schema: {
    type: string
    fields: Array<{ name: string; type: string; required: boolean; options?: string[] }>
  },
): Record<string, any> {
  const mapped: Record<string, any> = {}

  for (const field of schema.fields) {
    const value = mapEntityToField(entities, field, schema.type)
    if (value !== null) {
      mapped[field.name] = value
    }
  }

  return mapped
}

/**
 * Map a single field using available entities
 * Returns null if no match found (not blocking - just unknown)
 */
function mapEntityToField(
  entities: ExtractedEntities,
  field: { name: string; type: string; options?: string[] },
  schemaType: string,
): any {
  if (field.name === "sted" || field.name === "strekning") {
    // Prefer road references first (most reliable)
    if (entities.roads.length > 0) {
      return entities.roads[0]
    }

    // Use place names if available
    if (entities.places.length === 1) {
      return entities.places[0]
    }

    // If multiple places, try to pick the best one
    if (entities.places.length > 1) {
      // Prefer longer names (likely to be actual places vs common words)
      const sorted = [...entities.places].sort((a, b) => b.length - a.length)
      return sorted[0]
    }

    return null
  }

  if (field.name === "oppringt_av" || field.name === "ringer") {
    // Use extracted caller (from "oppringt av [Name]" pattern) first
    if (entities.callers.length > 0) {
      return entities.callers[0]
    }
    return null
  }

  // Caller field
  if (field.name === "oppringt_av") {
    return entities.callers.length > 0 ? entities.callers[0] : null
  }

  // Incident type field
  if (field.name === "hendelse") {
    if (entities.keywords.includes("glatt")) return "Glatt vei"
    if (entities.keywords.includes("stengt")) return "Stengt vei"
    if (entities.keywords.includes("ulykke")) return "Ulykke"
    if (entities.keywords.includes("sikt")) return "Dårlig sikt"
    return "Annet" // Default fallback
  }

  // Action/tiltak field
  if (field.name === "tiltak") {
    if (entities.actions.includes("brøyting")) return "Brøyting"
    if (entities.actions.includes("strøing")) return "Strøing"
    if (entities.actions.includes("befaring")) return "Befaring"
    return null
  }

  // Friction value field
  if (field.name === "friksjon") {
    // Look for numbers between 0 and 1
    const frictionValue = entities.numbers.find((n) => n > 0 && n < 1)
    return frictionValue !== undefined ? frictionValue : null
  }

  // Winter work type
  if (field.name === "type_arbeid") {
    if (entities.actions.includes("brøytestikksetting")) return "Brøytestikksetting"
    if (entities.keywords.includes("skiltkosting")) return "Skiltkosting"
    if (entities.keywords.includes("leskur")) return "Rydding av leskur"
    return "Annet"
  }

  // Count field (e.g., antall_stikker)
  if (field.type === "number" && field.name.includes("antall")) {
    // Use first integer found
    const count = entities.numbers.find((n) => Number.isInteger(n) && n > 0)
    return count !== undefined ? count : null
  }

  // Boolean fields
  if (field.type === "boolean") {
    if (field.name === "tiltak_startet") {
      if (entities.actions.includes("kallet_ut")) return true
      if (entities.keywords.includes("ingen") && entities.keywords.includes("tiltak")) return false
    }
    return null
  }

  // Comment/description field: collect unmapped text
  if (field.name === "kommentar" || field.name === "beskrivelse") {
    return entities.rawText.substring(0, 200)
  }

  return null
}
