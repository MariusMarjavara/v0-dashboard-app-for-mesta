"use client"

import { useEffect, useRef, useState } from "react"
import { getContractBoundary, getContractLocations } from "@/lib/contract-boundaries"
import type { WeatherData } from "@/lib/types"
import { getWeatherIcon } from "@/lib/weather-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Thermometer, Wind, Droplets, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ContractMapProps {
  contractId: string
  contractName: string
}

export function ContractMap({ contractId, contractName }: ContractMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [selectedLocation, setSelectedLocation] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const boundary = getContractBoundary(contractId)
  const locations = getContractLocations(contractId)

  const fetchWeather = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/weather?contractId=${contractId}`)
      const data = await response.json()
      if (data.weather) {
        setWeatherData(data.weather)
        setLastUpdated(new Date().toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" }))
      }
    } catch (error) {
      console.error("Failed to fetch weather:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather()
    // Oppdater værdata hvert 30. minutt
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [contractId])

  // Beregn posisjon på kartet basert på koordinater
  const getPosition = (lat: number, lon: number) => {
    const { north, south, east, west } = boundary.bounds
    const x = ((lon - west) / (east - west)) * 100
    const y = ((north - lat) / (north - south)) * 100
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-mesta-orange" />
            {contractName}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchWeather}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {lastUpdated && <p className="text-xs text-muted-foreground">Sist oppdatert: {lastUpdated}</p>}
      </CardHeader>
      <CardContent>
        {/* Kart-visualisering */}
        <div
          ref={mapRef}
          className="relative w-full h-64 bg-mesta-navy-light rounded-lg overflow-hidden border border-border"
        >
          {/* Bakgrunnskart-stil */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" className="text-muted-foreground" />
            </svg>
          </div>

          {/* Område-omriss */}
          <div className="absolute inset-4 border-2 border-dashed border-mesta-orange/30 rounded-lg" />

          {/* Værpunkter */}
          {weatherData.map((weather, index) => {
            const pos = getPosition(weather.lat, weather.lon)
            const isSelected = selectedLocation?.location === weather.location

            return (
              <button
                key={weather.location}
                onClick={() => setSelectedLocation(isSelected ? null : weather)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 z-10
                  ${isSelected ? "scale-125 z-20" : "hover:scale-110"}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                title={weather.location}
              >
                <div
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg 
                  ${isSelected ? "bg-mesta-orange text-white" : "bg-card/90 border border-border"}`}
                >
                  <span className="text-lg leading-none">{getWeatherIcon(weather.symbol)}</span>
                  <span className="text-xs font-bold">{Math.round(weather.temperature)}°</span>
                </div>
              </button>
            )
          })}

          {/* Kontraktsnavn overlay */}
          <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            {boundary.name}
          </div>
        </div>

        {/* Værdetaljer for valgt lokasjon */}
        {selectedLocation && (
          <div className="mt-4 p-4 bg-mesta-navy-light rounded-lg border border-border">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="text-2xl">{getWeatherIcon(selectedLocation.symbol)}</span>
              {selectedLocation.location}
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-mesta-orange" />
                <div>
                  <p className="text-xs text-muted-foreground">Temperatur</p>
                  <p className="font-semibold text-foreground">{selectedLocation.temperature.toFixed(1)}°C</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Vind</p>
                  <p className="font-semibold text-foreground">{selectedLocation.windSpeed.toFixed(1)} m/s</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Nedbør</p>
                  <p className="font-semibold text-foreground">{selectedLocation.precipitation.toFixed(1)} mm</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alle lokasjoner som liste */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {weatherData.slice(0, 9).map((weather) => (
            <button
              key={weather.location}
              onClick={() => setSelectedLocation(weather)}
              className={`p-2 rounded-lg text-left transition-colors
                ${selectedLocation?.location === weather.location ? "bg-mesta-orange/20 border-mesta-orange" : "bg-mesta-navy-light hover:bg-mesta-navy-light/80"} 
                border border-border`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{getWeatherIcon(weather.symbol)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{weather.location}</p>
                  <p className="text-sm font-bold text-foreground">{Math.round(weather.temperature)}°C</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
