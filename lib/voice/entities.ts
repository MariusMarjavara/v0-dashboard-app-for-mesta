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

  // PRIORITIZE strekning extraction FIRST - this is critical
  const strekningPattern =
    /\bmellom\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)\s+og\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/gi
  const strekningMatch = strekningPattern.exec(text)
  if (strekningMatch) {
    const strekning = `${strekningMatch[1]} – ${strekningMatch[2]}`
    entities.places.push(strekning)
    console.log("[v0] 🛣️ STREKNING detected (PRIORITY):", strekning)
    // Don't return early - continue extracting other entities
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
    "stort",
    "sett",
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

  // Better number extraction - include friction values and counts
  const numberPattern = /\b(\d+(?:[,.]\d+)?)\b/g
  while ((match = numberPattern.exec(text)) !== null) {
    const num = Number.parseFloat(match[1].replace(",", "."))
    if (!Number.isNaN(num)) {
      entities.numbers.push(num)
    }
  }

  // Also extract "over X" and "under X" patterns for friction
  const overMatch = t.match(/over\s+(\d+[,.]?\d+)/i)
  if (overMatch) {
    const val = Number.parseFloat(overMatch[1].replace(",", "."))
    if (!Number.isNaN(val) && val > 0 && val < 1) {
      entities.numbers.push(val)
      console.log("[v0] 🔢 Friction value from 'over':", val)
    }
  }

  // Improved caller detection
  const callerPattern =
    /(?:oppringt av|ringte? fra|telefon fra|melding fra)\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/i
  const callerMatch = callerPattern.exec(text)
  if (callerMatch) {
    entities.callers.push(callerMatch[1])
    console.log("[v0] 📞 CALLER detected:", callerMatch[1])
  }

  if (t.includes("bts") || t.includes("vts") || t.includes("vegtrafikksentral") || t.includes("trafikksentral")) {
    entities.callers.push("Vegtrafikksentral")
  }
  if (t.includes("politi")) entities.callers.push("Politiet")
  if (t.includes("trafikant") || t.includes("bilist")) entities.callers.push("Trafikant")
  if (t.includes("brann") || t.includes("amk") || t.includes("ambulanse")) entities.callers.push("AMK/Brann")

  // Better action detection
  if (t.includes("brøyt")) entities.actions.push("brøyting")
  if (t.includes("strø")) entities.actions.push("strøing")
  if (t.includes("målt") || t.includes("friksjon") || t.includes("kjørt friksjon"))
    entities.actions.push("friksjonsmåling")
  if (t.includes("befaring") || t.includes("sjekk")) entities.actions.push("befaring")
  if (
    t.includes("kalt ut") ||
    t.includes("kalte ut") ||
    t.includes("bestilt") ||
    t.includes("bedt om") ||
    t.includes("iverksatt") ||
    t.includes("strøbil") ||
    t.includes("brøytebil")
  ) {
    entities.actions.push("operativ_beslutning")
    console.log("[v0] 🚨 OPERATIONAL DECISION detected")
  }
  if (t.includes("stikker") || t.includes("brøytestikk")) entities.actions.push("brøytestikksetting")

  // Extended keyword list
  const keywordList = [
    "glatt",
    "isete",
    "glatte",
    "snø",
    "mye snø",
    "snødrev",
    "stengt",
    "ulykke",
    "sikt",
    "dårlig sikt",
    "friksjon",
    "brøyting",
    "strøing",
    "vakttlf",
    "oppringt",
    "ringte",
    "telefon",
    "varslet",
    "tiltak",
    "kjøpt",
    "handlet",
    "maskin",
    "service",
    "skilt",
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
  // Prioritize strekning over sted - critical fix
  if (field.name === "strekning") {
    // ALWAYS use strekning if available (prioritized)
    const strekningPlace = entities.places.find((p) => p.includes("–"))
    if (strekningPlace) {
      console.log("[v0] ✅ Using STREKNING for field:", strekningPlace)
      return strekningPlace
    }

    // Otherwise fall through to road or place
  }

  if (field.name === "sted" || field.name === "strekning") {
    // If we have a strekning, use it (highest priority)
    const strekningPlace = entities.places.find((p) => p.includes("–"))
    if (strekningPlace) {
      return strekningPlace
    }

    // Prefer road references (very reliable)
    if (entities.roads.length > 0) {
      return entities.roads[0]
    }

    // Use any place name if available - be less strict
    if (entities.places.length > 0) {
      return entities.places[0]
    }

    return null
  }

  if (field.name === "vakttlf") {
    const t = entities.rawText.toLowerCase()
    if (t.includes("ble oppringt") || t.includes("oppringt av")) return true
    if (t.includes("ringte") || t.includes("telefon fra")) return true
    if (t.includes("vakttlf") || t.includes("vts") || t.includes("vegtrafikksentral")) return true
    if (t.includes("varslet") || t.includes("melding fra")) return true
    if (entities.callers.length > 0) return true
    return false
  }

  if (field.name === "oppringt_av" || field.name === "ringer") {
    if (entities.callers.length > 0) {
      return entities.callers[0]
    }
    const t = entities.rawText.toLowerCase()
    if (t.includes("vts") || t.includes("vegtrafikksentral") || t.includes("trafikksentral")) return "Vegtrafikksentral"
    if (t.includes("politi")) return "Politiet"
    if (t.includes("trafikant") || t.includes("bilist")) return "Trafikant"
    if (t.includes("brann") || t.includes("amk")) return "AMK/Brann"
    // If we know it's a vakttlf but don't know who called, at least put "Annet"
    if (t.includes("oppringt") || t.includes("ringte") || t.includes("vakttlf")) return "Annet"
    return null
  }

  if (field.name === "hendelse") {
    const t = entities.rawText.toLowerCase()
    if (t.includes("glatt") || t.includes("glatte") || t.includes("isete") || t.includes("islagt")) return "Glatt vei"
    if (t.includes("snø") || t.includes("mye snø") || t.includes("snødrev") || t.includes("snøfall")) return "Glatt vei"
    if (t.includes("stengt") || t.includes("sperret")) return "Stengt vei"
    if (t.includes("ulykke") || t.includes("kollisjon") || t.includes("utforkjøring")) return "Ulykke"
    if (t.includes("sikt") || t.includes("dårlig sikt") || t.includes("null sikt")) return "Dårlig sikt"
    // If no specific match but we have keywords, suggest "Annet"
    if (entities.keywords.length > 0) return "Annet"
    return null
  }

  if (field.name === "tiltak") {
    const t = entities.rawText.toLowerCase()

    // FIRST: Check for explicit operational decision keywords
    if (entities.actions.includes("operativ_beslutning")) {
      // Extract the specific action from context
      if (t.includes("brøyt") || t.includes("brøytebil")) return "Brøyting"
      if (t.includes("strø") || t.includes("strødde") || t.includes("strø") || t.includes("salt")) return "Strøing"
      if (t.includes("befaring") || t.includes("sjekk")) return "Befaring"
      // Default for operational decision
      return "Brøyting"
    }

    // SECOND: Check for action verbs in past tense (work was done)
    if (entities.actions.includes("brøyting") || t.includes("brøytet") || t.includes("brøyte")) return "Brøyting"
    if (entities.actions.includes("strøing") || t.includes("strødde") || t.includes("strø")) return "Strøing"
    if (entities.actions.includes("befaring") || t.includes("befaring")) return "Befaring"

    // THIRD: Check if they said "ingen tiltak" explicitly
    if (t.includes("ingen tiltak") || t.includes("ikke iverksatt")) return "Ingen tiltak"

    return null
  }

  if (field.name === "operativ_status") {
    const t = entities.rawText.toLowerCase()
    if (entities.actions.includes("operativ_beslutning")) {
      if (t.includes("utført") || t.includes("ferdig")) {
        if (t.includes("strø")) return "Utført strøing"
        if (t.includes("brøyt")) return "Utført brøyting"
      }
      if (t.includes("under") || t.includes("pågår")) return "Under utføring"
      // Default: action was ordered
      if (t.includes("strø")) return "Utført strøing"
      if (t.includes("brøyt")) return "Utført brøyting"
    }
    return null
  }

  // Better friction value extraction
  if (field.name === "friksjon") {
    // Look for numbers between 0 and 1
    const frictionValue = entities.numbers.find((n) => n > 0 && n < 1)
    if (frictionValue !== undefined) {
      console.log("[v0] ✅ Extracted friction value:", frictionValue)
      return frictionValue
    }
    return null
  }

  // Winter work type
  if (field.name === "type_arbeid") {
    if (entities.actions.includes("brøytestikksetting")) return "Brøytestikksetting"
    if (entities.actions.includes("skiltkosting") || entities.keywords.includes("skilt")) return "Skiltkosting"
    if (entities.keywords.includes("leskur")) return "Rydding av leskur"
    return "Annet"
  }

  // Fields for Innkjøp schema
  if (field.name === "hva") {
    const t = entities.rawText.toLowerCase()

    // Try pattern: "kjøpt X" or "handlet X" or "kjøpt inn X"
    const whatMatch = entities.rawText.match(
      /(?:kjøpt(?:\s+inn)?|handlet)\s+([^,.ved]+?)(?:\s+(?:i|ved|på|fra)|[,.]|$)/i,
    )
    if (whatMatch) {
      const item = whatMatch[1].trim()
      // Clean up common filler words
      const cleaned = item.replace(/\b(noen|litt|flere|masse)\b/gi, "").trim()
      if (cleaned.length > 0) {
        return cleaned
      }
    }

    // Fallback: try "X stk" pattern
    const countMatch = entities.rawText.match(/(\d+)\s*stk\s+([^,.]+)/i)
    if (countMatch) {
      return countMatch[2].trim()
    }

    return null
  }

  if (field.name === "hvor" && schemaType === "innkjøp") {
    const t = entities.rawText.toLowerCase()

    // Try pattern: "i/ved/på/fra STORE"
    const whereMatch = entities.rawText.match(/(?:i|ved|på|fra|hos)\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/i)
    if (whereMatch) {
      const store = whereMatch[1]
      // Common Norwegian stores
      if (
        [
          "biltema",
          "jula",
          "tools",
          "coop",
          "extra",
          "meny",
          "rema",
          "kiwi",
          "obs",
          "europris",
          "maxbo",
          "byggmakker",
        ].some((s) => store.toLowerCase().includes(s))
      ) {
        return store
      }
      // Generic store mention
      if (t.includes("butikk") || t.includes("handel")) {
        return store
      }
    }

    // Check for store names anywhere in text
    const storeNames = [
      "Biltema",
      "Jula",
      "Tools",
      "Coop",
      "Extra",
      "Meny",
      "Rema",
      "Kiwi",
      "OBS",
      "Europris",
      "Maxbo",
      "Byggmakker",
    ]
    for (const storeName of storeNames) {
      if (entities.rawText.match(new RegExp(`\\b${storeName}\\b`, "i"))) {
        return storeName
      }
    }

    return null
  }

  if (field.name === "antall" && schemaType === "innkjøp") {
    // Look for "X stk" pattern
    const countMatch = entities.rawText.match(/(\d+)\s*stk/i)
    if (countMatch) {
      const count = Number.parseInt(countMatch[1])
      if (count > 0 && count < 10000) {
        return count
      }
    }
    return null
  }

  // Fields for Maskin schema
  if (field.name === "maskin_type") {
    if (entities.rawText.toLowerCase().includes("traktor")) return "Traktor"
    if (entities.rawText.toLowerCase().includes("fres")) return "Fres"
    if (entities.rawText.toLowerCase().includes("bil")) return "Bil"
    return "Annet"
  }

  if (field.name === "arbeid") {
    if (entities.actions.includes("maskin")) return entities.rawText.substring(0, 100)
    return null
  }

  // Count field (e.g., antall_stikker)
  if (field.type === "number" && field.name.includes("antall")) {
    // Use first integer found
    const count = entities.numbers.find((n) => Number.isInteger(n) && n > 0 && n < 1000)
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
