"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Cloud, Mountain, Car } from "lucide-react"

interface WeatherSource {
  id: string
  name: string
  description: string
  url: string
  icon: React.ReactNode
  color: string
}

const weatherSources: WeatherSource[] = [
  {
    id: "yr",
    name: "Yr.no",
    description: "Værvarsling fra Meteorologisk institutt",
    url: "https://www.yr.no",
    icon: <Cloud className="h-5 w-5" />,
    color: "bg-blue-500",
  },
  {
    id: "windy",
    name: "Windy.com",
    description: "Detaljert vindkart og værkart",
    url: "https://www.windy.com",
    icon: <Cloud className="h-5 w-5" />,
    color: "bg-cyan-500",
  },
  {
    id: "175",
    name: "175.no",
    description: "Vegtrafikksentral - Trafikkmeldinger",
    url: "https://www.175.no",
    icon: <Car className="h-5 w-5" />,
    color: "bg-green-500",
  },
  {
    id: "varsom",
    name: "Varsom.no",
    description: "Snøskred- og flomvarsel",
    url: "https://www.varsom.no",
    icon: <Mountain className="h-5 w-5" />,
    color: "bg-red-500",
  },
]

export function WeatherSources() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">Værkilder</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {weatherSources.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-mesta-navy-light hover:bg-mesta-navy-light/80 border border-border transition-colors group"
            >
              <div className={`p-2 rounded-full ${source.color} text-white`}>{source.icon}</div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground group-hover:text-mesta-orange transition-colors flex items-center gap-1">
                  {source.name}
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">{source.description}</p>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
