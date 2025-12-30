"use client"

import { Button } from "@/components/ui/button"
import { Download, ImageIcon } from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type ExportRegistrationsButtonProps = {}

export function ExportRegistrationsButton() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: "excel" | "images") => {
    setIsExporting(true)
    try {
      const endpoint = format === "excel" ? "/api/export-registrations" : "/api/export-images"
      const params = new URLSearchParams()

      const response = await fetch(`${endpoint}?${params}`)

      if (!response.ok) {
        throw new Error("Kunne ikke eksportere")
      }

      const blob = await response.blob()
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `mine_${format === "excel" ? "registreringer" : "bilder"}_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "zip"}`
      link.click()
      URL.revokeObjectURL(link.href)
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
          {isExporting ? "Eksporterer..." : "Eksporter mine data"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Mine registreringer</div>
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          <Download className="h-4 w-4 mr-2" />
          Eksporter til Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("images")}>
          <ImageIcon className="h-4 w-4 mr-2" />
          Eksporter bilder (ZIP)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
