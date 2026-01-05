import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { IncidentsMap } from "@/components/incidents-map"

export default function IncidentsPage() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Tilbake til dashboard
      </Link>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Hendelseskart</CardTitle>
          <CardDescription className="text-gray-400">
            Oversikt over registreringer med GPS-data. Kartet er kun til visning.
          </CardDescription>
        </CardHeader>
      </Card>

      <IncidentsMap />

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Hendelseskategorier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {Object.entries({
              "Dyr nær veg": "Elg, hjort, rein eller andre dyr observert",
              Ulykke: "Kollisjon eller utforkjøring",
              "Glatt kjørebane": "Is eller speilblanke forhold",
              "Ras i vegbane": "Stein- eller jordras",
              "Stengt veg": "Veg stengt eller kolonnekjøring",
              "Hindring i veg": "Gjenstander eller andre hindringer",
              "Dårlig sikt": "Tåke eller snøfokk",
            }).map(([category, description]) => (
              <div key={category} className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{
                    background:
                      {
                        "Dyr nær veg": "#ff6b35",
                        Ulykke: "#dc2626",
                        "Glatt kjørebane": "#3b82f6",
                        "Ras i vegbane": "#f59e0b",
                        "Stengt veg": "#ef4444",
                        "Hindring i veg": "#eab308",
                        "Dårlig sikt": "#6b7280",
                      }[category] || "#ff6b35",
                  }}
                />
                <div>
                  <div className="text-sm font-medium text-white">{category}</div>
                  <div className="text-xs text-gray-400">{description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
