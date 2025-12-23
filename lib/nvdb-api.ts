// NVDB API V4 integrasjon for kontraktsområder
// Dokumentasjon: https://nvdbapiles.atlas.vegvesen.no/dokumentasjon/

export interface NVDBContractArea {
  nummer: number
  navn: string
  type?: string
  region?: string
  fylke?: number
  geometri?: {
    type: string
    coordinates: number[][][]
  }
  senterpunkt?: {
    lat: number
    lon: number
  }
}

export interface NVDBLocation {
  name: string
  lat: number
  lon: number
  type: "weather_station" | "city" | "town" | "village" | "poi"
  population?: number
  stationId?: string
  priority: number // Lavere = høyere prioritet
}

const NVDB_API_BASE = "https://nvdbapiles.atlas.vegvesen.no"

// Hent alle kontraktsområder fra NVDB
export async function fetchNVDBContractAreas(): Promise<NVDBContractArea[]> {
  try {
    const response = await fetch(`${NVDB_API_BASE}/omrader/kontraktsomrader`, {
      headers: {
        Accept: "application/json",
        "X-Client": "Mesta-Dashboard",
      },
      next: { revalidate: 86400 }, // Cache i 24 timer
    })

    if (!response.ok) {
      console.error("NVDB API error:", response.status)
      return []
    }

    const data = await response.json()
    return data || []
  } catch (error) {
    console.error("Failed to fetch NVDB contract areas:", error)
    return []
  }
}

// Hent spesifikt kontraktsområde med geometri
export async function fetchNVDBContractArea(nummer: number): Promise<NVDBContractArea | null> {
  try {
    const response = await fetch(`${NVDB_API_BASE}/omrader/kontraktsomrader/${nummer}?inkluder=geometri`, {
      headers: {
        Accept: "application/json",
        "X-Client": "Mesta-Dashboard",
      },
      next: { revalidate: 86400 },
    })

    if (!response.ok) {
      console.error("NVDB API error for contract:", nummer, response.status)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Failed to fetch NVDB contract area:", error)
    return null
  }
}

// Beregn senterpunkt fra polygon-geometri
export function calculateCentroid(coordinates: number[][][]): { lat: number; lon: number } {
  let totalLat = 0
  let totalLon = 0
  let count = 0

  for (const polygon of coordinates) {
    for (const ring of polygon) {
      if (Array.isArray(ring) && ring.length >= 2) {
        totalLon += ring[0]
        totalLat += ring[1]
        count++
      }
    }
  }

  if (count === 0) return { lat: 64.5, lon: 12.0 } // Default Norge senter

  return {
    lat: totalLat / count,
    lon: totalLon / count,
  }
}

// Beregn bounding box fra polygon
export function calculateBoundingBox(coordinates: number[][][]): {
  north: number
  south: number
  east: number
  west: number
} {
  let north = -90
  let south = 90
  let east = -180
  let west = 180

  for (const polygon of coordinates) {
    for (const ring of polygon) {
      if (Array.isArray(ring) && ring.length >= 2) {
        const lon = ring[0]
        const lat = ring[1]
        north = Math.max(north, lat)
        south = Math.min(south, lat)
        east = Math.max(east, lon)
        west = Math.min(west, lon)
      }
    }
  }

  return { north, south, east, west }
}

// Sjekk om et punkt er innenfor bounding box
export function isPointInBoundingBox(
  lat: number,
  lon: number,
  bounds: { north: number; south: number; east: number; west: number },
): boolean {
  return lat <= bounds.north && lat >= bounds.south && lon <= bounds.east && lon >= bounds.west
}

// Filtrer kontraktsområder basert på type (drift/elektro/etc)
export function filterContractsByType(
  contracts: NVDBContractArea[],
  type: "drift" | "elektro" | "all" = "drift",
): NVDBContractArea[] {
  if (type === "all") return contracts

  return contracts.filter((c) => {
    const navn = c.navn.toLowerCase()
    if (type === "drift") {
      return !navn.includes("elektro") && !navn.includes("veilys")
    }
    if (type === "elektro") {
      return navn.includes("elektro") || navn.includes("veilys")
    }
    return true
  })
}

// Grupper kontraktsområder etter fylke/region
export function groupContractsByRegion(contracts: NVDBContractArea[]): Record<string, NVDBContractArea[]> {
  const groups: Record<string, NVDBContractArea[]> = {}

  for (const contract of contracts) {
    // Ekstraher region fra kontraktsnavn eller bruk nummer
    const region = extractRegionFromContract(contract)
    if (!groups[region]) {
      groups[region] = []
    }
    groups[region].push(contract)
  }

  return groups
}

// Ekstraher regionnavn fra kontrakt
function extractRegionFromContract(contract: NVDBContractArea): string {
  const nummer = contract.nummer

  // Basert på nummerering av kontraktsområder
  if (nummer >= 9700 && nummer < 9800) return "Finnmark"
  if (nummer >= 9600 && nummer < 9700) return "Troms"
  if (nummer >= 9500 && nummer < 9600) return "Nordland"
  if (nummer >= 9400 && nummer < 9500) return "Trøndelag"
  if (nummer >= 9300 && nummer < 9400) return "Møre og Romsdal"
  if (nummer >= 9200 && nummer < 9300) return "Vestland"
  if (nummer >= 9100 && nummer < 9200) return "Rogaland"
  if (nummer >= 9000 && nummer < 9100) return "Agder"
  if (nummer >= 8900 && nummer < 9000) return "Vestfold og Telemark"
  if (nummer >= 8800 && nummer < 8900) return "Viken"
  if (nummer >= 8700 && nummer < 8800) return "Oslo"
  if (nummer >= 8600 && nummer < 8700) return "Innlandet"

  return "Øvrige"
}
