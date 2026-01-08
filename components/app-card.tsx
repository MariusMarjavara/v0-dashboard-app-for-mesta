"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, ClipboardList, ShieldCheck, AlertTriangle, Truck, Clock, Navigation } from "lucide-react"
import type { AppLink } from "@/lib/types"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ClipboardList,
  ShieldCheck,
  AlertTriangle,
  Truck,
  Clock,
  Navigation,
}

interface AppCardProps {
  app: AppLink
}

export function AppCard({ app }: AppCardProps) {
  const Icon = iconMap[app.icon] || ClipboardList

  const handleOpenApp = () => {
    if (app.webUrl) {
      // Åpne web-URL direkte
      window.open(app.webUrl, "_blank")
      return
    }

    // Prøv å åpne mobilapp
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

    if (isAndroid && app.androidPackage) {
      // Prøv å åpne Android-appen
      window.location.href = `intent://${app.androidPackage}#Intent;scheme=app;package=${app.androidPackage};end`
      // Fallback til Play Store etter kort delay
      setTimeout(() => {
        window.open(app.playStoreUrl, "_blank")
      }, 500)
    } else if (isIOS && app.iosUrl) {
      // Prøv å åpne iOS-appen
      window.location.href = app.iosUrl
      // Fallback til App Store etter kort delay
      setTimeout(() => {
        if (app.appStoreUrl) {
          window.open(app.appStoreUrl, "_blank")
        }
      }, 500)
    } else {
      // Desktop eller ukjent plattform - åpne app store
      const storeUrl = isIOS && app.appStoreUrl ? app.appStoreUrl : app.playStoreUrl
      window.open(storeUrl, "_blank")
    }
  }

  return (
    <Card className="bg-card/50 border-2 border-border transition-all shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:border-primary/60 hover:shadow-[0_4px_12px_rgba(243,112,33,0.3)] hover:scale-[1.03]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="p-3 bg-primary/30 rounded-lg ring-1 ring-primary/40 shadow-md">
            <Icon className="h-7 w-7 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold text-white mt-4 leading-tight">{app.name}</CardTitle>
        <CardDescription className="text-muted-foreground text-sm leading-snug mt-1">{app.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleOpenApp}
          variant="outline"
          className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white bg-transparent touch-manipulation font-semibold h-11"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Åpne app
        </Button>
      </CardContent>
    </Card>
  )
}
