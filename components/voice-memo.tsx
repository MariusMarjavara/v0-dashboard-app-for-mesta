"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mic, Square, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import type { VoiceMemoType, VoiceMemoMetadata, OfflineVoiceMemo, VoiceMemoProps } from "@/lib/types"
import { VoiceFlow } from "./voice-flow"

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(";base64,")
  const contentType = parts[0].split(":")[1]
  const raw = window.atob(parts[1])
  const rawLength = raw.length
  const uInt8Array = new Uint8Array(rawLength)

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i)
  }

  return new Blob([uInt8Array], { type: contentType })
}

export function VoiceMemo({ userId, contractArea, contractNummer }: VoiceMemoProps) {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<VoiceMemoType | null>(null)
  const [uploading, setUploading] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const [transcription, setTranscription] = useState("")

  // Loggbok-spesifikke felter
  const [vakttlf, setVakttlf] = useState(false)
  const [ringer, setRinger] = useState("")
  const [hendelse, setHendelse] = useState("")
  const [tiltak, setTiltak] = useState("")

  const [flowStarted, setFlowStarted] = useState(false)
  const [showVoiceFlow, setShowVoiceFlow] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const syncOffline = async () => {
      const itemsJson = localStorage.getItem("offlineVoiceMemos")
      if (!itemsJson) return

      const items: OfflineVoiceMemo[] = JSON.parse(itemsJson)
      if (items.length === 0) return

      toast.info(`Synkroniserer ${items.length} offline opptak...`)

      for (const item of items) {
        try {
          const blob = base64ToBlob(item.audioBlob)
          await uploadVoiceMemo(blob, item.metadata)
        } catch (error) {
          console.error("Offline sync failed for item:", error)
        }
      }

      localStorage.removeItem("offlineVoiceMemos")
      toast.success("Offline opptak synkronisert!")
    }

    window.addEventListener("online", syncOffline)
    return () => window.removeEventListener("online", syncOffline)
  }, [])

  async function startRecording() {
    console.log("[v0] 🎤 VoiceMemo: startRecording called")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("[v0] 🎤 VoiceMemo: Got media stream")

      const recorder = new MediaRecorder(stream)
      console.log("[v0] 🎤 VoiceMemo: MediaRecorder created, state:", recorder.state)

      recorder.ondataavailable = (e) => {
        console.log("[v0] 🎤 VoiceMemo: Data available, size:", e.data.size)
        chunks.current.push(e.data)
      }

      recorder.onstop = () => {
        console.log("[v0] 🎧 VoiceMemo: Recording stopped, chunks:", chunks.current.length)
        const blob = new Blob(chunks.current, { type: "audio/webm" })
        console.log("[v0] 🎧 VoiceMemo: Audio blob size:", blob.size)
        setAudioBlob(blob)
        setOpen(true)
        chunks.current = []
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      console.log("[v0] 🎤 VoiceMemo: MediaRecorder.start() called")
      mediaRecorderRef.current = recorder
      setRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } catch (error) {
      console.error("[v0] ❌ VoiceMemo: Recording error:", error)
      toast.error("Kunne ikke starte opptak. Sjekk mikrofontillatelser.")
    }
  }

  function stopRecording() {
    console.log("[v0] 🛑 VoiceMemo: stopRecording called")
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  async function uploadVoiceMemo(blob: Blob, metadata: VoiceMemoMetadata) {
    console.log("[v0] 📤 Uploading voice memo, blob size:", blob.size, "metadata:", metadata)
    const formData = new FormData()
    formData.append("audio", blob, "voice-memo.webm")
    formData.append("metadata", JSON.stringify(metadata))

    const response = await fetch("/api/voice", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) throw new Error("Upload feilet")
    const result = await response.json()
    console.log("[v0] ✅ Upload response:", result)
    return result
  }

  async function transcribeAudio(blob: Blob): Promise<string> {
    console.log("[v0] 🧠 Starting transcription, blob size:", blob.size)
    try {
      const formData = new FormData()
      formData.append("file", blob, "voice-memo.webm")

      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        console.error("[v0] ❌ Transcription failed:", response.status)
        return "[Transkribering feilet]"
      }

      const data = await response.json()
      console.log("[v0] 🧠 Transcription result:", data.text)
      return data.text || "[Transkribering feilet]"
    } catch (error) {
      console.error("[v0] ❌ Transcription error:", error)
      return "[Transkribering feilet]"
    }
  }

  function autoSuggestFromTranscript(text: string) {
    if (flowStarted) return // Never run after VoiceFlow begins

    const lowerText = text.toLowerCase()

    // Only set vakttlf if it's false (never overwrite explicit "Nei")
    if (vakttlf === false && (lowerText.includes("vakttlf") || lowerText.includes("vakttelefon"))) {
      setVakttlf(true)
    }

    // Only set ringer if it's empty (never overwrite user selection)
    if (!ringer) {
      if (lowerText.includes("trafikant")) setRinger("Trafikant")
      else if (lowerText.includes("politi")) setRinger("Politiet")
      else if (lowerText.includes("vegtrafikksentral") || lowerText.includes("vts")) setRinger("Vegtrafikksentral")
      else if (lowerText.includes("amk") || lowerText.includes("brann")) setRinger("AMK/Brann")
    }

    // Only set hendelse if it's empty (never overwrite user selection)
    if (!hendelse) {
      if (lowerText.includes("glatt") || lowerText.includes("is")) setHendelse("Glatt vei")
      else if (lowerText.includes("stengt") || lowerText.includes("steng")) setHendelse("Stengt vei")
      else if (lowerText.includes("ulykke") || lowerText.includes("krasj")) setHendelse("Ulykke")
      else if (lowerText.includes("sikt") || lowerText.includes("tåke")) setHendelse("Dårlig sikt")
    }

    // Only set tiltak if it's empty (never overwrite user selection)
    if (!tiltak) {
      if (lowerText.includes("brøyt") || lowerText.includes("brøt")) setTiltak("Brøyting")
      else if (lowerText.includes("strø")) setTiltak("Strøing")
      else if (lowerText.includes("befar")) setTiltak("Befaring")
      else if (lowerText.includes("eskaler")) setTiltak("Eskalert")
    }
  }

  async function handleVoiceFlowComplete(finalData: Record<string, string>) {
    console.log("[v0] 🎙️ VOICE FLOW COMPLETE DATA:", finalData)

    // Extract data from the finalData object
    const isLoggbok = finalData.type === "ja"
    const vakttlfValue = finalData.vakttlf === "ja"

    if (isLoggbok) {
      await submitVoiceMemo({
        vakttlf: vakttlfValue,
        ringer: finalData.caller || "",
        hendelse: finalData.reason || "",
        tiltak: finalData.action || "",
      })
    } else {
      await submitVoiceMemo({})
    }
  }

  async function submitVoiceMemo(finalData: {
    vakttlf?: boolean
    ringer?: string
    hendelse?: string
    tiltak?: string
  }) {
    console.log("[v0] 💾 SUBMIT VOICE MEMO called with finalData:", finalData)

    if (!audioBlob || !type) {
      console.error("[v0] ❌ Missing audioBlob or type:", { audioBlob: !!audioBlob, type })
      return
    }

    console.log("[v0] 💾 VOICE SUBMIT DATA", {
      type,
      finalData,
      transcript: transcription,
    })

    setUploading(true)

    try {
      // 1️⃣ ALWAYS transcribe first - this is now blocking and required
      let transcript = transcription
      if (!transcript) {
        setTranscribing(true)
        transcript = await transcribeAudio(audioBlob)
        setTranscription(transcript)
        setTranscribing(false)
      }

      const metadata: VoiceMemoMetadata = {
        type,
        userId,
        contractArea,
        contractNummer,
        timestamp: new Date().toISOString(),
        transcript,
        ...(type === "loggbok" && finalData),
      }

      await uploadVoiceMemo(audioBlob, metadata)
      toast.success("Voice memo lagret!")
      resetForm()
    } catch (error) {
      // Offline fallback - still saves with transcript
      try {
        const base64Audio = await blobToBase64(audioBlob)
        const offlineItems: OfflineVoiceMemo[] = JSON.parse(localStorage.getItem("offlineVoiceMemos") || "[]")

        const metadata: VoiceMemoMetadata = {
          type: type!,
          userId,
          contractArea,
          contractNummer,
          timestamp: new Date().toISOString(),
          transcript: transcription || "[Offline - ingen transkripsjon]",
          ...(type === "loggbok" && finalData),
        }

        offlineItems.push({
          audioBlob: base64Audio,
          metadata,
          savedAt: Date.now(),
        })
        localStorage.setItem("offlineVoiceMemos", JSON.stringify(offlineItems))
        toast.warning("Ingen internett. Lagret for senere synkronisering.")
        resetForm()
      } catch (offlineError) {
        toast.error("Kunne ikke lagre voice memo")
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleManualSubmit() {
    await submitVoiceMemo({
      vakttlf,
      ringer,
      hendelse,
      tiltak,
    })
  }

  useEffect(() => {
    if (audioBlob && open && type && !transcription && !transcribing && !flowStarted) {
      ;(async () => {
        setTranscribing(true)
        const transcript = await transcribeAudio(audioBlob)
        setTranscription(transcript)
        setTranscribing(false)

        // Auto-suggest only if flow hasn't started
        if (transcript && type === "loggbok" && !flowStarted) {
          autoSuggestFromTranscript(transcript)
        }
      })()
    }
  }, [audioBlob, open, type, flowStarted])

  function resetForm() {
    setOpen(false)
    setType(null)
    setAudioBlob(null)
    setTranscription("")
    setTranscribing(false)
    setVakttlf(false)
    setRinger("")
    setHendelse("")
    setTiltak("")
    setFlowStarted(false)
    setShowVoiceFlow(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <>
      <Button
        onClick={recording ? stopRecording : startRecording}
        className={`fixed bottom-6 right-6 z-50 h-20 w-20 rounded-full shadow-2xl
          ${recording ? "bg-red-800 animate-pulse" : "bg-red-600"} 
          hover:bg-red-700 text-white font-bold transition-all`}
      >
        {recording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        <div className="text-xs mt-1">{recording ? formatTime(recordingTime) : "VOICE"}</div>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-full sm:h-auto h-[100dvh] rounded-none sm:rounded-lg bg-[#0b1f3a] text-white border-orange-500/20">
          {showVoiceFlow && (
            <VoiceFlow
              transcript={transcription}
              onComplete={handleVoiceFlowComplete}
              onCancel={() => {
                setShowVoiceFlow(false)
                setFlowStarted(false)
              }}
            />
          )}

          {!showVoiceFlow && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {!type ? "Hva vil du registrere?" : type === "loggbok" ? "Loggbok" : "Notat"}
                </DialogTitle>
              </DialogHeader>

              {transcribing && (
                <div className="flex items-center gap-2 text-sm text-orange-400 bg-orange-500/10 p-3 rounded">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transkriberer opptak...
                </div>
              )}

              {transcription && (
                <div className="p-3 bg-[#1a2332] rounded border border-gray-600">
                  <p className="text-xs text-gray-400 mb-1">Transkripsjon:</p>
                  <p className="text-sm text-gray-200">{transcription}</p>
                </div>
              )}

              {!type ? (
                <div className="space-y-3">
                  <Button
                    onClick={() => setType("loggbok")}
                    className="w-full h-20 text-xl bg-orange-500 hover:bg-orange-600 active:scale-95 transition-transform"
                  >
                    LOGGBOK
                  </Button>
                  <Button
                    onClick={() => setType("notat")}
                    className="w-full h-20 text-xl bg-blue-500 hover:bg-blue-600 active:scale-95 transition-transform"
                  >
                    NOTAT
                  </Button>
                </div>
              ) : type === "loggbok" ? (
                <div className="space-y-4">
                  <Button
                    onClick={() => {
                      setFlowStarted(true)
                      setShowVoiceFlow(true)
                    }}
                    className="w-full h-14 text-base bg-purple-500 hover:bg-purple-600"
                  >
                    🎙️ Bruk stemmeguide
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#0b1f3a] px-2 text-gray-400">eller fyll ut manuelt</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">Steg: {vakttlf ? "Detaljer" : "Avklaring"}</p>

                  <div>
                    <label className="text-sm text-gray-300 font-medium">Gjelder dette vakttlf?</label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={() => setVakttlf(true)}
                        variant={vakttlf ? "default" : "outline"}
                        className="flex-1 h-14 text-base"
                      >
                        Ja
                      </Button>
                      <Button
                        onClick={() => setVakttlf(false)}
                        variant={!vakttlf ? "default" : "outline"}
                        className="flex-1 h-14 text-base"
                      >
                        Nei
                      </Button>
                    </div>
                  </div>

                  {vakttlf && (
                    <>
                      <div>
                        <label className="text-sm text-gray-300 font-medium">Hvem ringte?</label>
                        <select
                          value={ringer}
                          onChange={(e) => setRinger(e.target.value)}
                          className="w-full mt-2 p-4 text-base rounded bg-[#1a2332] border border-gray-600 text-white"
                        >
                          <option value="">Velg...</option>
                          <option value="Trafikant">Trafikant</option>
                          <option value="Politiet">Politiet</option>
                          <option value="Vegtrafikksentral">Vegtrafikksentral</option>
                          <option value="AMK/Brann">AMK / Brann</option>
                          <option value="Annet">Annet</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-300 font-medium">Hva gjaldt det?</label>
                        <select
                          value={hendelse}
                          onChange={(e) => setHendelse(e.target.value)}
                          className="w-full mt-2 p-4 text-base rounded bg-[#1a2332] border border-gray-600 text-white"
                        >
                          <option value="">Velg...</option>
                          <option value="Glatt vei">Glatt vei</option>
                          <option value="Stengt vei">Stengt vei</option>
                          <option value="Ulykke">Ulykke</option>
                          <option value="Dårlig sikt">Dårlig sikt</option>
                          <option value="Annet">Annet</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-sm text-gray-300 font-medium">Tiltak</label>
                    <select
                      value={tiltak}
                      onChange={(e) => setTiltak(e.target.value)}
                      className="w-full mt-2 p-4 text-base rounded bg-[#1a2332] border border-gray-600 text-white"
                    >
                      <option value="">Velg...</option>
                      <option value="Brøyting">Brøyting</option>
                      <option value="Strøing">Strøing</option>
                      <option value="Befaring">Befaring</option>
                      <option value="Ingen tiltak">Ingen tiltak</option>
                      <option value="Eskalert">Eskalert</option>
                    </select>
                  </div>

                  <div className="rounded bg-[#101826] border border-gray-600 p-3 text-sm">
                    <p className="text-gray-400 mb-2">Registrert:</p>
                    <ul className="space-y-1">
                      <li>
                        Vakttlf: <strong>{vakttlf ? "Ja" : "Nei"}</strong>
                      </li>
                      {vakttlf && (
                        <li>
                          Ringer: <strong>{ringer || "–"}</strong>
                        </li>
                      )}
                      {vakttlf && (
                        <li>
                          Hendelse: <strong>{hendelse || "–"}</strong>
                        </li>
                      )}
                      <li>
                        Tiltak: <strong>{tiltak || "–"}</strong>
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleManualSubmit}
                    disabled={uploading || (vakttlf && (!ringer || !hendelse || !tiltak))}
                    className="w-full h-14 text-base bg-orange-500 hover:bg-orange-600 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" /> Lagrer...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2" /> Lagre loggbok
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">Lydopptaket vil bli lagret sammen med notatet.</p>

                  <Button
                    onClick={() => submitVoiceMemo({})}
                    disabled={uploading}
                    className="w-full h-14 text-base bg-blue-500 hover:bg-blue-600 active:scale-95 transition-transform"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" /> Lagrer...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2" /> Lagre notat
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
