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
import { VoiceFlow } from "@/components/voice-flow"
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
import type { VoiceInterpretation } from "@/types/voice"
import { withTimeout } from "@/lib/voice/timeout"

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

  const [voiceFlowActive, setVoiceFlowActive] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [voiceAudioBlob, setVoiceAudioBlob] = useState<Blob | null>(null)
  const [voiceConfirmData, setVoiceConfirmData] = useState<Record<string, string> | null>(null)
  const [activeNavSection, setActiveNavSection] = useState<"status" | "voice" | "camera" | "log">("status")
  const { carMode } = useCarMode()

  const [isDesktop, setIsDesktop] = useState(false)
  const [voiceStage, setVoiceStage] = useState<"idle" | "recording" | "transcribing" | "confirm" | "saving" | "done">(
    "idle",
  )
  const [transcriptionStartTime, setTranscriptionStartTime] = useState<number | null>(null)

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

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "nb-NO"
    utterance.rate = 0.95
    utterance.pitch = 1
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const handleVoiceFinished = async (blob: Blob, liveTranscript: string) => {
    console.log("[v0] 🎤 Voice recording finished, starting transcription")
    console.time("[v0] transcribe")

    setVoiceAudioBlob(blob)
    setVoiceStage("transcribing")
    setTranscriptionStartTime(Date.now())

    const fallbackTranscript = liveTranscript || ""

    try {
      const formData = new FormData()
      formData.append("audio", blob, "voice-memo.webm")

      const response = await withTimeout(
        fetch("/api/voice/transcribe", {
          method: "POST",
          body: formData,
        }),
        15000,
      )

      if (response.ok) {
        const data = await response.json()
        const transcript = data.text || ""

        console.timeEnd("[v0] transcribe")

        const finalTranscript = transcript.trim().length > 0 ? transcript : fallbackTranscript

        setVoiceTranscript(finalTranscript)
        console.log("[v0] 📝 Transcription complete:", finalTranscript)

        const interpretation = interpretVoiceMemo(finalTranscript)
        console.log("[v0] 🧠 Interpretation:", interpretation)

        speak("Jeg er ferdig med å tolke. Se gjennom før lagring.")

        setVoiceConfirmData({
          transcript: finalTranscript,
          interpretation: JSON.stringify(interpretation),
        })

        setVoiceStage("confirm")
        setTranscriptionStartTime(null)

        if (interpretation.confidence >= 0.7) {
          console.log("[v0] ✅ High confidence interpretation")
        } else {
          console.log("[v0] ⚠️ Low confidence interpretation")
        }
      } else {
        throw new Error("Transcription API returned error")
      }
    } catch (error) {
      console.error("[v0] ❌ Transcription error:", error)
      console.timeEnd("[v0] transcribe")

      if (fallbackTranscript.trim().length > 0) {
        console.log("[v0] 🔄 Using live transcript as fallback:", fallbackTranscript)

        setVoiceTranscript(fallbackTranscript)

        const interpretation = interpretVoiceMemo(fallbackTranscript)

        speak("Transkribering tok for lang tid. Bruker direkte lydopptak.")

        setVoiceConfirmData({
          transcript: fallbackTranscript,
          interpretation: JSON.stringify(interpretation),
        })

        setVoiceStage("confirm")
        setTranscriptionStartTime(null)
      } else {
        toast.error("Kunne ikke transkribere tale. Prøv igjen.")
        setVoiceStage("idle")
        setTranscriptionStartTime(null)
      }
    }
  }

  const interpretVoiceMemo = (transcript: string): VoiceInterpretation => {
    return {
      type: "loggbok",
      confidence: 0.8,
      overridden: false,
      extracted: {},
      summary: "Summary of the voice memo",
      transcript: transcript,
    }
  }

  const handleVoiceConfirm = async (classification: {
    type: RegistrationType
    confidence: number
    overridden: boolean
    interpretation: VoiceInterpretation
  }) => {
    if (!voiceAudioBlob || !voiceConfirmData) return

    setVoiceStage("saving")

    const finalTranscript =
      classification.interpretation.transcript || voiceConfirmData.transcript || voiceTranscript || "Voice memo"

    if (!finalTranscript || finalTranscript.trim().length < 3) {
      console.error("[v0] ❌ Transcript missing or invalid", voiceConfirmData)
      toast.error("Kunne ikke registrere tale – prøv igjen")
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      setVoiceStage("idle")
      return
    }

    console.log("[v0] 📤 Submitting with classification:", classification)

    const metadata = {
      type: classification.type,
      userId: user.id,
      userName: userName,
      contractArea,
      contractNummer,
      timestamp: new Date().toISOString(),
      transcript: finalTranscript,
      extracted: classification.interpretation.extracted,
      classification: {
        registration_type: classification.type,
        confidence: classification.confidence,
        overridden: classification.overridden,
        summary: classification.interpretation.summary,
      },
      feedback: classification.overridden
        ? {
            predicted_type: classification.interpretation.registration_type,
            corrected_type: classification.type,
          }
        : null,
    }

    console.log("[v0] 📦 Metadata being sent:", metadata)

    const formData = new FormData()
    formData.append("audio", voiceAudioBlob, "voice-memo.webm")
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
          setVoiceConfirmData(null)
          setVoiceTranscript("")
          setVoiceAudioBlob(null)
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

  const handleVoiceEdit = () => {
    console.log("[v0] ✏️ User wants to edit, opening guided flow")
    setVoiceFlowActive(true)
    setVoiceConfirmData(null)
  }

  const handleVoiceCancel = () => {
    setVoiceStage("idle")
    setVoiceConfirmData(null)
    setVoiceTranscript("")
    setVoiceAudioBlob(null)
  }

  const handleVoiceFlowCancel = () => {
    setVoiceFlowActive(false)
    setVoiceTranscript("")
    setVoiceAudioBlob(null)
  }

  const handleNavigation = (section: "status" | "voice" | "camera" | "log") => {
    setActiveNavSection(section)

    if (section === "voice" && !voiceFlowActive) {
      if (navigator.vibrate) navigator.vibrate(50)
    }
  }

  const buildVoiceSummary = (data: Record<string, string>) => {
    const parts = []
    if (data.type === "ja") parts.push("Loggbok:")
    if (data.vakttlf === "ja") parts.push("• Vaktelefon")
    if (data.caller) parts.push(`• ${data.caller}`)
    if (data.reason) parts.push(`• ${data.reason}`)
    if (data.action) parts.push(`• ${data.action}`)
    return parts.join("\n")
  }

  const effectiveName = userName || manualName || ""
  const isMestaUser = userType === "mesta"

  const handleVoiceFlowComplete = async (data: Record<string, string>) => {
    console.log("[v0] ✅ VoiceFlow complete, data:", data)
    setVoiceConfirmData(data)
    setVoiceFlowActive(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1f3a] via-[#1a2332] to-[#0b1f3a] text-white">
      {/* Header */}
      <header className="border-b border-border bg-mesta-navy-light sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <MestaLogo />
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden md:flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{effectiveName || userEmail}</span>
                </div>
                {contractArea && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-mesta-navy rounded-lg border border-border">
                    <MapPin className="h-3.5 w-3.5 text-mesta-orange" />
                    <span className="text-xs font-medium text-foreground">{contractArea}</span>
                  </div>
                )}
                {isMestaUser && (
                  <span className="px-2 py-0.5 bg-mesta-orange/20 text-mesta-orange text-xs rounded-full font-medium">
                    Mesta
                  </span>
                )}
              </div>
              <CarModeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-white touch-manipulation"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logg ut</span>
              </Button>
            </div>
          </div>
          <div className="md:hidden pb-3 space-y-2">
            {contractArea && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-mesta-orange" />
                <span className="text-foreground font-medium">{contractArea}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="truncate">{effectiveName || userEmail}</span>
              {isMestaUser && (
                <span className="px-2 py-0.5 bg-mesta-orange/20 text-mesta-orange text-xs rounded-full font-medium">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeForm || showSuccess || needsName ? (
          <div className="max-w-xl mx-auto">{renderForm()}</div>
        ) : (
          <WeatherProvider contractId={"" || "default"}>
            {/* Mobile/Tablet Registration Section */}
            <section className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Registreringer</h2>
                <div className="flex items-center gap-2">
                  <ExportRegistrationsButton />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/qr")}
                    className="border-border text-white hover:bg-secondary bg-transparent touch-manipulation"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {registrationCards.map((card) => (
                  <RegistrationCard key={card.id} {...card} onClick={() => handleFormClick(card.id)} />
                ))}
              </div>
            </section>

            {/* Skillelinje og seksjonstittel for ekstern informasjon */}
            <div className="relative mb-6 sm:mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-mesta-navy px-4 text-sm text-muted-foreground">Værdata og eksterne systemer</span>
              </div>
            </div>

            <section className="mb-6 sm:mb-8">
              <TopExposedAreas />
            </section>

            <section className="mb-6 sm:mb-8">
              <WeatherSources />
            </section>

            {/* External Apps Section */}
            <section className="mb-8 sm:mb-12">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Nyttige lenker</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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
      {!activeForm && !showSuccess && !needsName && !voiceFlowActive && !voiceConfirmData && (
        <>
          {carMode ? (
            <VoiceButton onFinished={handleVoiceFinished} disabled={false} />
          ) : (
            <VoiceMemo userId={user.id} contractArea={contractArea} contractNummer={contractNummer || undefined} />
          )}
        </>
      )}

      {voiceFlowActive && (
        <VoiceFlow transcript={voiceTranscript} onComplete={handleVoiceFlowComplete} onCancel={handleVoiceFlowCancel} />
      )}

      {/* Voice Confirmation Screen */}
      {voiceStage === "confirm" && voiceConfirmData && (
        <VoiceConfirm
          transcript={voiceConfirmData.transcript || voiceTranscript}
          onConfirm={handleVoiceConfirm}
          onEdit={handleVoiceEdit}
          onCancel={handleVoiceCancel}
        />
      )}

      {/* Transcribing Overlay */}
      {voiceStage === "transcribing" && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl bg-[#1a2332] p-8 text-center">
            <div className="animate-spin h-16 w-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Tolker det du sa…</h2>
            <p className="text-muted-foreground">Dette tar vanligvis noen sekunder</p>
          </div>
        </div>
      )}

      {/* Saving Overlay */}
      {voiceStage === "saving" && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl bg-[#1a2332] p-8 text-center">
            <div className="animate-spin h-16 w-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">Lagrer…</h2>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {voiceStage === "done" && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6">
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
        <BottomNav onNavigate={handleNavigation} activeSection={activeNavSection} />
      )}
    </div>
  )
}
