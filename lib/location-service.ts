// Tjeneste for å hente og prioritere lokasjoner for et kontraktsområde

import { fetchWeatherStationsInArea, stationToLocation } from "./frost-api"
import { calculateBoundingBox, calculateCentroid, type NVDBContractArea } from "./nvdb-api"
import type { Location } from "./types"

export interface PrioritizedLocation extends Location {
  priority: number
  source: "weather_station" | "city" | "town" | "village" | "poi"
  stationId?: string
  population?: number
}

// Kjente tettsteder i Norge med befolkningsdata
const norwegianPlaces: Array<{
  name: string
  lat: number
  lon: number
  type: "city" | "town" | "village"
  population: number
  county: string
}> = [
  // Finnmark
  { name: "Kirkenes", lat: 69.7271, lon: 30.0454, type: "town", population: 3500, county: "Finnmark" },
  { name: "Vardø", lat: 70.3716, lon: 31.1099, type: "town", population: 2100, county: "Finnmark" },
  { name: "Vadsø", lat: 70.0741, lon: 29.7508, type: "town", population: 5100, county: "Finnmark" },
  { name: "Hammerfest", lat: 70.6634, lon: 23.6821, type: "city", population: 10300, county: "Finnmark" },
  { name: "Alta", lat: 69.9689, lon: 23.2716, type: "city", population: 15000, county: "Finnmark" },
  { name: "Honningsvåg", lat: 70.9827, lon: 25.9706, type: "town", population: 2400, county: "Finnmark" },
  { name: "Karasjok", lat: 69.4718, lon: 25.5141, type: "village", population: 1800, county: "Finnmark" },
  { name: "Kautokeino", lat: 69.0112, lon: 23.0464, type: "village", population: 1400, county: "Finnmark" },
  { name: "Tana Bru", lat: 70.0095, lon: 27.738, type: "village", population: 500, county: "Finnmark" },
  { name: "Lakselv", lat: 70.0516, lon: 24.9725, type: "town", population: 2300, county: "Finnmark" },
  { name: "Berlevåg", lat: 70.8577, lon: 29.0866, type: "village", population: 950, county: "Finnmark" },
  { name: "Båtsfjord", lat: 70.6348, lon: 29.7186, type: "village", population: 2100, county: "Finnmark" },

  // Troms
  { name: "Tromsø", lat: 69.6496, lon: 18.956, type: "city", population: 77000, county: "Troms" },
  { name: "Harstad", lat: 68.7989, lon: 16.5417, type: "city", population: 25000, county: "Troms" },
  { name: "Finnsnes", lat: 69.234, lon: 17.9809, type: "town", population: 4700, county: "Troms" },
  { name: "Bardufoss", lat: 69.0583, lon: 18.5222, type: "village", population: 2800, county: "Troms" },
  { name: "Skibotn", lat: 69.3833, lon: 20.25, type: "village", population: 500, county: "Troms" },
  { name: "Nordkjosbotn", lat: 69.2167, lon: 19.55, type: "village", population: 400, county: "Troms" },

  // Nordland
  { name: "Bodø", lat: 67.2804, lon: 14.4049, type: "city", population: 52000, county: "Nordland" },
  { name: "Narvik", lat: 68.4385, lon: 17.4269, type: "city", population: 14500, county: "Nordland" },
  { name: "Mo i Rana", lat: 66.3128, lon: 14.1428, type: "city", population: 18500, county: "Nordland" },
  { name: "Mosjøen", lat: 65.8439, lon: 13.1907, type: "town", population: 9800, county: "Nordland" },
  { name: "Svolvær", lat: 68.2342, lon: 14.5685, type: "town", population: 4700, county: "Nordland" },
  { name: "Leknes", lat: 68.1491, lon: 13.6107, type: "town", population: 3400, county: "Nordland" },
  { name: "Sortland", lat: 68.6928, lon: 15.4125, type: "town", population: 5200, county: "Nordland" },
  { name: "Fauske", lat: 67.2586, lon: 15.3917, type: "town", population: 6200, county: "Nordland" },
  { name: "Sandnessjøen", lat: 66.0183, lon: 12.6318, type: "town", population: 6100, county: "Nordland" },
  { name: "Brønnøysund", lat: 65.4742, lon: 12.2106, type: "town", population: 5100, county: "Nordland" },
  { name: "Stokmarknes", lat: 68.5667, lon: 14.9167, type: "town", population: 3400, county: "Nordland" },
  { name: "Andenes", lat: 69.3147, lon: 16.1189, type: "town", population: 2600, county: "Nordland" },

  // Trøndelag
  { name: "Trondheim", lat: 63.4305, lon: 10.3951, type: "city", population: 207000, county: "Trøndelag" },
  { name: "Steinkjer", lat: 64.0147, lon: 11.4953, type: "town", population: 12000, county: "Trøndelag" },
  { name: "Namsos", lat: 64.4667, lon: 11.4992, type: "town", population: 8500, county: "Trøndelag" },
  { name: "Levanger", lat: 63.7464, lon: 11.2992, type: "town", population: 10000, county: "Trøndelag" },
  { name: "Verdal", lat: 63.7928, lon: 11.4833, type: "town", population: 7500, county: "Trøndelag" },
  { name: "Stjørdal", lat: 63.4692, lon: 10.9172, type: "town", population: 11500, county: "Trøndelag" },
  { name: "Røros", lat: 62.5744, lon: 11.385, type: "town", population: 3700, county: "Trøndelag" },
  { name: "Orkanger", lat: 63.3, lon: 9.85, type: "town", population: 8000, county: "Trøndelag" },

  // Møre og Romsdal
  { name: "Ålesund", lat: 62.4722, lon: 6.1549, type: "city", population: 48000, county: "Møre og Romsdal" },
  { name: "Molde", lat: 62.7372, lon: 7.1608, type: "city", population: 27000, county: "Møre og Romsdal" },
  { name: "Kristiansund", lat: 63.1139, lon: 7.7279, type: "city", population: 17500, county: "Møre og Romsdal" },

  // Vestland
  { name: "Bergen", lat: 60.393, lon: 5.3242, type: "city", population: 285000, county: "Vestland" },
  { name: "Førde", lat: 61.4527, lon: 5.8534, type: "town", population: 10000, county: "Vestland" },
  { name: "Sogndal", lat: 61.2297, lon: 7.0944, type: "town", population: 4000, county: "Vestland" },
  { name: "Florø", lat: 61.5997, lon: 5.0328, type: "town", population: 8800, county: "Vestland" },
  { name: "Voss", lat: 60.6286, lon: 6.4219, type: "town", population: 6700, county: "Vestland" },
  { name: "Odda", lat: 60.0692, lon: 6.5497, type: "town", population: 5000, county: "Vestland" },

  // Rogaland
  { name: "Stavanger", lat: 58.97, lon: 5.7331, type: "city", population: 144000, county: "Rogaland" },
  { name: "Sandnes", lat: 58.8517, lon: 5.7358, type: "city", population: 80000, county: "Rogaland" },
  { name: "Haugesund", lat: 59.4138, lon: 5.268, type: "city", population: 37500, county: "Rogaland" },
  { name: "Egersund", lat: 58.4522, lon: 6.0003, type: "town", population: 11000, county: "Rogaland" },

  // Agder
  { name: "Kristiansand", lat: 58.1467, lon: 8.0, type: "city", population: 93000, county: "Agder" },
  { name: "Arendal", lat: 58.4619, lon: 8.7722, type: "city", population: 33000, county: "Agder" },
  { name: "Grimstad", lat: 58.3406, lon: 8.5939, type: "town", population: 12500, county: "Agder" },
  { name: "Mandal", lat: 58.0294, lon: 7.4608, type: "town", population: 10500, county: "Agder" },
  { name: "Farsund", lat: 58.0975, lon: 6.8039, type: "town", population: 6000, county: "Agder" },
  { name: "Flekkefjord", lat: 58.2969, lon: 6.6611, type: "town", population: 6500, county: "Agder" },

  // Vestfold og Telemark
  { name: "Skien", lat: 59.2097, lon: 9.6089, type: "city", population: 55000, county: "Vestfold og Telemark" },
  { name: "Porsgrunn", lat: 59.1406, lon: 9.6561, type: "city", population: 36500, county: "Vestfold og Telemark" },
  { name: "Sandefjord", lat: 59.1314, lon: 10.2167, type: "city", population: 45000, county: "Vestfold og Telemark" },
  { name: "Tønsberg", lat: 59.2672, lon: 10.4078, type: "city", population: 42000, county: "Vestfold og Telemark" },
  { name: "Larvik", lat: 59.0536, lon: 10.0269, type: "city", population: 27000, county: "Vestfold og Telemark" },
  { name: "Horten", lat: 59.4172, lon: 10.4847, type: "city", population: 27500, county: "Vestfold og Telemark" },
  { name: "Notodden", lat: 59.5594, lon: 9.2631, type: "town", population: 9000, county: "Vestfold og Telemark" },

  // Viken
  { name: "Drammen", lat: 59.7439, lon: 10.2045, type: "city", population: 70000, county: "Viken" },
  { name: "Fredrikstad", lat: 59.2181, lon: 10.9298, type: "city", population: 83000, county: "Viken" },
  { name: "Sarpsborg", lat: 59.2839, lon: 11.1097, type: "city", population: 56000, county: "Viken" },
  { name: "Moss", lat: 59.4358, lon: 10.6567, type: "city", population: 32000, county: "Viken" },
  { name: "Halden", lat: 59.1228, lon: 11.3875, type: "town", population: 21000, county: "Viken" },
  { name: "Kongsberg", lat: 59.6692, lon: 9.6508, type: "town", population: 21000, county: "Viken" },
  { name: "Jessheim", lat: 60.1433, lon: 11.1764, type: "town", population: 18000, county: "Viken" },
  { name: "Ski", lat: 59.7189, lon: 10.8372, type: "town", population: 14000, county: "Viken" },
  { name: "Lillestrøm", lat: 59.9558, lon: 11.0492, type: "city", population: 17500, county: "Viken" },

  // Oslo
  { name: "Oslo", lat: 59.9139, lon: 10.7522, type: "city", population: 700000, county: "Oslo" },

  // Innlandet
  { name: "Hamar", lat: 60.7945, lon: 11.0679, type: "city", population: 32000, county: "Innlandet" },
  { name: "Lillehammer", lat: 61.1153, lon: 10.4662, type: "town", population: 28000, county: "Innlandet" },
  { name: "Gjøvik", lat: 60.7957, lon: 10.6916, type: "town", population: 20000, county: "Innlandet" },
  { name: "Elverum", lat: 60.8819, lon: 11.5614, type: "town", population: 14500, county: "Innlandet" },
  { name: "Kongsvinger", lat: 60.1917, lon: 11.9994, type: "town", population: 12500, county: "Innlandet" },
]

