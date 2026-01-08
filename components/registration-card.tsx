"use client"

import { memo } from "react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Thermometer, Wrench, Snowflake, ShoppingCart, AlertOctagon, Camera } from "lucide-react"

const iconMap = {
  arbeidsdok: Camera,
  friksjon: Thermometer,
  maskin: Wrench,
  vinter: Snowflake,
  innkjop: ShoppingCart,
  utbedring: AlertOctagon,
} satisfies Record<string, LucideIcon>

interface RegistrationCardProps {
  title: string
  description: string
  icon: keyof typeof iconMap
  onClick: () => void
}

export const RegistrationCard = memo(function RegistrationCard({
  title,
  description,
  icon,
  onClick,
}: RegistrationCardProps) {
  const Icon = iconMap[icon]

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className="bg-card/60 border-2 border-border cursor-pointer transition-all shadow-[0_2px_8px_rgba(0,0,0,0.3)]
                 hover:border-primary hover:shadow-[0_4px_16px_rgba(243,112,33,0.4)] hover:scale-[1.02] hover:bg-card/80
                 active:scale-[0.98] active:shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
    >
      <CardHeader className="pb-4">
        <div className="p-4 bg-primary/30 rounded-xl w-fit ring-2 ring-primary/40 shadow-lg">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold text-white mt-6 leading-tight">{title}</CardTitle>
        <CardDescription className="text-muted-foreground text-base leading-relaxed mt-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-primary text-base font-bold flex items-center gap-2">
          Klikk for å registrere
          <span className="text-lg">→</span>
        </div>
      </CardContent>
    </Card>
  )
})
