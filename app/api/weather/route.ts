import { NextResponse } from "next/server"
import { fetchWeatherData, fetchAvalancheWarnings, avalancheRegions } from "@/lib/weather-api"
import { getContractLocations } from "@/lib/contract-boundaries"
import type { Location } from "@/lib/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const contractId = searchParams.get("contractId") || "default"

  try {
    // Hent tettsteder for kontraktsområdet
    const locations = getContractLocations(contractId)

    const weatherData = await fetchWeatherData(locations)

    // Prøv å hente skredvarsel, men ikke la det feile hele requesten
    let avalancheWarnings: Awaited<ReturnType<typeof fetchAvalancheWarnings>> = []
    try {
      const regionIds = avalancheRegions[contractId] || []
      if (regionIds.length > 0) {
        avalancheWarnings = await fetchAvalancheWarnings(regionIds)
      }
    } catch {
      // Ignorer feil fra Varsom API
      console.error("Skipping avalanche warnings due to API error")
    }

    return NextResponse.json({
      weather: weatherData,
      avalanche: avalancheWarnings,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const locations: Location[] = body.locations || []

    if (locations.length === 0) {
      return NextResponse.json({ error: "No locations provided" }, { status: 400 })
    }

    // Hent værdata for de angitte stedene
    const weatherData = await fetchWeatherData(locations)

    return NextResponse.json({
      weather: weatherData,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Weather API POST error:", error)
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
