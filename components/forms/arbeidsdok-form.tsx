"use client"

import React from "react"
import { useState, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, ImageIcon, Plus, AlertCircle } from "lucide-react"
import { CameraCapture } from "@/components/camera-capture"
import { ImageCard } from "@/components/image-card"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useToast } from "@/hooks/use-toast"
import { getGpsSnapshot } from "@/lib/gps-snapshot"

interface ArbeidsdokFormProps {
  userName: string
  userId: string | null
  contractArea: string
  contractNummer: number | null
  onBack: () => void
  onSuccess: () => void
}

interface CapturedImage {
  id: string
  file: File
  previewUrl: string
  timestamp: string
  location: {
    lat: number | null
    lon: number | null
    accuracy: number | null
  }
  roadReference: string
}

enum Step {
  ORDER = 1,
  DESCRIPTION = 2,
  IMAGES = 3,
}

export function ArbeidsdokForm({
  userName,
  userId,
  contractArea,
  contractNummer,
  onBack,
  onSuccess,
}: ArbeidsdokFormProps) {
  const [step, setStep] = useState<Step>(Step.ORDER)
  const [hasOrderNumber, setHasOrderNumber] = useState<string>("")
  const [orderNumber, setOrderNumber] = useState("")
  const [orderDescription, setOrderDescription] = useState("")
  const [workDescription, setWorkDescription] = useState("")
  const [images, setImages] = useState<CapturedImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCamera, setShowCamera] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { location } = useGeolocation()
  const { toast } = useToast()

  const handleCameraCapture = useCallback(
    async (file: File, gpsMetadata: { lat: number; lon: number; vegreferanse: string } | null) => {
      if (!gpsMetadata) {
        toast({
          title: "GPS mangler",
          description: "Kunne ikke ta bilde uten GPS. Prøv igjen.",
          variant: "destructive",
        })
        return
      }

      const previewUrl = URL.createObjectURL(file)

      const imageLocation = {
        lat: gpsMetadata.lat,
        lon: gpsMetadata.lon,
        accuracy: null,
      }

      const roadRef = gpsMetadata.vegreferanse || ""

      const newImage: CapturedImage = {
        id: crypto.randomUUID(),
        file,
        previewUrl,
        timestamp: new Date().toISOString(),
        location: imageLocation,
        roadReference: roadRef,
      }

      setImages((prev) => [...prev, newImage])
      setShowCamera(false)
    },
    [toast],
  )

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const gpsResult = await getGpsSnapshot()
      if ("error" in gpsResult) {
        toast({
          title: "GPS påkrevd",
          description: gpsResult.error.message,
          variant: "destructive",
        })
        event.target.value = ""
        return
      }

      const { lat, lon, accuracy } = gpsResult.gps

      const previewUrl = URL.createObjectURL(file)

      let roadRef = ""
      try {
        const res = await fetch(`/api/nvdb/vegreferanse?lat=${lat}&lon=${lon}`)
        const data = await res.json()
        roadRef = data.vegreferanse || ""
      } catch {
        roadRef = ""
      }

      const newImage: CapturedImage = {
        id: crypto.randomUUID(),
        file,
        previewUrl,
        timestamp: new Date().toISOString(),
        location: { lat, lon, accuracy },
        roadReference: roadRef,
      }

      setImages((prev) => [...prev, newImage])
      event.target.value = ""
    },
    [toast],
  )

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id)
      if (image) {
        URL.revokeObjectURL(image.previewUrl)
      }
      return prev.filter((img) => img.id !== id)
    })
  }, [])

  const updateRoadReference = useCallback((imageId: string, roadRef: string) => {
    setImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, roadReference: roadRef } : img)))
  }, [])

  const canProceedStep1 = useMemo(() => {
    if (!hasOrderNumber) return false
    if (hasOrderNumber === "ja") return !!orderNumber.trim()
    return !!orderDescription.trim()
  }, [hasOrderNumber, orderNumber, orderDescription])

  const handleSubmit = async () => {
    if (!userId || !userName) {
      toast({
        title: "Feil",
        description: "Brukerinformasjon mangler",
        variant: "destructive",
      })
      return
    }

    if (images.length === 0) {
      toast({
        title: "Ingen bilder",
        description: "Du må ta minst ett bilde før du sender inn",
        variant: "destructive",
      })
      return
    }

    const imagesWithoutGps = images.filter((img) => !img.location.lat || !img.location.lon)
    if (imagesWithoutGps.length > 0) {
      toast({
        title: "GPS mangler",
        description: `${imagesWithoutGps.length} bilde(r) mangler GPS-data. Fjern eller ta på nytt.`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const registrationId = crypto.randomUUID()
      const imageMetadata: Array<{
        id: string
        url: string
        timestamp: string
        location: { lat: number | null; lon: number | null; accuracy: number | null }
        roadReference: string
      }> = []

      const orderRef = hasOrderNumber === "ja" ? orderNumber.replace(/[^a-zA-Z0-9-]/g, "_") : "ingen-ordre"
      const datestamp = new Date().toISOString().split("T")[0] // YYYY-MM-DD
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5) // YYYY-MM-DDTHH-MM-SS

      console.log("[v0] Uploading", images.length, "images to storage...")
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const seq = String(i + 1).padStart(2, "0")
        const fileName = `${orderRef}-${seq}-${timestamp}.jpg`
        const filePath = `arbeidsdok/${orderRef}/${datestamp}/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("registrations")
          .upload(filePath, img.file, {
            contentType: "image/jpeg",
            upsert: false,
          })

        if (uploadError) {
          console.error("[v0] Upload error:", uploadError.message)
          throw new Error(`Bildeopplasting feilet: ${uploadError.message}`)
        }

        console.log("[v0] Uploaded image successfully:", filePath)

        const { data: urlData, error: urlError } = await supabase.storage
          .from("registrations")
          .createSignedUrl(filePath, 31536000) // 1 år i sekunder

        if (urlError) {
          console.error("[v0] URL generation error:", urlError.message)
          throw new Error(`Kunne ikke generere URL: ${urlError.message}`)
        }

        imageMetadata.push({
          id: img.id,
          url: urlData.signedUrl,
          timestamp: img.timestamp,
          location: img.location,
          roadReference: img.roadReference,
        })
      }

      console.log("[v0] All images uploaded successfully, saving to database...")

      const data = {
        has_order_number: hasOrderNumber === "ja",
        order_number: hasOrderNumber === "ja" ? orderNumber : null,
        order_description: hasOrderNumber === "nei" ? orderDescription : null,
        work_description: workDescription,
        images: imageMetadata,
        image_count: images.length,
      }

      const { error: dbError } = await supabase.from("registrations").insert({
        id: registrationId,
        user_id: userId,
        registered_by_name: userName,
        registration_type: "arbeidsdokumentering",
        contract_area: contractArea,
        contract_nummer: contractNummer,
        data,
      })

      if (dbError) throw dbError

      toast({
        title: "Suksess!",
        description: "Arbeidsdokumentasjon er sendt inn",
      })

      onSuccess()
    } catch (error) {
      console.error("[v0] Submit error:", error)
      toast({
        title: "Feil",
        description: "Kunne ikke sende inn registrering. Prøv igjen.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  React.useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    }
  }, [images])

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-white touch-manipulation">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tilbake
      </Button>

      <div>
        <h2 className="text-2xl font-bold text-white">Arbeidsdokumentering</h2>
        <p className="text-muted-foreground mt-1">Bilder og ressursbruk for oppdrag på kontrakten</p>
      </div>

      {step === Step.ORDER && (
        <div className="space-y-4">
          <Label className="text-white text-lg">Hvilken ordre gjelder oppdraget?</Label>
          <RadioGroup value={hasOrderNumber} onValueChange={setHasOrderNumber} className="space-y-3">
            <div className="flex items-center space-x-3 p-4 bg-secondary rounded-lg touch-manipulation">
              <RadioGroupItem value="ja" id="order-yes" />
              <Label htmlFor="order-yes" className="text-white cursor-pointer flex-1">
                Har ordrenummer
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-secondary rounded-lg touch-manipulation">
              <RadioGroupItem value="nei" id="order-no" />
              <Label htmlFor="order-no" className="text-white cursor-pointer flex-1">
                Ikke utlevert ordrenummer
              </Label>
            </div>
          </RadioGroup>

          {hasOrderNumber === "ja" && (
            <div className="space-y-2 mt-4">
              <Label className="text-white">Ordrenummer</Label>
              <Input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Legg inn ordrenummer her"
                className="bg-secondary border-border text-white"
              />
            </div>
          )}

          {hasOrderNumber === "nei" && (
            <div className="space-y-2 mt-4">
              <Label className="text-white">Beskrivelse av oppdrag</Label>
              <Textarea
                value={orderDescription}
                onChange={(e) => setOrderDescription(e.target.value)}
                placeholder="Beskriv oppdraget..."
                className="bg-secondary border-border text-white min-h-24"
              />
            </div>
          )}

          <Button
            onClick={() => setStep(Step.DESCRIPTION)}
            disabled={!canProceedStep1}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white touch-manipulation min-h-[44px]"
          >
            Neste
          </Button>
        </div>
      )}

      {step === Step.DESCRIPTION && (
        <div className="space-y-4">
          <Label className="text-white text-lg">Hva er utført?</Label>
          <Textarea
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            placeholder="Beskriv utført arbeid..."
            className="bg-secondary border-border text-white min-h-32"
          />

          <Button
            onClick={() => setStep(Step.IMAGES)}
            disabled={!workDescription.trim()}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white touch-manipulation min-h-[44px]"
          >
            Neste - Legg til bilder
          </Button>
        </div>
      )}

      {step === Step.IMAGES && (
        <div className="space-y-4">
          <Label className="text-white text-lg">Dokumenter med bilder</Label>
          <p className="text-sm text-muted-foreground">Bildene lagres med tidspunkt og GPS-koordinater automatisk.</p>

          {showCamera ? (
            <CameraCapture onCapture={handleCameraCapture} onCancel={() => setShowCamera(false)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => setShowCamera(true)}
                variant="outline"
                className="border-border text-white hover:bg-secondary h-auto py-6 flex flex-col gap-3 bg-transparent touch-manipulation min-h-[88px]"
              >
                <ImageIcon className="h-8 w-8" />
                <span className="text-base">Bruk kamera</span>
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-border text-white hover:bg-secondary h-auto py-6 flex flex-col gap-3 touch-manipulation min-h-[88px]"
              >
                <ImageIcon className="h-8 w-8" />
                <span className="text-base">Last opp bilde</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {location && (
            <div className="p-3 bg-secondary/50 rounded-lg text-sm text-muted-foreground">
              GPS aktiv: {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
            </div>
          )}

          {images.length > 0 && (
            <div className="space-y-3">
              <Label className="text-white">Tatte bilder ({images.length})</Label>
              <div className="grid grid-cols-1 gap-4">
                {images.map((img) => (
                  <ImageCard
                    key={img.id}
                    id={img.id}
                    previewUrl={img.previewUrl}
                    roadReference={img.roadReference}
                    timestamp={new Date(img.timestamp).toLocaleString("nb-NO", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    onRemove={removeImage}
                    onUpdateReference={updateRoadReference}
                  />
                ))}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-white hover:border-orange-600 transition-colors touch-manipulation min-h-[88px]"
                >
                  <Plus className="h-8 w-8" />
                  <span className="text-base">Legg til flere bilder</span>
                </button>
              </div>
            </div>
          )}

          {images.length === 0 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-500">Du må ta minst ett bilde før du kan sende inn</p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || images.length === 0}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white touch-manipulation min-h-[44px]"
          >
            {isSubmitting ? "Sender inn..." : "Send inn"}
          </Button>
        </div>
      )}
    </div>
  )
}
