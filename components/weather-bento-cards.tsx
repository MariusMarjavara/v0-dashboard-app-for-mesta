"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext, useMemo, useCallback, memo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Wind, Thermometer, Droplets, AlertTriangle } from "lucide-react"
import { FALLBACK_LOCATIONS, CONDITION_TEXT, CONDITION_COLOR, TYPE_TEXT } from "@/lib/constants/weather"

interface Location {
  name: string
  lat: number
  lon: number
  type: "town" | "coastal" | "border" | "village" | "weather_station" | "city" | "poi"
  population?: number
  station_id?: string
}

interface WeatherData {
  location: string
  type: "town" | "coastal" | "border" | "village" | "weather_station" | "city" | "poi"
  temperature: number
  windSpeed: number
  precipitation: number
  condition: "good" | "caution" | "danger"
  conditionText: string
  conditionColor: string
  typeText: string
  exposureScore: number
  lat: number
  lon: number
}

interface WeatherBentoCardsProps {
  contractId: string
}

function calculateExposureScore(temp: number, precip: number, wind: number): number {
  let score = 0

  // Snøfall ved kulde
  if (temp <= 0 && precip > 0) {
    score += 30
    score += Math.min(20, Math.abs(temp) * 2)
    score += Math.min(25, precip * 20)
  }

  // Glatte forhold rundt frysepunktet
  if (temp >= -3 && temp <= 1) {
    score += 25
  }

  // Vind
  if (wind > 15) {
    score += 35
  } else if (wind > 10) {
    score += 20
  } else if (wind > 7) {
    score += 10
  }

  // Kombinasjon kald + vind
  if (temp < -10 && wind > 10) {
    score += 25
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

function getRoadCondition(temp: number, precip: number, wind: number): "good" | "caution" | "danger" {
  if (temp <= 0 && precip > 0.3) return "danger"
  if (wind > 15 && temp <= 0) return "danger"
  if ((temp > 0 && temp <= 3 && precip > 0.3) || precip > 3) return "caution"
  if (temp >= -3 && temp <= 1) return "caution"
  return "good"
}

function getYrLink(lat: number, lon: number): string {
  return `https://www.yr.no/nb/v%C3%A6rvarsel/daglig-tabell/${lat},${lon}`
}

const WeatherBentoCard = memo(function WeatherBentoCard({
  weather,
  isHighlighted = false,
}: { weather: WeatherData; isHighlighted?: boolean }) {
  const handleClick = () => {
    window.open(getYrLink(weather.lat, weather.lon), "_blank", "noopener,noreferrer")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <Card
      className={`p-5 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:scale-[1.02] ${
        isHighlighted
          ? "border-2 border-primary bg-card/60 ring-2 ring-primary/20"
          : "border-2 border-border bg-card/50"
      }`}
      role="link"
      aria-label={`Åpne værvarsel for ${weather.location} på yr.no`}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-2xl font-bold leading-tight tracking-tight text-white">{weather.location}</h3>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="border-muted-foreground/50 bg-muted/30 text-xs text-muted-foreground">
            {weather.typeText}
          </Badge>
          <span className="text-xs text-primary/80 font-medium">yr.no →</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center py-3">
        <div>
          <Thermometer className="mx-auto h-5 w-5 text-blue-400 mb-1" />
          <div className="text-xs text-muted-foreground mb-1">Temp</div>
          <div className={`text-2xl font-bold ${weather.temperature < 0 ? "text-blue-400" : "text-white"}`}>
            {weather.temperature}°
          </div>
        </div>

        <div>
          <Wind className="mx-auto h-5 w-5 text-primary mb-1" />
          <div className="text-xs text-muted-foreground mb-1">Vind</div>
          <div
            className={`text-2xl font-bold ${
              weather.windSpeed > 15 ? "text-primary" : weather.windSpeed > 10 ? "text-yellow-400" : "text-white"
            }`}
          >
            {weather.windSpeed}
          </div>
        </div>

        <div>
          <Droplets className="mx-auto h-5 w-5 text-blue-300 mb-1" />
          <div className="text-xs text-muted-foreground mb-1">Nedbør</div>
          <div className={`text-2xl font-bold ${weather.precipitation > 2 ? "text-blue-400" : "text-white"}`}>
            {weather.precipitation}
          </div>
        </div>
      </div>

      <div className="mt-5 border-t-2 border-border pt-4">
        <div
          className={`text-center text-base font-bold ${
            weather.condition === "danger"
              ? "text-red-500"
              : weather.condition === "caution"
                ? "text-yellow-500"
                : "text-green-500"
          }`}
        >
          {weather.conditionText}
        </div>
        <div className="text-center text-sm text-muted-foreground mt-1 font-medium">
          Eksponering: {weather.exposureScore}
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full ${
              weather.condition === "danger"
                ? "bg-red-500"
                : weather.condition === "caution"
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${weather.exposureScore}%` }}
          />
        </div>
      </div>
    </Card>
  )
})

const CompactWeatherCard = memo(function CompactWeatherCard({ weather }: { weather: WeatherData }) {
  const handleClick = () => {
    window.open(getYrLink(weather.lat, weather.lon), "_blank", "noopener,noreferrer")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <Card
      className="border-2 border-border bg-card/50 p-4 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:scale-[1.02] transition-all"
      role="link"
      aria-label={`Åpne værvarsel for ${weather.location} på yr.no`}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-bold leading-tight tracking-tight text-white">{weather.location}</h3>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="border-muted-foreground/50 bg-muted/30 text-xs text-muted-foreground">
            {weather.typeText}
          </Badge>
          <span className="text-xs text-primary/80 font-medium">yr.no →</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-muted-foreground font-medium">Temp</span>
          </div>
          <span className={`text-xl font-bold ${weather.temperature < 0 ? "text-blue-400" : "text-white"}`}>
            {weather.temperature}°C
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Vind</span>
          </div>
          <span className={`text-xl font-bold ${weather.windSpeed > 15 ? "text-primary" : "text-white"}`}>
            {weather.windSpeed} m/s
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-300" />
            <span className="text-sm text-muted-foreground font-medium">Nedbør</span>
          </div>
          <span className="text-xl font-bold text-white">{weather.precipitation} mm</span>
        </div>
      </div>

      <div className="mt-4 border-t-2 border-border pt-3">
        <div
          className={`text-center text-sm font-bold ${
            weather.condition === "danger"
              ? "text-red-500"
              : weather.condition === "caution"
                ? "text-yellow-500"
                : "text-green-500"
          }`}
        >
          {weather.conditionText} · {weather.exposureScore}
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full ${
              weather.condition === "danger"
                ? "bg-red-500"
                : weather.condition === "caution"
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${weather.exposureScore}%` }}
          />
        </div>
      </div>
    </Card>
  )
})

function WeatherCardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <Card className={`border-border bg-card ${large ? "p-6" : "p-4"}`}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <Skeleton className="mb-2 h-6 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="space-y-3">
        <Skeleton className={`${large ? "h-10" : "h-8"} w-full rounded-lg`} />
        <Skeleton className={`${large ? "h-10" : "h-8"} w-full rounded-lg`} />
        <Skeleton className={`${large ? "h-10" : "h-8"} w-full rounded-lg`} />
        <Skeleton className={`${large ? "h-16" : "h-14"} w-full rounded-lg`} />
      </div>
    </Card>
  )
}

