// Automatic incident classification from Norwegian voice transcripts
export function classifyIncident(transcript: string): string | null {
  if (!transcript || transcript.trim() === "") return null

  const t = transcript.toLowerCase()

  // Wildlife hazards
  if (t.match(/\b(elg|hjort|rein|rådyr|dyr)\b.*\b(veg|veien|kjørebane)\b/i)) {
    return "Dyr nær veg"
  }

  // Accidents
  if (t.match(/\b(ulykke|kollisjon|krasj|påkjørsel|utforkjøring)\b/i)) {
    return "Ulykke"
  }

  // Road conditions - ice
  if (t.match(/\b(glatt|is|speilblank|isete|isdekke|islagt)\b/i)) {
    return "Glatt kjørebane"
  }

  // Landslides
  if (t.match(/\b(ras|steinras|jordras|stein.*veg|jord.*veg)\b/i)) {
    return "Ras i vegbane"
  }

  // Road closures
  if (t.match(/\b(stengt|sperret|kolonne|kolonnekjøring|avstengt)\b/i)) {
    return "Stengt veg"
  }

  // Obstacles on road
  if (t.match(/\b(hindring|hinder|gjenstand|stein|løs.*gjenstand)\b.*\b(veg|veien|kjørebane)\b/i)) {
    return "Hindring i veg"
  }

  // Weather hazards
  if (t.match(/\b(tåke|dårlig.*sikt|null.*sikt|snøfokk)\b/i)) {
    return "Dårlig sikt"
  }

  return null
}

export const INCIDENT_COLORS: Record<string, string> = {
  "Dyr nær veg": "#ff6b35",
  Ulykke: "#dc2626",
  "Glatt kjørebane": "#3b82f6",
  "Ras i vegbane": "#f59e0b",
  "Stengt veg": "#ef4444",
  "Hindring i veg": "#eab308",
  "Dårlig sikt": "#6b7280",
}
