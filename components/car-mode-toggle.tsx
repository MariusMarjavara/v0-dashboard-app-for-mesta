"use client"

import { Button } from "@/components/ui/button"
import { Car, Monitor } from "lucide-react"
import { useCarMode } from "./car-mode-provider"

export function CarModeToggle() {
  const { carMode, toggleCarMode } = useCarMode()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleCarMode}
      className={`border-border hover:bg-secondary bg-transparent touch-manipulation ${
        carMode ? "border-[#ff6b35] text-[#ff6b35]" : "text-white"
      }`}
      aria-label={carMode ? "Deaktiver bilmodus" : "Aktiver bilmodus"}
    >
      {carMode ? <Car className="h-4 w-4 sm:mr-2" /> : <Monitor className="h-4 w-4 sm:mr-2" />}
      <span className="hidden sm:inline">{carMode ? "Bilmodus" : "Normal"}</span>
    </Button>
  )
}
