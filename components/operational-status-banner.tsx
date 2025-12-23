"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, XCircle } from "lucide-react"
import { OPERATIONAL_STATUS_CONFIG } from "@/lib/types"

export function OperationalStatusBanner() {
  const [status, setStatus] = useState<string>("NORMAL DRIFT")
  const [severity, setSeverity] = useState<"normal" | "warning" | "critical">("normal")

  useEffect(() => {
    const checkStatus = () => {
      const savedStatus = localStorage.getItem("operationalStatus")
      if (savedStatus) {
        const { status: newStatus, timestamp } = JSON.parse(savedStatus)

        const expiryMs = OPERATIONAL_STATUS_CONFIG.EXPIRY_HOURS * 60 * 60 * 1000
        if (Date.now() - timestamp > expiryMs) {
          setStatus("NORMAL DRIFT")
          setSeverity("normal")
          localStorage.removeItem("operationalStatus")
        } else {
          setStatus(newStatus)

          if (newStatus.includes("STENGT") || newStatus.includes("ULYKKE")) {
            setSeverity("critical")
          } else if (newStatus.includes("ANBEFALES") || newStatus.includes("OBS")) {
            setSeverity("warning")
          } else {
            setSeverity("normal")
          }
        }
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, OPERATIONAL_STATUS_CONFIG.CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  if (severity === "normal") return null

  const bgColor = severity === "critical" ? "bg-red-700" : "bg-orange-600"
  const Icon = severity === "critical" ? XCircle : AlertTriangle

  return (
    <div className={`${bgColor} text-white text-center py-3 font-bold flex items-center justify-center gap-2`}>
      <Icon className="h-5 w-5" />
      {status}
    </div>
  )
}
