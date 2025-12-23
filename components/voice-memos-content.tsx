"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mic, Calendar, MapPin } from "lucide-react"

interface VoiceMemo {
  id: string
  created_at: string
  registration_type: string
  data: {
    type: "loggbok" | "notat"
    transcript: string
    vakttlf?: boolean
    ringer?: string
    hendelse?: string
    tiltak?: string
    autoParsed?: any
  }
  contract_area: string
}

interface VoiceMemosContentProps {
  userId: string
}

export function VoiceMemosContent({ userId }: VoiceMemosContentProps) {
  const [memos, setMemos] = useState<VoiceMemo[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadMemos() {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("user_id", userId)
        .eq("registration_type", "voice_memo")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setMemos(data)
      }
      setLoading(false)
    }

    loadMemos()
  }, [userId, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-mesta-navy flex items-center justify-center">
        <div className="text-white">Laster voice memos...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mesta-navy">
      <header className="border-b border-border bg-mesta-navy-light">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard")} className="text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Mic className="h-6 w-6 text-orange-500" />
              Mine Voice Memos
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {memos.length === 0 ? (
          <Card className="bg-mesta-navy-light border-border">
            <CardContent className="p-8 text-center">
              <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-white">Ingen voice memos ennå</p>
              <p className="text-muted-foreground text-sm mt-2">
                Bruk den røde VOICE-knappen i dashboard for å registrere
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {memos.map((memo) => (
              <Card key={memo.id} className="bg-mesta-navy-light border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={memo.data.type === "loggbok" ? "default" : "secondary"}>
                          {memo.data.type === "loggbok" ? "Loggbok" : "Notat"}
                        </Badge>
                        {memo.data.vakttlf && <Badge variant="outline">Vakttlf</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(memo.created_at).toLocaleString("nb-NO")}
                        </div>
                        {memo.contract_area && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {memo.contract_area}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {memo.data.type === "loggbok" && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {memo.data.ringer && (
                        <div>
                          <span className="text-muted-foreground">Ringer:</span>
                          <span className="text-white ml-2">{memo.data.ringer}</span>
                        </div>
                      )}
                      {memo.data.hendelse && (
                        <div>
                          <span className="text-muted-foreground">Hendelse:</span>
                          <span className="text-white ml-2">{memo.data.hendelse}</span>
                        </div>
                      )}
                      {memo.data.tiltak && (
                        <div>
                          <span className="text-muted-foreground">Tiltak:</span>
                          <span className="text-white ml-2">{memo.data.tiltak}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="bg-mesta-navy p-3 rounded-lg">
                    <p className="text-white text-sm">{memo.data.transcript}</p>
                  </div>
                  {memo.data.autoParsed && memo.data.autoParsed.confidence > 0.5 && (
                    <div className="text-xs text-muted-foreground">
                      AI-parsert med {Math.round(memo.data.autoParsed.confidence * 100)}% konfidens
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
