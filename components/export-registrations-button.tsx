"use client"

import { Button } from "@/components/ui/button"
import { Download, ImageIcon } from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ExportRegistrationsButtonProps {
  userType: "mesta" | "ue"
  isContractAdmin?: boolean
  contractNummer?: number | null
}

export function ExportRegistrationsButton({
  userType,
  isContractAdmin = false,
  contractNummer,
}: ExportRegistrationsButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: "user" | "admin" | "all", format: "excel" | "images", saveToSupabase = false) => {
    setIsExporting(true)
    try {
      const endpoint = format === "excel" ? "/api/export-registrations" : "/api/export-images"
      const params = new URLSearchParams({
        type,
        ...(type === "admin" && contractNummer ? { contract: contractNummer.toString() } : {}),
        ...(saveToSupabase ? { save: "true" } : {}),
      })

      const response = await fetch(`${endpoint}?${params}`)

      if (!response.ok) {
        throw new Error("Kunne ikke eksportere")
      }

      if (!saveToSupabase) {
        const blob = await response.blob()
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `${format === "excel" ? "registreringer" : "bilder"}_${type}_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "zip"}`
        link.click()
        URL.revokeObjectURL(link.href)
      } else {
        alert("Eksport lagret i Supabase!")
      }
    } catch (error) {
      console.error("[v0] Eksport-feil:", error)
      alert("Kunne ikke eksportere")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white bg-transparent"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Eksporterer..." : "Eksporter"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Mine registreringer */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Mine registreringer</div>
        <DropdownMenuItem onClick={() => handleExport("user", "excel", false)}>
          <Download className="h-4 w-4 mr-2" />
          Eksporter til Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("user", "images", false)}>
          <ImageIcon className="h-4 w-4 mr-2" />
          Eksporter bilder (ZIP)
        </DropdownMenuItem>

        {/* Kontraktsadmin */}
        {isContractAdmin && contractNummer && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Min kontrakt</div>
            <DropdownMenuItem onClick={() => handleExport("admin", "excel", false)}>
              <Download className="h-4 w-4 mr-2" />
              Kontraktsdata til Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("admin", "images", false)}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Kontraktsbilder (ZIP)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("admin", "excel", true)}>
              <Download className="h-4 w-4 mr-2" />
              Lagre i Supabase
            </DropdownMenuItem>
          </>
        )}

        {/* Mesta-bruker */}
        {userType === "mesta" && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Alle data (Mesta)</div>
            <DropdownMenuItem onClick={() => handleExport("all", "excel", false)}>
              <Download className="h-4 w-4 mr-2" />
              Alt til Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("all", "images", false)}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Alle bilder (ZIP)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("all", "excel", true)}>
              <Download className="h-4 w-4 mr-2" />
              Lagre alt i Supabase
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
