"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Camera, X } from "lucide-react"
import { formatDateTime, getCurrentPosition } from "@/lib/utils/formatting"

interface CameraCaptureProps {
  onCapture: (file: File, metadata: { lat: number; lon: number; vegreferanse: string } | null) => void
  onCancel: () => void
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement("canvas"))
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })

        if (controller.signal.aborted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setIsReady(true)
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          if (err.name === "NotAllowedError") {
            setError("Kameratilgang er ikke tillatt. Aktiver kamera i nettleserinnstillinger.")
          } else if (err.name === "NotFoundError") {
            setError("Ingen kamera funnet på denne enheten.")
          } else if (err.name === "NotReadableError") {
            setError("Kameraet er allerede i bruk av en annen app.")
          } else {
            setError("Kunne ikke starte kamera. Prøv igjen.")
          }
        }
      }
    }

    startCamera()
    document.body.style.overflow = "hidden"

    return () => {
      controller.abort()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      document.body.style.overflow = ""
    }
  }, [])

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !isReady) return

    const canvas = canvasRef.current
    const video = videoRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw the video frame
    ctx.drawImage(video, 0, 0)

    const dateText = formatDateTime()

    let gpsMetadata: { lat: number; lon: number; vegreferanse: string } | null = null
    let locationText: string | null = null

    try {
      const pos = await getCurrentPosition()
      const lat = pos.coords.latitude
      const lon = pos.coords.longitude

      const res = await fetch(`/api/nvdb/vegreferanse?lat=${lat}&lon=${lon}`)
      const data = await res.json()
      const vegreferanse = data.vegreferanse || null

      if (vegreferanse) {
        locationText = vegreferanse
        gpsMetadata = { lat, lon, vegreferanse }
      } else {
        gpsMetadata = { lat, lon, vegreferanse: "" }
      }
    } catch {
      locationText = "GPS utilgjengelig"
    }

    const hasLocationText = locationText !== null
    const boxHeight = hasLocationText ? 100 : 60
    const boxPadding = 20

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
    ctx.fillRect(boxPadding, canvas.height - boxHeight - boxPadding, canvas.width - boxPadding * 2, boxHeight)

    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 28px sans-serif"
    ctx.fillText(dateText, boxPadding * 2, canvas.height - boxHeight / 2 - 10)

    if (hasLocationText) {
      ctx.fillText(locationText, boxPadding * 2, canvas.height - boxHeight / 2 + 30)
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `bilde-${Date.now()}.jpg`, {
            type: "image/jpeg",
          })
          onCapture(file, gpsMetadata)
        }
      },
      "image/jpeg",
      0.9,
    )
  }, [isReady, onCapture])

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
        <div className="bg-destructive/10 text-destructive rounded-lg p-6 max-w-md">
          <p className="text-lg font-medium mb-2">Kamerafeil</p>
          <p>{error}</p>
          <Button onClick={onCancel} className="mt-4 w-full">
            Lukk
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overscroll-none touch-none">
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={onCancel}
          className="rounded-full h-16 w-16 bg-transparent"
        >
          <X className="h-6 w-6" />
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={captureImage}
          disabled={!isReady}
          className="rounded-full h-20 w-20 bg-white text-black hover:bg-gray-200"
        >
          <Camera className="h-8 w-8" />
        </Button>
      </div>
    </div>
  )
}
