"use client"

import type React from "react"
import { toast } from "@/components/ui/use-toast"
import { CameraCapture } from "@/components/camera-capture"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Camera, X, MapPin, Clock, ImageIcon } from "lucide-react"
import { getVegreferanse } from "@/lib/road-reference-service"

interface UtbedringFormProps {
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
  dataUrl: string
  timestamp: string
  location: {
    lat: number | null
    lon: number | null
    accuracy: number | null
  }
  roadReference?: string
}

type FormSection = "avvik" | "uonsket" | "forbedring"

export function UtbedringForm({
  userName,
  userId,
  contractArea,
  contractNummer,
  onBack,
  onSuccess,
}: UtbedringFormProps) {
  const [currentSection, setCurrentSection] = useState<FormSection>("avvik")

  // Avvik
  const [avvikRegistered, setAvvikRegistered] = useState<string>("")
  const [avvikText, setAvvikText] = useState("")
  const [avvikImages, setAvvikImages] = useState<CapturedImage[]>([])

  // Uønsket hendelse (RUH)
  const [ruhRegistered, setRuhRegistered] = useState<string>("")
  const [ruhText, setRuhText] = useState("")
  const [ruhImages, setRuhImages] = useState<CapturedImage[]>([])

  // Forbedringsforslag
  const [forbedringRegistered, setForbedringRegistered] = useState<string>("")
  const [forbedringText, setForbedringText] = useState("")
  const [forbedringImages, setForbedringImages] = useState<CapturedImage[]>([])

  const [showCamera, setShowCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number | null
    lon: number | null
    accuracy: number | null
  }>({ lat: null, lon: null, accuracy: null })
  const [editingRoadRef, setEditingRoadRef] = useState<string | null>(null)
  const [tempRoadRef, setTempRoadRef] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hent gjeldende bilder basert på seksjon
  const getCurrentImages = () => {
    switch (currentSection) {
      case "avvik":
        return avvikImages
      case "uonsket":
        return ruhImages
      case "forbedring":
        return forbedringImages
    }
  }

  const setCurrentImages = (images: CapturedImage[] | ((prev: CapturedImage[]) => CapturedImage[])) => {
    switch (currentSection) {
      case "avvik":
        setAvvikImages(images)
        break
      case "uonsket":
        setRuhImages(images)
        break
      case "forbedring":
        setForbedringImages(images)
        break
    }
  }

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
        },
        (error) => {
          console.log("[v0] Geolocation error:", error.message)
        },
        { enableHighAccuracy: true },
      )
    }
  }, [])

  const handleCameraCapture = (file: File) => {
    const dataUrl = URL.createObjectURL(file)
    const newImage: CapturedImage = {
      id: crypto.randomUUID(),
      file,
      dataUrl,
      timestamp: new Date().toISOString(),
      location: currentLocation,
      roadReference: "",
    }
    setCurrentImages((prev) => [...prev, newImage])
    setShowCamera(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const dataUrl = URL.createObjectURL(file)

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const roadRef = await getVegreferanse(position.coords.latitude, position.coords.longitude)

          const newImage: CapturedImage = {
            id: crypto.randomUUID(),
            file,
            dataUrl,
            timestamp: new Date().toISOString(),
            location: {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
            roadReference: roadRef || "",
          }
          setCurrentImages((prev) => [...prev, newImage])
        },
        () => {
          const newImage: CapturedImage = {
            id: crypto.randomUUID(),
            file,
            dataUrl,
            timestamp: new Date().toISOString(),
            location: currentLocation,
            roadReference: "",
          }
          setCurrentImages((prev) => [...prev, newImage])
        },
        { enableHighAccuracy: true, timeout: 5000 },
      )
    }
  }

  const removeImage = (id: string) => {
    setCurrentImages((prev) => prev.filter((img) => img.id !== id))
  }

  const updateRoadReference = (imageId: string, roadRef: string) => {
    setCurrentImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, roadReference: roadRef } : img)))
    setEditingRoadRef(null)
    setTempRoadRef("")
  }

  const formatTimestamp = (iso: string) => {
    return new Date(iso).toLocaleString("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleSubmit = async () => {
    if (!userId || !userName) {
      toast({
        title: "Feil",
        description: "Brukerinformasjon mangler",
        variant: "destructive",
      })
      return
    }

    const hasAvvik = avvikRegistered && avvikText
    const hasRuh = ruhRegistered && ruhText
    const hasForbedring = forbedringRegistered && forbedringText

    if (!hasAvvik && !hasRuh && !hasForbedring) {
      toast({
        title: "Ingen data",
        description: "Du må fylle ut minst én seksjon",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const uploadImages = async (images: CapturedImage[], prefix: string) => {
        const imageMetadata: Array<{
          id: string
          url: string
          timestamp: string
          location: { lat: number | null; lon: number | null; accuracy: number | null }
          roadReference: string
        }> = []

        const datestamp = new Date().toISOString().split("T")[0]
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)

        for (let i = 0; i < images.length; i++) {
          const img = images[i]
          const seq = String(i + 1).padStart(2, "0")
          const fileName = `${prefix}-${seq}-${timestamp}.jpg`
          const filePath = `${prefix}/${datestamp}/${fileName}`

          const { error: uploadError } = await supabase.storage.from("registrations").upload(filePath, img.file, {
            contentType: "image/jpeg",
            upsert: false,
          })

          if (uploadError) {
            throw new Error(`Bildeopplasting feilet: ${uploadError.message}`)
          }

          const { data: urlData, error: urlError } = await supabase.storage
            .from("registrations")
            .createSignedUrl(filePath, 31536000)

          if (urlError) {
            throw new Error(`Kunne ikke generere URL: ${urlError.message}`)
          }

          imageMetadata.push({
            id: img.id,
            url: urlData.signedUrl,
            timestamp: img.timestamp,
            location: img.location,
            roadReference: img.roadReference || "",
          })
        }

        return imageMetadata
      }

      const data: any = {}

      if (hasAvvik) {
        const avvikImageData = avvikImages.length > 0 ? await uploadImages(avvikImages, "avvik") : []
        data.avvik = {
          registered_in_landax: avvikRegistered === "ja",
          text: avvikText,
          images: avvikImageData,
          image_count: avvikImages.length,
        }
      }

      if (hasRuh) {
        const ruhImageData = ruhImages.length > 0 ? await uploadImages(ruhImages, "ruh") : []
        data.ruh = {
          registered_in_landax: ruhRegistered === "ja",
          text: ruhText,
          images: ruhImageData,
          image_count: ruhImages.length,
        }
      }

      if (hasForbedring) {
        const forbedringImageData =
          forbedringImages.length > 0 ? await uploadImages(forbedringImages, "forbedring") : []
        data.forbedring = {
          registered_in_landax: forbedringRegistered === "ja",
          text: forbedringText,
          images: forbedringImageData,
          image_count: forbedringImages.length,
        }
      }

      await supabase.from("registrations").insert({
        user_id: userId,
        registered_by_name: userName,
        registration_type: "utbedring",
        contract_area: contractArea,
        contract_nummer: contractNummer,
        data,
      })

      setIsSubmitting(false)
      onSuccess()
    } catch (error: any) {
      console.error("[v0] Submission error:", error.message)
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup logic can be added here if needed
    }
  }, [])

  const currentImages = getCurrentImages()

  const renderImageSection = () => {
    return (
      <div className="space-y-4 pt-4 border-t border-border">
        <Label className="text-white text-lg">Dokumenter med bilder (valgfritt)</Label>

        {showCamera && <CameraCapture onCapture={handleCameraCapture} onCancel={() => setShowCamera(false)} />}

        {!showCamera && currentImages.length === 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setShowCamera(true)}
              variant="outline"
              className="border-border text-white hover:bg-secondary h-auto py-4 flex flex-col gap-2 bg-transparent touch-manipulation min-h-[44px]"
            >
              <Camera className="h-6 w-6" />
              <span>Bruk kamera</span>
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-border text-white hover:bg-secondary h-auto py-4 flex flex-col gap-2 touch-manipulation min-h-[44px]"
            >
              <ImageIcon className="h-6 w-6" />
              <span>Last opp bilde</span>
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

        {cameraError && <p className="text-sm text-red-400">{cameraError}</p>}

        {currentImages.length > 0 && (
          <div className="space-y-3">
            <Label className="text-white">Bilder ({currentImages.length})</Label>
            <div className="grid grid-cols-1 gap-3">
              {currentImages.map((img) => (
                <div key={img.id} className="relative rounded-lg overflow-hidden bg-secondary">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <img
                        src={img.dataUrl || "/placeholder.svg"}
                        alt="Dokumentasjon"
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <Button
                        onClick={() => removeImage(img.id)}
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-col justify-between p-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(img.timestamp)}</span>
                        </div>
                        {img.location.lat && img.location.lon && (
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {img.location.lat.toFixed(5)}, {img.location.lon.toFixed(5)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        {editingRoadRef === img.id ? (
                          <div className="space-y-2">
                            <Label className="text-white text-xs">Vegreferanse</Label>
                            <div className="flex gap-2">
                              <Input
                                value={tempRoadRef}
                                onChange={(e) => setTempRoadRef(e.target.value)}
                                placeholder="F.eks. FV888 HP1 M500"
                                className="bg-background border-border text-white text-sm"
                              />
                              <Button
                                onClick={() => updateRoadReference(img.id, tempRoadRef)}
                                size="sm"
                                className="bg-mesta-orange hover:bg-mesta-orange-hover shrink-0"
                              >
                                Lagre
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Label className="text-white text-xs">Vegreferanse</Label>
                            <div
                              onClick={() => {
                                setEditingRoadRef(img.id)
                                setTempRoadRef(img.roadReference || "")
                              }}
                              className="text-sm text-muted-foreground hover:text-white cursor-pointer p-2 bg-background rounded border border-border transition-colors touch-manipulation min-h-[44px] flex items-center"
                            >
                              {img.roadReference || "Klikk for å legge til"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!showCamera && (
              <Button
                onClick={() => setShowCamera(true)}
                variant="outline"
                className="w-full border-border text-white hover:bg-secondary touch-manipulation min-h-[44px] bg-transparent"
              >
                <Camera className="h-4 w-4 mr-2" />
                Ta flere bilder
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-muted-foreground hover:text-white touch-manipulation min-h-[44px]"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tilbake
      </Button>

      <h2 className="text-2xl font-bold text-white">Avvik, RUH og forbedringer</h2>

      <div className="flex gap-2 border-b border-border overflow-x-auto">
        <button
          onClick={() => setCurrentSection("avvik")}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors touch-manipulation min-h-[44px] ${
            currentSection === "avvik"
              ? "text-white border-b-2 border-mesta-orange"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Avvik
        </button>
        <button
          onClick={() => setCurrentSection("uonsket")}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors touch-manipulation min-h-[44px] ${
            currentSection === "uonsket"
              ? "text-white border-b-2 border-mesta-orange"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Uønskede hendelser
        </button>
        <button
          onClick={() => setCurrentSection("forbedring")}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors touch-manipulation min-h-[44px] ${
            currentSection === "forbedring"
              ? "text-white border-b-2 border-mesta-orange"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Forbedringsforslag
        </button>
      </div>

      {currentSection === "avvik" && (
        <div className="space-y-4">
          <Label className="text-white text-lg">Har du laget kvalitetsavvik i Landax?</Label>
          <RadioGroup value={avvikRegistered} onValueChange={setAvvikRegistered} className="space-y-3">
            <div className="flex items-center space-x-3 p-4 bg-secondary rounded-lg touch-manipulation min-h-[44px]">
              <RadioGroupItem value="ja" id="avvik-landax-ja" />
              <Label htmlFor="avvik-landax-ja" className="text-white cursor-pointer">
                Ja
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-secondary rounded-lg touch-manipulation min-h-[44px]">
              <RadioGroupItem value="nei" id="avvik-landax-nei" />
              <Label htmlFor="avvik-landax-nei" className="text-white cursor-pointer">
                Nei
              </Label>
            </div>
          </RadioGroup>

          {avvikRegistered && (
            <>
              <div className="space-y-2">
                <Label className="text-white">Avvik og evt bilde</Label>
                <Textarea
                  value={avvikText}
                  onChange={(e) => setAvvikText(e.target.value)}
                  placeholder="Beskriv avviket..."
                  className="bg-secondary border-border text-white min-h-[120px]"
                />
              </div>
              {renderImageSection()}
            </>
          )}
        </div>
      )}

      {currentSection === "uonsket" && (
        <div className="space-y-4">
          <Label className="text-white text-lg">Har du laget rapport i Landax?</Label>
          <RadioGroup value={ruhRegistered} onValueChange={setRuhRegistered} className="space-y-3">
            <div className="flex items-center space-x-3 p-4 bg-secondary rounded-lg touch-manipulation min-h-[44px]">
              <RadioGroupItem value="ja" id="ruh-landax-ja" />
              <Label htmlFor="ruh-landax-ja" className="text-white cursor-pointer">
                Ja
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-secondary rounded-lg touch-manipulation min-h-[44px]">
              <RadioGroupItem value="nei" id="ruh-landax-nei" />
              <Label htmlFor="ruh-landax-nei" className="text-white cursor-pointer">
                Nei
              </Label>
            </div>
          </RadioGroup>

          {ruhRegistered && (
            <>
              <div className="space-y-2">
                <Label className="text-white">Kommentar og bilde</Label>
                <Textarea
                  value={ruhText}
                  onChange={(e) => setRuhText(e.target.value)}
                  placeholder="Beskriv den uønskede hendelsen..."
                  className="bg-secondary border-border text-white min-h-[120px]"
                />
              </div>
              {renderImageSection()}
            </>
          )}
        </div>
      )}

      {currentSection === "forbedring" && (
        <div className="space-y-4">
          <Label className="text-white text-lg">Har du laget forbedringsforslag i Landax?</Label>
          <RadioGroup value={forbedringRegistered} onValueChange={setForbedringRegistered} className="space-y-3">
            <div className="flex items-center space-x-3 p-4 bg-secondary rounded-lg touch-manipulation min-h-[44px]">
              <RadioGroupItem value="ja" id="forbedring-landax-ja" />
              <Label htmlFor="forbedring-landax-ja" className="text-white cursor-pointer">
                Ja
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-secondary rounded-lg touch-manipulation min-h-[44px]">
              <RadioGroupItem value="nei" id="forbedring-landax-nei" />
              <Label htmlFor="forbedring-landax-nei" className="text-white cursor-pointer">
                Nei
              </Label>
            </div>
          </RadioGroup>

          {forbedringRegistered && (
            <>
              <div className="space-y-2">
                <Label className="text-white">Forslag og evt bilde</Label>
                <Textarea
                  value={forbedringText}
                  onChange={(e) => setForbedringText(e.target.value)}
                  placeholder="Beskriv forbedringsforslaget..."
                  className="bg-secondary border-border text-white min-h-[120px]"
                />
              </div>
              {renderImageSection()}
            </>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || (!avvikRegistered && !ruhRegistered && !forbedringRegistered)}
          className="w-full bg-mesta-orange hover:bg-mesta-orange-hover text-white touch-manipulation min-h-[44px]"
        >
          {isSubmitting ? "Sender inn..." : "Send inn registrering"}
        </Button>
      </div>
    </div>
  )
}
