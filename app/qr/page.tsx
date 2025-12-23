"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Copy, Check } from "lucide-react"
import { MestaLogo } from "@/components/mesta-logo"

export default function QRCodePage() {
  const [appUrl, setAppUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Get the current URL
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin)
    }
  }, [])

  const handleDownload = () => {
    const svg = document.getElementById("qr-code")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    canvas.width = 1024
    canvas.height = 1024

    img.onload = () => {
      if (!ctx) return
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, 1024, 1024)

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "mesta-dashboard-qr.png"
        link.click()
        URL.revokeObjectURL(url)
      })
    }

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handleCopy = async () => {
    if (appUrl) {
      await navigator.clipboard.writeText(appUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-mesta-navy">
      <header className="border-b border-border bg-mesta-navy-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <MestaLogo />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">QR-kode for Dashboard</h1>
          <p className="text-muted-foreground">Skann denne QR-koden for å få rask tilgang til Mesta Dashboard</p>
        </div>

        <Card className="p-6 sm:p-8 bg-white">
          <div className="flex flex-col items-center gap-6">
            {/* QR Code */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-gray-200">
              {appUrl && (
                <QRCodeSVG id="qr-code" value={appUrl} size={256} level="H" includeMargin={true} fgColor="#1a1a2e" />
              )}
            </div>

            {/* URL Display */}
            <div className="w-full max-w-md">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <code className="flex-1 text-sm text-gray-700 truncate">{appUrl}</code>
                <Button size="sm" variant="ghost" onClick={handleCopy} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownload}
              size="lg"
              className="w-full max-w-xs bg-mesta-orange hover:bg-mesta-orange/90 text-white"
            >
              <Download className="h-5 w-5 mr-2" />
              Last ned QR-kode
            </Button>

            {/* Instructions */}
            <div className="text-sm text-gray-600 text-center max-w-md mt-4 space-y-2">
              <p className="font-medium">Hvordan bruke QR-koden:</p>
              <ol className="text-left space-y-1 list-decimal list-inside">
                <li>Last ned QR-koden som et bilde</li>
                <li>Print den ut eller del den digitalt</li>
                <li>Skann med mobil for rask tilgang til dashboardet</li>
              </ol>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
