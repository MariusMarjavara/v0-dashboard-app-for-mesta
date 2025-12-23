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

type ActiveForm = null | "friksjon" | "maskin" | "vinter" | "innkjop" | "utbedring" | "arbeidsdok"

interface DashboardContentProps {
  userId: string
  userName: string
  userType: "mesta" | "ue"
  userEmail: string
  contractArea: string
  contractAreaId: string
}

const getAllRegistrationCards = (userType: "mesta" | "ue") => {
  const baseCards = [
    {
      id: "arbeidsdok",
      title: "Arbeidsdokumentering",
      description: "Bilder og ressursbruk for oppdrag på kontrakten",
      icon: "arbeidsdok" as const,
    },
    {
      id: "friksjon",
      title: "Friksjonsmålinger",
      description: "Registrer friksjonsmålinger og tiltak",
      icon: "friksjon" as const,
    },
    {
      id: "vinter",
      title: "Manuelt vinterarbeid",
      description: "Brøytestikk, skiltkosting, leskur m.m.",
      icon: "vinter" as const,
    },
  ]

  if (userType === "mesta") {
    baseCards.push(
      {
        id: "innkjop",
        title: "Innkjøp",
        description: "Registrer innkjøp og utgifter",
        icon: "innkjop" as const,
      },
      {
        id: "maskin",
        title: "Maskinoppfølgning",
        description: "Innleid maskin - vedlikehold og forbruksvarer",
        icon: "maskin" as const,
      },
    )
  }

  return baseCards
}

export function DashboardContent({
  userId,
  userName,
  userType,
  userEmail,
  contractArea,
  contractAreaId,
}: DashboardContentProps) {
  const [activeForm, setActiveForm] = useState<ActiveForm>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [manualName, setManualName] = useState<string | null>(null)
  const [needsName, setNeedsName] = useState(false)
  const [isContractAdmin, setIsContractAdmin] = useState(false)
  const [contractType, setContractType] = useState<"riksveg" | "fylkeskommune" | "felleskontrakt" | null>(null)
  const router = useRouter()

  const effectiveName = userName || manualName || ""
  const isMestaUser = userType === "mesta"

  const contractNummer = contractArea ? Number.parseInt(contractArea.split(" - ")[0]) : null

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!contractNummer || isNaN(contractNummer)) return

      const supabase = createClient()
      const { data } = await supabase
        .from("contract_admins")
        .select("*")
        .eq("user_id", userId)
        .eq("contract_nummer", contractNummer)
        .single()

      setIsContractAdmin(!!data)
    }

    checkAdminStatus()
  }, [contractNummer, userId])

  useEffect(() => {
    const fetchContractType = async () => {
      if (!contractNummer || isNaN(contractNummer)) return

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
    if (!effectiveName) {
      setNeedsName(true)
      setActiveForm(formId as ActiveForm)
    } else {
      setActiveForm(formId as ActiveForm)
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
      userName: effectiveName,
      userId,
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

  const registrationCards = getAllRegistrationCards(userType)
  const filteredApps = getAppsForUser(userType, contractType || undefined)

  const [voiceFlowActive, setVoiceFlowActive] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [voiceAudioBlob, setVoiceAudioBlob] = useState<Blob | null>(null)
  const { carMode } = useCarMode()

  const handleVoiceFinished = async (blob: Blob) => {
    setVoiceAudioBlob(blob)

    // Transcribe the audio
    try {
      const formData = new FormData()
      formData.append("audio", blob, "voice-memo.webm")

      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setVoiceTranscript(data.text || "")
      }
    } catch (error) {
      console.error("[v0] Transcription failed:", error)
    }

    setVoiceFlowActive(true)
  }

  const handleVoiceFlowComplete = async (data: Record<string, string>) => {
    if (!voiceAudioBlob) return

    const metadata = {
      type: data.type === "ja" ? "loggbok" : "notat",
      userId,
      contractArea,
      contractNummer,
      timestamp: new Date().toISOString(),
      transcript: voiceTranscript,
      vakttlf: data.vakttlf === "ja",
      ringer: data.caller,
      hendelse: data.reason,
      tiltak: data.action,
    }

    const formData = new FormData()
    formData.append("audio", voiceAudioBlob, "voice-memo.webm")
    formData.append("metadata", JSON.stringify(metadata))

    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        toast.success("Voice memo lagret!")
      }
    } catch (error) {
      console.error("[v0] Upload failed:", error)
      toast.error("Kunne ikke lagre voice memo")
    }

    setVoiceFlowActive(false)
    setVoiceTranscript("")
    setVoiceAudioBlob(null)
  }

  const handleVoiceFlowCancel = () => {
    setVoiceFlowActive(false)
    setVoiceTranscript("")
    setVoiceAudioBlob(null)
  }

  return (
    <div className="min-h-screen bg-mesta-navy">
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
          <WeatherProvider contractId={contractAreaId || "default"}>
            {/* Registration Section */}
            <section className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Registreringer</h2>
                <div className="flex items-center gap-2">
                  <ExportRegistrationsButton
                    userType={userType}
                    isContractAdmin={isContractAdmin}
                    contractNummer={contractNummer}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/qr")}
                    className="border-border text-white hover:bg-secondary bg-transparent touch-manipulation"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  {isMestaUser && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/admin")}
                      className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white bg-transparent"
                    >
                      Admin
                    </Button>
                  )}
                  {isContractAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/admin/weather-locations")}
                      className="border-border text-white hover:bg-secondary bg-transparent touch-manipulation"
                    >
                      <MapPin className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Værlokasjoner</span>
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
      {!activeForm && !showSuccess && !needsName && !voiceFlowActive && (
        <>
          {carMode ? (
            <VoiceButton onFinished={handleVoiceFinished} disabled={false} />
          ) : (
            <VoiceMemo userId={userId} contractArea={contractArea} contractNummer={contractNummer || undefined} />
          )}
        </>
      )}

      {voiceFlowActive && (
        <VoiceFlow transcript={voiceTranscript} onComplete={handleVoiceFlowComplete} onCancel={handleVoiceFlowCancel} />
      )}
    </div>
  )
}