// Hent prioriterte lokasjoner for et kontraktsområde
export async function getPrioritizedLocations(
  contractArea: NVDBContractArea | null,
  contractId: string,
  maxLocations = 9,
): Promise<PrioritizedLocation[]> {
  // Beregn bounds fra kontraktsområde eller bruk forhåndsdefinerte
  let bounds: { north: number; south: number; east: number; west: number }
  let center: { lat: number; lon: number }

  if (contractArea?.geometri?.coordinates) {
    bounds = calculateBoundingBox(contractArea.geometri.coordinates as number[][][])
    center = calculateCentroid(contractArea.geometri.coordinates as number[][][])
  } else {
    // Bruk forhåndsdefinerte grenser basert på kontrakts-ID
    const predefinedBounds = getPredefinedBounds(contractId)
    bounds = predefinedBounds.bounds
    center = predefinedBounds.center
  }

  const locations: PrioritizedLocation[] = []

  // 1. Hent værstasjoner (høyeste prioritet)
  const weatherStations = await fetchWeatherStationsInArea(bounds)
  for (const station of weatherStations) {
    const loc = stationToLocation(station)
    locations.push({
      ...loc,
      source: "weather_station",
      priority: 1,
    })
  }

  // 2. Legg til tettsteder (prioriter etter befolkning)
  const placesInArea = norwegianPlaces.filter((place) => {
    return (
      place.lat <= bounds.north && place.lat >= bounds.south && place.lon <= bounds.east && place.lon >= bounds.west
    )
  })

  // Sorter etter befolkning (høyest først)
  placesInArea.sort((a, b) => b.population - a.population)

  for (const place of placesInArea) {
    // Sjekk om vi allerede har en lokasjon nær dette stedet
    const isDuplicate = locations.some((loc) => {
      const distance = getDistanceKm(loc.lat, loc.lon, place.lat, place.lon)
      return distance < 10 // Innen 10 km regnes som duplikat
    })

    if (!isDuplicate) {
      locations.push({
        name: place.name,
        lat: place.lat,
        lon: place.lon,
        type: place.type,
        source: place.type,
        population: place.population,
        priority: place.type === "city" ? 2 : place.type === "town" ? 3 : 4,
      })
    }
  }

  // 3. Sorter etter prioritet og velg de mest relevante
  locations.sort((a, b) => {
    // Prioritet først
    if (a.priority !== b.priority) return a.priority - b.priority
    // Deretter avstand fra sentrum
    const distA = getDistanceKm(a.lat, a.lon, center.lat, center.lon)
    const distB = getDistanceKm(b.lat, b.lon, center.lat, center.lon)
    return distA - distB
  })

  // 4. Velg et godt utvalg med geografisk spredning
  const selected: PrioritizedLocation[] = []
  const gridSize = Math.ceil(Math.sqrt(maxLocations))
  const latStep = (bounds.north - bounds.south) / gridSize
  const lonStep = (bounds.east - bounds.west) / gridSize

  // Prøv å velge minst én lokasjon fra hver celle i gridet
  for (let i = 0; i < gridSize && selected.length < maxLocations; i++) {
    for (let j = 0; j < gridSize && selected.length < maxLocations; j++) {
      const cellLat = bounds.south + latStep * (i + 0.5)
      const cellLon = bounds.west + lonStep * (j + 0.5)

      // Finn nærmeste lokasjon til celle-sentrum som ikke allerede er valgt
      let bestLoc: PrioritizedLocation | null = null
      let bestScore = Number.POSITIVE_INFINITY

      for (const loc of locations) {
        if (selected.some((s) => s.name === loc.name)) continue

        const dist = getDistanceKm(loc.lat, loc.lon, cellLat, cellLon)
        const score = dist + loc.priority * 10 // Vektlegg prioritet

        if (score < bestScore) {
          bestScore = score
          bestLoc = loc
        }
      }

      if (bestLoc) {
        selected.push(bestLoc)
      }
    }
  }

  // Fyll opp med resterende høyt prioriterte lokasjoner
  for (const loc of locations) {
    if (selected.length >= maxLocations) break
    if (!selected.some((s) => s.name === loc.name)) {
      selected.push(loc)
    }
  }

  return selected.slice(0, maxLocations)
}

