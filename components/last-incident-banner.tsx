"use client"

interface Incident {
  id: string
  category: string
  vegreferanse: string | null
  ageMinutes: number
}

interface LastIncidentBannerProps {
  incident: Incident | null
}

export function LastIncidentBanner({ incident }: LastIncidentBannerProps) {
  if (!incident) return null

  const formatAge = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)} min siden`
    const hours = Math.round(minutes / 60)
    return `${hours} ${hours === 1 ? "time" : "timer"} siden`
  }

  return (
    <div className="bg-red-700 text-white px-4 py-3 rounded-lg shadow-lg">
      <div className="flex items-start gap-2">
        <span className="text-xl flex-shrink-0">⚠️</span>
        <div className="flex-1">
          <strong className="font-semibold">Siste hendelse:</strong>{" "}
          <span className="font-normal">
            {incident.category}
            {incident.vegreferanse && ` – ${incident.vegreferanse}`}
          </span>
          <div className="text-sm text-red-100 mt-1">({formatAge(incident.ageMinutes)})</div>
        </div>
      </div>
    </div>
  )
}
