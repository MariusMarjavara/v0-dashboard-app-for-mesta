// Service for å hente og synkronisere kontraktsdata fra NVDB
import { createClient } from "@/lib/supabase/server"
import type { GeoJSON } from "geojson"
import { getLocationsByContract } from "./contract-locations-data"
import { getCoordinatesForLocations } from "./location-coordinates"

export interface Contract {
  id: string
  nummer: number
  navn: string
  type: string
  region: string | null
  geometri: GeoJSON.Geometry | null
  bbox_north: number | null
  bbox_south: number | null
  bbox_east: number | null
  bbox_west: number | null
  center_lat: number | null
  center_lon: number | null
}

export interface ContractLocation {
  id: string
  contract_id: string
  contract_nummer: number
  name: string
  lat: number
  lon: number
  location_type: "weather_station" | "city" | "town" | "village" | "poi"
  priority: number
  population: number | null
  station_id: string | null
  source: string
}

const NVDB_API_BASE = "https://nvdbapiles.atlas.vegvesen.no"

export async function fetchContractFromNVDB(nummer: number): Promise<any | null> {
  try {
    const response = await fetch(`${NVDB_API_BASE}/omrader/kontraktsomrader/${nummer}?inkluder=geometri`, {
      headers: {
        Accept: "application/json",
        "X-Client": "Mesta-Dashboard/1.0",
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch {
    return null
  }
}

export async function fetchAllContractsFromNVDB(): Promise<any[]> {
  try {
    const response = await fetch(`${NVDB_API_BASE}/omrader/kontraktsomrader`, {
      headers: {
        Accept: "application/json",
        "X-Client": "Mesta-Dashboard/1.0",
      },
    })

    if (!response.ok) {
      return []
    }

    return await response.json()
  } catch {
    return []
  }
}

// Beregn bounding box fra GeoJSON geometri
export function calculateBoundingBox(geometry: any): {
  north: number
  south: number
  east: number
  west: number
  centerLat: number
  centerLon: number
} | null {
  if (!geometry || !geometry.coordinates) return null

  let north = -90
  let south = 90
  let east = -180
  let west = 180
  let sumLat = 0
  let sumLon = 0
  let count = 0

  function processCoordinates(coords: any) {
    if (typeof coords[0] === "number") {
      // Dette er et punkt [lon, lat]
      const lon = coords[0]
      const lat = coords[1]
      north = Math.max(north, lat)
      south = Math.min(south, lat)
      east = Math.max(east, lon)
      west = Math.min(west, lon)
      sumLat += lat
      sumLon += lon
      count++
    } else {
      // Dette er en array av koordinater
      for (const c of coords) {
        processCoordinates(c)
      }
    }
  }

  processCoordinates(geometry.coordinates)

  if (count === 0) return null

  return {
    north,
    south,
    east,
    west,
    centerLat: sumLat / count,
    centerLon: sumLon / count,
  }
}

// Hent værstasjoner fra Frost API innenfor bounding box
export async function fetchWeatherStationsInArea(
  north: number,
  south: number,
  east: number,
  west: number,
): Promise<ContractLocation[]> {
  // Frost API krever registrering - bruker forhåndsdefinerte stasjoner
  // I produksjon: bruk https://frost.met.no/sources/v0.jsonld?geometry=...

  const stations: ContractLocation[] = []

  // Forhåndsdefinerte værstasjoner i Norge med koordinater
  const knownStations = [
    { name: "Kirkenes lufthavn", lat: 69.7258, lon: 29.8913, id: "SN99710" },
    { name: "Vardø", lat: 70.3714, lon: 31.1108, id: "SN98550" },
    { name: "Vadsø", lat: 70.065, lon: 29.845, id: "SN98200" },
    { name: "Tana Bru", lat: 70.0067, lon: 28.0197, id: "SN97251" },
    { name: "Karasjok", lat: 69.4697, lon: 25.5083, id: "SN97250" },
    { name: "Neiden", lat: 69.7333, lon: 29.3667, id: "SN99400" },
    { name: "Storskog", lat: 69.75, lon: 30.0333, id: "SN99720" },
    // ... flere stasjoner kan legges til
  ]

  for (const station of knownStations) {
    if (station.lat >= south && station.lat <= north && station.lon >= west && station.lon <= east) {
      stations.push({
        id: "",
        contract_id: "",
        contract_nummer: 0,
        name: station.name,
        lat: station.lat,
        lon: station.lon,
        location_type: "weather_station",
        priority: 10, // Høyest prioritet
        population: null,
        station_id: station.id,
        source: "frost",
      })
    }
  }

  return stations
}

// Hent tettsteder innenfor bounding box
export async function fetchSettlementsInArea(
  north: number,
  south: number,
  east: number,
  west: number,
): Promise<ContractLocation[]> {
  // Forhåndsdefinerte tettsteder med befolkning
  const settlements = [
    { name: "Kirkenes", lat: 69.7271, lon: 30.0458, pop: 3529, type: "city" as const },
    { name: "Vadsø", lat: 70.0741, lon: 29.75, pop: 5157, type: "city" as const },
    { name: "Vardø", lat: 70.3714, lon: 31.1108, pop: 1900, type: "town" as const },
    { name: "Tana Bru", lat: 70.0067, lon: 28.0197, pop: 600, type: "town" as const },
    { name: "Karasjok", lat: 69.4697, lon: 25.5083, pop: 1800, type: "town" as const },
    { name: "Neiden", lat: 69.7333, lon: 29.3667, pop: 250, type: "village" as const },
    { name: "Varangerbotn", lat: 70.1667, lon: 28.05, pop: 400, type: "village" as const },
    { name: "Bugøyfjord", lat: 69.9667, lon: 29.6667, pop: 150, type: "village" as const },
    { name: "Høybuktmoen", lat: 69.7167, lon: 29.8667, pop: 200, type: "village" as const },
    { name: "Vestre Jakobselv", lat: 70.0833, lon: 28.9167, pop: 350, type: "village" as const },
    { name: "Kiberg", lat: 70.2833, lon: 30.9833, pop: 200, type: "village" as const },
    { name: "Storskog", lat: 69.75, lon: 30.0333, pop: 50, type: "poi" as const },
    { name: "Levajok", lat: 69.95, lon: 27.25, pop: 100, type: "village" as const },
    { name: "Valjok", lat: 69.85, lon: 26.85, pop: 80, type: "village" as const },
    { name: "Sirma", lat: 69.9833, lon: 27.05, pop: 120, type: "village" as const },
  ]

  const results: ContractLocation[] = []

  for (const s of settlements) {
    if (s.lat >= south && s.lat <= north && s.lon >= west && s.lon <= east) {
      results.push({
        id: "",
        contract_id: "",
        contract_nummer: 0,
        name: s.name,
        lat: s.lat,
        lon: s.lon,
        location_type: s.type,
        priority: s.type === "city" ? 20 : s.type === "town" ? 30 : s.type === "village" ? 40 : 50,
        population: s.pop,
        station_id: null,
        source: "kartverket",
      })
    }
  }

  // Sorter etter befolkning (større først)
  results.sort((a, b) => (b.population || 0) - (a.population || 0))

  return results
}

export async function getContractWithLocations(nummer: number): Promise<{
  contract: Contract | null
  locations: ContractLocation[]
}> {
  const stedsnavn = getLocationsByContract(nummer)

  if (stedsnavn.length > 0) {
    const coordinates = getCoordinatesForLocations(stedsnavn)

    const locations: ContractLocation[] = coordinates.map((coord, index) => ({
      id: "",
      contract_id: "",
      contract_nummer: nummer,
      name: coord.name,
      lat: coord.lat,
      lon: coord.lon,
      location_type: coord.type,
      priority: index + 1,
      population: null,
      station_id: null,
      source: "csv_mapping",
    }))

    return {
      contract: {
        id: "",
        nummer: nummer,
        navn: getContractNameByNumber(nummer),
        type: "statens_vegvesen",
        region: null,
        geometri: null,
        bbox_north: null,
        bbox_south: null,
        bbox_east: null,
        bbox_west: null,
        center_lat: null,
        center_lon: null,
      },
      locations,
    }
  }

  // Fallback to default Finnmark locations if no mapping exists
  return {
    contract: {
      id: "",
      nummer: nummer,
      navn: getContractNameByNumber(nummer),
      type: "statens_vegvesen",
      region: "Øst-Finnmark",
      geometri: null,
      bbox_north: 70.5,
      bbox_south: 69.3,
      bbox_east: 31.2,
      bbox_west: 25.0,
      center_lat: 69.9,
      center_lon: 28.5,
    },
    locations: getFallbackLocations(),
  }
}

// Synkroniser kontrakt til database
export async function syncContractToDatabase(nummer: number): Promise<boolean> {
  const supabase = await createClient()

  const { contract, locations } = await getContractWithLocations(nummer)

  if (!contract) return false

  // Upsert kontrakt
  const { error: contractError } = await supabase.from("contracts").upsert(
    {
      nummer: contract.nummer,
      navn: contract.navn,
      type: contract.type,
      region: contract.region,
      geometri: contract.geometri,
      bbox_north: contract.bbox_north,
      bbox_south: contract.bbox_south,
      bbox_east: contract.bbox_east,
      bbox_west: contract.bbox_west,
      center_lat: contract.center_lat,
      center_lon: contract.center_lon,
      nvdb_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "nummer" },
  )

  if (contractError) {
    console.error("Failed to sync contract:", contractError)
    return false
  }

  // Hent contract ID
  const { data: savedContract } = await supabase.from("contracts").select("id").eq("nummer", nummer).single()

  if (!savedContract) return false

  // Upsert steder
  for (const loc of locations) {
    await supabase.from("contract_locations").upsert(
      {
        contract_id: savedContract.id,
        contract_nummer: nummer,
        name: loc.name,
        lat: loc.lat,
        lon: loc.lon,
        location_type: loc.location_type,
        priority: loc.priority,
        population: loc.population,
        station_id: loc.station_id,
        source: loc.source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "contract_nummer,name" },
    )
  }

  return true
}

function getFallbackLocations(): ContractLocation[] {
  return [
    {
      id: "",
      contract_id: "",
      contract_nummer: 0,
      name: "Kirkenes",
      lat: 69.7271,
      lon: 30.0458,
      location_type: "city",
      priority: 1,
      population: 3529,
      station_id: null,
      source: "fallback",
    },
    {
      id: "",
      contract_id: "",
      contract_nummer: 0,
      name: "Vadsø",
      lat: 70.0741,
      lon: 29.75,
      location_type: "city",
      priority: 2,
      population: 5157,
      station_id: null,
      source: "fallback",
    },
    {
      id: "",
      contract_id: "",
      contract_nummer: 0,
      name: "Vardø",
      lat: 70.3714,
      lon: 31.1108,
      location_type: "town",
      priority: 3,
      population: 1900,
      station_id: null,
      source: "fallback",
    },
    {
      id: "",
      contract_id: "",
      contract_nummer: 0,
      name: "Tana Bru",
      lat: 70.0067,
      lon: 28.0197,
      location_type: "town",
      priority: 4,
      population: 600,
      station_id: null,
      source: "fallback",
    },
    {
      id: "",
      contract_id: "",
      contract_nummer: 0,
      name: "Neiden",
      lat: 69.7333,
      lon: 29.3667,
      location_type: "village",
      priority: 5,
      population: 250,
      station_id: null,
      source: "fallback",
    },
    {
      id: "",
      contract_id: "",
      contract_nummer: 0,
      name: "Varangerbotn",
      lat: 70.1667,
      lon: 28.05,
      location_type: "village",
      priority: 6,
      population: 400,
      station_id: null,
      source: "fallback",
    },
    {
      id: "",
      contract_id: "",
      contract_nummer: 0,
      name: "Karasjok",
      lat: 69.4697,
      lon: 25.5083,
      location_type: "town",
      priority: 7,
      population: 1800,
      station_id: null,
      source: "fallback",
    },
    {
      id: "",
      contract_id: "",
      contract_nummer: 0,
      name: "Storskog",
      lat: 69.75,
      lon: 30.0333,
      location_type: "poi",
      priority: 8,
      population: 50,
      station_id: null,
      source: "fallback",
    },
    {
      id: "",
      contract_id: "",
      contract_nummer: 0,
      name: "Høybuktmoen",
      lat: 69.7167,
      lon: 29.8667,
      location_type: "village",
      priority: 9,
      population: 200,
      station_id: null,
      source: "fallback",
    },
  ]
}

function getContractNameByNumber(nummer: number): string {
  const contractNames: Record<number, string> = {
    9507: "9507 Øst-Finnmark",
    9506: "9506 Vest-Finnmark",
    9505: "9505 Nord-Troms",
    9504: "9504 Sør-Troms",
    9503: "9503 Midtre Hålogaland",
    9502: "9502 Salten",
    9508: "9508 Ofoten",
    9406: "9406 Trøndelag nord",
    9405: "9405 Trøndelag Sør",
    9404: "9404 Sunnmøre og Indre Romsdal",
    9403: "9403 Nordmøre",
    9306: "9306 Nordfjord",
    9305: "9305 Sunnfjord",
    9304: "9304 Bergen",
    9303: "9303 Hardanger og Sogn",
    9302: "9302 Haugesund",
    9301: "9301 Stavanger",
    9204: "9204 Agder",
    9201: "9201 Vestfold og Telemark øst",
    9108: "9108 Hedmark",
    9107: "9107 Gudbrandsdalen",
    9106: "9106 Gjøvik–Romerike",
    9104: "9104 Oslo–Gardermoen",
    9103: "9103 Østfold–Follo",
    9102: "9102 Hallingdal og Valdres",
    9101: "9101 Drammen",
  }
  return contractNames[nummer] || `Kontrakt ${nummer}`
}
