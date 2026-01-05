"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, MapPin } from "lucide-react"

interface Incident {
  id: string
  type: "vakttlf" | "friksjon" | "tiltak" | "voice_notat" | "annet"
  lat: number
  lon: number
  vegreferanse: string | null
  timestamp: string
  confidence: number | null
}

interface IncidentsMapProps {
  contract?: string
}

const TYPE_COLORS = {
  vakttlf: "#3b82f6", // blue
  friksjon: "#f59e0b", // amber
  tiltak: "#10b981", // green
  voice_notat: "#8b5cf6", // purple
  annet: "#6b7280", // gray
}

const TYPE_LABELS = {
  vakttlf: "Vakttlf/loggbok",
  friksjon: "Friksjonsmåling",
  tiltak: "Tiltak/arbeid",
  voice_notat: "Voice notat",
  annet: "Annet",
}

export function IncidentsMap({ contract }: IncidentsMapProps) {
  console.log("[INCIDENT MAP] Component mounted")

  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)

  useEffect(() => {
    const preview =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("v0.app") || window.location.hostname.includes("blob.vercel"))
    setIsPreview(preview)
    console.log("[INCIDENT MAP] Preview mode:", preview)
  }, [])

  useEffect(() => {
    async function fetchIncidents() {
      console.log("[INCIDENT MAP] Fetching incidents...")
      try {
        const url = contract ? `/api/incidents?contract=${encodeURIComponent(contract)}` : "/api/incidents"
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          console.log("[INCIDENT MAP] Loaded incidents:", data.length)
          setIncidents(data)
        } else {
          console.error("[INCIDENT MAP] API error:", response.status)
          setError("Kunne ikke hente hendelser")
        }
      } catch (err) {
        console.error("[INCIDENT MAP] Fetch error:", err)
        setError("Nettverksfeil")
      } finally {
        setLoading(false)
      }
    }
    fetchIncidents()
  }, [contract])

  useEffect(() => {
    if (isPreview || !mapContainer.current || incidents.length === 0 || map.current) return

    console.log("[INCIDENT MAP] Initializing map with", incidents.length, "incidents")

    import("maplibre-gl")
      .then(({ default: maplibregl }) => {
        if (!mapContainer.current) return

        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: "https://api.maptiler.com/maps/streets/style.json?key=get_your_own_key",
          center: [10.7522, 59.9139],
          zoom: 5,
        })

        incidents.forEach((incident) => {
          const el = document.createElement("div")
          el.className = "marker"
          el.style.backgroundColor = TYPE_COLORS[incident.type] || TYPE_COLORS.annet
          el.style.width = "12px"
          el.style.height = "12px"
          el.style.borderRadius = "50%"
          el.style.border = "2px solid white"
          el.style.cursor = "pointer"

          const ageHours = (Date.now() - new Date(incident.timestamp).getTime()) / (1000 * 60 * 60)
          const opacity = Math.max(0.3, 1 - ageHours / 24)
          el.style.opacity = opacity.toString()

          const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; font-size: 12px;">
            <strong>${TYPE_LABELS[incident.type] || "Hendelse"}</strong><br/>
            ${incident.vegreferanse || "Ukjent lokasjon"}<br/>
            <span style="color: #666;">${new Date(incident.timestamp).toLocaleString("nb-NO")}</span>
          </div>
        `)

          new maplibregl.Marker(el).setLngLat([incident.lon, incident.lat]).setPopup(popup).addTo(map.current)
        })

        const bounds = new maplibregl.LngLatBounds()
        incidents.forEach((inc) => bounds.extend([inc.lon, inc.lat]))
        map.current.fitBounds(bounds, { padding: 50 })
      })
      .catch((err) => {
        console.error("[INCIDENT MAP] MapLibre load error:", err)
        setError("Kartbibliotek kunne ikke lastes")
      })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [incidents, isPreview])

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (incidents.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Hendelseskart</CardTitle>
          <CardDescription className="text-gray-400">Ingen hendelser med GPS-data funnet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isPreview) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Hendelseskart
          </CardTitle>
          <CardDescription className="text-gray-400">
            Viser {incidents.length} registrering{incidents.length !== 1 ? "er" : ""} med GPS-data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] w-full rounded-xl bg-gray-800/50 border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-4 text-gray-400">
            <MapPin className="h-12 w-12" />
            <div className="text-center">
              <div className="font-medium">Hendelseskart vises i produksjon</div>
              <div className="text-sm mt-1">v0 preview støtter ikke kartvisning</div>
              <div className="text-xs mt-2">Fant {incidents.length} hendelser med GPS</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full border-2 border-white"
                  style={{ backgroundColor: TYPE_COLORS[type as keyof typeof TYPE_COLORS] }}
                />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Hendelseskart
        </CardTitle>
        <CardDescription className="text-gray-400">
          Viser {incidents.length} registrering{incidents.length !== 1 ? "er" : ""} med GPS-data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={mapContainer} className="w-full h-[500px] rounded-xl" style={{ height: "500px" }} />

        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full border-2 border-white"
                style={{ backgroundColor: TYPE_COLORS[type as keyof typeof TYPE_COLORS] }}
              />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
