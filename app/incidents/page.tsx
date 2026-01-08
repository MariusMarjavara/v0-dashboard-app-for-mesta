"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { IncidentsMap } from "@/components/incidents-map"
import { useState, useEffect } from "react"

export default function IncidentsPage() {
  const [selectedContract, setSelectedContract] = useState<string>("all")
  const [availableContracts, setAvailableContracts] = useState<string[]>([])

  useEffect(() => {
    async function fetchContracts() {
      try {
        const response = await fetch("/api/incidents")
        if (response.ok) {
          const incidents = await response.json()
          const contracts = [...new Set(incidents.map((i: any) => i.contract).filter(Boolean))] as string[]
          setAvailableContracts(contracts.sort())
        }
      } catch (err) {
        console.error("Failed to fetch contracts:", err)
      }
    }
    fetchContracts()
  }, [])

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Tilbake til dashboard
      </Link>

      <Card className="bg-card/60 border-2 border-border shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl font-bold text-white">Hendelseskart</CardTitle>
          <CardDescription className="text-muted-foreground text-base mt-2">
            Oversikt over registreringer med GPS-data. Kartet er kun til visning.
          </CardDescription>
        </CardHeader>
        {availableContracts.length > 0 && (
          <CardContent>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-white">Kontrakt:</label>
              <select
                value={selectedContract}
                onChange={(e) => setSelectedContract(e.target.value)}
                className="px-4 py-3 rounded-lg bg-secondary/80 text-white border-2 border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[48px] font-medium"
              >
                <option value="all">Alle kontrakter</option>
                {availableContracts.map((contract) => (
                  <option key={contract} value={contract}>
                    {contract}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        )}
      </Card>

      <IncidentsMap contract={selectedContract === "all" ? undefined : selectedContract} />

      <Card className="bg-card/60 border-2 border-border shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Hendelseskategorier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Object.entries({
              "Vakttlf/loggbok": "Observasjoner fra vakttelefonsamtaler",
              Friksjonsmåling: "Målt veggrep og friksjon",
              "Tiltak/arbeid": "Utført vedlikehold eller tiltak",
              "Voice notat": "Talemeldinger med GPS",
              Annet: "Diverse registreringer",
            }).map(([category, description]) => (
              <div
                key={category}
                className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border"
              >
                <div
                  className="h-5 w-5 rounded-full ring-2 ring-white/20 flex-shrink-0"
                  style={{
                    background:
                      {
                        "Vakttlf/loggbok": "#3b82f6",
                        Friksjonsmåling: "#f59e0b",
                        "Tiltak/arbeid": "#10b981",
                        "Voice notat": "#8b5cf6",
                        Annet: "#6b7280",
                      }[category] || "#6b7280",
                  }}
                />
                <div>
                  <div className="text-base font-semibold text-white">{category}</div>
                  <div className="text-sm text-muted-foreground">{description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
