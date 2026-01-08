"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MestaLogo } from "@/components/mesta-logo"
import { AppCard } from "@/components/app-card"
import { RegistrationCard } from "@/components/registration-card"
import { FriksjonForm } from "@/components/forms/friksjon-form"
import { MaskinForm } from "@/components/forms/maskin-form"
import { VinterarbeidForm } from "@/components/forms/vinterarbeid-form"
import { InnkjopForm } from "@/components/forms/innkjop-form"
import { UtbedringForm } from "@/components/forms/utbedring-form"
import { ArbeidsdokForm } from "@/components/forms/arbeidsdok-form"
import { SuccessMessage } from "@/components/success-message"
import { NamePrompt } from "@/components/name-prompt"
import { WeatherSources } from "@/components/weather-sources"
import { WeatherProvider, TopExposedAreas, RemainingWeatherCards } from "@/components/weather-bento-cards"
import { ExportRegistrationsButton } from "@/components/export-registrations-button"
import { VoiceMemo } from "@/components/voice-memo"
import { VoiceButton } from "@/components/voice-button"
import { OperationalStatusBanner } from "@/components/operational-status-banner"
import { CarModeToggle } from "@/components/car-mode-toggle"
import { useCarMode } from "@/components/car-mode-provider"
import { Button } from "@/components/ui/button"
import { getAppsForUser } from "@/lib/apps"
import { createClient } from "@/lib/supabase/client"
import { LogOut, User, MapPin, QrCode } from "lucide-react"
import { toast } from "sonner"
import { getRegistrationCardsForUser } from "@/lib/registration-cards"
import { BottomNav } from "@/components/bottom-nav"
import { VoiceConfirm } from "@/components/voice-confirm"
import type { RegistrationType } from "@/types"
import type { VoiceSession } from "@/lib/voice/session"
import { interpretVoiceMemo } from "@/lib/voice/classify"
import { speak } from "@/lib/voice/tts"
import { cleanTranscript } from "@/lib/voice/cleanTranscript"
import { getCurrentPosition } from "@/lib/utils/formatting"

interface DashboardContentProps {
  userId: string
  userName: string
  userType: "mesta" | "ue"
  userEmail: string
  contractArea: string
  contractAreaId: string
}

