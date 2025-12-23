"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft } from "lucide-react"

const workTypes = [
  { id: "broytestikk", name: "Brøytestikksetting" },
  { id: "skiltkosting", name: "Skiltkosting" },
  { id: "leskur", name: "Rydding av leskur" },
  { id: "annet", name: "Annet" },
]

interface VinterarbeidFormProps {
  userName: string
  userId: string | null
  contractArea: string
  contractNummer: number | null
  onBack: () => void
  onSuccess: () => void
}

export function VinterarbeidForm({
  userName,
  userId,
  contractArea,
  contractNummer,
  onBack,
  onSuccess,
}: VinterarbeidFormProps) {
  const [selectedWork, setSelectedWork] = useState("")
  const [location, setLocation] = useState("")
  const [stickCount, setStickCount] = useState("")
  const [whatDone, setWhatDone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const supabase = createClient()

    const data = {
      work_type: selectedWork,
      location,
      stick_count: selectedWork === "broytestikk" ? Number.parseInt(stickCount) : null,
      what_done: selectedWork === "annet" ? whatDone : null,
    }

    await supabase.from("registrations").insert({
      user_id: userId,
      registered_by_name: userName,
      registration_type: "vinterarbeid",
      contract_area: contractArea,
      contract_nummer: contractNummer,
      data,
    })

    setIsSubmitting(false)
    onSuccess()
  }

  const isValid = () => {
    if (!selectedWork || !location) return false
    if (selectedWork === "broytestikk" && !stickCount) return false
    if (selectedWork === "annet" && !whatDone) return false
    return true
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-white">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Tilbake
      </Button>

      <h2 className="text-2xl font-bold text-white">Manuelt vinterarbeid</h2>

      <div className="space-y-4">
        <Label className="text-white text-lg">Type arbeid</Label>
        <RadioGroup value={selectedWork} onValueChange={setSelectedWork} className="space-y-3">
          {workTypes.map((work) => (
            <div key={work.id} className="flex items-center space-x-3 p-4 bg-secondary rounded-lg">
              <RadioGroupItem value={work.id} id={work.id} />
              <Label htmlFor={work.id} className="text-white cursor-pointer">
                {work.name}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {selectedWork && (
          <>
            <div className="space-y-2">
              <Label className="text-white">Hvor?</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Sted/lokasjon"
                className="bg-secondary border-border text-white"
              />
            </div>

            {selectedWork === "broytestikk" && (
              <div className="space-y-2">
                <Label className="text-white">Hvor mange stikker?</Label>
                <Input
                  type="number"
                  value={stickCount}
                  onChange={(e) => setStickCount(e.target.value)}
                  placeholder="Antall"
                  className="bg-secondary border-border text-white"
                />
              </div>
            )}

            {selectedWork === "annet" && (
              <div className="space-y-2">
                <Label className="text-white">Hva er utført?</Label>
                <Textarea
                  value={whatDone}
                  onChange={(e) => setWhatDone(e.target.value)}
                  placeholder="Beskriv arbeidet..."
                  className="bg-secondary border-border text-white"
                />
              </div>
            )}
          </>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!isValid() || isSubmitting}
          className="w-full bg-mesta-orange hover:bg-mesta-orange-hover text-white"
        >
          {isSubmitting ? "Sender..." : "Send inn registrering"}
        </Button>
      </div>
    </div>
  )
}
