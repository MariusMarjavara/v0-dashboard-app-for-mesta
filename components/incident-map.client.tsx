"use client"

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import "leaflet/dist/leaflet.css"
import { INCIDENT_COLORS } from "@/lib/incidents/classify"

interface Incident {
  id: string
  lat: number
  lon: number
  vegreferanse: string | null
  category: string
  reportedAt: string
  ageMinutes: number
}

interface IncidentMapClientProps {
  incidents: Incident[]
}

export function IncidentMapClient({ incidents }: IncidentMapClientProps) {
  if (incidents.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-lg bg-[#1a2332] border border-border">
        <p className="text-gray-400">Ingen aktive hendelser siste 24 timer</p>
      </div>
    )
  }

  // Calculate center from incidents
  const centerLat = incidents.reduce((sum, i) => sum + Number(i.lat), 0) / incidents.length
  const centerLon = incidents.reduce((sum, i) => sum + Number(i.lon), 0) / incidents.length

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[centerLat || 69.9, centerLon || 29.8]}
        zoom={8}
        className="h-[400px] w-full"
        style={{ background: "#1a2332" }}
      >
        <TileLayer attribution="" url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={10}>
          {incidents.map((incident) => (
            <CircleMarker
              key={incident.id}
              center={[Number(incident.lat), Number(incident.lon)]}
              radius={getRadius(incident.ageMinutes)}
              pathOptions={{
                color: INCIDENT_COLORS[incident.category] || "#ff6b35",
                fillColor: INCIDENT_COLORS[incident.category] || "#ff6b35",
                fillOpacity: getOpacity(incident.ageMinutes),
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <div className="text-sm">
                  <strong className="text-base">{incident.category}</strong>
                  <br />
                  {incident.vegreferanse && (
                    <>
                      {incident.vegreferanse}
                      <br />
                    </>
                  )}
                  <span className="text-xs text-gray-400">{formatAge(incident.ageMinutes)}</span>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}

function getOpacity(ageMinutes: number): number {
  if (ageMinutes < 30) return 0.9
  if (ageMinutes < 120) return 0.6
  if (ageMinutes < 360) return 0.4
  return 0.2
}

function getRadius(ageMinutes: number): number {
  if (ageMinutes < 30) return 10
  if (ageMinutes < 120) return 8
  return 6
}

function formatAge(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min siden`
  const hours = Math.round(minutes / 60)
  return `${hours} ${hours === 1 ? "time" : "timer"} siden`
}