export function DashboardContent({
  userId,
  userName,
  userType,
  userEmail,
  contractArea,
  contractAreaId,
}: DashboardContentProps) {
  const [activeForm, setActiveForm] = useState<
    null | "friksjon" | "maskin" | "vinter" | "innkjop" | "utbedring" | "arbeidsdok"
  >(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [manualName, setManualName] = useState<string | null>(null)
  const [needsName, setNeedsName] = useState(false)
  const [isContractAdmin, setIsContractAdmin] = useState(false)
  const [contractType, setContractType] = useState<"riksveg" | "fylkeskommune" | "felleskontrakt" | null>(null)
  const router = useRouter()

  const user = {
    id: userId,
    name: userName,
    type: userType,
    email: userEmail,
  }

  const contractNummer = contractAreaId ? Number.parseInt(contractAreaId) : null

  const [voiceSession, setVoiceSession] = useState<VoiceSession | null>(null)
  const [voiceStage, setVoiceStage] = useState<"idle" | "transcribing" | "confirm" | "saving" | "done">("idle")
  const { carMode } = useCarMode()

  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!contractNummer) return

      const supabase = createClient()
      const { data } = await supabase
        .from("contract_admins")
        .select("*")
        .eq("user_id", user.id)
        .eq("contract_nummer", contractNummer)
        .single()

      setIsContractAdmin(!!data)
    }

    checkAdminStatus()
  }, [contractNummer, user.id])

  useEffect(() => {
    const fetchContractType = async () => {
      if (!contractNummer) return

      const supabase = createClient()
      const { data } = await supabase.from("contracts").select("type").eq("nummer", contractNummer).single()

      if (data) {
        setContractType(data.type)
      }
    }

    fetchContractType()
  }, [contractNummer])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleFormClick = (formId: string) => {
    if (!userName) {
      setNeedsName(true)
      setActiveForm(formId as any)
    } else {
      setActiveForm(formId as any)
    }
  }

  const handleNameSubmit = (name: string) => {
    setManualName(name)
    setNeedsName(false)
  }

  const handleSuccess = () => {
    setShowSuccess(true)
    setActiveForm(null)
  }

  const handleBack = () => {
    setActiveForm(null)
    setShowSuccess(false)
  }

  const renderForm = () => {
    if (needsName) {
      return <NamePrompt onSubmit={handleNameSubmit} />
    }

    if (showSuccess) {
      return <SuccessMessage onClose={handleBack} />
    }

    const formProps = {
      userName: userName,
      userId: user.id,
      contractArea,
      contractNummer,
      onBack: handleBack,
      onSuccess: handleSuccess,
    }

    switch (activeForm) {
      case "arbeidsdok":
        return <ArbeidsdokForm {...formProps} />
      case "friksjon":
        return <FriksjonForm {...formProps} />
      case "maskin":
        return <MaskinForm {...formProps} />
      case "vinter":
        return <VinterarbeidForm {...formProps} />
      case "innkjop":
        return <InnkjopForm {...formProps} />
      case "utbedring":
        return <UtbedringForm {...formProps} />
      default:
        return null
    }
  }

  const registrationCards = getRegistrationCardsForUser(userType)
  const filteredApps = getAppsForUser(userType, contractType || undefined)

  const handleVoiceFinished = async (audioBlob: Blob, liveTranscript: string) => {
    console.log("[v0] 🎙️ Voice finished, blob size:", audioBlob.size, "live transcript:", liveTranscript)

    setVoiceStage("transcribing")

    const cleanedTranscript = cleanTranscript(liveTranscript)
    console.log("[v0] 🧹 Cleaned transcript:", cleanedTranscript)

    const interpretation = interpretVoiceMemo(cleanedTranscript)
    console.log("[v0] 🧠 Interpretation:", interpretation)

    // Create voice session with both transcript and interpretation
    const session: VoiceSession = {
      audio: audioBlob,
      transcript: cleanedTranscript,
      interpretation: {
        type: interpretation.registration_type,
        confidence: interpretation.confidence,
        extracted: interpretation.extracted,
        summary: interpretation.summary,
        schema: interpretation.schema,
        fieldConfidence: interpretation.fieldConfidence,
        missingRequired: interpretation.missingRequired,
      },
    }

    setVoiceSession(session)
    setVoiceStage("confirm")

    // TTS readback
    speak("Jeg er ferdig med å tolke. Se gjennom før lagring")
  }

  const handleVoiceConfirm = async (classification: {
    type: RegistrationType
    confidence: number
    overridden: boolean
    interpretation: any
  }) => {
    if (!voiceSession) return

    setVoiceStage("saving")

    const finalTranscript = voiceSession.transcript || "Voice memo"

    if (!finalTranscript || finalTranscript.trim().length < 3) {
      console.error("[v0] ❌ Transcript missing or invalid")
      toast.error("Kunne ikke registrere tale – prøv igjen")
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      setVoiceStage("idle")
      return
    }

    let gpsData = null
    try {
      const position = await getCurrentPosition()
      gpsData = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      }
      console.log("[v0] 📍 GPS captured for voice memo:", gpsData)
    } catch (error) {
      console.log("[v0] ⚠️ GPS not available for voice memo:", error)
      // Continue without GPS - it's optional
    }

    const metadata = {
      type: classification.type,
      userId: user.id,
      userName: userName,
      contractArea,
      contractNummer,
      timestamp: new Date().toISOString(),
      transcript: finalTranscript,
      extracted: voiceSession.interpretation.extracted,
      gps: gpsData,
      classification: {
        registration_type: classification.type,
        confidence: classification.confidence,
        overridden: classification.overridden,
        summary: voiceSession.interpretation.summary,
      },
      feedback: classification.overridden
        ? {
            predicted_type: voiceSession.interpretation.type,
            corrected_type: classification.type,
          }
        : null,
    }

    const formData = new FormData()
    formData.append("audio", voiceSession.audio, "voice-memo.webm")
    formData.append("metadata", JSON.stringify(metadata))

    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setVoiceStage("done")
        toast.success("Loggen er lagret")
        speak("Loggen er lagret")
        if (navigator.vibrate) navigator.vibrate([100, 50, 100])

        setTimeout(() => {
          setVoiceStage("idle")
          setVoiceSession(null)
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error("[v0] ❌ API error:", errorData)
        toast.error("Kunne ikke lagre voice memo")
        setVoiceStage("idle")
      }
    } catch (error) {
      console.error("[v0] ❌ Submission error:", error)
      toast.error("Kunne ikke lagre voice memo")
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200])
      setVoiceStage("idle")
    }
  }

  const handleVoiceCancel = () => {
    setVoiceSession(null)
    setVoiceStage("idle")
    speak("Avbrutt")
  }

  const effectiveName = userName || manualName || ""
  const isMestaUser = userType === "mesta"

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-card sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <MestaLogo />
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden md:flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-foreground/90">{effectiveName || userEmail}</span>
                </div>
                {contractArea && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-lg border border-border shadow-sm">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">{contractArea}</span>
                  </div>
                )}
                {isMestaUser && (
                  <span className="px-2.5 py-1 bg-primary/25 text-primary text-xs rounded-full font-semibold ring-1 ring-primary/30">
                    Mesta
                  </span>
                )}
              </div>
              <CarModeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-white hover:bg-secondary/80 touch-manipulation"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logg ut</span>
              </Button>
            </div>
          </div>
          <div className="md:hidden pb-3 space-y-2">
            {contractArea && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-foreground font-semibold">{contractArea}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="truncate text-foreground/90">{effectiveName || userEmail}</span>
              {isMestaUser && (
                <span className="px-2 py-0.5 bg-primary/25 text-primary text-xs rounded-full font-semibold ring-1 ring-primary/30">
                  Mesta
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Operational Status Banner */}
      <OperationalStatusBanner />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeForm || showSuccess || needsName ? (
          <div className="max-w-xl mx-auto">{renderForm()}</div>
        ) : (
          <WeatherProvider contractId={"" || "default"}>
            {/* Mobile/Tablet Registration Section */}
            <section className="mb-10 sm:mb-14">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Registreringer</h2>
                <div className="flex items-center gap-2">
                  <ExportRegistrationsButton />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/qr")}
                    className="border-2 border-border text-white hover:bg-secondary hover:border-primary bg-transparent touch-manipulation"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                {registrationCards.map((card) => (
                  <RegistrationCard key={card.id} {...card} onClick={() => handleFormClick(card.id)} />
                ))}
              </div>
            </section>

            <div className="relative mb-10 sm:mb-14">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-border/90"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-5 py-2 text-base font-semibold text-muted-foreground">
                  Værdata og eksterne systemer
                </span>
              </div>
            </div>

            <section className="mb-8 sm:mb-12">
              <TopExposedAreas />
            </section>

            <section className="mb-8 sm:mb-12">
              <WeatherSources />
            </section>

            {/* External Apps Section */}
            <section className="mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Nyttige lenker</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {filteredApps.map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            </section>

            {/* Remaining Weather Cards Section */}
            <section>
              <RemainingWeatherCards />
            </section>
          </WeatherProvider>
        )}
      </main>

      {/* VoiceMemo Floating Button */}
      {!activeForm && !showSuccess && !needsName && voiceStage === "idle" && !voiceSession && (
        <>
          {carMode ? (
            <VoiceButton onFinished={handleVoiceFinished} disabled={false} />
          ) : (
            <VoiceMemo userId={user.id} contractArea={contractArea} contractNummer={contractNummer || undefined} />
          )}
        </>
      )}

      {/* Voice Confirmation Screen */}
      {voiceStage === "confirm" && voiceSession && (
        <VoiceConfirm
          transcript={voiceSession.transcript}
          interpretation={{
            registration_type: voiceSession.interpretation.type,
            confidence: voiceSession.interpretation.confidence,
            extracted: voiceSession.interpretation.extracted,
            summary: voiceSession.interpretation.summary,
            schema: voiceSession.interpretation.schema,
            fieldConfidence: voiceSession.interpretation.fieldConfidence,
            missingRequired: voiceSession.interpretation.missingRequired,
          }}
          onConfirm={handleVoiceConfirm}
          onCancel={handleVoiceCancel}
        />
      )}

      {/* Transcribing Overlay */}
      {voiceStage === "transcribing" && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center px-6">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Tolker det du sa…</h2>
            <p className="text-sm text-gray-400">Ett øyeblikk...</p>
          </div>
        </div>
      )}

      {/* Saving Overlay */}
      {voiceStage === "saving" && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50">
          <div className="w-full max-w-md rounded-2xl bg-[#1a2332] p-8 text-center">
            <div className="animate-spin h-16 w-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">Lagrer…</h2>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {voiceStage === "done" && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50">
          <div className="w-full max-w-md rounded-2xl bg-[#1a2332] p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Lagret</h2>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Car Mode */}
      {carMode && !activeForm && !showSuccess && !needsName && (
        <BottomNav onNavigate={() => {}} activeSection={"" as any} />
      )}
    </div>
  )
}