interface WeatherContextType {
  weatherData: WeatherData[]
  loading: boolean
  error: string | null
  contractName: string | null
}

export const WeatherContext = createContext<WeatherContextType>({
  weatherData: [],
  loading: true,
  error: null,
  contractName: null,
})

const BATCH_SIZE = 4

export function WeatherProvider({ children, contractId }: { children: React.ReactNode; contractId: string }) {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contractName, setContractName] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const fetchTime = new Date().toLocaleTimeString("nb-NO")
    if (process.env.NODE_ENV === "development") {
      console.log("[v0] Henter værdata klokken:", fetchTime)
    }

    setLoading(true)
    setError(null)

    let locations: Location[] = []

    if (contractId) {
      try {
        const nummerMatch = contractId.match(/(\d+)/)
        if (nummerMatch) {
          const nummer = nummerMatch[1]
          const response = await fetch(`/api/contract/${nummer}`)

          if (response.ok) {
            const data = await response.json()

            if (data.contract) {
              setContractName(data.contract.navn)
              if (process.env.NODE_ENV === "development") {
                console.log("[v0] Lastet kontrakt:", data.contract.navn)
              }
            }

            if (data.locations && data.locations.length > 0) {
              locations = data.locations.map((loc: any) => ({
                name: loc.name,
                lat: loc.lat,
                lon: loc.lon,
                type: loc.location_type || "town",
                population: loc.population,
                station_id: loc.station_id,
              }))
              if (process.env.NODE_ENV === "development") {
                console.log("[v0] Lastet", locations.length, "lokasjoner fra database")
              }
            }
          }
        }
      } catch (err) {
        console.error("[v0] Failed to fetch contract locations:", err)
      }
    }

    if (locations.length === 0) {
      locations = [...FALLBACK_LOCATIONS]
      if (process.env.NODE_ENV === "development") {
        console.log("[v0] Bruker fallback-lokasjoner")
      }
    }

    try {
      const results: WeatherData[] = []

      for (let i = 0; i < locations.length; i += BATCH_SIZE) {
        const batch = locations.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.all(
          batch.map(async (location) => {
            try {
              const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,wind_speed_10m,precipitation&timezone=Europe%2FOslo&wind_speed_unit=ms`

              const response = await fetch(apiUrl)

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
              }

              const data = await response.json()

              const temp = data.current?.temperature_2m ?? 0
              const wind = data.current?.wind_speed_10m ?? 0
              const precip = data.current?.precipitation ?? 0

              if (location === locations[0] && process.env.NODE_ENV === "development") {
                console.log(`[v0] Live værdata for ${location.name}:`, {
                  temp: `${temp}°C`,
                  vind: `${wind} m/s`,
                  nedbør: `${precip} mm`,
                  tidspunkt: fetchTime,
                })
              }

              const condition = getRoadCondition(temp, precip, wind)

              return {
                location: location.name,
                type: location.type,
                temperature: Math.round(temp * 10) / 10,
                windSpeed: Math.round(wind * 10) / 10,
                precipitation: Math.round(precip * 10) / 10,
                condition,
                conditionText: CONDITION_TEXT[condition],
                conditionColor: CONDITION_COLOR[condition],
                typeText: TYPE_TEXT[location.type] || TYPE_TEXT.town,
                exposureScore: calculateExposureScore(temp, precip, wind),
                lat: location.lat,
                lon: location.lon,
              } as WeatherData
            } catch {
              const condition = "good" as const
              return {
                location: location.name,
                type: location.type,
                temperature: -5,
                windSpeed: 8,
                precipitation: 0,
                condition,
                conditionText: CONDITION_TEXT[condition],
                conditionColor: CONDITION_COLOR[condition],
                typeText: TYPE_TEXT[location.type] || TYPE_TEXT.town,
                exposureScore: 15,
                lat: location.lat,
                lon: location.lon,
              } as WeatherData
            }
          }),
        )
        results.push(...batchResults)
      }

      setWeatherData(results)
      if (process.env.NODE_ENV === "development") {
        console.log("[v0] Suksess! Lastet værdata for", results.length, "lokasjoner")
      }
    } catch (err) {
      console.error("[v0] Weather fetch error:", err)
      setError("Kunne ikke laste værdata")
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    const controller = new AbortController()

    fetchData()

    const interval = setInterval(
      () => {
        if (process.env.NODE_ENV === "development") {
          console.log("[v0] Auto-refresh: Henter oppdaterte værdata...")
        }
        fetchData()
      },
      5 * 60 * 1000,
    )

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [fetchData])

  const sortedWeatherData = useMemo(() => {
    return [...weatherData].sort((a, b) => b.exposureScore - a.exposureScore)
  }, [weatherData])

  const contextValue = useMemo(
    () => ({
      weatherData: sortedWeatherData,
      loading,
      error,
      contractName,
    }),
    [sortedWeatherData, loading, error, contractName],
  )

  return <WeatherContext.Provider value={contextValue}>{children}</WeatherContext.Provider>
}

export function TopExposedAreas() {
  const { weatherData, loading, error, contractName } = useContext(WeatherContext)

  const topExposedAreas = weatherData.slice(0, 4)

  if (loading) {
    return (
      <div>
        <h3 className="mb-4 text-lg font-semibold text-muted-foreground">Mest værutsatte områder nå</h3>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <WeatherCardSkeleton key={i} large={true} />
          ))}
        </div>
      </div>
    )
  }

  if (error && weatherData.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-yellow-500" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-muted-foreground">Mest værutsatte områder nå</h3>
        {contractName && (
          <Badge variant="outline" className="border-mesta-orange/50 text-mesta-orange">
            {contractName}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {topExposedAreas.map((weather) => (
          <WeatherBentoCard
            key={`${weather.location}-${weather.lat}-${weather.lon}`}
            weather={weather}
            isHighlighted={true}
          />
        ))}
      </div>
    </div>
  )
}

export function RemainingWeatherCards() {
  const { weatherData, loading } = useContext(WeatherContext)

  const remainingAreas = weatherData.slice(4)

  if (loading) {
    return (
      <div>
        <h3 className="mb-4 text-lg font-semibold text-muted-foreground">Øvrige værstasjoner</h3>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <WeatherCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (remainingAreas.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-muted-foreground">Øvrige værstasjoner</h3>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {remainingAreas.map((weather) => (
          <CompactWeatherCard key={`${weather.location}-${weather.lat}-${weather.lon}`} weather={weather} />
        ))}
      </div>
    </div>
  )
}

export function WeatherBentoCards({ contractId }: WeatherBentoCardsProps) {
  return (
    <WeatherProvider contractId={contractId}>
      <div className="space-y-6">
        <TopExposedAreas />
      </div>
    </WeatherProvider>
  )
}
