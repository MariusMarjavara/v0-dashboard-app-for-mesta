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
      className="bg-mesta-navy-light border-border cursor-pointer transition-all 
                 hover:border-mesta-orange hover:scale-[1.02]
                 active:scale-[0.98]"
    >
      <CardHeader className="pb-3">
        <div className="p-3 bg-mesta-orange/20 rounded-lg w-fit">
          <Icon className="h-8 w-8 text-mesta-orange" />
        </div>
        <CardTitle className="text-xl text-white mt-4">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-mesta-orange text-sm font-medium">Klikk for å registrere →</div>
      </CardContent>
    </Card>
  )
})
