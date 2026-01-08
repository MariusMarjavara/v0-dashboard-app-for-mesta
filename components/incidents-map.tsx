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
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)

  const [enabledTypes, setEnabledTypes] = useState<Record<string, boolean>>({
    vakttlf: true,
    friksjon: true,
    tiltak: true,
    voice_notat: true,
    annet: true,
  })

  const [timeWindow, setTimeWindow] = useState<"24h" | "7d" | "all">("all")

  const [lookupState, setLookupState] = useState<{
    incidentId: string | null
    loading: boolean
    result: { status: string; vegreferanse?: string; avstand?: number } | null
  }>({
    incidentId: null,
    loading: false,
    result: null,
  })

  useEffect(() => {
    const preview =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("v0.app") || window.location.hostname.includes("blob.vercel"))
    setIsPreview(preview)
  }, [])

  useEffect(() => {
    async function fetchIncidents() {
      try {
        const url = contract ? `/api/incidents?contract=${encodeURIComponent(contract)}` : "/api/incidents"
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setIncidents(data)
        } else {
          setError("Kunne ikke hente hendelser")
        }
      } catch (err) {
        setError("Nettverksfeil")
      } finally {
        setLoading(false)
      }
    }
    fetchIncidents()
  }, [contract])

  const lookupVegreferanse = async (incident: Incident) => {
    setLookupState({ incidentId: incident.id, loading: true, result: null })

    try {
      const response = await fetch("/api/vegreferanse/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: incident.lat, lon: incident.lon }),
      })

      if (response.ok) {
        const data = await response.json()
        setLookupState({ incidentId: incident.id, loading: false, result: data })
      } else {
        setLookupState({ incidentId: incident.id, loading: false, result: { status: "not_found" } })
      }
    } catch (error) {
      setLookupState({ incidentId: incident.id, loading: false, result: { status: "not_found" } })
    }
  }

  const filteredIncidents = incidents.filter((incident) => {
    if (!enabledTypes[incident.type]) return false

    if (timeWindow !== "all") {
      const ageHours = (Date.now() - new Date(incident.timestamp).getTime()) / (1000 * 60 * 60)
      if (timeWindow === "24h" && ageHours > 24) return false
      if (timeWindow === "7d" && ageHours > 168) return false
    }

    return true
  })

  useEffect(() => {
    if (isPreview || !mapContainer.current || filteredIncidents.length === 0) return

    if (map.current) {
      map.current.remove()
      map.current = null
    }

    import("maplibre-gl")
      .then(({ default: maplibregl }) => {
        if (!mapContainer.current) return

        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
          center: [10.7522, 59.9139],
          zoom: 5,
        })

        filteredIncidents.forEach((incident) => {
          const el = document.createElement("div")
          el.className = "marker"
          el.style.backgroundColor = TYPE_COLORS[incident.type] || TYPE_COLORS.annet
          el.style.width = "12px"
          el.style.height = "12px"
          el.style.borderRadius = "50%"
          el.style.border = "2px solid white"
          el.style.cursor = "pointer"

          const ageHours = (Date.now() - new Date(incident.timestamp).getTime()) / (1000 * 60 * 60)
          let opacity = 1.0
          if (ageHours > 24 && ageHours <= 168) {
            opacity = 0.6
          } else if (ageHours > 168) {
            opacity = 0.3
          }
          el.style.opacity = opacity.toString()

          const popupContent = document.createElement("div")
          popupContent.style.padding = "12px"
          popupContent.style.fontSize = "12px"
          popupContent.style.minWidth = "200px"

          const renderPopupContent = () => {
            const isLoading = lookupState.incidentId === incident.id && lookupState.loading
            const result = lookupState.incidentId === incident.id ? lookupState.result : null

            let html = `
              <div style="margin-bottom: 8px;">
                <strong>${TYPE_LABELS[incident.type] || "Hendelse"}</strong><br/>
                <span style="color: #666;">${new Date(incident.timestamp).toLocaleString("nb-NO")}</span>
              </div>
              <div style="margin-bottom: 8px; padding: 8px; background: #f3f4f6; border-radius: 4px;">
                <div style="font-weight: 500; margin-bottom: 4px;">📍 GPS-punkt</div>
                <div style="font-size: 11px; color: #666;">${incident.lat.toFixed(5)}, ${incident.lon.toFixed(5)}</div>
              </div>
            `

            if (incident.vegreferanse) {
              html += `
                <div style="padding: 8px; background: #e0f2fe; border-radius: 4px; margin-bottom: 8px;">
                  <div style="font-size: 11px; color: #0369a1;">Eksisterende vegreferanse</div>
                  <div style="font-weight: 500;">${incident.vegreferanse}</div>
                </div>
              `
            }

            if (isLoading) {
              html += `
                <div style="padding: 8px; text-align: center;">
                  <div style="color: #666;">Henter vegreferanse…</div>
                </div>
              `
            } else if (result) {
              if (result.status === "found") {
                html += `
                  <div style="padding: 8px; background: #dcfce7; border-radius: 4px; border: 1px solid #86efac;">
                    <div style="font-weight: 500; color: #166534;">${result.vegreferanse}</div>
                    <div style="font-size: 10px; color: #166534; margin-top: 4px;">
                      (utledet fra GPS${result.avstand ? ` – ${result.avstand}m` : ""})
                    </div>
                  </div>
                `
              } else if (result.status === "estimated") {
                html += `
                  <div style="padding: 8px; background: #fef3c7; border-radius: 4px; border: 1px solid #fbbf24;">
                    <div style="font-weight: 500; color: #92400e;">${result.vegreferanse}</div>
                    <div style="font-size: 10px; color: #92400e; margin-top: 4px;">
                      (estimat – ${result.avstand}m)
                    </div>
                  </div>
                `
              } else {
                html += `
                  <div style="padding: 8px; background: #fee2e2; border-radius: 4px; border: 1px solid #fca5a5;">
                    <div style="font-size: 11px; color: #991b1b;">Ingen vegreferanse funnet</div>
                    <div style="font-size: 10px; color: #991b1b; margin-top: 4px;">(GPS er lagret)</div>
                  </div>
                `
              }
            } else {
              html += `
                <button
                  id="lookup-btn-${incident.id}"
                  style="
                    width: 100%;
                    padding: 8px 12px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                  "
                >
                  Finn vegreferanse
                </button>
              `
            }

            popupContent.innerHTML = html

            const button = popupContent.querySelector(`#lookup-btn-${incident.id}`)
            if (button) {
              button.addEventListener("click", () => lookupVegreferanse(incident))
            }
          }

          renderPopupContent()

          const popup = new maplibregl.Popup({ offset: 25 }).setDOMContent(popupContent)

          new maplibregl.Marker(el).setLngLat([incident.lon, incident.lat]).setPopup(popup).addTo(map.current)

          popup.on("open", renderPopupContent)
        })

        if (filteredIncidents.length === 1) {
          map.current.flyTo({
            center: [filteredIncidents[0].lon, filteredIncidents[0].lat],
            zoom: 14,
            duration: 0,
          })
        } else {
          const bounds = new maplibregl.LngLatBounds()
          filteredIncidents.forEach((inc) => bounds.extend([inc.lon, inc.lat]))
          map.current.fitBounds(bounds, {
            padding: 40,
            maxZoom: 15,
            duration: 0,
          })
        }
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
  }, [filteredIncidents, isPreview, lookupState])

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Laster hendelser...</div>
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full ml-4" />
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
      <Card className="bg-card/60 border-2 border-border shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Hendelseskart
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Viser {filteredIncidents.length} registrering{filteredIncidents.length !== 1 ? "er" : ""} med GPS-data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setTimeWindow("24h")}
                className={`px-5 py-3 rounded-lg text-sm font-bold transition-all min-h-[48px] shadow-md ${
                  timeWindow === "24h"
                    ? "bg-primary text-white ring-2 ring-primary/40 scale-105"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary/80 border-2 border-border"
                }`}
              >
                24 timer
              </button>
              <button
                onClick={() => setTimeWindow("7d")}
                className={`px-5 py-3 rounded-lg text-sm font-bold transition-all min-h-[48px] shadow-md ${
                  timeWindow === "7d"
                    ? "bg-primary text-white ring-2 ring-primary/40 scale-105"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary/80 border-2 border-border"
                }`}
              >
                7 dager
              </button>
              <button
                onClick={() => setTimeWindow("all")}
                className={`px-5 py-3 rounded-lg text-sm font-bold transition-all min-h-[48px] shadow-md ${
                  timeWindow === "all"
                    ? "bg-primary text-white ring-2 ring-primary/40 scale-105"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary/80 border-2 border-border"
                }`}
              >
                Alle
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {Object.entries(TYPE_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setEnabledTypes((prev) => ({ ...prev, [type]: !prev[type] }))}
                  className={`px-5 py-3 rounded-lg text-sm font-bold transition-all min-h-[48px] shadow-md ${
                    enabledTypes[type]
                      ? "bg-primary text-white ring-2 ring-primary/40 scale-105"
                      : "bg-secondary/60 text-muted-foreground hover:bg-secondary/80 border-2 border-border"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              height: "500px",
              background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px dashed #475569",
              padding: "32px",
            }}
          >
            <div className="text-center">
              <MapPin className="h-20 w-20 text-gray-600 mx-auto mb-6" />
              <p className="text-white text-2xl font-bold mb-2">Hendelseskart vises i produksjon</p>
              <p className="text-gray-400 text-lg mt-3">
                {filteredIncidents.length} hendelse{filteredIncidents.length !== 1 ? "r" : ""} klar til visning
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/60 border-2 border-border shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
          <MapPin className="h-6 w-6" />
          Hendelseskart
        </CardTitle>
        <CardDescription className="text-muted-foreground text-base">
          Viser {filteredIncidents.length} av {incidents.length} registrering
          {incidents.length !== 1 ? "er" : ""} med GPS-data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setTimeWindow("24h")}
              className={`px-5 py-3 rounded-lg text-sm font-bold transition-all min-h-[48px] shadow-md ${
                timeWindow === "24h"
                  ? "bg-primary text-white ring-2 ring-primary/40 scale-105"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary/80 border-2 border-border"
              }`}
            >
              24 timer
            </button>
            <button
              onClick={() => setTimeWindow("7d")}
              className={`px-5 py-3 rounded-lg text-sm font-bold transition-all min-h-[48px] shadow-md ${
                timeWindow === "7d"
                  ? "bg-primary text-white ring-2 ring-primary/40 scale-105"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary/80 border-2 border-border"
              }`}
            >
              7 dager
            </button>
            <button
              onClick={() => setTimeWindow("all")}
              className={`px-5 py-3 rounded-lg text-sm font-bold transition-all min-h-[48px] shadow-md ${
                timeWindow === "all"
                  ? "bg-primary text-white ring-2 ring-primary/40 scale-105"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary/80 border-2 border-border"
              }`}
            >
              Alle
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setEnabledTypes((prev) => ({ ...prev, [type]: !prev[type] }))}
                className={`px-5 py-3 rounded-lg text-sm font-bold transition-all min-h-[48px] shadow-md ${
                  enabledTypes[type]
                    ? "bg-primary text-white ring-2 ring-primary/40 scale-105"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary/80 border-2 border-border"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={mapContainer}
          style={{ height: "500px", borderRadius: "12px", border: "2px solid hsl(var(--border))" }}
          className="shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
        />
      </CardContent>
    </Card>
  )
}
