"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface SuccessMessageProps {
  onClose: () => void
}

export function SuccessMessage({ onClose }: SuccessMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 bg-green-500/20 rounded-full mb-6">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Registrering sendt!</h2>
      <p className="text-muted-foreground mb-8">Din registrering er lagret i systemet.</p>
      <Button onClick={onClose} className="bg-mesta-orange hover:bg-mesta-orange-hover text-white">
        Tilbake til dashboard
      </Button>
    </div>
  )
}
