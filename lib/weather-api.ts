// Værdata fra MET API (Yr.no), Varsom og 175.no

import type { WeatherData, AvalancheWarning, Location } from "./types"

// MET API User-Agent (påkrevd)
const MET_USER_AGENT = "MestaDashboard/1.0 github.com/mesta"

// Hent værdata fra MET API (Yr.no)
export async function fetchWeatherData(locations: Location[]): Promise<WeatherData[]> {
  const weatherPromises = locations.map(async (location) => {
    try {
      const response = await fetch(
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${location.lat}&lon=${location.lon}`,
        {
          headers: {
            "User-Agent": MET_USER_AGENT,
          },
          next: { revalidate: 1800 }, // Cache 30 min
        },
      )

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`)
      }

      const data = await response.json()
      const current = data.properties.timeseries[0]
      const details = current.data.instant.details

      return {
        location: location.name,
        lat: location.lat,
        lon: location.lon,
        temperature: details.air_temperature,
        precipitation: current.data.next_1_hours?.details?.precipitation_amount || 0,
        windSpeed: details.wind_speed,
        windDirection: details.wind_from_direction,
        symbol: current.data.next_1_hours?.summary?.symbol_code || "cloudy",
        updatedAt: current.time,
      } as WeatherData
    } catch (error) {
      console.error(`Failed to fetch weather for ${location.name}:`, error)
      return {
        location: location.name,
        lat: location.lat,
        lon: location.lon,
        temperature: 0,
        precipitation: 0,
        windSpeed: 0,
        windDirection: 0,
        symbol: "cloudy",
        updatedAt: new Date().toISOString(),
      } as WeatherData
    }
  })

  return Promise.all(weatherPromises)
}

// Hent snøskredvarsel fra Varsom API
export async function fetchAvalancheWarnings(regionIds: number[]): Promise<AvalancheWarning[]> {
  // Returner tom array hvis ingen regioner er gitt
  if (!regionIds || regionIds.length === 0) {
    return []
  }

  try {
    // Bruk riktig API-format: hent alle varsler og filtrer på regionIds
    const response = await fetch(
      `https://api01.nve.no/hydrology/forecast/avalanche/v6.3.0/api/AvalancheWarningByRegion/Simple`,
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 3600 }, // Cache 1 time
      },
    )

    if (!response.ok) {
      console.error(`Varsom API error: ${response.status}`)
      return []
    }

    const data = await response.json()

    // Filtrer på de ønskede regionene
    const filteredData = Array.isArray(data)
      ? data.filter((warning: Record<string, unknown>) => regionIds.includes(warning.RegionId as number))
      : []

    return filteredData.map((warning: Record<string, unknown>) => ({
      regionId: warning.RegionId,
      regionName: warning.RegionName,
      dangerLevel: warning.DangerLevel,
      dangerLevelName: getDangerLevelName(warning.DangerLevel as number),
      validFrom: warning.ValidFrom,
      validTo: warning.ValidTo,
      mainText: warning.MainText || "",
    }))
  } catch (error) {
    // Feil i Varsom API skal ikke stoppe hele applikasjonen
    console.error("Failed to fetch avalanche warnings:", error)
    return []
  }
}

// Faregrad-navn på norsk
function getDangerLevelName(level: number): string {
  const levels: Record<number, string> = {
    0: "Ikke vurdert",
    1: "Liten",
    2: "Moderat",
    3: "Betydelig",
    4: "Stor",
    5: "Meget stor",
  }
  return levels[level] || "Ukjent"
}

// Mapping av Varsom-regioner til kontraktsområder
export const avalancheRegions: Record<string, number[]> = {
  "sv-9701": [3003, 3004], // Øst-Finnmark
  "sv-9702": [3001, 3002], // Vest-Finnmark
  "sv-9703": [3001, 3003], // Indre Finnmark
  "sv-9601": [3009, 3010], // Tromsø
  "sv-9602": [3009, 3011], // Senja
  "sv-9603": [3010, 3011], // Indre Troms
  "sv-9501": [3012, 3013], // Lofoten/Vesterålen
  "sv-9502": [3012, 3013], // Ofoten
  "sv-9503": [3014, 3015], // Salten
  "sv-9504": [3015, 3016], // Helgeland
  "sv-9401": [3022, 3023], // Nord-Trøndelag
  "sv-9402": [3022, 3023], // Sør-Trøndelag
  default: [],
}

// Værikon-mapping til norske ikoner
export function getWeatherIcon(symbolCode: string): string {
  const iconMap: Record<string, string> = {
    clearsky_day: "☀️",
    clearsky_night: "🌙",
    fair_day: "🌤️",
    fair_night: "🌙",
    partlycloudy_day: "⛅",
    partlycloudy_night: "🌙",
    cloudy: "☁️",
    fog: "🌫️",
    lightrain: "🌧️",
    rain: "🌧️",
    heavyrain: "🌧️",
    lightrainshowers_day: "🌦️",
    rainshowers_day: "🌦️",
    heavyrainshowers_day: "🌦️",
    lightsleet: "🌨️",
    sleet: "🌨️",
    heavysleet: "🌨️",
    lightsnow: "❄️",
    snow: "❄️",
    heavysnow: "❄️",
    lightsnowshowers_day: "🌨️",
    snowshowers_day: "🌨️",
    heavysnowshowers_day: "🌨️",
    thunder: "⛈️",
    thunderstorm: "⛈️",
  }
  // Fjern _day/_night suffix for å matche
  const baseSymbol = symbolCode.replace(/_day|_night/g, "")
  return iconMap[symbolCode] || iconMap[baseSymbol] || "🌡️"
}