// Beregn avstand mellom to punkter (Haversine)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Jordens radius i km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Forhåndsdefinerte grenser for kontrakter
function getPredefinedBounds(contractId: string): {
  bounds: { north: number; south: number; east: number; west: number }
  center: { lat: number; lon: number }
} {
  const predefined: Record<
    string,
    { bounds: { north: number; south: number; east: number; west: number }; center: { lat: number; lon: number } }
  > = {
    "sv-9701": { bounds: { north: 71.2, south: 69.5, east: 31.2, west: 27.5 }, center: { lat: 70.0634, lon: 29.7319 } },
    "sv-9702": { bounds: { north: 71.2, south: 69.0, east: 26.5, west: 22.0 }, center: { lat: 70.6634, lon: 23.6821 } },
    "sv-9703": { bounds: { north: 70.5, south: 68.5, east: 28.5, west: 23.0 }, center: { lat: 69.4457, lon: 25.5141 } },
    "sv-9601": { bounds: { north: 70.1, south: 69.2, east: 20.0, west: 17.5 }, center: { lat: 69.6496, lon: 18.956 } },
    "sv-9602": { bounds: { north: 69.6, south: 68.8, east: 18.5, west: 16.0 }, center: { lat: 69.234, lon: 17.506 } },
    "sv-9603": { bounds: { north: 69.8, south: 68.5, east: 21.5, west: 17.5 }, center: { lat: 69.0593, lon: 19.0185 } },
    "sv-9501": { bounds: { north: 69.5, south: 67.8, east: 17.0, west: 12.0 }, center: { lat: 68.4353, lon: 14.4044 } },
    "sv-9502": { bounds: { north: 68.8, south: 68.0, east: 18.5, west: 16.0 }, center: { lat: 68.4385, lon: 17.4269 } },
    "sv-9503": { bounds: { north: 68.0, south: 66.5, east: 16.5, west: 12.5 }, center: { lat: 67.2804, lon: 14.4049 } },
    "sv-9504": { bounds: { north: 66.5, south: 64.8, east: 15.0, west: 10.5 }, center: { lat: 65.8439, lon: 12.1882 } },
    "sv-9401": { bounds: { north: 65.2, south: 63.5, east: 14.0, west: 10.0 }, center: { lat: 64.4667, lon: 11.4992 } },
    "sv-9402": { bounds: { north: 64.0, south: 62.0, east: 12.5, west: 8.5 }, center: { lat: 63.4305, lon: 10.3951 } },
    "sv-9301": { bounds: { north: 63.5, south: 62.5, east: 9.0, west: 6.0 }, center: { lat: 63.1139, lon: 7.7279 } },
    "sv-9302": { bounds: { north: 63.0, south: 62.0, east: 8.0, west: 5.0 }, center: { lat: 62.4722, lon: 6.1549 } },
    "sv-9201": { bounds: { north: 62.2, south: 60.8, east: 8.0, west: 4.5 }, center: { lat: 61.4527, lon: 5.8534 } },
    "sv-9202": { bounds: { north: 61.2, south: 60.2, east: 8.0, west: 5.0 }, center: { lat: 60.7845, lon: 6.6942 } },
    "sv-9203": { bounds: { north: 60.6, south: 59.8, east: 6.5, west: 4.5 }, center: { lat: 60.393, lon: 5.3242 } },
    "sv-9101": { bounds: { north: 59.7, south: 58.8, east: 7.0, west: 5.0 }, center: { lat: 59.2903, lon: 5.7363 } },
    "sv-9102": { bounds: { north: 59.2, south: 58.3, east: 7.0, west: 5.0 }, center: { lat: 58.7648, lon: 5.6562 } },
    "sv-9001": { bounds: { north: 58.6, south: 57.9, east: 8.5, west: 6.0 }, center: { lat: 58.1467, lon: 7.0 } },
    "sv-9002": { bounds: { north: 59.0, south: 58.0, east: 10.0, west: 8.0 }, center: { lat: 58.4699, lon: 8.7689 } },
  }

  return (
    predefined[contractId] || {
      bounds: { north: 71.2, south: 57.9, east: 31.2, west: 4.5 },
      center: { lat: 64.5, lon: 12.0 },
    }
  )
}
