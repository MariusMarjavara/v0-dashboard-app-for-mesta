import dynamic from "next/dynamic"

// Incident map wrapper v1.0 - SSR-safe Leaflet map loader
export const IncidentMap = dynamic(() => import("./incident-map.client").then((mod) => mod.IncidentMapClient), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-full items-center justify-center rounded-lg bg-[#1a2332] border border-border">
      <p className="text-gray-400">Laster kart...</p>
    </div>
  ),
})
