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
  console.log("[INCIDENT MAP] Component mounted - START OF FUNCTION")

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
      console.error("[VEGREFERANSE LOOKUP] Error:", error)
      setLookupState({ incidentId: incident.id, loading: false, result: { status: "not_found" } })
    }
  }

  useEffect(() => {
    if (isPreview || !mapContainer.current || incidents.length === 0 || map.current) return

    console.log("[INCIDENT MAP] Initializing map with", incidents.length, "incidents")

    import("maplibre-gl")
      .then(({ default: maplibregl }) => {
        if (!mapContainer.current) return

        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: "https://demotiles.maplibre.org/style.json",
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

        if (incidents.length === 1) {
          map.current.setCenter([incidents[0].lon, incidents[0].lat])
          map.current.setZoom(12)
        } else {
          const bounds = new maplibregl.LngLatBounds()
          incidents.forEach((inc) => bounds.extend([inc.lon, inc.lat]))
          map.current.fitBounds(bounds, { padding: 50 })
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
  }, [incidents, isPreview, lookupState])

  const filteredIncidents = incidents.filter((incident) => {
    // Filter by type
    if (!enabledTypes[incident.type]) return false

    // Filter by time window
    if (timeWindow !== "all") {
      const ageHours = (Date.now() - new Date(incident.timestamp).getTime()) / (1000 * 60 * 60)
      if (timeWindow === "24h" && ageHours > 24) return false
      if (timeWindow === "7d" && ageHours > 168) return false
    }

    return true
  })

  useEffect(() => {
    if (isPreview || !mapContainer.current || filteredIncidents.length === 0 || map.current) return

    console.log("[INCIDENT MAP] Initializing map with", filteredIncidents.length, "filtered incidents")

    import("maplibre-gl")
      .then(({ default: maplibregl }) => {
        if (!mapContainer.current) return

        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: "https://demotiles.maplibre.org/style.json",
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
          map.current.setCenter([filteredIncidents[0].lon, filteredIncidents[0].lat])
          map.current.setZoom(12)
        } else {
          const bounds = new maplibregl.LngLatBounds()
          filteredIncidents.forEach((inc) => bounds.extend([inc.lon, inc.lat]))
          map.current.fitBounds(bounds, { padding: 50 })
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

  console.log("[INCIDENT MAP] Rendering with state:", { loading, error, incidentsCount: incidents.length, isPreview })

  if (loading) {
    console.log("[INCIDENT MAP] Returning loading state")
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Laster hendelser...</div>
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    console.log("[INCIDENT MAP] Returning error state:", error)
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
    console.log("[INCIDENT MAP] Returning no incidents state")
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
    console.log("[INCIDENT MAP] Returning preview placeholder")
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Hendelseskart
          </CardTitle>
          <CardDescription className="text-gray-400">
            Viser {filteredIncidents.length} registrering{filteredIncidents.length !== 1 ? "er" : ""} med GPS-data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            {/* Time window filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTimeWindow("24h")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeWindow === "24h" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                24 timer
              </button>
              <button
                onClick={() => setTimeWindow("7d")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeWindow === "7d" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                7 dager
              </button>
              <button
                onClick={() => setTimeWindow("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeWindow === "all" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Alle
              </button>
            </div>

            {/* Type filters */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(TYPE_LABELS).map(([type, label]) => {
                const isEnabled = enabledTypes[type]
                return (
                  <button
                    key={type}
                    onClick={() => setEnabledTypes((prev) => ({ ...prev, [type]: !prev[type] }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      isEnabled ? "bg-gray-800 text-white" : "bg-gray-900 text-gray-500 opacity-50"
                    }`}
                  >
                    <div
                      className="h-3 w-3 rounded-full border-2 border-white"
                      style={{
                        backgroundColor: isEnabled ? TYPE_COLORS[type as keyof typeof TYPE_COLORS] : "transparent",
                      }}
                    />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="h-[500px] w-full rounded-xl bg-gray-800/50 border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-4 text-gray-400">
            <MapPin className="h-12 w-12" />
            <div className="text-center">
              <div className="font-medium">Hendelseskart vises i produksjon</div>
              <div className="text-sm mt-1">v0 preview støtter ikke kartvisning</div>
              <div className="text-xs mt-2">
                Fant {filteredIncidents.length} av {incidents.length} hendelser med GPS
              </div>
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
          Viser {filteredIncidents.length} av {incidents.length} registrering
          {incidents.length !== 1 ? "er" : ""} med GPS-data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {/* Time window filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTimeWindow("24h")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeWindow === "24h" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              24 timer
            </button>
            <button
              onClick={() => setTimeWindow("7d")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeWindow === "7d" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              7 dager
            </button>
            <button
              onClick={() => setTimeWindow("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeWindow === "all" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Alle
            </button>
          </div>

          {/* Type filters - large touch targets for gloves */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(TYPE_LABELS).map(([type, label]) => {
              const isEnabled = enabledTypes[type]
              return (
                <button
                  key={type}
                  onClick={() => setEnabledTypes((prev) => ({ ...prev, [type]: !prev[type] }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all min-h-[44px] ${
                    isEnabled ? "bg-gray-800 text-white" : "bg-gray-900 text-gray-500 opacity-50"
                  }`}
                >
                  <div
                    className="h-3 w-3 rounded-full border-2 border-white"
                    style={{
                      backgroundColor: isEnabled ? TYPE_COLORS[type as keyof typeof TYPE_COLORS] : "transparent",
                    }}
                  />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </div>

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
