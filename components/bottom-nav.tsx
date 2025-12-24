"use client"

import { Home, Mic, Camera, FileText } from "lucide-react"
import { useCarMode } from "./car-mode-provider"

interface BottomNavProps {
  onNavigate: (section: "status" | "voice" | "camera" | "log") => void
  activeSection?: string
}

export function BottomNav({ onNavigate, activeSection = "status" }: BottomNavProps) {
  const { carMode } = useCarMode()

  if (!carMode) return null

  const navItems = [
    { id: "status", label: "STATUS", icon: Home },
    { id: "voice", label: "TALE", icon: Mic },
    { id: "camera", label: "KAMERA", icon: Camera },
    { id: "log", label: "LOGG", icon: FileText },
  ] as const

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b1f3a] border-t border-[#ff6b35]/30 flex justify-around py-3 safe-area-bottom">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeSection === item.id

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as any)}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-all active:scale-95 ${
              isActive ? "bg-[#ff6b35] text-white" : "text-gray-300"
            }`}
          >
            <Icon className="h-6 w-6" />
            <span className="text-sm font-semibold">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
